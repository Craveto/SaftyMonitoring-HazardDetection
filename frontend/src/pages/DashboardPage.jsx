import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import heroIllustration from "../assets/hero-illustration.svg";
import iconUpload from "../assets/icon-upload.svg";
import iconRule from "../assets/icon-rule.svg";
import iconMl from "../assets/icon-ml.svg";
import iconAlerts from "../assets/icon-alerts.svg";
import iconIncidents from "../assets/icon-incidents.svg";
import iconReport from "../assets/icon-report.svg";
import iconVision from "../assets/icon-vision.svg";
import iconStream from "../assets/icon-stream.svg";
import iconAi from "../assets/icon-ai.svg";
import iconIot from "../assets/icon-iot.svg";
import iconWearable from "../assets/icon-wearable.svg";
import iconEdge from "../assets/icon-edge.svg";
import iconGlossary from "../assets/icon-glossary.svg";
import iconFramework from "../assets/icon-framework.svg";
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
  {
    title: "Input & Upload",
    desc: "Manual readings or CSV upload enter the system.",
    route: "/add-reading",
    image: iconUpload,
  },
  {
    title: "Rule Engine",
    desc: "Threshold checks trigger alarms instantly.",
    route: "/alerts",
    image: iconRule,
  },
  {
    title: "ML Scoring",
    desc: "Model calculates risk score for context.",
    route: "/dashboard",
    image: iconMl,
  },
  {
    title: "Alerts",
    desc: "Alerts are stored and shown on the dashboard.",
    route: "/alerts",
    image: iconAlerts,
  },
  {
    title: "Incidents & CAPA",
    desc: "Teams investigate and track corrective actions.",
    route: "/incidents",
    image: iconIncidents,
  },
  {
    title: "Hazard Reports",
    desc: "Log hazards and near-misses for review.",
    route: "/admin-settings",
    image: iconReport,
  },
  {
    title: "Vision PPE",
    desc: "Simulated CV checks create PPE violation alerts.",
    route: "/vision-ppe",
    image: iconVision,
  },
  {
    title: "Live Stream",
    desc: "Simulated IoT stream sends readings every 5 seconds.",
    route: "/live-stream",
    image: iconStream,
  },
];

const lifecycleSteps = [
  {
    title: "Identify Hazards",
    desc: "Locate hazards and assess risk severity.",
    impl: "Sensors + manual inputs identify hazards and assign severity.",
  },
  {
    title: "Develop Procedures",
    desc: "Create safety procedures and train teams.",
    impl: "Procedures are attached to alerts and shared in the steps guide.",
  },
  {
    title: "Implement Controls",
    desc: "Apply engineering, admin, and PPE controls.",
    impl: "Controls are enforced through alert actions and CAPA tracking.",
  },
  {
    title: "Monitor & Review",
    desc: "Track effectiveness and update alerts.",
    impl: "Dashboards and SLA timers monitor response effectiveness.",
  },
  {
    title: "Continuous Improvement",
    desc: "Iterate based on incidents and KPIs.",
    impl: "KPIs, audit trails, and lessons learned drive improvements.",
  },
];

const techHighlights = [
  {
    title: "AI + Computer Vision",
    desc: "Detect PPE noncompliance and unsafe behaviors from video streams.",
    impl:
      "PPE checks flag missing helmets/vests in uploaded media. In production, a YOLOv8 detector would run on camera feeds and push violations into Alerts.",
    image: iconAi,
  },
  {
    title: "IoT Sensors",
    desc: "Gas, temperature, vibration, and smoke sensors feed live readings.",
    impl:
      "CSV uploads and live stream simulator mimic edge devices. Readings flow into the rule engine and are stored in Azure SQL for dashboards.",
    image: iconIot,
  },
  {
    title: "Wearables",
    desc: "Track worker vitals and location for confined-space safety.",
    impl:
      "Wearable data would attach to incidents (e.g., fatigue or heat stress). The system is ready to accept extra fields in hazard reports.",
    image: iconWearable,
  },
  {
    title: "Edge Computing",
    desc: "Analyze data near the source to reduce alert latency.",
    impl:
      "Rules execute instantly on incoming readings. In production, the same rules can run on a gateway to reduce network delay.",
    image: iconEdge,
  },
];

