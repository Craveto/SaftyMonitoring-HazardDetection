import { useEffect, useState } from "react";
import api from "../api/client";

function severityClass(level) { return { critical:"status-critical", high:"status-high", medium:"status-medium", low:"status-low" }[level] || "status-low"; }
function statusClass(level) { return { new:"status-new", acknowledged:"status-acknowledged", resolved:"status-resolved" }[level] || "status-new"; }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    const { data } = await api.get("/alerts");
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/alerts/${id}`, { status });
    fetchAlerts();
  };

  return (
    <section className="glass-card p-5 overflow-hidden animate-rise">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h2 className="text-2xl font-semibold">Hazard Alerts</h2>
        <span className="text-sm text-slate-600">Total: {alerts.length}</span>
      </div>
      <div className="overflow-auto">
        <table className="data-table min-w-[780px]">
          <thead><tr><th>ID</th><th>Location</th><th>Shift</th><th>Severity</th><th>Risk</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading alerts...</td></tr> : alerts.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-slate-500">No alerts yet.</td></tr> : alerts.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td><td>{a.reading_location}</td><td className="capitalize">{a.reading_shift}</td>
                <td><span className={`status-chip ${severityClass(a.severity)}`}>{a.severity}</span></td>
                <td>{a.risk_score}</td>
                <td><span className={`status-chip ${statusClass(a.status)}`}>{a.status}</span></td>
                <td><select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="select-ui !py-1.5 !w-[170px]"><option value="new">new</option><option value="acknowledged">acknowledged</option><option value="resolved">resolved</option></select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
