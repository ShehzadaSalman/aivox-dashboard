import { useState, useEffect } from 'react';
import { callAPI, agentAPI } from '../services/api';
import { formatUSD } from '../services/currency';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function CallManagement() {
  const { isSuperAdmin } = useAuth();
  const [calls, setCalls] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [filters, setFilters] = useState({
    agentId: '',
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
    try {
      setSyncing(true);
      await callAPI.sync(filters.agentId || undefined);
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

  console.log("Call history: ", calls)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="mt-1 text-gray-600">View and manage all calls</p>
        </div>
        {isSuperAdmin() ? (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Calls'}
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            Syncing calls is restricted to superadmin.
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Agent</label>
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
            <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
            <input
              type="text"
              value={filters.callStatus}
              onChange={(e) => setFilters({ ...filters, callStatus: e.target.value })}
              placeholder="Filter by status..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Sort By</label>
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
        <div className="py-12 text-center">Loading calls...</div>
      ) : error ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : (
        <>
              <div className="overflow-hidden bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Call ID</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Agent</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Duration</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {call.call_id.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {call.agent?.agent_name || call.agent_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(call.start_timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatUSD(call.cost)}
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
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
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
              <div className="flex items-center justify-between">
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

  const formatTranscriptLines = (transcript) => {
    if (!transcript) {
      return [];
    }

    return transcript
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) =>
        line.split(/(?=\b(?:Agent|User|Customer|Caller)\s*:)/gi)
      )
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const transcriptLines = formatTranscriptLines(call.transcript);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Call Details</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Call Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Call ID:</span> {call.call_id}</div>
              <div><span className="font-medium">Agent:</span> {call.agent?.agent_name || call.agent_id}</div>
              <div><span className="font-medium">Start:</span> {formatDate(call.start_timestamp)}</div>
              <div><span className="font-medium">End:</span> {formatDate(call.end_timestamp)}</div>
              <div><span className="font-medium">Duration:</span> {formatDuration(call.duration_seconds)}</div>
              <div><span className="font-medium">Cost:</span> {formatUSD(call.cost)}</div>
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
            <h3 className="mb-2 font-semibold text-gray-700">Call Analysis</h3>
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
            </div>
          </div>
        </div>

        {call.recording_url && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold text-gray-700">Audio</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <audio controls className="w-full sm:flex-1">
                <source src={call.recording_url} />
                Your browser does not support the audio element.
              </audio>
              <a
                href={call.recording_url}
                download
                className="inline-flex items-center justify-center px-4 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {call.transcript && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold text-gray-700">Transcript</h3>
            <div className="p-4 overflow-y-auto text-sm rounded-lg bg-gray-50 max-h-64">
              {transcriptLines.length > 0 ? (
                <div className="space-y-2">
                  {transcriptLines.map((line, index) => (
                    <div key={`${line}-${index}`} className="leading-relaxed">
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="leading-relaxed">{call.transcript}</div>
              )}
            </div>
          </div>
        )}

        {call.caller_info && (
          <div className="mt-4">
            <h3 className="mb-2 font-semibold text-gray-700">Caller Information</h3>
            <div className="p-4 text-sm rounded-lg bg-gray-50">
              {call.caller_info}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallManagement;
