import csv
import io
from datetime import timedelta
import hashlib
import random

import numpy as np
import pandas as pd
from django.conf import settings
from django.db import transaction
from django.db.models import Avg, Count, Max
from django.http import HttpResponse
from django.utils import timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.hazards.models import HazardAlert, HazardAlertHistory, PPEViolation
from apps.hazards.services.prediction_service import PredictionService
from apps.hazards.services.risk_scoring_engine import RiskScoringEngine
from apps.incidents.models import Incident, HazardReport
from apps.sensors.models import SensorReading
from apps.sensors.services.sensor_reading_service import SensorReadingService
from .serializers import (
    AlertStatusUpdateSerializer,
    HazardAlertSerializer,
    IncidentCreateSerializer,
    IncidentSerializer,
    SensorReadingCreateSerializer,
    SensorReadingCsvUploadSerializer,
    HazardReportCreateSerializer,
    HazardReportSerializer,
    HazardAlertHistorySerializer,    PPEViolationSerializer,    PPEViolationCreateSerializer,
)

def _normalize_location(value: str) -> str:
    clean = " ".join(str(value).replace("-", " ").split())
    if clean.lower().startswith("zone"):
        parts = clean.split()
        if len(parts) >= 2:
            return f"Zone {parts[1].upper()}"
    return clean.title()


def _normalize_shift(value: str) -> str:
    clean = " ".join(str(value).replace("-", " ").split())
    return clean.title()


class SensorReadingCreateAPIView(APIView):
    def post(self, request):
        serializer = SensorReadingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prediction_service = PredictionService(model_path=settings.MODEL_PATH)
        reading_service = SensorReadingService(prediction_service=prediction_service)
        result = reading_service.create_reading(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)


class SensorReadingCsvUploadAPIView(APIView):
    def post(self, request):
        serializer = SensorReadingCsvUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = serializer.validated_data["file"]
        df = pd.read_csv(file_obj)

        required = {"gas_level", "temperature", "pressure", "smoke_level"}
        if not required.issubset(df.columns):
            return Response({"detail": f"CSV must include columns: {sorted(required)}"}, status=400)

        if "location" not in df.columns:
            df["location"] = "Zone A"
        if "shift" not in df.columns:
            df["shift"] = "Day"

        df["location"] = df["location"].apply(_normalize_location)
        df["shift"] = df["shift"].apply(_normalize_shift)

        alarm_series = (
            (df["gas_level"] > 250)
            | (df["smoke_level"] > 15)
            | (df["temperature"] > 90)
        )
        df["alarm"] = alarm_series.astype(int)

        start_time = timezone.now()
        readings = []
        for row in df.itertuples(index=False):
            readings.append(
                SensorReading(
                    gas_level=float(row.gas_level),
                    temperature=float(row.temperature),
                    pressure=float(row.pressure),
                    smoke_level=float(row.smoke_level),
                    location=str(row.location),
                    shift=str(row.shift),
                    source_type="csv",
                    remarks="",
                    alarm=bool(row.alarm),
                    predicted_risk_score=90.0 if row.alarm else 10.0,
                )
            )

        with transaction.atomic():
            SensorReading.objects.bulk_create(readings, batch_size=500)

            alarm_readings = SensorReading.objects.filter(
                source_type="csv",
                alarm=True,
                timestamp__gte=start_time,
            )

            alert_objs = []
            for reading in alarm_readings:
                triggers = []
                if reading.gas_level > 250:
                    triggers.append("gas_level")
                if reading.smoke_level > 15:
                    triggers.append("smoke_level")
                if reading.temperature > 90:
                    triggers.append("temperature")

                severity = RiskScoringEngine.severity(90.0)
                alert_objs.append(
                    HazardAlert(
                        reading=reading,
                        severity=severity,
                        risk_score=90.0,
                        rule_triggered=",".join(triggers),
                        ml_triggered=False,
                        status="new",
                    )
                )

            if alert_objs:
                HazardAlert.objects.bulk_create(alert_objs, batch_size=500)

        return Response({"inserted": len(readings)}, status=status.HTTP_201_CREATED)


