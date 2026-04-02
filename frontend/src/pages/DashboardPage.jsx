import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import api from "../api/client";
import { getCache, setCache } from "../api/cache";

const zoneColors = ["#1a6ad9", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6", "#64748b"];

const steps = [
  "Add readings manually or upload CSVs.",
  "Rule engine evaluates hazards instantly.",
  "Alerts appear with severity and triggers.",
  "Create and track incidents to resolution.",
];

const flowCards = [
  { title: "Input & Upload", desc: "Manual readings or CSV upload enter the system.", route: "/add-reading", icon: "IN" },
  { title: "Rule Engine", desc: "Threshold checks trigger alarms instantly.", route: "/alerts", icon: "RE" },
  { title: "ML Scoring", desc: "Model calculates risk score for context.", route: "/dashboard", icon: "ML" },
  { title: "Alerts", desc: "Alerts are stored and shown on the dashboard.", route: "/alerts", icon: "AL" },
  { title: "Incidents & CAPA", desc: "Teams investigate and track corrective actions.", route: "/incidents", icon: "IC" },
  { title: "Hazard Reports", desc: "Log hazards and near-misses for review.", route: "/admin-settings", icon: "HR" },
];

const breadcrumbMap = {
  "/dashboard": "Dashboard",
  "/add-reading": "Add Reading",
  "/upload-csv": "Upload CSV",
  "/alerts": "Alerts",
  "/incidents": "Incidents",
  "/admin-settings": "Report Hazard",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    active_alerts: 0,
    open_incidents: 0,
    alerts_by_shift: [],
    alerts_by_zone: [],
    total_incidents: 0,
    resolution_rate: 0,
    total_alerts: 0,
    top_risk_zones: [],
    last_reading_at: null,
    stale_sensors: 0,
    total_sensors: 0,
    anomaly_detected: false,
    anomaly_message: "",
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      const cached = getCache("dashboard_summary", 5 * 60 * 1000);
      if (cached) {
        const cachedData = cached.data || {};
        const likelyStale = cachedData.active_alerts > 0 && !cachedData.last_reading_at && Number(cachedData.total_sensors || 0) === 0;
        if (!likelyStale) {
          setData(cachedData);
          setLastUpdated(new Date(cached.ts));
          setLoading(false);
        }
      }
      try {
        const { data } = await api.get("/dashboard/summary");
        setData(data);
        setLastUpdated(new Date());
        setCache("dashboard_summary", data);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDemoData = async () => {
    setDemoLoading(true);
    setDemoNotice("");
    try {
      await api.post("/readings/demo");
      setCache("dashboard_summary", null);
      setCache("alerts_list", null);
      const { data } = await api.get("/dashboard/summary");
      setData(data);
      setLastUpdated(new Date());
      setDemoNotice("Demo data inserted successfully.");
    } catch {
      setDemoNotice("Demo data load failed. Try again.");
    } finally {
      setDemoLoading(false);
      setTimeout(() => setDemoNotice(""), 2500);
    }
  };

  const shiftChart = useMemo(() => data.alerts_by_shift.map((i) => ({ name: i.reading__shift, total: i.total })), [data.alerts_by_shift]);
  const zoneChart = useMemo(() => data.alerts_by_zone.map((i) => ({ name: i.reading__location, value: i.total })), [data.alerts_by_zone]);

  return (
    <section className="space-y-5">
      {showSteps && (
        <div className="modal-backdrop" onClick={() => setShowSteps(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">How to use</p>
                <h3 className="text-lg font-semibold">Safety Monitoring Steps</h3>
              </div>
              <button className="modal-close" onClick={() => setShowSteps(false)}>Close</button>
            </div>
            <div className="steps-panel">
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={step} className="steps-item">
                    <div className="steps-index">{idx + 1}</div>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="panel p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Safety Monitoring Platform</p>
            <h2 className="hero-title">Detect hazardous conditions in minutes</h2>
            <p className="hero-sub">Real-time alarms, incident workflow, and shift/zone analytics for plant safety teams.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "--"}</div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button className="steps-btn" onClick={() => setShowSteps(true)}>
                Steps
                <span className="steps-dot">?</span>
              </button>
              <button className="btn-secondary" disabled={demoLoading} onClick={loadDemoData}>
                {demoLoading ? "Loading Demo..." : "Load Demo Data"}
              </button>
            </div>
          </div>
        </div>

        {demoNotice && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{demoNotice}</div>}

        <div className="metric-strip mt-5">
          <div className="metric-card"><div className="metric-label">Active Alerts</div><div className="metric-value">{loading ? "--" : data.active_alerts}</div></div>
          <div className="metric-card"><div className="metric-label">Open Incidents</div><div className="metric-value">{loading ? "--" : data.open_incidents}</div></div>
          <div className="metric-card"><div className="metric-label">Total Incidents</div><div className="metric-value">{loading ? "--" : data.total_incidents}</div></div>
          <div className="metric-card">
            <div className="metric-label flex items-center gap-2">
              Resolution Rate
              <span
                className="info-pill"
                title="Resolved incidents divided by total incidents."
                data-tooltip="Resolved incidents divided by total incidents."
                aria-label="Resolved incidents divided by total incidents."
              >
                i
              </span>
            </div>
            <div className="metric-value">{loading ? "--" : `${data.resolution_rate}%`}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 mt-5">
          <div className="panel p-4">
            <div className="section-title">Alerts by Shift</div>
            <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={shiftChart}><CartesianGrid strokeDasharray="3 3" stroke="#d5e0f7" /><XAxis dataKey="name" stroke="#516a96" /><YAxis stroke="#516a96" /><Tooltip /><Legend /><Bar dataKey="total" name="Alerts" fill="#1a6ad9" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
          </div>

          <div className="panel p-4">
            <div className="section-title">Alerts by Zone</div>
            <div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={zoneChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>{zoneChart.map((entry, index) => <Cell key={entry.name} fill={zoneColors[index % zoneColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Implementation Flow</p>
            <h3 className="text-lg font-semibold">How this system works end-to-end</h3>
            <p className="text-sm text-slate-600 mt-1">Click any step to jump to the related screen.</p>
          </div>
          <div className="text-xs text-slate-500">Interactive guide</div>
        </div>

        {/* <div className="flow-timeline mt-4">
          {["Alert", "Incident", "CAPA", "Resolved"].map((step, idx) => (
            <div key={step} className="timeline-step">
              <div className="timeline-dot">{idx + 1}</div>
              <div>
                <div className="text-sm font-semibold">{step}</div>
                <div className="text-xs text-slate-500">
                  {step === "Alert" && "Automatic rule + ML detection"}
                  {step === "Incident" && "Supervisor assigns investigation"}
                  {step === "CAPA" && "Corrective actions tracked"}
                  {step === "Resolved" && "Closure verified and audited"}
                </div>
              </div>
            </div>
          ))}
        </div> */}

        {data.anomaly_detected && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Anomaly Detected:</strong> {data.anomaly_message || "Unusual sensor spike observed."}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 mt-4">
          <div className="flow-card">
            <div className="section-title">Sensor Health</div>
            <p className="text-sm text-slate-600">Last reading: {data.last_reading_at ? new Date(data.last_reading_at).toLocaleString() : "--"}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Total Sensors</div>
                <div className="text-lg font-semibold">{loading ? "--" : data.total_sensors}</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                <div className="text-xs uppercase tracking-[0.1em] text-rose-500">Stale Sensors</div>
                <div className="text-lg font-semibold text-rose-700">{loading ? "--" : data.stale_sensors}</div>
              </div>
            </div>
          </div>

          <div className="flow-card">
            <div className="section-title">Top Risk Zones</div>
            {data.top_risk_zones?.length ? (
              <div className="space-y-2 mt-2">
                {data.top_risk_zones.map((z, idx) => (
                  <div key={z.reading__location} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{idx + 1}. {z.reading__location}</span>
                    <span className="text-slate-600">{z.total} alerts | Avg risk {Number(z.avg_risk).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2">No alerts yet. Load demo data to populate this.</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {flowCards.map((card) => (
            <div key={card.title} className="flow-card" onClick={() => navigate(card.route)}>
              <div className="flow-icon">{card.icon}</div>
              <div className="section-title">{card.title}</div>
              <p className="text-sm text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
