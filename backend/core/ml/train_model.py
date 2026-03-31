from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split


def train_models(csv_path: str, output_dir: str) -> None:
    df = pd.read_csv(csv_path)
    x = df[["gas_level", "temperature", "pressure", "smoke_level"]]
    y = df["alarm"]

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)

    lr = LogisticRegression(max_iter=400)
    lr.fit(x_train, y_train)

    rf = RandomForestClassifier(n_estimators=250, max_depth=12, random_state=42, class_weight="balanced")
    rf.fit(x_train, y_train)

    print("Logistic Regression report")
    print(classification_report(y_test, lr.predict(x_test)))
    print("Random Forest report")
    print(classification_report(y_test, rf.predict(x_test)))

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump(lr, out / "hazard_lr.joblib")
    joblib.dump(rf, out / "hazard_rf.joblib")
    print(f"Saved models in: {out.resolve()}")


if __name__ == "__main__":
    train_models("backend/core/db/safety_monitoring.csv", "backend/core/ml/artifacts")
