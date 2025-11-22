import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AnalyticsOverview from './AnalyticsOverview';
import AnalyticsAgents from './AnalyticsAgents';
import AnalyticsCalls from './AnalyticsCalls';
import AnalyticsSentiment from './AnalyticsSentiment';

function Analytics() {
  const location = useLocation();

  const tabs = [
    { path: '/dashboard/analytics', label: 'Overview', component: AnalyticsOverview },
    { path: '/dashboard/analytics/agents', label: 'Agents', component: AnalyticsAgents },
    { path: '/dashboard/analytics/calls', label: 'Calls', component: AnalyticsCalls },
    { path: '/dashboard/analytics/sentiment', label: 'Sentiment', component: AnalyticsSentiment },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === tab.path
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<AnalyticsOverview />} />
        <Route path="/agents" element={<AnalyticsAgents />} />
        <Route path="/calls" element={<AnalyticsCalls />} />
        <Route path="/sentiment" element={<AnalyticsSentiment />} />
        <Route path="*" element={<Navigate to="/dashboard/analytics" replace />} />
      </Routes>
    </div>
  );
}

export default Analytics;


