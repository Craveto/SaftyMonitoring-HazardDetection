import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["/dashboard", "Dashboard"],
  ["/add-reading", "Add Reading"],
  ["/upload-csv", "Upload CSV"],
  ["/alerts", "Alerts"],
  ["/incidents", "Incidents"],
  ["/admin-settings", "Report Hazard"],
  ["/vision-ppe", "Vision PPE"],
  ["/live-stream", "Live Stream"],
];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="top-panel">
        <div className="page-container">
          <div className="navbar">
            <NavLink to="/dashboard" className="brand">
              <div className="brand-badge">HM</div>
              <div>
                <div className="brand-sub">Industrial Safety</div>
                <div className="brand-title">Hazard Monitoring</div>
              </div>
            </NavLink>
            <div className="nav-links">
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