const glossaryItems = [
  { term: "Hazard", def: "A source or situation with potential to cause harm." },
  { term: "Risk", def: "Likelihood and severity of harm from a hazard." },
  { term: "Near-Miss", def: "An unplanned event that did not result in injury." },
  { term: "CAPA", def: "Corrective and Preventive Action to prevent recurrence." },
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
  const location = useLocation();
  const flowRef = useRef(null);
  const flowCardsRef = useRef(null);
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
  const [activeLifecycle, setActiveLifecycle] = useState(0);
  const [activeTech, setActiveTech] = useState(0);

  useEffect(() => {
    const load = async () => {
      const cached = getCache("dashboard_summary", 5 * 60 * 1000);
      if (cached) {
        const cachedData = cached.data || {};
        const likelyStale =
          cachedData.active_alerts > 0 &&
          !cachedData.last_reading_at &&
          Number(cachedData.total_sensors || 0) === 0;
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

  useEffect(() => {
    const shouldScrollToCards =
      location.hash === "#flow" || location.state?.scrollTo === "flow-cards";
    if (shouldScrollToCards && flowCardsRef.current) {
      setTimeout(() => {
        flowCardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [location.hash, location.state]);

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

  const shiftChart = useMemo(
    () => data.alerts_by_shift.map((i) => ({ name: i.reading__shift, total: i.total })),
    [data.alerts_by_shift]
  );

  const zoneChart = useMemo(
    () => data.alerts_by_zone.map((i) => ({ name: i.reading__location, value: i.total })),
    [data.alerts_by_zone]
  );

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
              <button className="modal-close" onClick={() => setShowSteps(false)}>
                Close
              </button>
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

      <div ref={flowRef} id="flow-section" className="panel p-5 same-panel">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Safety Monitoring Platform
            </p>
            <h2 className="hero-title">Detect hazardous conditions in minutes</h2>
            <p className="hero-sub">
              Real-time alarms, incident workflow, and shift/zone analytics for plant safety teams.
            </p>
          </div>
          <img
            className="hero-illustration"
            src={heroIllustration}
            alt="Safety monitoring overview"
          />
          <div className="text-right">
            <div className="text-xs text-slate-500">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "--"}
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button className="steps-btn" onClick={() => setShowSteps(true)}>
                Steps
                <span className="steps-dot">?</span>
              </button>
              {/* <button className="btn-secondary" disabled={demoLoading} onClick={loadDemoData}> */}
                {/* {demoLoading ? "Loading Demo..." : "Load Demo Data"} */}
              {/* </button>  */}
            </div>
          </div>
        </div>
        {demoNotice && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {demoNotice}
          </div>
        )}
        <div className="metric-strip mt-5">
          <div className="metric-card">
            <div className="metric-label">Active Alerts</div>
            <div className="metric-value">{loading ? "--" : data.active_alerts}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Open Incidents</div>
            <div className="metric-value">{loading ? "--" : data.open_incidents}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Incidents</div>
            <div className="metric-value">{loading ? "--" : data.total_incidents}</div>
          </div>
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
            <div className="h-[280px] chart-scroll">
              <div style={{ minWidth: Math.max(520, shiftChart.length * 140), height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shiftChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e0f7" />
                  <XAxis dataKey="name" stroke="#516a96" interval={0} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#516a96" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Alerts" fill="#1a6ad9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="panel p-4">
            <div className="section-title">Alerts by Zone</div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                  >
                    {zoneChart.map((entry, index) => (
                      <Cell key={entry.name} fill={zoneColors[index % zoneColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ maxHeight: 220, overflowY: "auto" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-5 same-panel">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Implementation Flow</p>
            <h3 className="text-lg font-semibold">How this system works end-to-end</h3>
            <p className="text-sm text-slate-600 mt-1">Click any step to jump to the related screen.</p>
          </div>
          <div className="text-xs text-slate-500">Interactive guide</div>
        </div>
        {data.anomaly_detected && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Anomaly Detected:</strong> {data.anomaly_message || "Unusual sensor spike observed."}
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-2 mt-4">
          <div className="flow-card static-card">
            <div className="section-title">Sensor Health</div>
            <p className="text-sm text-slate-600">
              Last reading: {data.last_reading_at ? new Date(data.last_reading_at).toLocaleString() : "--"}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Total Sensors</div>
                <div className="text-lg font-semibold">{loading ? "--" : data.total_sensors}</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                <div className="text-xs uppercase tracking-[0.1em] text-rose-500">Stale Sensors</div>
                <div className="text-lg font-semibold text-rose-700">
                  {loading ? "--" : data.stale_sensors}
                </div>
              </div>
            </div>
          </div>
          <div className="flow-card static-card">
            <div className="section-title">Top Risk Zones</div>
            {data.top_risk_zones?.length ? (
              <div className="space-y-2 mt-2">
                {data.top_risk_zones.map((z, idx) => (
                  <div key={z.reading__location} className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {idx + 1}. {z.reading__location}
                    </span>
                    <span className="text-slate-600">
                      {z.total} alerts | Avg risk {Number(z.avg_risk).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2">No alerts yet. Load demo data to populate this.</p>
            )}
          </div>
        </div>
        <div ref={flowCardsRef} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {flowCards.map((card) => (
            <div key={card.title} className="flow-card" onClick={() => navigate(card.route)}>
              <img className="flow-illustration" src={card.image} alt={card.title} />
              <div className="section-title">{card.title}</div>
              <p className="text-sm text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5 same-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Safety Lifecycle</p>
        <h3 className="text-lg font-semibold">From hazard identification to continuous improvement</h3>
        <p className="text-sm text-slate-600 mt-1">This is the operating model your dashboard supports.</p>
        <div className="info-grid mt-4">
          {lifecycleSteps.map((step, idx) => (
            <button
              key={step.title}
              className={`info-card interactive-card ${activeLifecycle === idx ? "active" : ""}`}
              onClick={() => setActiveLifecycle(idx)}
            >
              <div className="info-tag">Step {idx + 1}</div>
              <div className="section-title">{step.title}</div>
              <p className="text-sm text-slate-600">{step.desc}</p>
            </button>
          ))}
        </div>
        <div className="detail-panel mt-4">
          <div className="section-title">How this maps to your system</div>
          <p className="text-sm text-slate-600 mt-1">{lifecycleSteps[activeLifecycle]?.impl}</p>
        </div>
      </div>

      <div className="panel p-5 same-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Key Technologies</p>
        <h3 className="text-lg font-semibold">What powers modern hazard detection</h3>
        <p className="text-sm text-slate-600 mt-1">These are typical production-grade components mapped to your system.</p>
        <div className="info-grid mt-4">
          {techHighlights.map((item, idx) => (
            <button
              key={item.title}
              className={`info-card interactive-card ${activeTech === idx ? "active" : ""}`}
              onClick={() => setActiveTech(idx)}
            >
              <img className="card-icon" src={item.image} alt={item.title} />
              <div className="section-title">{item.title}</div>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </button>
          ))}
        </div>
        <div className="detail-panel mt-4">
          <div className="section-title">Implementation in this project</div>
          <p className="text-sm text-slate-600 mt-1">{techHighlights[activeTech]?.impl}</p>
        </div>
      </div>

      <div className="panel p-5 same-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Glossary & Best Practices</p>
        <h3 className="text-lg font-semibold">Terms and frameworks users should understand</h3>
        <div className="grid gap-4 lg:grid-cols-2 mt-4">
          <div className="info-card">
            <img className="card-icon" src={iconGlossary} alt="Key terms" />
            <div className="section-title">Key Terms</div>
            <div className="space-y-3 mt-3">
              {glossaryItems.map((item) => (
                <div key={item.term}>
                  <div className="text-sm font-semibold">{item.term}</div>
                  <div className="text-sm text-slate-600">{item.def}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="info-card">
            <img className="card-icon" src={iconFramework} alt="Frameworks" />
            <div className="section-title">Frameworks to Reference</div>
            <div className="space-y-3 mt-3 text-sm text-slate-600">
              <div>
                <div className="text-sm font-semibold">Hierarchy of Controls</div>
                <div>Eliminate, substitute, engineer, administrate, then PPE to reduce risk systematically.</div>
              </div>
              <div>
                <div className="text-sm font-semibold">PDCA Cycle</div>
                <div>Plan, Do, Check, Act for continuous improvement in safety management systems.</div>
              </div>
              <div>
                <div className="text-sm font-semibold">Incident Investigation</div>
                <div>Find root causes and prevent recurrence with CAPA actions.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
