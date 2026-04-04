from django.urls import path

from .views import (
    AlertListAPIView,
    AlertStatusUpdateAPIView,
    AlertHistoryAPIView,
    DashboardSummaryAPIView,
    IncidentListCreateAPIView,
    IncidentUpdateAPIView,
    IncidentPdfAPIView,
    SensorReadingCreateAPIView,
    SensorReadingCsvUploadAPIView,
    DemoDataCreateAPIView,
    HazardReportListCreateAPIView,
    PPEViolationListCreateAPIView,
)

urlpatterns = [
    path("readings", SensorReadingCreateAPIView.as_view(), name="reading-create"),
    path("readings/upload", SensorReadingCsvUploadAPIView.as_view(), name="reading-upload"),
    path("readings/demo", DemoDataCreateAPIView.as_view(), name="reading-demo"),
    path("alerts", AlertListAPIView.as_view(), name="alert-list"),
    path("alerts/<int:alert_id>", AlertStatusUpdateAPIView.as_view(), name="alert-update"),
    path("alerts/<int:alert_id>/history", AlertHistoryAPIView.as_view(), name="alert-history"),
    path("incidents", IncidentListCreateAPIView.as_view(), name="incident-list-create"),
    path("incidents/<int:incident_id>", IncidentUpdateAPIView.as_view(), name="incident-update"),
    path("incidents/<int:incident_id>/pdf", IncidentPdfAPIView.as_view(), name="incident-pdf"),
    path("hazards", HazardReportListCreateAPIView.as_view(), name="hazard-report-list-create"),
    path("ppe/violations", PPEViolationListCreateAPIView.as_view(), name="ppe-violations"),
    path("dashboard/summary", DashboardSummaryAPIView.as_view(), name="dashboard-summary"),
]
