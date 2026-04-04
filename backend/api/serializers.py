import csv
import io

from rest_framework import serializers

from apps.hazards.models import HazardAlert, HazardAlertHistory, PPEViolation
from apps.incidents.models import Incident, HazardReport
from apps.sensors.models import SensorReading


class SensorReadingCreateSerializer(serializers.ModelSerializer):
    source_type = serializers.ChoiceField(choices=["manual", "synthetic", "csv", "stream"], required=False)

    class Meta:
        model = SensorReading
        fields = [
            "gas_level",
            "temperature",
            "pressure",
            "smoke_level",
            "location",
            "shift",
            "source_type",
            "remarks",
        ]
        extra_kwargs = {
            "source_type": {"required": False},
            "remarks": {"required": False, "allow_blank": True},
            "location": {"required": False},
            "shift": {"required": False},
        }


class SensorReadingCsvUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        decoded = value.read().decode("utf-8")
        value.seek(0)
        reader = csv.DictReader(io.StringIO(decoded))
        required = {"gas_level", "temperature", "pressure", "smoke_level"}
        if not required.issubset(reader.fieldnames or []):
            raise serializers.ValidationError(f"CSV must include columns: {sorted(required)}")
        return value


class HazardAlertSerializer(serializers.ModelSerializer):
    reading_location = serializers.CharField(source="reading.location", read_only=True)
    reading_shift = serializers.CharField(source="reading.shift", read_only=True)

    class Meta:
        model = HazardAlert
        fields = [
            "id",
            "reading_id",
            "reading_location",
            "reading_shift",
            "severity",
            "risk_score",
            "rule_triggered",
            "ml_triggered",
            "status",
            "created_at",
        ]


class AlertStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["new", "acknowledged", "resolved"])


class IncidentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = ["alert", "title", "summary", "status", "capa_status", "next_action"]
        extra_kwargs = {
            "capa_status": {"required": False},
            "next_action": {"required": False, "allow_blank": True},
        }


class IncidentSerializer(serializers.ModelSerializer):
    alert_severity = serializers.CharField(source="alert.severity", read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "alert",
            "alert_severity",
            "title",
            "summary",
            "status",
            "capa_status",
            "next_action",
            "opened_at",
            "closed_at",
        ]


class HazardReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HazardReport
        fields = ["title", "description", "location", "severity", "reported_by"]
        extra_kwargs = {
            "reported_by": {"required": False, "allow_blank": True},
        }


class HazardReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HazardReport
        fields = ["id", "title", "description", "location", "severity", "reported_by", "created_at"]

class HazardAlertHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HazardAlertHistory
        fields = ["id", "old_status", "new_status", "changed_at"]

class PPEViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PPEViolation
        fields = ["id", "media_type", "filename", "detected", "violation_type", "confidence", "status", "created_at"]


class PPEViolationCreateSerializer(serializers.Serializer):
    file = serializers.FileField()

