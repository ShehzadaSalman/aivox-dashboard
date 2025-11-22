import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DashboardOverview from "./DashboardOverview";
import AgentManagement from "./AgentManagement";
import CallManagement from "./CallManagement";
import Analytics from "./Analytics";
import UserManagement from "./UserManagement";

function Dashboard() {
  const location = useLocation();
  const { logout, user, isAdmin } = useAuth();

  const navLinks = [
    { path: "/dashboard", label: "Overview", icon: "📊" },
    { path: "/dashboard/agents", label: "Agents", icon: "👥" },
    { path: "/dashboard/calls", label: "Calls", icon: "📞" },
    { path: "/dashboard/analytics", label: "Analytics", icon: "📈" },
  ];

  if (isAdmin()) {
    navLinks.push({ path: "/dashboard/users", label: "Users", icon: "👤" });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.svg" alt="AI Vox Agency" className="h-10" />
            </div>
            <div className="flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    location.pathname === link.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="ml-4 px-4 py-2 text-sm text-gray-600">
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/agents" element={<AgentManagement />} />
          <Route path="/calls" element={<CallManagement />} />
          <Route path="/analytics/*" element={<Analytics />} />
          {isAdmin() && <Route path="/users" element={<UserManagement />} />}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default Dashboard;
