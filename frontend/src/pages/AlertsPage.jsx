import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import iconAlerts from "../assets/icon-alerts.svg";
import { getCache, setCache } from "../api/cache";
const BackIcon = () => (
  <svg className="back-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#1a6ad9" strokeWidth="2" />
    <path d="M13.5 7.5L9 12l4.5 4.5" fill="none" stroke="#1a6ad9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function severityClass(level) { return { critical:"status-critical", high:"status-high", medium:"status-medium", low:"status-low" }[level] || "status-low"; }
function statusClass(level) { return { new:"status-new", acknowledged:"status-acknowledged", resolved:"status-resolved" }[level] || "status-new"; }

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditItems, setAuditItems] = useState([]);
  const [auditAlert, setAuditAlert] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [filters, setFilters] = useState({ severity: "all", status: "all", query: "" });

  const fetchAlerts = async () => {
    const cached = getCache("alerts_list", 2 * 60 * 1000);
    if (cached) {
      setAlerts(cached.data);
      setLoading(false);
    }
    const { data } = await api.get("/alerts?limit=500");
    setAlerts(data);
    setCache("alerts_list", data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/alerts/${id}`, { status });
    setCache("alerts_list", null);
    setCache("dashboard_summary", null);
    setToast("Alert status updated");
    setTimeout(() => setToast(""), 2500);
    fetchAlerts();
  };

  const countBy = (key, value) => alerts.filter((a) => a[key] === value).length;
  const severityCount = {
    critical: countBy("severity", "critical"),
    high: countBy("severity", "high"),
    medium: countBy("severity", "medium"),
    low: countBy("severity", "low"),
  };
  const statusCount = {
    new: countBy("status", "new"),
    acknowledged: countBy("status", "acknowledged"),
    resolved: countBy("status", "resolved"),
  };

  const formatSla = (value) => {
    const deltaMs = Date.now() - new Date(value).getTime();
    const mins = Math.floor(deltaMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const openAudit = async (alert) => {
    setAuditAlert(alert);
    setAuditOpen(true);
    setAuditLoading(true);
    try {
      const { data } = await api.get(`/alerts/${alert.id}/history`);
      setAuditItems(data);
    } finally {
      setAuditLoading(false);
    }
  };

  const recommendedAction = (alert) => {
    if (alert.status === "resolved") return "Archive and verify closure";
    if (alert.severity === "critical") return "Evacuate zone, isolate source, notify supervisor";
    if (alert.severity === "high") return "Inspect equipment, increase ventilation, assign CAPA";
    if (alert.severity === "medium") return "Review readings, schedule inspection";
    return "Monitor and record next reading";
  };

  const filteredAlerts = alerts.filter((a) => {
    const severityOk = filters.severity === "all" || a.severity === filters.severity;
    const statusOk = filters.status === "all" || a.status === filters.status;
    const q = filters.query.trim().toLowerCase();
    const queryOk = !q || `${a.reading_location} ${a.reading_shift} ${a.rule_triggered}`.toLowerCase().includes(q);
    return severityOk && statusOk && queryOk;
  });

  return (
    <section className="panel p-5">
      {auditOpen && (
        <div className="modal-backdrop" onClick={() => setAuditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Audit Trail</p>
                <h3 className="text-lg font-semibold">Alert #{auditAlert?.id}</h3>
              </div>
              <button className="modal-close" onClick={() => setAuditOpen(false)}>Close</button>
            </div>
            {auditLoading ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : (
              <div className="space-y-3">
                <div className="steps-item">
                  <div className="steps-index">0</div>
                  <div>
                    <p className="text-sm font-medium">Alert Created</p>
                    <p className="text-xs text-slate-500">{auditAlert?.created_at ? new Date(auditAlert.created_at).toLocaleString() : "--"}</p>
                  </div>
                </div>
                {auditItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No status changes recorded yet.</p>
                ) : (
                  auditItems.map((item, idx) => (
                    <div key={item.id} className="steps-item">
                      <div className="steps-index">{idx + 1}</div>
                      <div>
                        <p className="text-sm font-medium">{item.old_status || "new"} → {item.new_status}</p>
                        <p className="text-xs text-slate-500">{new Date(item.changed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <button className="back-btn" title="Back" aria-label="Back" onClick={() => navigate("/dashboard", { replace: true, state: { scrollTo: "flow-cards" } })}>
          <BackIcon />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Hazard Alerts</h2>
          <p className="text-sm text-slate-600 mt-1">Monitor, acknowledge, and resolve alerts.</p>
        </div>
        <img className="page-illustration ml-auto" src={iconAlerts} alt="Alerts overview" />
      </div>

      {toast && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{toast}</div>}

      <div className="filter-bar">
        <div className="filter-group">
          <label className="text-xs text-slate-500">Severity</label>
          <select className="select-ui !py-1.5 !w-[160px]" value={filters.severity} onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value }))}>
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="text-xs text-slate-500">Status</label>
          <select className="select-ui !py-1.5 !w-[160px]" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="filter-group flex-1">
          <label className="text-xs text-slate-500">Search</label>
          <input className="input-ui !py-1.5" placeholder="Search zone, shift, trigger..." value={filters.query} onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-3">
        <span className="status-chip status-critical">Critical <span className="chip-count">{severityCount.critical}</span></span>
        <span className="status-chip status-high">High <span className="chip-count">{severityCount.high}</span></span>
        <span className="status-chip status-medium">Medium <span className="chip-count">{severityCount.medium}</span></span>
        <span className="status-chip status-low">Low <span className="chip-count">{severityCount.low}</span></span>
        <span className="status-chip status-new">New <span className="chip-count">{statusCount.new}</span></span>
        <span className="status-chip status-acknowledged">Acknowledged <span className="chip-count">{statusCount.acknowledged}</span></span>
        <span className="status-chip status-resolved">Resolved <span className="chip-count">{statusCount.resolved}</span></span>
      </div>

      <div className="table-scroll">
        <table className="data-table min-w-[1180px]">
          <thead><tr><th>ID</th><th>Location</th><th>Shift</th><th>Severity</th><th>Risk</th><th>Status</th><th>SLA</th><th>Triggers</th><th>Recommended Action</th><th>Audit</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={11} className="text-center py-8 text-slate-500">Loading alerts...</td></tr> : filteredAlerts.length === 0 ? <tr><td colSpan={11} className="text-center py-8 text-slate-500">No alerts match current filters.</td></tr> : filteredAlerts.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td><td>{a.reading_location}</td><td className="capitalize">{a.reading_shift}</td>
                <td><span className={`status-chip ${severityClass(a.severity)}`}>{a.severity}</span></td>
                <td>{a.risk_score}</td>
                <td><span className={`status-chip ${statusClass(a.status)}`}>{a.status}</span></td>
                <td className="text-sm text-slate-600">{a.created_at ? formatSla(a.created_at) : "--"}</td>
                <td>{a.rule_triggered || "-"}</td>
                <td className="text-sm text-slate-700">{recommendedAction(a)}</td>
                <td><button className="btn-secondary !py-1.5 !text-xs" onClick={() => openAudit(a)}>View</button></td>
                <td><select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="select-ui !py-1.5 !w-[170px]"><option value="new">new</option><option value="acknowledged">acknowledged</option><option value="resolved">resolved</option></select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

