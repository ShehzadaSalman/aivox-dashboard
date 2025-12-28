import { useState, useEffect } from 'react';
import { agentAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function UserManagement() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAssignments, setShowAssignments] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [filters, pagination.offset, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      };
      const response = await userAPI.list(params);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await userAPI.delete(userId);
      await fetchUsers();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAssignAgents = (user) => {
    setAssignmentUser(user);
    setShowAssignments(true);
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12 text-red-600">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage system users (Admin only)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by email or name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">Loading users...</div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'SUPERADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : user.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isSuperAdmin() && user.status === 'PENDING' && (
                        <button
                          onClick={async () => {
                            try {
                              await userAPI.approve(user.id);
                              await fetchUsers();
                            } catch (err) {
                              alert(`Failed to approve user: ${err.message}`);
                            }
                          }}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={user.role === 'SUPERADMIN' && !isSuperAdmin()}
                        className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleAssignAgents(user)}
                        disabled={user.role === 'SUPERADMIN' && !isSuperAdmin()}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                      >
                        Assign Agents
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'SUPERADMIN'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Delete
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
              {pagination.total} users
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

      {/* Edit Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={async () => {
            await fetchUsers();
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {showAssignments && (
        <AgentAssignmentModal
          user={assignmentUser}
          onClose={() => {
            setShowAssignments(false);
            setAssignmentUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || 'USER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canEditSuperAdmin = isSuperAdmin();
  const isEditingSuperAdmin = user?.role === 'SUPERADMIN';
  const roleDisabled =
    currentUser.id === user.id || (isEditingSuperAdmin && !canEditSuperAdmin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userAPI.update(user.id, formData);
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
        <h2 className="text-2xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={roleDisabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN" disabled={!canEditSuperAdmin}>
                Super Admin
              </option>
            </select>
            {currentUser.id === user.id && (
              <p className="text-xs text-gray-500 mt-1">Cannot change your own role</p>
            )}
            {isEditingSuperAdmin && !canEditSuperAdmin && (
              <p className="text-xs text-gray-500 mt-1">Only a super admin can edit this role</p>
            )}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentAssignmentModal({ user, onClose }) {
  const [agents, setAgents] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [hasMoreAgents, setHasMoreAgents] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError('');

        const [agentsResponse, assignmentsResponse] = await Promise.all([
          agentAPI.list({ limit: 100, offset: 0 }),
          userAPI.listAgents(user.id),
        ]);

        const agentList = agentsResponse.data?.agents || [];
        const assignments = assignmentsResponse.data || [];
        const assignedAgentIds = new Set(
          assignments
            .map((assignment) => assignment.agent?.agent_id)
            .filter(Boolean)
        );

        setAgents(agentList);
        setAssignedIds(assignedAgentIds);
        setHasMoreAgents(!!agentsResponse.data?.pagination?.hasMore);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.id]);

  const filteredAgents = agents.filter((agent) => {
    if (!search) {
      return true;
    }
    const query = search.toLowerCase();
    return (
      agent.agent_name?.toLowerCase().includes(query) ||
      agent.agent_id?.toLowerCase().includes(query)
    );
  });

  const handleToggle = async (agentId) => {
    try {
      setSavingId(agentId);
      setError('');

      if (assignedIds.has(agentId)) {
        await userAPI.unassignAgent(user.id, agentId);
        setAssignedIds((prev) => {
          const next = new Set(prev);
          next.delete(agentId);
          return next;
        });
      } else {
        await userAPI.assignAgent(user.id, agentId);
        setAssignedIds((prev) => new Set(prev).add(agentId));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Assign Agents</h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.email} - {assignedIds.size} assigned
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search agents</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or agent ID..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="text-center py-10 text-gray-600">Loading agents...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-10 text-gray-600">No agents found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map((agent) => {
                  const isAssigned = assignedIds.has(agent.agent_id);
                  const isSaving = savingId === agent.agent_id;
                  return (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {agent.agent_name}
                        </div>
                        <div className="text-xs text-gray-500">{agent.agent_id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {agent.status || 'UNKNOWN'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleToggle(agent.agent_id)}
                          disabled={isSaving}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            isAssigned
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          } disabled:opacity-60`}
                        >
                          {isSaving ? 'Saving...' : isAssigned ? 'Unassign' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {hasMoreAgents && (
          <p className="mt-3 text-xs text-gray-500">
            Showing the first 100 agents. Refine search if you don't see the one you need.
          </p>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
