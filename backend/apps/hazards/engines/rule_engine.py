from dataclasses import dataclass
from typing import List


@dataclass
class RuleResult:
    alarm: int
    triggers: List[str]
    message: str


class HazardRuleEngine:
    GAS_THRESHOLD = 250.0
    TEMP_THRESHOLD = 90.0
    SMOKE_THRESHOLD = 15.0

    def evaluate(self, gas_level: float, temperature: float, pressure: float, smoke_level: float) -> RuleResult:
        triggers: List[str] = []
        if gas_level > self.GAS_THRESHOLD:
            triggers.append("gas_level")
        if smoke_level > self.SMOKE_THRESHOLD:
            triggers.append("smoke_level")
        if temperature > self.TEMP_THRESHOLD:
            triggers.append("temperature")

        alarm = 1 if triggers else 0
        msg = f"Hazard threshold exceeded for: {', '.join(triggers)}." if alarm else "All monitored values are within safe range."
        return RuleResult(alarm=alarm, triggers=triggers, message=msg)
