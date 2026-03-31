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

    class Meta:
        db_table = "sensor_readings"
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"Reading {self.id} @ {self.location}"