class AlertListAPIView(APIView):
    def get(self, request):
        limit = int(request.query_params.get("limit", 200))
        limit = min(max(limit, 1), 1000)
        queryset = HazardAlert.objects.select_related("reading").all()[:limit]
        serializer = HazardAlertSerializer(queryset, many=True)
        return Response(serializer.data)


class AlertStatusUpdateAPIView(APIView):
    def patch(self, request, alert_id: int):
        serializer = AlertStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            alert = HazardAlert.objects.get(pk=alert_id)
        except HazardAlert.DoesNotExist:
            return Response({"detail": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

        old_status = alert.status
        alert.status = serializer.validated_data["status"]
        alert.save(update_fields=["status"])
        HazardAlertHistory.objects.create(
            alert=alert,
            old_status=old_status,
            new_status=alert.status,
        )
        return Response(HazardAlertSerializer(alert).data)


class AlertHistoryAPIView(APIView):
    def get(self, request, alert_id: int):
        history = HazardAlertHistory.objects.filter(alert_id=alert_id)
        serializer = HazardAlertHistorySerializer(history, many=True)
        return Response(serializer.data)

class IncidentListCreateAPIView(APIView):
    def get(self, request):
        serializer = IncidentSerializer(Incident.objects.select_related("alert").all()[:100], many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = IncidentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()
        if incident.capa_status == "closed" and incident.status != "resolved":
            incident.status = "resolved"
            incident.closed_at = timezone.now()
            incident.save(update_fields=["status", "closed_at"])
        alert_id = incident.alert_id
        incident_count = Incident.objects.filter(alert_id=alert_id).count()
        if incident_count == 1:
            alert = HazardAlert.objects.get(id=alert_id)
            alert.status = "acknowledged"
            alert.save(update_fields=["status"])
            HazardAlertHistory.objects.create(alert=alert, old_status="new", new_status="acknowledged")
        return Response(IncidentSerializer(incident).data, status=status.HTTP_201_CREATED)


class IncidentUpdateAPIView(APIView):
    def patch(self, request, incident_id: int):
        try:
            incident = Incident.objects.get(pk=incident_id)
        except Incident.DoesNotExist:
            return Response({"detail": "Incident not found"}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get("status")
        capa_value = request.data.get("capa_status")
        next_action = request.data.get("next_action")

        if status_value:
            incident.status = status_value
            if status_value == "resolved":
                incident.closed_at = timezone.now()
        if capa_value:
            incident.capa_status = capa_value
            if capa_value == "closed":
                incident.status = "resolved"
                incident.closed_at = timezone.now()
        if next_action is not None:
            incident.next_action = next_action

        incident.save()
        return Response(IncidentSerializer(incident).data)

class HazardReportListCreateAPIView(APIView):
    def get(self, request):
        serializer = HazardReportSerializer(HazardReport.objects.all()[:100], many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = HazardReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        return Response(HazardReportSerializer(report).data, status=status.HTTP_201_CREATED)


class PPEViolationListCreateAPIView(APIView):
    def get(self, request):
        violations = PPEViolation.objects.all()[:200]
        serializer = PPEViolationSerializer(violations, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PPEViolationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data["file"]
        filename = file_obj.name
        media_type = file_obj.content_type or "application/octet-stream"
        raw = file_obj.read()
        file_obj.seek(0)

        digest = hashlib.md5(raw).hexdigest()
        seed = int(digest[:8], 16)
        random.seed(seed)

        keyword_hit = any(k in filename.lower() for k in ["unsafe", "nohelmet", "noppe", "violation"])
        detected = keyword_hit or random.random() < 0.35
        violation_type = "helmet_missing" if detected else "none"
        confidence = round((0.7 + random.random() * 0.25), 2) if detected else round((0.2 + random.random() * 0.2), 2)

        violation = PPEViolation.objects.create(
            media_type=media_type,
            filename=filename,
            detected=detected,
            violation_type=violation_type,
            confidence=confidence,
            status="open" if detected else "resolved",
        )

        return Response(PPEViolationSerializer(violation).data, status=status.HTTP_201_CREATED)

class DemoDataCreateAPIView(APIView):
    def post(self, request):
        rows = 50
        now = timezone.now()
        rng = np.random.default_rng()

        gas = rng.normal(100, 50, rows)
        temperature = rng.normal(60, 15, rows)
        pressure = rng.normal(200, 40, rows)
        smoke = rng.normal(5, 3, rows)
        locations = rng.choice(["Zone A", "Zone B", "Zone C"], rows)
        shifts = rng.choice(["Morning", "Afternoon", "Night"], rows)
        timestamps = [now - timedelta(minutes=rows - i) for i in range(rows)]

        alarm_flags = (gas > 250) | (smoke > 15) | (temperature > 90)

        readings = []
        for i in range(rows):
            readings.append(
                SensorReading(
                    timestamp=timestamps[i],
                    gas_level=float(gas[i]),
                    temperature=float(temperature[i]),
                    pressure=float(pressure[i]),
                    smoke_level=float(smoke[i]),
                    location=str(locations[i]),
                    shift=str(shifts[i]),
                    source_type="synthetic",
                    remarks="demo load",
                    alarm=bool(alarm_flags[i]),
                    predicted_risk_score=90.0 if alarm_flags[i] else 10.0,
                )
            )

        start_time = now - timedelta(minutes=rows + 2)

        with transaction.atomic():
            SensorReading.objects.bulk_create(readings, batch_size=200)

            alarm_readings = SensorReading.objects.filter(
                source_type="synthetic",
                alarm=True,
                timestamp__gte=start_time,
            )

            alert_objs = []
            for reading in alarm_readings:
                triggers = []
                if reading.gas_level > 250:
                    triggers.append("gas_level")
                if reading.smoke_level > 15:
                    triggers.append("smoke_level")
                if reading.temperature > 90:
                    triggers.append("temperature")

                severity = RiskScoringEngine.severity(90.0)
                alert_objs.append(
                    HazardAlert(
                        reading=reading,
                        severity=severity,
                        risk_score=90.0,
                        rule_triggered=",".join(triggers),
                        ml_triggered=False,
                        status="new",
                    )
                )

            if alert_objs:
                HazardAlert.objects.bulk_create(alert_objs, batch_size=200)

        return Response({"inserted": len(readings), "alerts": len(alert_objs)}, status=status.HTTP_201_CREATED)


class IncidentPdfAPIView(APIView):
    def get(self, request, incident_id: int):
        try:
            incident = Incident.objects.select_related("alert", "alert__reading").get(pk=incident_id)
        except Incident.DoesNotExist:
            return Response({"detail": "Incident not found"}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(40, height - 50, "Incident Summary")

        pdf.setFont("Helvetica", 11)
        y = height - 90
        lines = [
            f"Incident ID: {incident.id}",
            f"Title: {incident.title}",
            f"Status: {incident.status}",
            f"CAPA Status: {incident.capa_status}",
            f"Next Action: {incident.next_action or '-'}",
            f"Opened At: {incident.opened_at}",
            f"Closed At: {incident.closed_at or '-'}",
            f"Alert ID: {incident.alert_id}",
            f"Alert Severity: {incident.alert.severity}",
            f"Location: {incident.alert.reading.location}",
            f"Shift: {incident.alert.reading.shift}",
            f"Risk Score: {incident.alert.risk_score}",
            f"Summary: {incident.summary or '-'}",
        ]

        for line in lines:
            pdf.drawString(40, y, line)
            y -= 18
            if y < 60:
                pdf.showPage()
                pdf.setFont("Helvetica", 11)
                y = height - 60

        pdf.showPage()
        pdf.save()
        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = f"attachment; filename=incident_{incident_id}.pdf"
        return response

class DashboardSummaryAPIView(APIView):
    def get(self, request):
        try:
            alerts_by_shift = (
                HazardAlert.objects.select_related("reading").order_by()
                .values("reading__shift")
                .annotate(total=Count("id"))
                .order_by("reading__shift")
            )
        except Exception:
            alerts_by_shift = []

        try:
            alerts_by_zone = (
                HazardAlert.objects.select_related("reading").order_by()
                .values("reading__location")
                .annotate(total=Count("id"))
                .order_by("reading__location")
            )
        except Exception:
            alerts_by_zone = []

        try:
            top_risk_zones = (
                HazardAlert.objects.select_related("reading").order_by()
                .values("reading__location")
                .annotate(total=Count("id"), avg_risk=Avg("risk_score"))
                .order_by("-total")[:3]
            )
        except Exception:
            top_risk_zones = []

        active_alerts = HazardAlert.objects.exclude(status="resolved").count()
        open_incidents = Incident.objects.exclude(status="resolved").count()
        total_incidents = Incident.objects.count()
        resolved_incidents = Incident.objects.filter(status="resolved").count()
        capa_closed = Incident.objects.filter(capa_status="closed").count()
        resolved_total = max(resolved_incidents, capa_closed)
        resolution_rate = 0
        if total_incidents:
            resolution_rate = round((resolved_total / total_incidents) * 100, 1)
        try:
            sensor_last = SensorReading.objects.aggregate(last=Max("timestamp"))["last"]
            sensor_locations = SensorReading.objects.order_by().values("location").annotate(last=Max("timestamp"))
            sensor_count = sensor_locations.count()
        except Exception:
            sensor_last = None
            sensor_locations = []
            sensor_count = 0
        try:
            alert_last = HazardAlert.objects.aggregate(last=Max("reading__timestamp"))["last"]
            alert_locations = HazardAlert.objects.order_by().values("reading__location").annotate(last=Max("reading__timestamp"))
            alert_count = alert_locations.count()
        except Exception:
            alert_last = None
            alert_locations = []
            alert_count = 0

        last_reading = sensor_last or alert_last
        total_sensors = sensor_count or alert_count
        location_latest = sensor_locations if sensor_count else alert_locations
        stale_threshold = timezone.now() - timedelta(minutes=30)
        stale_sensors = sum(1 for item in location_latest if item["last"] and item["last"] < stale_threshold)
        try:
            recent = SensorReading.objects.filter(timestamp__gte=timezone.now() - timedelta(minutes=60))
            recent_max = recent.aggregate(
                max_gas=Max("gas_level"),
                max_temp=Max("temperature"),
                max_smoke=Max("smoke_level"),
            )
            anomaly_detected = False
            anomaly_message = ""
            if (recent_max["max_gas"] or 0) > 300:
                anomaly_detected = True
                anomaly_message = "Extreme gas spike detected"
            elif (recent_max["max_temp"] or 0) > 110:
                anomaly_detected = True
                anomaly_message = "Extreme temperature spike detected"
            elif (recent_max["max_smoke"] or 0) > 20:
                anomaly_detected = True
                anomaly_message = "Extreme smoke spike detected"
        except Exception:
            anomaly_detected = False
            anomaly_message = ""

        return Response(
            {
                "active_alerts": active_alerts,
                "open_incidents": open_incidents,
                "alerts_by_shift": list(alerts_by_shift),
                "alerts_by_zone": list(alerts_by_zone),
                "total_incidents": total_incidents,
                "resolution_rate": resolution_rate,
                "total_alerts": HazardAlert.objects.count(),
                "top_risk_zones": list(top_risk_zones),
                "last_reading_at": last_reading,
                "stale_sensors": stale_sensors,
                "total_sensors": total_sensors,
                "anomaly_detected": anomaly_detected,
                "anomaly_message": anomaly_message,
            }
        )












