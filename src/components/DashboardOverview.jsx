import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { analyticsAPI, utilityAPI } from '../services/api';
import { formatUSD } from '../services/currency';
import { useAuth } from '../contexts/AuthContext';

function DashboardOverview() {
  const { isAdmin } = useAuth();
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const response = await utilityAPI.getDashboardOverview();
      return response.data;
    },
  });
  const {
    data: callsData,
    isLoading: callsLoading,
    error: callsError,
  } = useQuery({
    queryKey: ['analytics-calls'],
    queryFn: async () => {
      const response = await analyticsAPI.getCalls();
      return response.data;
    },
  });
  const stats = overviewData?.stats || null;
  const analytics = overviewData?.analytics || null;
  const loading = overviewLoading || callsLoading;
  const error = overviewError || callsError;
  const showCost = isAdmin();
  const totalCostCents = analytics?.totalCost ?? stats?.cost?.total ?? 0;
  const avgCostCents = analytics?.avgCost ?? 0;
  const totalCalls = analytics?.totalCalls ?? stats?.calls?.total ?? 0;
  const successfulCalls = analytics?.successfulCalls ?? 0;
  const failedCalls = Math.max(totalCalls - successfulCalls, 0);
  const dailyStats = callsData?.dailyStats || [];
  const recentDailyStats = dailyStats.slice(-7);
  const chartData = recentDailyStats.map((entry) => ({
    date: formatChartDate(entry.date || entry.day || entry.label),
    calls: entry.totalCalls ?? 0,
    cost: entry.totalCost ?? 0,
  }));
  const statusSegments = buildStatusSegments(analytics?.callsByStatus);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-accent-600/10 border border-accent-600/20 rounded-md p-4">
        <p className="text-accent-700">Error: {error.message || 'Failed to load overview.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-navy-900 mb-2">Dashboard Overview</h1>
          <p className="text-ink-600">Welcome to your AI Receptionist Dashboard</p>
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
      {analytics && showCost && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-surface rounded-lg p-6">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">Cost Analysis</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-ink-600">Total Cost</span>
                <span className="font-semibold text-ink-900">{formatUSD(totalCostCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600">Average Cost per Call</span>
                <span className="font-semibold text-ink-900">{formatUSD(avgCostCents)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-600">Total Duration</span>
                <span className="font-semibold text-ink-900">
                  {Math.floor((analytics.totalDurationSeconds || 0) / 3600)}h{' '}
                  {Math.floor(((analytics.totalDurationSeconds || 0) % 3600) / 60)}m
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {analytics && (
          <ChartCard
            title="Call Statistics"
            subtitle="Totals and averages"
            stat={`${analytics.totalCalls || 0} total`}
            secondary={`${(analytics.successRate || 0).toFixed(1)}% success`}
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[
                  { label: 'Total', value: analytics.totalCalls || 0 },
                  { label: 'Successful', value: analytics.successfulCalls || 0 },
                  { label: 'Failed', value: failedCalls || 0 },
                  { label: 'Avg Duration (s)', value: analytics.avgDurationSeconds || 0 },
                ]}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d6e0ef" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, borderColor: '#d6e0ef' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="value" fill="#d62d20" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {chartData.length ? (
          <ChartCard
            title="Call Volume Trend"
            subtitle="Last 7 days"
            stat={`${totalCalls} total`}
            secondary={`${Math.round(totalCalls / Math.max(chartData.length, 1))} avg/day`}
          >
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="callsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#162d4a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#162d4a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, borderColor: '#d6e0ef' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#162d4a"
                  fill="url(#callsFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
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

        <ChartCard
          title="Call Outcomes"
          subtitle="Success vs failed"
          stat={`${successfulCalls} successful`}
          secondary={`${failedCalls} failed`}
        >
          <div className="space-y-4">
            <StackedBar
              segments={[
                { label: 'Successful', value: successfulCalls, color: 'bg-navy-700' },
                { label: 'Failed', value: failedCalls, color: 'bg-accent-600' },
              ]}
            />
            <div className="flex items-center justify-between text-sm text-ink-600">
              <span>Success rate</span>
              <span className="font-semibold text-ink-900">
                {totalCalls ? ((successfulCalls / totalCalls) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </ChartCard>
      </div>

      {showCost && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard
            title="Cost Trend"
            subtitle="Last 7 days"
            stat={`${formatUSD(totalCostCents)} total`}
            secondary={`${formatUSD(Math.round(totalCostCents / Math.max(chartData.length, 1)))} avg/day`}
          >
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d62d20" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d62d20" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, borderColor: '#d6e0ef' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#d62d20"
                  fill="url(#costFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    blue: 'border-l-4 border-accent-600',
    green: 'border-l-4 border-gold-500',
    purple: 'border-l-4 border-navy-700',
    indigo: 'border-l-4 border-accent-700',
  };

  return (
    <div className={`card-surface rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-semibold text-ink-900 mb-1">{value}</div>
      <div className="text-sm text-ink-500">{subtitle}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, stat, secondary, children }) {
  return (
    <div className="card-surface rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          <p className="text-sm text-ink-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-ink-900">{stat}</div>
          <div className="text-xs text-ink-500">{secondary}</div>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function formatChartDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StackedBar({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-navy-50">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={`${segment.color} h-full`}
            style={{ width: `${total ? (segment.value / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-ink-500">
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
    'bg-accent-600',
    'bg-gold-500',
    'bg-navy-700',
    'bg-navy-500',
    'bg-accent-500',
    'bg-navy-100',
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="h-7 w-48 bg-navy-100 rounded mb-2" />
          <div className="h-4 w-64 bg-navy-100 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card-surface rounded-lg p-6">
            <div className="h-4 w-24 bg-navy-100 rounded mb-3" />
            <div className="h-8 w-24 bg-navy-100 rounded mb-2" />
            <div className="h-3 w-28 bg-navy-100 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card-surface rounded-lg p-6">
            <div className="h-5 w-40 bg-navy-100 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex justify-between items-center">
                  <div className="h-3 w-32 bg-navy-100 rounded" />
                  <div className="h-3 w-16 bg-navy-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card-surface rounded-lg p-6">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-navy-100 rounded" />
                <div className="h-3 w-24 bg-navy-100 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-navy-100 rounded" />
                <div className="h-3 w-20 bg-navy-100 rounded" />
              </div>
            </div>
            <div className="h-24 bg-navy-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardOverview;
