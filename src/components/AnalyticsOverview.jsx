import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { centsToDollars, formatUSD } from '../services/currency';

function AnalyticsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getOverview();
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Calls"
          value={data.totalCalls}
          icon="📞"
          color="blue"
        />
        <MetricCard
          title="Success Rate"
          value={`${data.successRate.toFixed(1)}%`}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Total Cost"
          value={formatUSD(data.totalCost)}
          icon="💰"
          color="purple"
        />
        <MetricCard
          title="Avg Duration"
          value={`${data.avgDurationSeconds}s`}
          icon="⏱️"
          color="indigo"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Call Statistics</h3>
          <div className="space-y-3">
            <StatRow label="Total Calls" value={data.totalCalls} />
            <StatRow label="Successful Calls" value={data.successfulCalls} />
            <StatRow label="Success Rate" value={`${data.successRate.toFixed(1)}%`} />
            <StatRow label="Total Duration" value={`${Math.floor(data.totalDurationSeconds / 60)} minutes`} />
            <StatRow label="Average Duration" value={`${data.avgDurationSeconds} seconds`} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
          <div className="space-y-3">
            <StatRow label="Total Cost" value={formatUSD(data.totalCost)} />
            <StatRow label="Average Cost" value={formatUSD(data.avgCost)} />
            <StatRow
              label="Cost per Minute"
              value={`$${(
                data.avgDurationSeconds
                  ? (centsToDollars(data.avgCost) / data.avgDurationSeconds) * 60
                  : 0
              ).toFixed(2)}`}
            />
          </div>
        </div>
      </div>

      {/* Calls by Status */}
      {data.callsByStatus && Object.keys(data.callsByStatus).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Calls by Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.callsByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default AnalyticsOverview;
