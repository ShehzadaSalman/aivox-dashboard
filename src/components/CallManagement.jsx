import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callAPI, agentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import FilterPanel from './FilterPanel';

const DEFAULT_FILTERS = {
  agentId: '',
  outcome: '', // '', 'true', 'false'
  search: '',
  afterStart: '',
  beforeStart: '',
  sortBy: 'date',
};

function CallManagement() {
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const { isSuperAdmin } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  const updateFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const activeFilterCount = ['agentId', 'outcome', 'search', 'afterStart', 'beforeStart']
    .filter((key) => filters[key] !== '')
    .length;

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  // Only fetch the agents list (for the Agent dropdown) once the user opens filters,
  // so the page content isn't blocked by filter data on first load.
  const { data: agentsData } = useQuery({
    queryKey: ['agents', 'list'],
    queryFn: async () => {
      const response = await agentAPI.list({ limit: 100, includeCount: false });
      return response.data;
    },
    enabled: filtersOpen,
  });

  const {
    data: callsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['calls', filters, pagination.limit, pagination.offset],
    queryFn: async () => {
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        sortBy: filters.sortBy,
        includeCount: false,
        ...(filters.agentId && { agentId: filters.agentId }),
        ...(filters.outcome !== '' && { success: filters.outcome }),
        ...(filters.search.trim() && { search: filters.search.trim() }),
        ...(filters.afterStart && { afterStart: toEpochMs(filters.afterStart) }),
        ...(filters.beforeStart && { beforeStart: toEpochMs(filters.beforeStart) }),
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

  const showAgentId = isSuperAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-navy-900">Calls</h1>
          <p className="mt-1 text-ink-600">Every call your AI agents handled.</p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        open={filtersOpen}
        onToggle={() => setFiltersOpen((o) => !o)}
        activeCount={activeFilterCount}
        onClear={clearFilters}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Field label="Agent">
            <select
              value={filters.agentId}
              onChange={(e) => updateFilter({ agentId: e.target.value })}
              className={inputClass}
            >
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent.agent_id} value={agent.agent_id}>
                  {agent.agent_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Outcome">
            <select
              value={filters.outcome}
              onChange={(e) => updateFilter({ outcome: e.target.value })}
              className={inputClass}
            >
              <option value="">All</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
            </select>
          </Field>
          <Field label="From (phone)">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter({ search: e.target.value })}
              placeholder="Search caller number"
              className={inputClass}
            />
          </Field>
          <Field label="From date">
            <input
              type="datetime-local"
              value={filters.afterStart}
              onChange={(e) => updateFilter({ afterStart: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="To date">
            <input
              type="datetime-local"
              value={filters.beforeStart}
              onChange={(e) => updateFilter({ beforeStart: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </FilterPanel>

      {isLoading ? (
        <CallsSkeleton />
      ) : error ? (
        <div className="card-surface rounded-lg p-4">
          <p className="text-accent-700">Error: {error.message || 'Failed to load calls.'}</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="card-surface rounded-lg p-10 text-center">
          <div className="text-2xl mb-2">📞</div>
          <p className="text-ink-700 font-medium">No calls match these filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {calls.map((call) => (
              <div key={call.id} className="card-surface rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-400 uppercase tracking-wide">From</p>
                    <p className="font-semibold text-navy-900">{getCallerFrom(call.caller_info)}</p>
                  </div>
                  <OutcomeBadge successful={call.call_successful} status={call.call_status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Detail label="Agent" value={call.agent?.agent_name || call.agent_id} />
                  <Detail label="Duration" value={formatDuration(call.duration_seconds)} />
                  <div className="col-span-2">
                    <Detail label="Date" value={formatDate(call.start_timestamp)} />
                  </div>
                </div>
                <div className="pt-2 border-t border-navy-100">
                  <button
                    onClick={() => setSelectedCall(call)}
                    className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-navy-50"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block card-surface rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-navy-100">
                <thead className="bg-navy-50">
                  <tr>
                    <Th>From</Th>
                    <Th>Agent</Th>
                    {showAgentId && <Th>Agent ID</Th>}
                    <Th>Outcome</Th>
                    <Th>Date</Th>
                    <Th>Duration</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-navy-100">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-navy-50/60">
                      <td className="px-6 py-4 text-sm font-medium text-navy-900 whitespace-nowrap">
                        {getCallerFrom(call.caller_info)}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-600 whitespace-nowrap">
                        {call.agent?.agent_name || call.agent_id}
                      </td>
                      {showAgentId && (
                        <td className="px-6 py-4 text-sm text-ink-500 whitespace-nowrap">
                          {call.agent_id}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <OutcomeBadge successful={call.call_successful} status={call.call_status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-600 whitespace-nowrap">
                        {formatDate(call.start_timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-600 whitespace-nowrap">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-accent-700 hover:text-accent-800"
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
            <div className="text-sm text-ink-600">
              Showing {calls.length === 0 ? 0 : pagination.offset + 1} to{' '}
              {pagination.offset + calls.length} calls
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })
                }
                disabled={pagination.offset === 0}
                className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-navy-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
                }
                disabled={!paginationMeta.hasMore}
                className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-navy-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedCall && (
        <CallDetailsModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20';

function Field({ label, children }) {
  return (
    <div>
      <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-6 py-3 text-xs font-medium text-left text-ink-500 uppercase">
      {children}
    </th>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400 uppercase tracking-wide">{label}</p>
      <p className="text-ink-700">{value}</p>
    </div>
  );
}

function OutcomeBadge({ successful, status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        successful
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-accent-600/10 text-accent-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          successful ? 'bg-emerald-500' : 'bg-accent-600'
        }`}
      />
      {successful ? 'Successful' : status || 'Failed'}
    </span>
  );
}

function CallDetailsModal({ call, onClose }) {
  const transcriptLines = formatTranscriptLines(call.transcript);
  const callerInfo = parseCallerInfo(call.caller_info);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-navy-900">Call details</h2>
          <button onClick={onClose} className="text-2xl text-ink-500 hover:text-ink-700">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-ink-700">Call information</h3>
            <div className="space-y-2 text-sm text-ink-700">
              <div><span className="font-medium">Agent:</span> {call.agent?.agent_name || call.agent_id}</div>
              <div><span className="font-medium">Start:</span> {formatDate(call.start_timestamp)}</div>
              <div><span className="font-medium">End:</span> {formatDate(call.end_timestamp)}</div>
              <div><span className="font-medium">Duration:</span> {formatDuration(call.duration_seconds)}</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Outcome:</span>
                <OutcomeBadge successful={call.call_successful} status={call.call_status} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-ink-700">Call analysis</h3>
            <div className="space-y-2 text-sm text-ink-700">
              {call.call_summary && (
                <div>
                  <span className="font-medium">Summary:</span>
                  <p className="mt-1 text-ink-600">{call.call_summary}</p>
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
            <h3 className="mb-2 font-semibold text-ink-700">Audio</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <audio controls className="w-full sm:flex-1">
                <source src={call.recording_url} />
                Your browser does not support the audio element.
              </audio>
              <a
                href={call.recording_url}
                download
                className="inline-flex items-center justify-center px-4 py-2 text-white rounded-lg bg-accent-600 hover:bg-accent-700"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {call.transcript && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold text-ink-700">Transcript</h3>
            <div className="p-4 overflow-y-auto text-sm rounded-lg bg-navy-50 max-h-64 text-ink-700">
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
            <h3 className="mb-2 font-semibold text-ink-700">Caller information</h3>
            <div className="p-4 text-sm rounded-lg bg-navy-50">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="From" value={callerInfo.from_number || callerInfo.from || '--'} />
                <InfoRow label="To" value={callerInfo.to_number || callerInfo.to || '--'} />
                <InfoRow label="Direction" value={callerInfo.direction || '--'} />
                {callerInfo.location && <InfoRow label="Location" value={callerInfo.location} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toEpochMs(localValue) {
  if (!localValue) {
    return undefined;
  }
  const ms = new Date(localValue).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function formatDate(timestamp) {
  const value = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
  return new Date(value).toLocaleString();
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${secs}s`;
}

function formatTranscriptLines(transcript) {
  if (!transcript) {
    return [];
  }
  return transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => line.split(/(?=\b(?:Agent|User|Customer|Caller)\s*:)/gi))
    .map((line) => line.trim())
    .filter(Boolean);
}

function getCallerFrom(callerInfo) {
  if (!callerInfo) {
    return '--';
  }
  if (typeof callerInfo === 'string') {
    try {
      const parsed = JSON.parse(callerInfo);
      return (
        parsed?.from_number || parsed?.caller_number || parsed?.from || parsed?.phone || '--'
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
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className="text-sm font-medium text-navy-900">{value}</div>
    </div>
  );
}

function CallsSkeleton() {
  return (
    <div className="card-surface rounded-lg overflow-hidden animate-pulse">
      <div className="p-4 border-b border-navy-100">
        <div className="w-40 h-4 bg-navy-100 rounded" />
      </div>
      <div className="divide-y divide-navy-100">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 px-6 py-4">
            {Array.from({ length: 6 }).map((__, i) => (
              <div key={i} className="h-4 bg-navy-100 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CallManagement;
