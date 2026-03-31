export default function AdminSettingsPage() {
  return (
    <section className="glass-card p-5 max-w-4xl animate-rise">
      <h2 className="text-2xl font-semibold">Admin Settings</h2>
      <p className="text-sm text-slate-600 mt-1">Control thresholds and notification defaults for hazard detection behavior.</p>

      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <label className="text-sm font-medium text-slate-700">Gas Threshold<input className="input-ui mt-1" defaultValue="85" /></label>
        <label className="text-sm font-medium text-slate-700">Temperature Threshold<input className="input-ui mt-1" defaultValue="80" /></label>
        <label className="text-sm font-medium text-slate-700">Pressure Low<input className="input-ui mt-1" defaultValue="70" /></label>
        <label className="text-sm font-medium text-slate-700">Pressure High<input className="input-ui mt-1" defaultValue="130" /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Notification Email Group<input className="input-ui mt-1" defaultValue="safetyops@company.com" /></label>
      </div>

      <button className="btn-primary mt-5">Save Configuration</button>
    </section>
  );
}
