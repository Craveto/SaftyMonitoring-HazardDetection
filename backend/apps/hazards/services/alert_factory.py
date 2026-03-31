from apps.hazards.models import HazardAlert


class AlertFactory:
    @staticmethod
    def create_from_prediction(reading, prediction: dict):
        if prediction["alarm"] != 1:
            return None
        return HazardAlert.objects.create(
            reading=reading,
            severity=prediction["severity"],
            risk_score=prediction["risk_score"],
            rule_triggered=",".join(prediction.get("rule_triggered", [])),
            ml_triggered=prediction.get("ml_probability", 0.0) >= 0.5,
            status="new",
        )
