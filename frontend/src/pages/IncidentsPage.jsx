import { useEffect, useState } from "react";
import api from "../api/client";

function statusClass(level) { return { new:"status-new", acknowledged:"status-acknowledged", resolved:"status-resolved" }[level] || "status-new"; }

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({ alert: "", title: "", summary: "", status: "new" });

  const fetchIncidents = async () => {
    const { data } = await api.get("/incidents");
    setIncidents(data);
  };

  useEffect(() => { fetchIncidents(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    await api.post("/incidents", { ...form, alert: Number(form.alert) });
    setForm({ alert: "", title: "", summary: "", status: "new" });
    fetchIncidents();
  };

  return (
    <section className="space-y-4 animate-rise">
      <form onSubmit={onSubmit} className="glass-card p-5 grid md:grid-cols-2 gap-4">
        <h2 className="text-2xl font-semibold md:col-span-2">Create Incident</h2>
        <label className="text-sm font-medium text-slate-700">Alert ID<input className="input-ui mt-1" placeholder="e.g. 12" value={form.alert} onChange={(e) => setForm((p) => ({ ...p, alert: e.target.value }))} required /></label>
        <label className="text-sm font-medium text-slate-700">Incident Title<input className="input-ui mt-1" placeholder="Gas leak in Zone-B" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Summary<textarea rows={3} className="textarea-ui mt-1" placeholder="Provide quick operator notes..." value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} /></label>
        <button className="btn-primary md:col-span-2">Create Incident</button>
      </form>
      <div className="glass-card p-5 overflow-auto">
        <h2 className="text-xl font-semibold mb-3">Incident Timeline</h2>
        <table className="data-table min-w-[680px]">
          <thead><tr><th>ID</th><th>Alert</th><th>Severity</th><th>Title</th><th>Status</th><th>Opened</th></tr></thead>
          <tbody>{incidents.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-500">No incidents found.</td></tr> : incidents.map((i) => <tr key={i.id}><td>#{i.id}</td><td>{i.alert}</td><td className="capitalize">{i.alert_severity}</td><td>{i.title}</td><td><span className={`status-chip ${statusClass(i.status)}`}>{i.status}</span></td><td>{new Date(i.opened_at).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
