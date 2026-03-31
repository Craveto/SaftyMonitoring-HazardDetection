import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/dashboard", "Dashboard"],
  ["/add-reading", "Add Reading"],
  ["/upload-csv", "Upload CSV"],
  ["/alerts", "Alerts"],
  ["/incidents", "Incidents"],
  ["/admin-settings", "Settings"],
];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="top-panel">
        <div className="page-container py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Industrial Safety Suite</p>
              <h1 className="text-2xl md:text-3xl font-bold">Hazard Detection Control Center</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {links.map(([to, label]) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
