import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initialState = { title: "", description: "", location: "Zone A", severity: "medium", reported_by: "" };

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [toast, setToast] = useState("");

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    const { data } = await api.post("/hazards", form);
    setToast(`Hazard report submitted (ID ${data.id})`);
    setTimeout(() => setToast(""), 2500);
    setForm(initialState);
  };

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}>
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Report Hazard</h2>
          <p className="text-sm text-slate-600 mt-1">Log a near-miss or unsafe act for immediate review.</p>
        </div>
      </div>

      {toast && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{toast}</div>}

      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <label className="text-sm font-medium text-slate-700">Title<input name="title" className="input-ui mt-1" value={form.title} onChange={onChange} /></label>
        <label className="text-sm font-medium text-slate-700">Location<input name="location" className="input-ui mt-1" value={form.location} onChange={onChange} /></label>
        <label className="text-sm font-medium text-slate-700">Severity<select name="severity" className="select-ui mt-1" value={form.severity} onChange={onChange}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        <label className="text-sm font-medium text-slate-700">Reported By<input name="reported_by" className="input-ui mt-1" value={form.reported_by} onChange={onChange} /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Description<textarea name="description" className="textarea-ui mt-1" rows={4} value={form.description} onChange={onChange} /></label>
      </div>

      <button className="btn-primary mt-5" onClick={submit}>Submit Hazard Report</button>
    </section>
  );
}

