from django.db import models
from django.utils import timezone

from apps.hazards.models import HazardAlert


class Incident(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("acknowledged", "Acknowledged"),
        ("resolved", "Resolved"),
    )

    alert = models.ForeignKey(HazardAlert, on_delete=models.CASCADE, related_name="incidents")
    title = models.CharField(max_length=120)
    summary = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "incidents"
        ordering = ["-opened_at"]

    def mark_resolved(self) -> None:
        self.status = "resolved"
        self.closed_at = timezone.now()

    def __str__(self) -> str:
        return f"Incident {self.id}"
