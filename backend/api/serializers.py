import csv
import io

from rest_framework import serializers

from apps.hazards.models import HazardAlert
from apps.incidents.models import Incident
from apps.sensors.models import SensorReading


class SensorReadingCreateSerializer(serializers.ModelSerializer):
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
        }


class SensorReadingCsvUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        decoded = value.read().decode("utf-8")
        value.seek(0)
        reader = csv.DictReader(io.StringIO(decoded))
        required = {"gas_level", "temperature", "pressure", "smoke_level", "location", "shift"}
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
        fields = ["alert", "title", "summary", "status"]


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
            "opened_at",
            "closed_at",
        ]
