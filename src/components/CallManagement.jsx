import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callAPI, agentAPI } from '../services/api';
import { formatUSD } from '../services/currency';
import { useAuth } from '../contexts/AuthContext';
function CallManagement() {
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const { isSuperAdmin } = useAuth();
  const [filters, setFilters] = useState({
    agentId: '',
    sortBy: 'date',
  });
  const [selectedCall, setSelectedCall] = useState(null);

  const { data: agentsData } = useQuery({
    queryKey: ['agents', 'list'],
    queryFn: async () => {
      const response = await agentAPI.list({ limit: 100, includeCount: false });
      return response.data;
    },
  });

  const {
    data: callsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'calls',
      filters.agentId,
      filters.sortBy,
      pagination.limit,
      pagination.offset,
    ],
    queryFn: async () => {
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy: filters.sortBy,
        includeCount: false,
        ...(filters.agentId && { agentId: filters.agentId }),
      };
      const response = await callAPI.list(params);
      return response.data;
    },
    keepPreviousData: true,
  });

  const agents = agentsData?.agents || [];
  const calls = callsData?.calls || [];
  const paginationMeta = callsData?.pagination || {
    total: 0,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: false,
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const showAgentId = isSuperAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="mt-1 text-gray-600">View and manage all calls</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg shadow">
        <label className="block mb-2 text-sm font-medium text-gray-700">Agent</label>
        <select
          value={filters.agentId}
          onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Agents</option>
          {agents.map((agent) => (
            <option key={agent.agent_id} value={agent.agent_id}>
              {agent.agent_name}
            </option>
          ))}
        </select>
      </div>

      {/* Calls Table */}
      {isLoading ? (
        <CallsSkeleton />
      ) : error ? (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Error: {error.message || 'Failed to load calls.'}</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {calls.map((call) => (
              <div key={call.id} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">From</p>
                    <p className="font-semibold text-gray-900">{getCallerFrom(call.caller_info)}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${call.call_successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {call.call_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Agent</p>
                    <p className="text-gray-700">{call.agent?.agent_name || call.agent_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
                    <p className="text-gray-700">{formatDuration(call.duration_seconds)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                    <p className="text-gray-700">{formatDate(call.start_timestamp)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedCall(call)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">From</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Call ID</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Agent</th>
                    {showAgentId && (
                      <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Agent ID</th>
                    )}
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {getCallerFrom(call.caller_info)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {call.call_id.substring(0, 20)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {call.agent?.agent_name || call.agent_id}
                      </td>
                      {showAgentId && (
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {call.agent_id}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(call.start_timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-gray-900 hover:text-gray-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              Showing {calls.length === 0 ? 0 : pagination.offset + 1} to{' '}
              {paginationMeta.total === null || paginationMeta.total === undefined
                ? pagination.offset + calls.length
                : Math.min(pagination.offset + pagination.limit, paginationMeta.total)}
              {paginationMeta.total === null || paginationMeta.total === undefined
                ? ' calls'
                : ` of ${paginationMeta.total} calls`}
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
                disabled={!paginationMeta.hasMore}
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
  const callerInfo = parseCallerInfo(call.caller_info);

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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Call Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Call ID:</span> {call.call_id}</div>
              <div><span className="font-medium">Agent:</span> {call.agent?.agent_name || call.agent_id}</div>
              <div><span className="font-medium">Start:</span> {formatDate(call.start_timestamp)}</div>
              <div><span className="font-medium">End:</span> {formatDate(call.end_timestamp)}</div>
              <div><span className="font-medium">Duration:</span> {formatDuration(call.duration_seconds)}</div>
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
                className="inline-flex items-center justify-center px-4 py-2 text-white rounded-lg bg-gray-900 hover:bg-gray-800"
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

        {callerInfo && (
          <div className="mt-4">
            <h3 className="mb-2 font-semibold text-gray-700">Caller Information</h3>
            <div className="p-4 text-sm rounded-lg bg-gray-50">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="From" value={callerInfo.from_number || callerInfo.from || '--'} />
                <InfoRow label="To" value={callerInfo.to_number || callerInfo.to || '--'} />
                <InfoRow label="Direction" value={callerInfo.direction || '--'} />
                {callerInfo.location && <InfoRow label="Location" value={callerInfo.location} />}
              </div>
              <details className="mt-3 text-xs text-gray-500">
                <summary className="cursor-pointer select-none">Raw payload</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {JSON.stringify(callerInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getCallerFrom(callerInfo) {
  if (!callerInfo) {
    return '--';
  }
  if (typeof callerInfo === 'string') {
    try {
      const parsed = JSON.parse(callerInfo);
      return (
        parsed?.from_number ||
        parsed?.caller_number ||
        parsed?.from ||
        parsed?.phone ||
        '--'
      );
    } catch {
      return callerInfo;
    }
  }
  if (typeof callerInfo === 'object') {
    return (
      callerInfo?.from_number ||
      callerInfo?.caller_number ||
      callerInfo?.from ||
      callerInfo?.phone ||
      '--'
    );
  }
  return '--';
}

function parseCallerInfo(callerInfo) {
  if (!callerInfo) {
    return null;
  }
  if (typeof callerInfo === 'string') {
    try {
      return JSON.parse(callerInfo);
    } catch {
      return { raw: callerInfo };
    }
  }
  if (typeof callerInfo === 'object') {
    return callerInfo;
  }
  return null;
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function CallsSkeleton() {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow animate-pulse">
      <div className="p-4 border-b border-gray-200">
        <div className="w-40 h-4 bg-gray-200 rounded" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 px-6 py-4">
            <div className="h-4 col-span-1 bg-gray-200 rounded" />
            <div className="h-4 col-span-1 bg-gray-200 rounded" />
            <div className="h-4 col-span-1 bg-gray-200 rounded" />
            <div className="h-4 col-span-1 bg-gray-200 rounded" />
            <div className="h-4 col-span-1 bg-gray-200 rounded" />
            <div className="h-4 col-span-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CallManagement;
