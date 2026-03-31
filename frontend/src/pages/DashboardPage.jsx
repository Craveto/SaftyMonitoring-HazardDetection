import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import api from "../api/client";

const zoneColors = ["#1167d8", "#0fa968", "#f59e0b", "#dc2626", "#14b8a6", "#64748b"];

export default function DashboardPage() {
  const [data, setData] = useState({ active_alerts: 0, open_incidents: 0, alerts_by_shift: [], alerts_by_zone: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/dashboard/summary");
        setData(data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const shiftChart = useMemo(() => data.alerts_by_shift.map((i) => ({ name: i.reading__shift, total: i.total })), [data.alerts_by_shift]);
  const zoneChart = useMemo(() => data.alerts_by_zone.map((i) => ({ name: i.reading__location, value: i.total })), [data.alerts_by_zone]);
  const totalAlerts = zoneChart.reduce((sum, z) => sum + z.value, 0);

  return (
    <section className="space-y-5 animate-rise">
      <div className="glass-card p-5">
        <h2 className="text-2xl font-bold">Plant Safety Overview</h2>
        <p className="text-sm text-slate-600 mt-1">Live operational view for alarms, incidents, and risk distribution across shifts and zones.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="metric-card"><p className="metric-label">Active Alerts</p><p className="metric-value">{loading ? "--" : data.active_alerts}</p></article>
        <article className="metric-card"><p className="metric-label">Open Incidents</p><p className="metric-value">{loading ? "--" : data.open_incidents}</p></article>
        <article className="metric-card"><p className="metric-label">Zones With Alerts</p><p className="metric-value">{loading ? "--" : zoneChart.length}</p></article>
        <article className="metric-card"><p className="metric-label">Alert Volume</p><p className="metric-value">{loading ? "--" : totalAlerts}</p></article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-4">
          <h3 className="text-lg font-semibold mb-3">Alerts by Shift</h3>
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={shiftChart}><CartesianGrid strokeDasharray="3 3" stroke="#d5e0f7" /><XAxis dataKey="name" stroke="#516a96" /><YAxis stroke="#516a96" /><Tooltip /><Legend /><Bar dataKey="total" name="Alerts" fill="#1167d8" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
        </article>

        <article className="glass-card p-4">
          <h3 className="text-lg font-semibold mb-3">Alerts by Zone</h3>
          <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={zoneChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={48}>{zoneChart.map((entry, index) => <Cell key={entry.name} fill={zoneColors[index % zoneColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
        </article>
      </div>
    </section>
  );
}
