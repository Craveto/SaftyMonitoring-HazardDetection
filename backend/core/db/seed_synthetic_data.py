import numpy as np
import pandas as pd


def generate(rows: int = 4000, out_csv: str = "backend/core/db/safety_monitoring.csv") -> None:
    data = {
        "timestamp": pd.date_range(start="2026-01-01", periods=rows, freq="min"),
        "gas_level": np.random.normal(100, 50, rows),
        "temperature": np.random.normal(60, 15, rows),
        "pressure": np.random.normal(200, 40, rows),
        "smoke_level": np.random.normal(5, 3, rows),
        "location": np.random.choice(["Zone A", "Zone B", "Zone C"], rows),
        "shift": np.random.choice(["Morning", "Afternoon", "Night"], rows),
    }

    df = pd.DataFrame(data)
    df["alarm"] = (
        (df["gas_level"] > 250)
        | (df["smoke_level"] > 15)
        | (df["temperature"] > 90)
    ).astype(int)

    df.to_csv(out_csv, index=False)
    print(f"Saved synthetic data to {out_csv}")


if __name__ == "__main__":
    generate()
