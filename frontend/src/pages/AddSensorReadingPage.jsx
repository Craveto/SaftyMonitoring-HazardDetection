import { useState } from "react";
import api from "../api/client";

const initialState = { gas_level:"", temperature:"", pressure:"", smoke_level:"", location:"Zone-A", shift:"morning", remarks:"" };

function severityClass(level) {
  return { critical:"status-critical", high:"status-high", medium:"status-medium", low:"status-low" }[level] || "status-low";
}

export default function AddSensorReadingPage() {
  const [form, setForm] = useState(initialState);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, gas_level:Number(form.gas_level), temperature:Number(form.temperature), pressure:Number(form.pressure), smoke_level:Number(form.smoke_level) };
      const { data } = await api.post("/readings", payload);
      setResult(data);
      setForm(initialState);
    } finally { setSubmitting(false); }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] animate-rise">
      <article className="glass-card p-5">
        <h2 className="text-2xl font-semibold">Add Sensor Reading</h2>
        <p className="text-sm text-slate-600 mt-1 mb-4">Capture real-time values from operator checks or edge devices.</p>
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
          {[ ["gas_level","Gas Level (ppm)"],["temperature","Temperature (°C)"],["pressure","Pressure (kPa)"],["smoke_level","Smoke Level"] ].map(([key,label]) => (
            <label key={key} className="text-sm font-medium text-slate-700">{label}<input name={key} value={form[key]} onChange={onChange} type="number" step="0.1" className="input-ui mt-1" required /></label>
          ))}
          <label className="text-sm font-medium text-slate-700">Location<input name="location" value={form.location} onChange={onChange} className="input-ui mt-1" /></label>
          <label className="text-sm font-medium text-slate-700">Shift<select name="shift" value={form.shift} onChange={onChange} className="select-ui mt-1"><option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option></select></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Remarks<textarea name="remarks" value={form.remarks} onChange={onChange} rows={3} className="textarea-ui mt-1" /></label>
          <button disabled={submitting} className="btn-primary sm:col-span-2 disabled:opacity-50">{submitting ? "Evaluating Risk..." : "Submit and Predict"}</button>
        </form>
      </article>

      <article className="glass-card p-5">
        <h3 className="text-xl font-semibold mb-2">Latest Assessment</h3>
        {!result ? <p className="text-sm text-slate-500">Submit a reading to view alarm decision, risk score, severity, and reason.</p> : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-card !p-3"><p className="metric-label">Alarm</p><p className="metric-value text-2xl">{result.alarm}</p></div>
              <div className="metric-card !p-3"><p className="metric-label">Risk Score</p><p className="metric-value text-2xl">{result.risk_score}</p></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="text-sm font-medium">Severity</span><span className={`status-chip ${severityClass(result.severity)}`}>{result.severity}</span></div>
            <div className="rounded-xl border border-slate-200 p-3 bg-white"><p className="text-xs uppercase tracking-[0.09em] text-slate-500 mb-1">Triggered Rules</p><p className="text-sm text-slate-800">{result.rule_triggered?.join(", ") || "None"}</p></div>
            <div className="rounded-xl border border-slate-200 p-3 bg-white"><p className="text-xs uppercase tracking-[0.09em] text-slate-500 mb-1">Message</p><p className="text-sm text-slate-800">{result.message}</p></div>
          </div>
        )}
      </article>
    </section>
  );
}
