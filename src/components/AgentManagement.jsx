import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { agentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function AgentManagement() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const result = await agentAPI.sync();
      setSyncMessage(
        `Synced ${result.agentsSynced ?? 0} new, updated ${result.agentsUpdated ?? 0}.`
      );
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (err) {
      setSyncMessage(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const {
    data: agentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agents', search, pagination.offset, pagination.limit],
    queryFn: async () => {
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        includeCount: false,
        ...(search && { search }),
      };
      const response = await agentAPI.list(params);
      return response.data;
    },
    keepPreviousData: true,
  });

  const agents = agentsData?.agents || [];
  const paginationMeta = agentsData?.pagination || {
    total: 0,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: false,
  };
  const superAdmin = isSuperAdmin();

  const handleDelete = async (agentId) => {
    if (!window.confirm('Deactivate this agent?')) {
      return;
    }
    try {
      await agentAPI.delete(agentId);
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (err) {
      window.alert(`Failed to deactivate agent: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-navy-900">Agents</h1>
          <p className="text-ink-600 mt-1">Your AI voice agents and their status.</p>
        </div>
        {isAdmin() && (
          <div className="flex items-center gap-3">
            {syncMessage && <span className="text-sm text-ink-500">{syncMessage}</span>}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-navy-50 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        )}
      </div>

      {/* Search — only meaningful once agents exist (or a search is active) */}
      {(agents.length > 0 || search.trim()) && (
        <div className="card-surface rounded-lg p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, offset: 0 }));
            }}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
          />
        </div>
      )}

      {isLoading && agents.length === 0 ? (
        <AgentsSkeleton />
      ) : error ? (
        <div className="card-surface rounded-lg p-4">
          <p className="text-accent-700">Error: {error.message || 'Failed to load agents.'}</p>
        </div>
      ) : agents.length === 0 ? (
        <AgentsEmptyState
          isAdmin={isAdmin()}
          hasSearch={Boolean(search.trim())}
          search={search}
          onSync={handleSync}
          syncing={syncing}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const isActive = agent.status === 'ACTIVE';
              return (
                <div
                  key={agent.id}
                  className="card-surface rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent-600/10 border border-accent-600/20 flex items-center justify-center text-accent-700 font-semibold">
                      {(agent.agent_name || 'A').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-navy-900">
                        {agent.agent_name}
                      </h3>
                      {superAdmin && (
                        <p className="text-[11px] text-ink-400 mt-0.5">{agent.agent_id}</p>
                      )}
                      <span
                        className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium ${
                          isActive ? 'text-emerald-700' : 'text-accent-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-accent-600'
                          }`}
                        />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {superAdmin && (
                      <button
                        onClick={() => handleDelete(agent.agent_id)}
                        className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-navy-50"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-ink-600">
              Showing {pagination.offset + 1} to {pagination.offset + agents.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    offset: Math.max(0, pagination.offset - pagination.limit),
                  })
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
    </div>
  );
}

function AgentsEmptyState({ isAdmin, hasSearch, search, onSync, syncing }) {
  // No results for an active search — same for every role.
  if (hasSearch) {
    return (
      <div className="card-surface rounded-2xl p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-3xl">
          🔍
        </div>
        <h2 className="text-lg font-semibold text-navy-900">No agents match your search</h2>
        <p className="mt-1 text-ink-500">
          Nothing found for “{search.trim()}”. Try a different name.
        </p>
      </div>
    );
  }

  // Admins provision agents by syncing from Retell.
  if (isAdmin) {
    return (
      <div className="card-surface rounded-2xl p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-3xl">
          👥
        </div>
        <h2 className="text-lg font-semibold text-navy-900">No agents yet</h2>
        <p className="mt-1 text-ink-600">
          Pull your voice agents in from Retell to get started.
        </p>
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="mt-5 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync agents from Retell'}
        </button>
      </div>
    );
  }

  // End client: their agent is provisioned for them — reassure and redirect energy.
  return (
    <div className="card-surface rounded-2xl p-10 text-center max-w-xl mx-auto">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-3xl">
        🛠️
      </div>
      <h2 className="text-xl font-semibold text-navy-900">
        Your AI agent is being set up
      </h2>
      <p className="mt-2 text-ink-600">
        Our team is configuring your voice agent and connecting your phone line.
        You'll get an email the moment it's ready to start answering calls.
      </p>
      <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/70 p-4 text-left">
        <p className="text-sm font-semibold text-navy-900">While you wait</p>
        <p className="mt-1 text-sm text-ink-600">
          Connect your calendar so your agent can book appointments the moment it
          goes live.
        </p>
        <Link
          to="/dashboard/settings"
          className="mt-3 inline-flex rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
        >
          Connect your calendar
        </Link>
      </div>
      <p className="mt-5 text-sm text-ink-500">
        Questions? Email{' '}
        <a
          href="mailto:support@candibly.online"
          className="font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
        >
          support@candibly.online
        </a>
        .
      </p>
    </div>
  );
}

function AgentsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="card-surface rounded-xl p-5 flex items-center gap-4"
        >
          <div className="h-12 w-12 bg-navy-100 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-navy-100 rounded" />
            <div className="h-3 w-24 bg-navy-100 rounded" />
            <div className="h-3 w-16 bg-navy-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default AgentManagement;
