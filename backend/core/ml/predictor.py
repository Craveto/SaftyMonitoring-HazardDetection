from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np


class SklearnHazardPredictor:
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model = None

    def load(self) -> None:
        if self.model_path.exists():
            self.model = joblib.load(self.model_path)

    def _fallback_probability(self, features: List[float]) -> float:
        gas, temp, pressure, smoke = features
        score = 0.0
        if gas >= 85:
            score += 0.30
        if temp >= 80:
            score += 0.25
        if pressure <= 70 or pressure >= 130:
            score += 0.20
        if smoke >= 65:
            score += 0.25
        return min(score, 0.99)

    def predict_probability(self, features: List[float]) -> float:
        if self.model is None:
            self.load()
        if self.model is None:
            return self._fallback_probability(features)
        row = np.array(features, dtype=float).reshape(1, -1)
        return float(self.model.predict_proba(row)[0][1])

    def predict(self, features: List[float]) -> Dict[str, float | int]:
        proba = self.predict_probability(features)
        alarm = 1 if proba >= 0.5 else 0
        return {"alarm": alarm, "ml_probability": round(proba, 4)}
