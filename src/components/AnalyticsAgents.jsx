import { useState, useEffect } from 'react';
import { analyticsAPI, agentAPI } from '../services/api';
import { formatUSD } from '../services/currency';

function AnalyticsAgents() {
  const [agents, setAgents] = useState([]);
  const [agentNameMap, setAgentNameMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchAgentNames();
  }, []);

  const fetchAgentNames = async () => {
    try {
      const response = await agentAPI.list({ includeCount: false });
      const nameMap = {};
      (response.data.agents || []).forEach((agent) => {
        if (agent.agent_id && agent.agent_name) {
          nameMap[agent.agent_id] = agent.agent_name;
        }
      });
      setAgentNameMap(nameMap);
    } catch (err) {
      console.error('Failed to fetch agent names:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getAgents();
      setAgents(response.data);
    } catch (err) {
      console.error('Failed to fetch agent analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading agent analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Agent Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Calls</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => {
              // Determine the display name - avoid showing ID as name
              // First check if agent_name exists and is not the same as agent_id
              // Then check agentNameMap for a lookup
              // Finally fallback to formatted ID
              const displayName = (agent.agent_name && agent.agent_name !== agent.agent_id) 
                ? agent.agent_name 
                : (agent.name && agent.name !== agent.agent_id)
                ? agent.name
                : (agent.agent_id && agentNameMap[agent.agent_id])
                ? agentNameMap[agent.agent_id]
                : agent.agent_id 
                ? `Agent ${agent.agent_id}` 
                : 'Unknown Agent';
              
              return (
              <tr key={agent.agent_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{displayName}</div>
                  <div className="text-sm text-gray-500">ID: {agent.agent_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.totalCalls}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${agent.successRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{agent.successRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatUSD(agent.totalCost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatUSD(agent.avgCost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {agent.avgDurationSeconds}s
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AnalyticsAgents;
