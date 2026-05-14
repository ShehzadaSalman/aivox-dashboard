import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import DashboardOverview from "./DashboardOverview";
import AgentManagement from "./AgentManagement";
import CallManagement from "./CallManagement";
import Leads from "./Leads";
import Appointments from "./Appointments";
import UserManagement from "./UserManagement";
import Profile from "./Profile";
import Settings from "./Settings";

function Dashboard() {
  const location = useLocation();
  const { logout, user, isAdmin, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userMenuRef = useRef(null);

  const navLinks = [
    { path: "/dashboard", label: "Overview", icon: "📊" },
    { path: "/dashboard/agents", label: "Agents", icon: "👥" },
    { path: "/dashboard/calls", label: "Calls", icon: "📞" },
    { path: "/dashboard/leads", label: "Leads", icon: "🧾" },
  ];

  if (!isSuperAdmin()) {
    navLinks.push({
      path: "/dashboard/appointments",
      label: "Appointments",
      icon: "📅",
    });
  }

  if (isAdmin()) {
    navLinks.push({ path: "/dashboard/users", label: "Users", icon: "👤" });
  }

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const userInitial = user?.name?.trim()?.[0] || user?.email?.[0] || "U";

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="sticky top-0 z-30 border-b text-ink-900 border-navy-100 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex items-center justify-center p-2 rounded-md text-ink-900 hover:bg-navy-50 md:hidden"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Toggle navigation</span>
              {mobileOpen ? <span className="text-2xl">×</span> : <span className="text-2xl">☰</span>}
            </button>
            <img src="/candibly-vertical-logo.png" alt="AI Vox Agency" className="h-12" />
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-full border border-navy-200 bg-white px-3 py-1.5 text-sm text-ink-900 shadow-sm hover:bg-navy-50"
            >
              <span className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-accent-600">
                {userInitial.toUpperCase()}
              </span>
              <span className="hidden lg:inline">{user?.email}</span>
              <span className="text-xs">▾</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 z-10 w-48 mt-2 bg-white border rounded-lg shadow-lg border-navy-100 text-ink-900">
                <Link
                  to="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-ink-900 hover:bg-navy-50"
                >
                  Profile
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-ink-900 hover:bg-navy-50"
                >
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="block w-full px-4 py-2 text-sm text-left text-ink-900 hover:bg-navy-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] flex-shrink-0 border-r border-navy-100 bg-white p-4 md:flex md:flex-col ${sidebarCollapsed ? "w-20" : "w-64"
            }`}
        >
          <div className="flex-1 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition ${location.pathname === link.path
                  ? "bg-accent-600 text-white shadow-soft"
                  : "text-ink-700 hover:bg-navy-50"
                  }`}
              >
                <span className="text-lg">{link.icon}</span>
                {!sidebarCollapsed && <span>{link.label}</span>}
              </Link>
            ))}
          </div>
          <div className="pt-4 space-y-1 border-t border-navy-100">
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-700 rounded-md hover:bg-navy-50"
            >
              <span className="text-lg">👤</span>
              {!sidebarCollapsed && <span>Profile</span>}
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-700 rounded-md hover:bg-navy-50"
            >
              <span className="text-lg">⚙️</span>
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="flex items-center w-full gap-3 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-700 rounded-md hover:bg-navy-50"
              aria-pressed={sidebarCollapsed}
            >
              <span className="text-lg">{sidebarCollapsed ? "➡️" : "⬅️"}</span>
              {!sidebarCollapsed && (
                <span>{sidebarCollapsed ? "Expand sidebar" : "Collapse"}</span>
              )}
            </button>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden" id="mobile-menu">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-ink-900/20"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute top-0 left-0 h-full p-4 text-ink-900 shadow-xl bg-white w-72">
              <div className="flex items-center justify-between mb-4">
                <img src="/candibly-vertical-logo.png" alt="AI Vox Agency" className="h-10" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-md text-ink-900 hover:bg-navy-50"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition ${location.pathname === link.path
                      ? "bg-accent-600 text-white shadow-soft"
                      : "text-ink-700 hover:bg-navy-50"
                      }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
                <Link
                  to="/dashboard/profile"
                  className="block px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-700 rounded-md hover:bg-navy-50"
                >
                  👤 Profile
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="block px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-ink-700 rounded-md hover:bg-navy-50"
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-left text-white transition bg-accent-600 rounded-md hover:bg-accent-700"
                >
                  Logout
                </button>
              </div>
              <div className="mt-4 text-xs text-ink-500">{user?.email}</div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/calls" element={<CallManagement />} />
            <Route path="/leads" element={<Leads />} />
            <Route
              path="/appointments"
              element={
                isSuperAdmin() ? <Navigate to="/dashboard" replace /> : <Appointments />
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            {isAdmin() && <Route path="/users" element={<UserManagement />} />}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
