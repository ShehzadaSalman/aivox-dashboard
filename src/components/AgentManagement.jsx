import { useState, useEffect } from 'react';
import { agentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function AgentManagement() {
  const { isSuperAdmin } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, [filters, pagination.offset]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        includeCount: false,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      };
      const response = await agentAPI.list(params);
      console.log('Agents data:', response.data.agents);
      setAgents(response.data.agents);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (agentId) => {
    if (!window.confirm('Are you sure you want to deactivate this agent?')) {
      return;
    }
    try {
      await agentAPI.delete(agentId);
      await fetchAgents();
    } catch (err) {
      alert(`Failed to delete agent: ${err.message}`);
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingAgent(null);
    setShowModal(true);
  };

  const superAdmin = isSuperAdmin();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
          <p className="text-gray-600 mt-1">Manage your AI voice agents</p>
        </div>
        <div className="flex gap-3">
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by name or ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Cards */}
      {loading ? (
        <AgentsSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="relative bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4 hover:border-gray-200 hover:shadow-sm transition"
              >
                <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b from-amber-400 via-rose-400 to-fuchsia-500" />
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-50 to-rose-100 border border-amber-200 flex items-center justify-center text-amber-700 text-base font-semibold">
                    {(agent.agent_name || 'A').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agent.agent_name}</h3>
                    {superAdmin && (
                      <p className="text-[11px] text-gray-500 mt-1">{agent.agent_id}</p>
                    )}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center gap-2 text-xs font-medium ${
                          agent.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            agent.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {agent.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {superAdmin && (
                    <button
                      onClick={() => handleDelete(agent.agent_id)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {agents.length === 0 ? 0 : pagination.offset + 1} to{' '}
              {pagination.total === null || pagination.total === undefined
                ? pagination.offset + agents.length
                : Math.min(pagination.offset + pagination.limit, pagination.total)}
              {pagination.total === null || pagination.total === undefined
                ? ' agents'
                : ` of ${pagination.total} agents`}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <AgentModal
          agent={editingAgent}
          onClose={() => {
            setShowModal(false);
            setEditingAgent(null);
          }}
          onSave={async () => {
            await fetchAgents();
            setShowModal(false);
            setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
}

function AgentModal({ agent, onClose, onSave }) {
  const [formData, setFormData] = useState({
    agent_id: agent?.agent_id || '',
    agent_name: agent?.agent_name || '',
    status: agent?.status || 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (agent) {
        await agentAPI.update(agent.agent_id, {
          agent_name: formData.agent_name,
          status: formData.status,
        });
      } else {
        await agentAPI.create(formData);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {agent ? 'Edit Agent' : 'Create Agent'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!agent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent ID *
              </label>
              <input
                type="text"
                value={formData.agent_id}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="relative bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gray-200" />
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gray-200 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default AgentManagement;
