from typing import Dict

from apps.hazards.services.alert_factory import AlertFactory
from apps.sensors.models import SensorReading


class SensorReadingService:
    def __init__(self, prediction_service):
        self.prediction_service = prediction_service

    def create_reading(self, payload: Dict) -> Dict:
        prediction = self.prediction_service.evaluate_reading(payload)

        reading = SensorReading.objects.create(
            gas_level=payload["gas_level"],
            temperature=payload["temperature"],
            pressure=payload["pressure"],
            smoke_level=payload["smoke_level"],
            location=payload["location"],
            shift=payload["shift"],
            source_type=payload.get("source_type", "manual"),
            remarks=payload.get("remarks", ""),
            alarm=bool(prediction["alarm"]),
            predicted_risk_score=prediction["risk_score"],
        )

        alert = AlertFactory.create_from_prediction(reading=reading, prediction=prediction)

        return {
            "reading_id": reading.id,
            "alert_id": alert.id if alert else None,
            **prediction,
        }

