from typing import Dict

from apps.hazards.engines.rule_engine import HazardRuleEngine
from apps.hazards.services.risk_scoring_engine import RiskScoringEngine
from core.ml.predictor import SklearnHazardPredictor


class PredictionService:
    def __init__(self, model_path: str):
        self.rule_engine = HazardRuleEngine()
        self.risk_engine = RiskScoringEngine()
        self.predictor = SklearnHazardPredictor(model_path=model_path)

    def evaluate_reading(self, payload: Dict) -> Dict:
        gas_level = float(payload["gas_level"])
        temperature = float(payload["temperature"])
        pressure = float(payload["pressure"])
        smoke_level = float(payload["smoke_level"])

        rule = self.rule_engine.evaluate(gas_level, temperature, pressure, smoke_level)
        ml = self.predictor.predict([gas_level, temperature, pressure, smoke_level])

        risk_score = self.risk_engine.score(len(rule.triggers), ml["ml_probability"])
        severity = self.risk_engine.severity(risk_score)
        final_alarm = 1 if (rule.alarm == 1 or ml["alarm"] == 1) else 0

        msg = (
            f"{severity.title()} hazard due to {', '.join(rule.triggers)}."
            if rule.triggers
            else "No critical rule trigger. ML indicates low immediate hazard."
        )

        return {
            "alarm": final_alarm,
            "risk_score": risk_score,
            "severity": severity,
            "ml_probability": round(ml["ml_probability"], 4),
            "rule_triggered": rule.triggers,
            "message": msg,
        }
