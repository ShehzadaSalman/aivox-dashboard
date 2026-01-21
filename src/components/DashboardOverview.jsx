import { useState, useEffect } from 'react';
import { analyticsAPI, utilityAPI } from '../services/api';
import { formatUSD } from '../services/currency';
import { useAuth } from '../contexts/AuthContext';

function DashboardOverview() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const showCost = isAdmin();
  const totalCostCents = analytics?.totalCost ?? stats?.cost?.total ?? 0;
  const avgCostCents = analytics?.avgCost ?? 0;
  const totalCalls = analytics?.totalCalls ?? stats?.calls?.total ?? 0;
  const successfulCalls = analytics?.successfulCalls ?? 0;
  const failedCalls = Math.max(totalCalls - successfulCalls, 0);
  const recentDailyStats = dailyStats.slice(-7);
  const callTrend = recentDailyStats.length
    ? recentDailyStats.map((entry) => entry.totalCalls)
    : [];
  const costTrend = recentDailyStats.length
    ? recentDailyStats.map((entry) => entry.totalCost)
    : Array.from({ length: 7 }, () => 0);
  const statusSegments = buildStatusSegments(analytics?.callsByStatus);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await utilityAPI.getDashboardOverview();
      const callsResponse = showCost
        ? await analyticsAPI.getCalls().catch(() => null)
        : null;
      setStats(response.data.stats);
      setAnalytics(response.data.analytics);
      setDailyStats(callsResponse?.data?.dailyStats || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        {showCost && (
          <StatCard
            title="Total Cost"
            value={formatUSD(totalCostCents)}
            subtitle={`Avg: ${formatUSD(avgCostCents)}`}
            icon="💰"
            color="purple"
          />
        )}
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

          {showCost && (
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
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {callTrend.length ? (
          <ChartCard
            title="Call Volume Trend"
            subtitle="Last 7 days"
            stat={`${totalCalls} total`}
            secondary={`${Math.round(totalCalls / callTrend.length || 0)} avg/day`}
          >
            <SparklineChart values={callTrend} stroke="#2563eb" fill="rgba(37, 99, 235, 0.12)" />
          </ChartCard>
        ) : (
          <ChartCard
            title="Call Status Breakdown"
            subtitle="Current status mix"
            stat={`${totalCalls} total`}
            secondary={`${successfulCalls} successful`}
          >
            <StackedBar segments={statusSegments} />
          </ChartCard>
        )}

        {showCost && (
          <ChartCard
            title="Cost Trend"
            subtitle="Last 7 days"
            stat={`${formatUSD(totalCostCents)} total`}
            secondary={`${formatUSD(Math.round(totalCostCents / costTrend.length || 0))} avg/day`}
          >
            <SparklineChart values={costTrend} stroke="#16a34a" fill="rgba(22, 163, 74, 0.12)" />
          </ChartCard>
        )}

        <ChartCard
          title="Call Outcomes"
          subtitle="Success vs failed"
          stat={`${successfulCalls} successful`}
          secondary={`${failedCalls} failed`}
        >
          <div className="space-y-4">
            <StackedBar
              segments={[
                { label: 'Successful', value: successfulCalls, color: 'bg-emerald-500' },
                { label: 'Failed', value: failedCalls, color: 'bg-rose-400' },
              ]}
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Success rate</span>
              <span className="font-semibold text-gray-900">
                {totalCalls ? ((successfulCalls / totalCalls) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </ChartCard>
      </div>
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

function ChartCard({ title, subtitle, stat, secondary, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{stat}</div>
          <div className="text-xs text-gray-500">{secondary}</div>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SparklineChart({ values, stroke, fill }) {
  const width = 320;
  const height = 120;
  const padding = 12;
  const points = getSparklinePoints(values, width, height, padding);
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${linePoints} ${points[points.length - 1].x},${height - padding} ${
    points[0].x
  },${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28" role="img" aria-label="Trend chart">
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      <polygon points={areaPoints} fill={fill} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={stroke} />
    </svg>
  );
}

function StackedBar({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={`${segment.color} h-full`}
            style={{ width: `${total ? (segment.value / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${segment.color}`} />
            <span>
              {segment.label}: {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildStatusSegments(callsByStatus = {}) {
  const colors = [
    'bg-emerald-500',
    'bg-amber-400',
    'bg-rose-400',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-slate-400',
  ];
  return Object.entries(callsByStatus).map(([status, value], index) => ({
    label: formatStatusLabel(status),
    value: Number.isFinite(value) ? value : 0,
    color: colors[index % colors.length],
  }));
}

function formatStatusLabel(status) {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSparklinePoints(values, width, height, padding) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const steps = values.length - 1 || 1;

  return values.map((value, index) => {
    const x = padding + (index / steps) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardOverview;
