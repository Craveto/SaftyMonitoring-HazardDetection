from typing import Dict

from apps.incidents.models import Incident


class IncidentService:
    VALID_STATUS = {"new", "acknowledged", "resolved"}

    def create_incident(self, payload: Dict) -> Incident:
        return Incident.objects.create(**payload)

    def transition_status(self, incident: Incident, target_status: str) -> Incident:
        if target_status not in self.VALID_STATUS:
            raise ValueError("Invalid status")
        if incident.status == "resolved" and target_status != "resolved":
            raise ValueError("Resolved incidents cannot move backward")
        incident.status = target_status
        if target_status == "resolved":
            incident.mark_resolved()
        incident.save(update_fields=["status", "closed_at"])
        return incident
