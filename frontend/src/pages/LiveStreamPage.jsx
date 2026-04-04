import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const randomBetween = (min, max) => Math.random() * (max - min) + min;

export default function LiveStreamPage() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  const sendReading = async () => {
    const payload = {
      gas_level: Number(randomBetween(60, 280).toFixed(1)),
      temperature: Number(randomBetween(40, 110).toFixed(1)),
      pressure: Number(randomBetween(140, 260).toFixed(1)),
      smoke_level: Number(randomBetween(2, 18).toFixed(1)),
      location: ["Zone A", "Zone B", "Zone C"][Math.floor(Math.random() * 3)],
      shift: ["Morning", "Afternoon", "Night"][Math.floor(Math.random() * 3)],
      source_type: "stream",
      remarks: "live stream",
    };
    try {
      const { data } = await api.post("/readings", payload);
      setLastSent({ ...payload, alarm: data.alarm, risk: data.risk_score });
      setSentCount((c) => c + 1);
      setError("");
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Stream failed to send. Check backend and try again.";
      setError(detail);
      stop();
    }
  };

  const start = () => {
    if (timerRef.current) return;
    setRunning(true);
    sendReading();
    timerRef.current = setInterval(sendReading, 5000);
  };

  const stop = () => {
    setRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => stop(), []);

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}> <BackIcon /> </button>
        <div>
          <h2 className="text-2xl font-semibold">Live IoT Sensor Stream</h2>
          <p className="text-sm text-slate-600 mt-1">Simulated stream writes to Azure SQL every 5 seconds.</p>
        </div>
      </div>

      <div className="flow-card">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={start} disabled={running}>Start Stream</button>
          <button className="btn-secondary" onClick={stop} disabled={!running}>Stop Stream</button>
          <span className="text-sm text-slate-600">Sent: {sentCount}</span>
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error}
          </div>
        )}

        {lastSent && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="info-card">
              <div className="section-title">Latest Reading</div>
              <p className="text-sm text-slate-600">Gas: {lastSent.gas_level} ppm</p>
              <p className="text-sm text-slate-600">Temp: {lastSent.temperature} C</p>
              <p className="text-sm text-slate-600">Pressure: {lastSent.pressure} kPa</p>
              <p className="text-sm text-slate-600">Smoke: {lastSent.smoke_level}</p>
              <p className="text-sm text-slate-600">Location: {lastSent.location}</p>
              <p className="text-sm text-slate-600">Shift: {lastSent.shift}</p>
            </div>
            <div className="info-card">
              <div className="section-title">Latest Assessment</div>
              <p className="text-sm text-slate-600">Alarm: {lastSent.alarm}</p>
              <p className="text-sm text-slate-600">Risk Score: {lastSent.risk}</p>
              <p className="text-sm text-slate-600">Source: stream</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

