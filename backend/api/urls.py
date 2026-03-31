from django.urls import path

from .views import (
    AlertListAPIView,
    AlertStatusUpdateAPIView,
    DashboardSummaryAPIView,
    IncidentListCreateAPIView,
    SensorReadingCreateAPIView,
    SensorReadingCsvUploadAPIView,
)

urlpatterns = [
    path("readings", SensorReadingCreateAPIView.as_view(), name="reading-create"),
    path("readings/upload", SensorReadingCsvUploadAPIView.as_view(), name="reading-upload"),
    path("alerts", AlertListAPIView.as_view(), name="alert-list"),
    path("alerts/<int:alert_id>", AlertStatusUpdateAPIView.as_view(), name="alert-update"),
    path("incidents", IncidentListCreateAPIView.as_view(), name="incident-list-create"),
    path("dashboard/summary", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
]
