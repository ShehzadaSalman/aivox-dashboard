import { useState, useEffect } from 'react';
import { callAPI, agentAPI } from '../services/api';
import { Link } from 'react-router-dom';

function CallManagement() {
  const [calls, setCalls] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [filters, setFilters] = useState({
    agentId: '',
    startDate: '',
    endDate: '',
    callStatus: '',
    sortBy: 'date',
  });
  const [selectedCall, setSelectedCall] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchCalls();
  }, [filters, pagination.offset]);

  const fetchAgents = async () => {
    try {
      const response = await agentAPI.list({ limit: 100 });
      setAgents(response.data.agents);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy: filters.sortBy,
        ...(filters.agentId && { agentId: filters.agentId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.callStatus && { callStatus: filters.callStatus }),
      };
      const response = await callAPI.list(params);
      setCalls(response.data.calls);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const days = parseInt(prompt('How many days to sync? (1-90)', '30') || '30');
    if (isNaN(days) || days < 1 || days > 90) {
      alert('Please enter a number between 1 and 90');
      return;
    }
    try {
      setSyncing(true);
      await callAPI.sync(days, filters.agentId || null);
      await fetchCalls();
      alert('Calls synced successfully!');
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-600 mt-1">View and manage all calls</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Calls'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.agent_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <input
              type="text"
              value={filters.callStatus}
              onChange={(e) => setFilters({ ...filters, callStatus: e.target.value })}
              placeholder="Filter by status..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="duration">Duration</option>
              <option value="cost">Cost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calls Table */}
      {loading ? (
        <div className="text-center py-12">Loading calls...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {call.call_id.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.agent?.agent_name || call.agent_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(call.start_timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${call.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          call.call_successful
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {call.call_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedCall(call)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {pagination.offset + 1} to{' '}
              {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
              {pagination.total} calls
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })
                }
                disabled={pagination.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
                }
                disabled={!pagination.hasMore}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}

function CallDetailsModal({ call, onClose }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Call Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Call Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Call ID:</span> {call.call_id}</div>
              <div><span className="font-medium">Agent:</span> {call.agent?.agent_name || call.agent_id}</div>
              <div><span className="font-medium">Start:</span> {formatDate(call.start_timestamp)}</div>
              <div><span className="font-medium">End:</span> {formatDate(call.end_timestamp)}</div>
              <div><span className="font-medium">Duration:</span> {formatDuration(call.duration_seconds)}</div>
              <div><span className="font-medium">Cost:</span> ${call.cost.toFixed(2)}</div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  call.call_successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {call.call_status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Call Analysis</h3>
            <div className="space-y-2 text-sm">
              {call.call_summary && (
                <div>
                  <span className="font-medium">Summary:</span>
                  <p className="mt-1 text-gray-600">{call.call_summary}</p>
                </div>
              )}
              {call.user_sentiment && (
                <div>
                  <span className="font-medium">Sentiment:</span>{' '}
                  <span className="capitalize">{call.user_sentiment}</span>
                </div>
              )}
              {call.disconnection_reason && (
                <div>
                  <span className="font-medium">Disconnection:</span> {call.disconnection_reason}
                </div>
              )}
              {call.recording_url && (
                <div>
                  <span className="font-medium">Recording:</span>{' '}
                  <a href={call.recording_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Listen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {call.transcript && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Transcript</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-64 overflow-y-auto">
              {call.transcript}
            </div>
          </div>
        )}

        {call.caller_info && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Caller Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              {call.caller_info}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallManagement;


