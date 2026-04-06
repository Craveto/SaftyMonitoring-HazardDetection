from typing import Dict

from apps.hazards.services.alert_factory import AlertFactory
from apps.sensors.models import SensorReading


def _normalize_location(value: str) -> str:
    clean = " ".join(str(value).replace("-", " ").split())
    if clean.lower().startswith("zone"):
        parts = clean.split()
        if len(parts) >= 2:
            return f"Zone {parts[1].upper()}"
    return clean.title()


def _normalize_shift(value: str) -> str:
    clean = " ".join(str(value).replace("-", " ").split())
    return clean.title()


class SensorReadingService:
    def __init__(self, prediction_service):
        self.prediction_service = prediction_service

    def create_reading(self, payload: Dict) -> Dict:
        normalized_payload = {
            **payload,
            "location": _normalize_location(payload.get("location", "Zone A")),
            "shift": _normalize_shift(payload.get("shift", "Day")),
            "source_type": payload.get("source_type", "manual"),
        }
        fingerprint = SensorReading.build_fingerprint(normalized_payload)
        existing = SensorReading.objects.filter(fingerprint=fingerprint).first()
        if existing:
            alert = existing.alerts.first() if hasattr(existing, "alerts") else None
            prediction = self.prediction_service.evaluate_reading(payload)
            return {
                "reading_id": existing.id,
                "alert_id": alert.id if alert else None,
                "duplicate": True,
                **prediction,
            }

        prediction = self.prediction_service.evaluate_reading(payload)

        reading = SensorReading.objects.create(
            gas_level=payload["gas_level"],
            temperature=payload["temperature"],
            pressure=payload["pressure"],
            smoke_level=payload["smoke_level"],
            location=normalized_payload["location"],
            shift=normalized_payload["shift"],
            source_type=normalized_payload["source_type"],
            remarks=payload.get("remarks", ""),
            alarm=bool(prediction["alarm"]),
            predicted_risk_score=prediction["risk_score"],
            fingerprint=fingerprint,
        )

        alert = AlertFactory.create_from_prediction(reading=reading, prediction=prediction)

        return {
            "reading_id": reading.id,
            "alert_id": alert.id if alert else None,
            **prediction,
        }
