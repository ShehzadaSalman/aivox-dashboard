import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import DashboardOverview from "./DashboardOverview";
import AgentManagement from "./AgentManagement";
import CallManagement from "./CallManagement";
import Leads from "./Leads";
import Analytics from "./Analytics";
import UserManagement from "./UserManagement";
import Profile from "./Profile";
import Settings from "./Settings";

function Dashboard() {
  const location = useLocation();
  const { logout, user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const navLinks = [
    { path: "/dashboard", label: "Overview", icon: "📊" },
    { path: "/dashboard/agents", label: "Agents", icon: "👥" },
    { path: "/dashboard/calls", label: "Calls", icon: "📞" },
    { path: "/dashboard/leads", label: "Leads", icon: "🧾" },
  ];

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/new-logo-website.png" alt="AI Vox Agency" className="h-12" />
            </div>
            <div className="items-center hidden space-x-4 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    location.pathname === link.path
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="relative ml-4" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white">
                    {userInitial.toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">{user?.email}</span>
                  <span className="text-xs">▾</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <Link
                      to="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex items-center justify-center p-2 text-gray-700 rounded-md hover:bg-gray-100"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
              >
                <span className="sr-only">Toggle navigation</span>
                {mobileOpen ? (
                  <span className="text-2xl">×</span>
                ) : (
                  <span className="text-2xl">☰</span>
                )}
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div id="mobile-menu" className="border-t border-gray-200 md:hidden">
            <div className="px-4 pt-4 pb-3 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2 rounded-lg transition ${
                    location.pathname === link.path
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              <Link
                to="/dashboard/profile"
                className="block px-4 py-2 rounded-lg transition text-gray-700 hover:bg-gray-100"
              >
                👤 Profile
              </Link>
              <Link
                to="/dashboard/settings"
                className="block px-4 py-2 rounded-lg transition text-gray-700 hover:bg-gray-100"
              >
                ⚙️ Settings
              </Link>
              <div className="px-4 py-2 text-sm text-gray-600">{user?.email}</div>
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-white transition bg-gray-900 rounded-lg hover:bg-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/agents" element={<AgentManagement />} />
          <Route path="/calls" element={<CallManagement />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/analytics/*" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          {isAdmin() && <Route path="/users" element={<UserManagement />} />}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default Dashboard;
