from django.db import models
from django.utils import timezone

from apps.hazards.models import HazardAlert


class Incident(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("acknowledged", "Acknowledged"),
        ("resolved", "Resolved"),
    )

    CAPA_STATUS_CHOICES = (
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("closed", "Closed"),
    )

    alert = models.ForeignKey(HazardAlert, on_delete=models.CASCADE, related_name="incidents")
    title = models.CharField(max_length=120)
    summary = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    capa_status = models.CharField(max_length=20, choices=CAPA_STATUS_CHOICES, default="open")
    next_action = models.CharField(max_length=255, blank=True, default="")
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


class HazardReport(models.Model):
    SEVERITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    )

    title = models.CharField(max_length=120)
    description = models.CharField(max_length=800)
    location = models.CharField(max_length=80)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")
    reported_by = models.CharField(max_length=80, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "hazard_reports"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"HazardReport {self.id}"
