import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { getCache, setCache } from "../api/cache";
const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function IncidentsPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({ alert: "", title: "", summary: "", status: "new", capa_status: "open", next_action: "" });

  const fetchIncidents = async () => {
    const cached = getCache("incidents_list", 2 * 60 * 1000);
    if (cached) {
      setIncidents(cached.data);
    }
    const { data } = await api.get("/incidents");
    setIncidents(data);
    setCache("incidents_list", data);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    await api.post("/incidents", { ...form, alert: Number(form.alert) });
    setForm({ alert: "", title: "", summary: "", status: "new", capa_status: "open", next_action: "" });
    setCache("incidents_list", null);
    setCache("dashboard_summary", null);
    fetchIncidents();
  };

  const downloadPdf = async (id) => {
    const response = await api.get(`/incidents/${id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `incident_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard")}>
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Incidents</h2>
          <p className="text-sm text-slate-600 mt-1">Create and track incidents with CAPA actions.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4 mb-6">
        <label className="text-sm font-medium text-slate-700">Alert ID<input className="input-ui mt-1" placeholder="e.g. 12" value={form.alert} onChange={(e) => setForm((p) => ({ ...p, alert: e.target.value }))} required /></label>
        <label className="text-sm font-medium text-slate-700">Incident Title<input className="input-ui mt-1" placeholder="Gas leak in Zone-B" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Summary<textarea rows={3} className="textarea-ui mt-1" placeholder="Provide quick operator notes..." value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} /></label>
        <label className="text-sm font-medium text-slate-700">CAPA Status<select className="select-ui mt-1" value={form.capa_status} onChange={(e) => setForm((p) => ({ ...p, capa_status: e.target.value }))}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select></label>
        <label className="text-sm font-medium text-slate-700">Next Action<input className="input-ui mt-1" placeholder="Assign inspection to supervisor" value={form.next_action} onChange={(e) => setForm((p) => ({ ...p, next_action: e.target.value }))} /></label>
        <button className="btn-primary md:col-span-2">Create Incident</button>
      </form>

      <div className="overflow-auto">
        <table className="data-table min-w-[980px]">
          <thead><tr><th>ID</th><th>Alert</th><th>Title</th><th>Status</th><th>CAPA</th><th>Next Action</th><th>Opened</th><th>Report</th></tr></thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">No incidents found.</td></tr>
            ) : (
              incidents.map((i) => (
                <tr key={i.id}>
                  <td>#{i.id}</td>
                  <td>{i.alert}</td>
                  <td>{i.title}</td>
                  <td>{i.status}</td>
                  <td>{i.capa_status}</td>
                  <td>{i.next_action || "-"}</td>
                  <td>{new Date(i.opened_at).toLocaleString()}</td>
                  <td><button className="btn-secondary !py-1.5 !text-xs" onClick={() => downloadPdf(i.id)}>PDF</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
