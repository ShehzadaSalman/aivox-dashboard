import { useState, useEffect } from 'react';
import { utilityAPI, agentAPI, callAPI } from '../services/api';
import { formatUSD } from '../services/currency';
import { useAuth } from '../contexts/AuthContext';

function DashboardOverview() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const totalCostCents = analytics?.totalCost ?? stats?.cost?.total ?? 0;
  const avgCostCents = analytics?.avgCost ?? 0;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await utilityAPI.getDashboardOverview();
      setStats(response.data.stats);
      setAnalytics(response.data.analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFullSync = async () => {
    try {
      setSyncing(true);
      await agentAPI.sync();
      await callAPI.sync();
      await fetchData();
      alert('Agents and calls synced successfully!');
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to your AI Receptionist Dashboard</p>
        </div>
        {isAdmin() && (
          <button
            onClick={handleFullSync}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Agents & Calls'}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Agents"
          value={stats?.agents?.total || 0}
          subtitle={`${stats?.agents?.active || 0} active`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Total Calls"
          value={stats?.calls?.total || 0}
          subtitle={`${analytics?.successfulCalls || 0} successful`}
          icon="📞"
          color="green"
        />
        <StatCard
          title="Total Cost"
          value={formatUSD(totalCostCents)}
          subtitle={`Avg: ${formatUSD(avgCostCents)}`}
          icon="💰"
          color="purple"
        />
        <StatCard
          title="Success Rate"
          value={`${(analytics?.successRate || 0).toFixed(1)}%`}
          subtitle={`${analytics?.totalCalls || 0} total calls`}
          icon="✅"
          color="indigo"
        />
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Call Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Calls</span>
                <span className="font-semibold">{analytics.totalCalls}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Successful Calls</span>
                <span className="font-semibold text-green-600">{analytics.successfulCalls}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold">{analytics.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Duration</span>
                <span className="font-semibold">{analytics.avgDurationSeconds}s</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Analysis</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Cost</span>
                <span className="font-semibold">{formatUSD(totalCostCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Cost per Call</span>
                <span className="font-semibold">{formatUSD(avgCostCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Duration</span>
                <span className="font-semibold">
                  {Math.floor((analytics.totalDurationSeconds || 0) / 3600)}h{' '}
                  {Math.floor(((analytics.totalDurationSeconds || 0) % 3600) / 60)}m
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-44 bg-gray-200 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex justify-between items-center">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardOverview;
