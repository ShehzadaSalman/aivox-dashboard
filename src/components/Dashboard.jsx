import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Bot,
  Phone,
  ClipboardList,
  CalendarDays,
  Users,
  CircleUser,
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { utilityAPI } from "../services/api";
import DashboardOverview from "./DashboardOverview";
import AgentManagement from "./AgentManagement";
import CallManagement from "./CallManagement";
import Leads from "./Leads";
import Appointments from "./Appointments";
import UserManagement from "./UserManagement";
import Profile from "./Profile";
import Settings from "./Settings";

const ICON_PROPS = { size: 18, strokeWidth: 1.75 };

function Dashboard() {
  const location = useLocation();
  const { logout, user, isAdmin, isSuperAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [planName, setPlanName] = useState(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    utilityAPI
      .getPlanUsage()
      .then((response) => {
        if (isMounted) {
          setPlanName(response?.data?.plan?.name || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlanName(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const navLinks = [
    { path: "/dashboard", label: "Overview", Icon: LayoutDashboard },
    { path: "/dashboard/agents", label: "Agents", Icon: Bot },
    { path: "/dashboard/calls", label: "Calls", Icon: Phone },
    { path: "/dashboard/leads", label: "Leads", Icon: ClipboardList },
  ];

  if (!isSuperAdmin()) {
    navLinks.push({
      path: "/dashboard/appointments",
      label: "Appointments",
      Icon: CalendarDays,
    });
  }

  if (isAdmin()) {
    navLinks.push({ path: "/dashboard/users", label: "Users", Icon: Users });
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
              className="inline-flex items-center justify-center p-2 rounded-md text-ink-700 hover:bg-navy-50 md:hidden"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Toggle navigation</span>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <img src="/candibly-vertical-logo.png" alt="AI Vox Agency" className="h-12" />
            {planName && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-accent-600/20 bg-accent-600/10 px-3 py-1 text-xs font-semibold text-accent-700">
                {planName} plan
              </span>
            )}
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-full border border-navy-200 bg-white px-3 py-1.5 text-sm text-ink-900 shadow-sm hover:bg-navy-50"
            >
              <span className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-accent-600 text-sm font-semibold">
                {userInitial.toUpperCase()}
              </span>
              <span className="hidden lg:inline">{user?.email}</span>
              <ChevronDown size={16} className="text-ink-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 z-10 w-48 mt-2 bg-white border rounded-lg shadow-lg border-navy-100 text-ink-900 overflow-hidden">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-navy-50"
                >
                  <CircleUser size={16} className="text-ink-400" />
                  Profile
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-navy-50"
                >
                  <SettingsIcon size={16} className="text-ink-400" />
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left text-ink-700 hover:bg-navy-50 border-t border-navy-100"
                >
                  <LogOut size={16} className="text-ink-400" />
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
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  title={sidebarCollapsed ? link.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-tight transition ${active
                    ? "bg-accent-600 text-white shadow-soft"
                    : "text-ink-700 hover:bg-navy-50"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <link.Icon {...ICON_PROPS} className="shrink-0" />
                  {!sidebarCollapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 space-y-1 border-t border-navy-100">
            <Link
              to="/dashboard/profile"
              title={sidebarCollapsed ? "Profile" : undefined}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium tracking-tight text-ink-700 rounded-lg hover:bg-navy-50 ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <CircleUser {...ICON_PROPS} className="shrink-0" />
              {!sidebarCollapsed && <span>Profile</span>}
            </Link>
            <Link
              to="/dashboard/settings"
              title={sidebarCollapsed ? "Settings" : undefined}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium tracking-tight text-ink-700 rounded-lg hover:bg-navy-50 ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <SettingsIcon {...ICON_PROPS} className="shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className={`flex items-center w-full gap-3 px-3 py-2 text-sm font-medium tracking-tight text-ink-500 rounded-lg hover:bg-navy-50 ${sidebarCollapsed ? "justify-center" : ""}`}
              aria-pressed={sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen {...ICON_PROPS} className="shrink-0" />
              ) : (
                <PanelLeftClose {...ICON_PROPS} className="shrink-0" />
              )}
              {!sidebarCollapsed && <span>Collapse</span>}
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
                  className="p-2 rounded-md text-ink-700 hover:bg-navy-50"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const active = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium tracking-tight transition ${active
                        ? "bg-accent-600 text-white shadow-soft"
                        : "text-ink-700 hover:bg-navy-50"
                        }`}
                    >
                      <link.Icon {...ICON_PROPS} className="shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium tracking-tight text-ink-700 rounded-lg hover:bg-navy-50"
                >
                  <CircleUser {...ICON_PROPS} className="shrink-0" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium tracking-tight text-ink-700 rounded-lg hover:bg-navy-50"
                >
                  <SettingsIcon {...ICON_PROPS} className="shrink-0" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium tracking-tight text-left text-white transition bg-accent-600 rounded-lg hover:bg-accent-700 mt-2"
                >
                  <LogOut {...ICON_PROPS} className="shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
              <div className="mt-4 text-xs text-ink-500">{user?.email}</div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/agents/:agentId" element={<Navigate to="/dashboard/agents" replace />} />
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
