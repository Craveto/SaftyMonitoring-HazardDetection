import csv
import io

from django.conf import settings
from django.db.models import Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.hazards.models import HazardAlert
from apps.hazards.services.prediction_service import PredictionService
from apps.incidents.models import Incident
from apps.sensors.services.sensor_reading_service import SensorReadingService
from .serializers import (
    AlertStatusUpdateSerializer,
    HazardAlertSerializer,
    IncidentCreateSerializer,
    IncidentSerializer,
    SensorReadingCreateSerializer,
    SensorReadingCsvUploadSerializer,
)


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

        decoded = serializer.validated_data["file"].read().decode("utf-8")
        rows = csv.DictReader(io.StringIO(decoded))

        prediction_service = PredictionService(model_path=settings.MODEL_PATH)
        reading_service = SensorReadingService(prediction_service=prediction_service)

        inserted = 0
        for row in rows:
            reading_service.create_reading(
                {
                    "gas_level": float(row["gas_level"]),
                    "temperature": float(row["temperature"]),
                    "pressure": float(row["pressure"]),
                    "smoke_level": float(row["smoke_level"]),
                    "location": row["location"],
                    "shift": row["shift"],
                    "source_type": "csv",
                    "remarks": row.get("remarks", ""),
                }
            )
            inserted += 1

        return Response({"inserted": inserted}, status=status.HTTP_201_CREATED)


class AlertListAPIView(APIView):
    def get(self, request):
        serializer = HazardAlertSerializer(HazardAlert.objects.select_related("reading").all()[:100], many=True)
        return Response(serializer.data)


class AlertStatusUpdateAPIView(APIView):
    def patch(self, request, alert_id: int):
        serializer = AlertStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            alert = HazardAlert.objects.get(pk=alert_id)
        except HazardAlert.DoesNotExist:
            return Response({"detail": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

        alert.status = serializer.validated_data["status"]
        alert.save(update_fields=["status"])
        return Response(HazardAlertSerializer(alert).data)


class IncidentListCreateAPIView(APIView):
    def get(self, request):
        serializer = IncidentSerializer(Incident.objects.select_related("alert").all()[:100], many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = IncidentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()
        return Response(IncidentSerializer(incident).data, status=status.HTTP_201_CREATED)


class DashboardSummaryAPIView(APIView):
    def get(self, request):
        alerts_by_shift = (
            HazardAlert.objects.select_related("reading")
            .values("reading__shift")
            .annotate(total=Count("id"))
            .order_by("reading__shift")
        )
        alerts_by_zone = (
            HazardAlert.objects.select_related("reading")
            .values("reading__location")
            .annotate(total=Count("id"))
            .order_by("reading__location")
        )
        active_alerts = HazardAlert.objects.exclude(status="resolved").count()
        open_incidents = Incident.objects.exclude(status="resolved").count()

        return Response(
            {
                "active_alerts": active_alerts,
                "open_incidents": open_incidents,
                "alerts_by_shift": list(alerts_by_shift),
                "alerts_by_zone": list(alerts_by_zone),
            }
        )
