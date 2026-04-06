from django.db import models


class SensorReading(models.Model):
    SOURCE_CHOICES = (
        ("manual", "Manual"),
        ("synthetic", "Synthetic"),
        ("csv", "CSV"),
    )

    timestamp = models.DateTimeField(auto_now_add=True)
    gas_level = models.FloatField()
    temperature = models.FloatField()
    pressure = models.FloatField()
    smoke_level = models.FloatField()
    location = models.CharField(max_length=80)
    shift = models.CharField(max_length=20)
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="manual")
    remarks = models.CharField(max_length=255, blank=True, default="")
    alarm = models.BooleanField(null=True, blank=True)
    predicted_risk_score = models.FloatField(null=True, blank=True)
    fingerprint = models.CharField(max_length=64, unique=True, db_index=True)

    class Meta:
        db_table = "sensor_readings"
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"Reading {self.id} @ {self.location}"

    @staticmethod
    def build_fingerprint(payload: dict) -> str:
        import hashlib
        def _norm(value):
            if value is None:
                return ""
            return str(value).strip().lower()
        parts = [
            _norm(payload.get("timestamp", "")),
            _norm(payload.get("gas_level")),
            _norm(payload.get("temperature")),
            _norm(payload.get("pressure")),
            _norm(payload.get("smoke_level")),
            _norm(payload.get("location")),
            _norm(payload.get("shift")),
            _norm(payload.get("source_type")),
        ]
        raw = "|".join(parts)
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()
