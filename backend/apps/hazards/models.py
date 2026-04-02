from django.db import models

from apps.sensors.models import SensorReading


class HazardAlert(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("acknowledged", "Acknowledged"),
        ("resolved", "Resolved"),
    )

    reading = models.ForeignKey(SensorReading, on_delete=models.CASCADE, related_name="alerts")
    severity = models.CharField(max_length=20)
    risk_score = models.FloatField()
    rule_triggered = models.CharField(max_length=255, blank=True, default="")
    ml_triggered = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "hazard_alerts"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Alert {self.id} ({self.severity})"

class HazardAlertHistory(models.Model):
    alert = models.ForeignKey(HazardAlert, on_delete=models.CASCADE, related_name="history")
    old_status = models.CharField(max_length=20, blank=True, default="")
    new_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "hazard_alert_history"
        ordering = ["-changed_at"]

    def __str__(self) -> str:
        return f"Alert {self.alert_id} {self.old_status}->{self.new_status}"
