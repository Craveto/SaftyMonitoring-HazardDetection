class RiskScoringEngine:
    @staticmethod
    def score(rule_trigger_count: int, ml_probability: float) -> float:
        rule_component = min(rule_trigger_count * 18.0, 54.0)
        ml_component = max(0.0, min(ml_probability, 1.0)) * 46.0
        return round(rule_component + ml_component, 2)

    @staticmethod
    def severity(risk_score: float) -> str:
        if risk_score >= 85:
            return "critical"
        if risk_score >= 65:
            return "high"
        if risk_score >= 40:
            return "medium"
        return "low"
