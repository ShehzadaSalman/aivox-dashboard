import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

function AnalyticsSentiment() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getSentiment();
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch sentiment analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading sentiment analytics...</div>;
  }

  if (!data || !data.sentimentDistribution) {
    return <div className="text-center py-12 text-gray-500">No sentiment data available</div>;
  }

  const total = data.totalCallsWithSentiment;
  const sentiments = Object.entries(data.sentimentDistribution);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sentiment Overview</h3>
        <div className="text-3xl font-bold text-gray-900 mb-2">{total}</div>
        <div className="text-sm text-gray-600">Total calls with sentiment analysis</div>
      </div>

      {/* Sentiment Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
        <div className="space-y-4">
          {sentiments.map(([sentiment, stats]) => {
            const colorClass = {
              positive: 'bg-green-500',
              neutral: 'bg-yellow-500',
              negative: 'bg-red-500',
            }[sentiment.toLowerCase()] || 'bg-gray-500';

            return (
              <div key={sentiment}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{sentiment}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats.count} ({stats.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`${colorClass} h-4 rounded-full transition-all`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sentiments.map(([sentiment, stats]) => {
          const colorClasses = {
            positive: 'bg-green-50 border-green-200 text-green-800',
            neutral: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            negative: 'bg-red-50 border-red-200 text-red-800',
          }[sentiment.toLowerCase()] || 'bg-gray-50 border-gray-200 text-gray-800';

          return (
            <div key={sentiment} className={`bg-white rounded-lg shadow p-6 border-2 ${colorClasses}`}>
              <div className="text-sm font-medium mb-2 capitalize">{sentiment}</div>
              <div className="text-3xl font-bold mb-1">{stats.count}</div>
              <div className="text-sm">{stats.percentage}% of total</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnalyticsSentiment;

