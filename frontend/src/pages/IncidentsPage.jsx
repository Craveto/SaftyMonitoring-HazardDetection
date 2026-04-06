import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import iconIncidents from "../assets/icon-incidents.svg";
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
  const [formOpen, setFormOpen] = useState(false);
  const [lastIncident, setLastIncident] = useState(null);
  const [lastIncidentAt, setLastIncidentAt] = useState(null);

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
  useEffect(() => {
    try {
      const saved = localStorage.getItem("last_incident");
      const savedAt = localStorage.getItem("last_incident_at");
      if (saved) setLastIncident(JSON.parse(saved));
      if (savedAt) setLastIncidentAt(new Date(savedAt));
    } catch {
      // ignore invalid local storage data
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/incidents", { ...form, alert: Number(form.alert) });
    setForm({ alert: "", title: "", summary: "", status: "new", capa_status: "open", next_action: "" });
    setLastIncident(data);
    setLastIncidentAt(new Date());
    localStorage.setItem("last_incident", JSON.stringify(data));
    localStorage.setItem("last_incident_at", new Date().toISOString());
    setCache("incidents_list", null);
    setCache("dashboard_summary", null);
    fetchIncidents();
  };

  const updateIncident = async (id, payload) => {
    await api.patch(`/incidents/${id}`, payload);
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
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}>
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Incidents</h2>
          <p className="text-sm text-slate-600 mt-1">Create and track incidents with CAPA actions.</p>
        </div>
        <img className="page-illustration ml-auto" src={iconIncidents} alt="Incident tracking" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] mb-6">
        <article>
          <div className="flow-card mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick Tips</p>
            <p className="text-sm mt-1 text-slate-700">
              Use this form to capture incident context and link to alert IDs for traceability.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>1. Link an Alert ID so the incident stays audit-ready.</li>
              <li>2. Summaries should include location, shift, and root-cause hints.</li>
              <li>3. CAPA status + next action keep remediation visible to supervisors.</li>
            </ul>
            <button
              type="button"
              className="quick-toggle-btn mt-3"
              onClick={() => setFormOpen((prev) => !prev)}
            >
              {formOpen ? "Close" : "Add Incident"}
            </button>
          </div>
          {formOpen ? (
            <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-slate-700">Alert ID<input className="input-ui mt-1" placeholder="e.g. 12" value={form.alert} onChange={(e) => setForm((p) => ({ ...p, alert: e.target.value }))} required /></label>
              <label className="text-sm font-medium text-slate-700">Incident Title<input className="input-ui mt-1" placeholder="Gas leak in Zone-B" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Summary<textarea rows={3} className="textarea-ui mt-1" placeholder="Provide quick operator notes..." value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} /></label>
              <label className="text-sm font-medium text-slate-700">CAPA Status<select className="select-ui mt-1" value={form.capa_status} onChange={(e) => setForm((p) => ({ ...p, capa_status: e.target.value }))}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select></label>
              <label className="text-sm font-medium text-slate-700">Next Action<input className="input-ui mt-1" placeholder="Assign inspection to supervisor" value={form.next_action} onChange={(e) => setForm((p) => ({ ...p, next_action: e.target.value }))} /></label>
              <button className="btn-primary md:col-span-2">Create Incident</button>
            </form>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Click “Add Incident” to log a new incident and CAPA action.
            </div>
          )}
        </article>

        <article>
          <div className="flow-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">Latest Incident</h3>
              <span className="status-badge">CAPA Tracking</span>
            </div>
            {!lastIncident ? (
              <p className="text-sm text-slate-500">Create an incident to see the most recent update here.</p>
            ) : (
              <div className="space-y-3 text-sm text-slate-700">
                <div className="text-xs text-slate-500">
                  {lastIncidentAt ? `Last update: ${lastIncidentAt.toLocaleString()}` : "Last update saved"}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Title</div>
                  <div className="text-base font-semibold text-slate-900">{lastIncident.title}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Status</div>
                    <div className="text-sm font-semibold text-slate-900">{lastIncident.status}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs uppercase tracking-[0.1em] text-slate-500">CAPA</div>
                    <div className="text-sm font-semibold text-slate-900">{lastIncident.capa_status}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Next Action</div>
                  <div className="text-sm text-slate-800">{lastIncident.next_action || "Not set"}</div>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="table-scroll">
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
                  <td>
                    <select
                      className="select-ui !py-1.5 !w-[150px]"
                      value={i.status}
                      onChange={(e) => updateIncident(i.id, { status: e.target.value })}
                    >
                      <option value="new">new</option>
                      <option value="acknowledged">acknowledged</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-ui !py-1.5 !w-[160px]"
                      value={i.capa_status}
                      onChange={(e) => updateIncident(i.id, { capa_status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
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

