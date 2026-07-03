import { useState, useEffect } from 'react';
import { agentAPI, planAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import FilterPanel from './FilterPanel';

function UserManagement() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAssignments, setShowAssignments] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planUser, setPlanUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [filters, pagination.offset, isAdmin]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = (message, variant = 'error') => {
    setToast({ message, variant });
  };

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

  const handleAssignPlan = (user) => {
    setPlanUser(user);
    setShowPlanModal(true);
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12 text-accent-700">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg ${
              toast.variant === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <div className="text-sm font-medium">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-navy-900">User Management</h1>
        <p className="text-ink-600 mt-1">Manage system users (Admin only)</p>
      </div>

      {/* Filters */}
      <FilterPanel
        open={filtersOpen}
        onToggle={() => setFiltersOpen((o) => !o)}
        activeCount={
          (filters.search ? 1 : 0) + (filters.role ? 1 : 0) + (filters.status ? 1 : 0)
        }
        onClear={() => {
          setFilters({ role: '', status: '', search: '' });
          setPagination((prev) => ({ ...prev, offset: 0 }));
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by email or name..."
              className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">Loading users...</div>
      ) : error ? (
        <div className="bg-accent-600/10 border border-accent-600/20 rounded-lg p-4">
          <p className="text-accent-700">Error: {error}</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden -mx-4 overflow-x-auto px-4">
            <div className="flex gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="w-[85vw] max-w-sm flex-shrink-0 rounded-lg border border-navy-100 bg-white p-4 shadow-sm"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">
                      {user.email}
                    </p>
                    <p className="text-xs text-ink-500">
                      {user.name || "N/A"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                      user.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : user.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-ink-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-ink-400">
                      Phone
                    </span>
                    <span>{user.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-ink-400">
                      Phone Status
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.phone
                          ? user.phone_verified_at
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-yellow-100 text-yellow-800"
                          : "bg-navy-50 text-navy-800"
                      }`}
                    >
                      {user.phone
                        ? user.phone_verified_at
                          ? "Verified"
                          : "Unverified"
                        : "No phone"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-ink-400">
                      Role
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.role === "SUPERADMIN"
                          ? "bg-amber-100 text-amber-800"
                          : user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-navy-50 text-navy-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-ink-400">
                      Created
                    </span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                  {isSuperAdmin() && user.status === "PENDING" && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await userAPI.approve(user.id);
                          if (response?.sms?.failed > 0 || response?.sms?.skipped) {
                            showToast(
                              "Approval SMS was not sent. Please check SMS settings and the user's phone number."
                            );
                          } else {
                            showToast("User approved and SMS sent.", 'success');
                          }
                          await fetchUsers();
                        } catch (err) {
                          showToast(`Failed to approve user: ${err.message}`);
                        }
                      }}
                      className="text-navy-900 hover:text-ink-700"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(user)}
                    disabled={user.role === "SUPERADMIN" && !isSuperAdmin()}
                    className="text-navy-900 hover:text-ink-700 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleAssignAgents(user)}
                    disabled={user.role === "SUPERADMIN" && !isSuperAdmin()}
                    className="text-navy-900 hover:text-ink-700 disabled:opacity-50"
                  >
                    Assign Agents
                  </button>
                  {isSuperAdmin() && user.role === "USER" && (
                    <button
                      onClick={() => handleAssignPlan(user)}
                      className="text-navy-900 hover:text-ink-700"
                    >
                      Assign Plan
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={user.role === "SUPERADMIN"}
                    className="text-rose-600 hover:text-rose-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden card-surface rounded-lg overflow-x-auto md:block">
            <table className="min-w-[900px] w-full divide-y divide-navy-100">
              <thead className="bg-navy-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Phone Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-ink-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-navy-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-navy-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.phone
                            ? user.phone_verified_at
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-navy-50 text-navy-800'
                        }`}
                      >
                        {user.phone
                          ? user.phone_verified_at
                            ? 'Verified'
                            : 'Unverified'
                          : 'No phone'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'SUPERADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-navy-50 text-navy-800'
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isSuperAdmin() && user.status === 'PENDING' && (
                        <button
                        onClick={async () => {
                          try {
                            const response = await userAPI.approve(user.id);
                            if (response?.sms?.failed > 0 || response?.sms?.skipped) {
                              showToast(
                                "Approval SMS was not sent. Please check SMS settings and the user's phone number."
                              );
                            } else {
                              showToast("User approved and SMS sent.", 'success');
                            }
                            await fetchUsers();
                          } catch (err) {
                            showToast(`Failed to approve user: ${err.message}`);
                          }
                        }}
                          className="text-navy-900 hover:text-ink-700 mr-4"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={user.role === 'SUPERADMIN' && !isSuperAdmin()}
                        className="text-navy-900 hover:text-ink-700 mr-4 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleAssignAgents(user)}
                        disabled={user.role === 'SUPERADMIN' && !isSuperAdmin()}
                        className="text-navy-900 hover:text-ink-700 mr-4 disabled:opacity-50"
                      >
                        Assign Agents
                      </button>
                      {isSuperAdmin() && user.role === 'USER' && (
                        <button
                          onClick={() => handleAssignPlan(user)}
                          className="text-navy-900 hover:text-ink-700 mr-4"
                        >
                          Assign Plan
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'SUPERADMIN'}
                        className="text-rose-600 hover:text-rose-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-ink-700">
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
                className="px-4 py-2 border border-navy-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({ ...pagination, offset: pagination.offset + pagination.limit })
                }
                disabled={!pagination.hasMore}
                className="px-4 py-2 border border-navy-200 rounded-lg disabled:opacity-50"
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

      {showPlanModal && (
        <PlanAssignmentModal
          user={planUser}
          onClose={() => {
            setShowPlanModal(false);
            setPlanUser(null);
          }}
          onAssigned={async () => {
            await fetchUsers();
            setShowPlanModal(false);
            setPlanUser(null);
            showToast('Plan assigned successfully.', 'success');
          }}
          onError={(message) => showToast(message)}
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
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-navy-200 rounded-lg bg-navy-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={roleDisabled}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 disabled:bg-navy-50"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN" disabled={!canEditSuperAdmin}>
                Super Admin
              </option>
            </select>
            {currentUser.id === user.id && (
              <p className="text-xs text-ink-500 mt-1">Cannot change your own role</p>
            )}
            {isEditingSuperAdmin && !canEditSuperAdmin && (
              <p className="text-xs text-ink-500 mt-1">Only a super admin can edit this role</p>
            )}
          </div>
          {error && (
            <div className="text-accent-700 text-sm bg-accent-600/10 p-3 rounded-lg">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-navy-200 rounded-lg hover:bg-navy-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50"
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
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Assign Agents</h2>
            <p className="text-sm text-ink-600 mt-1">
              {user?.email} - {assignedIds.size} assigned
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-500 hover:text-ink-700"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-700 mb-2">Search agents</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or agent ID..."
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"
          />
        </div>

        {error && (
          <div className="mt-4 text-accent-700 text-sm bg-accent-600/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto border border-navy-100 rounded-lg">
          {loading ? (
            <div className="text-center py-10 text-ink-600">Loading agents...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-10 text-ink-600">No agents found.</div>
          ) : (
            <table className="min-w-full divide-y divide-navy-100">
              <thead className="bg-navy-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-ink-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-navy-100">
                {filteredAgents.map((agent) => {
                  const isAssigned = assignedIds.has(agent.agent_id);
                  const isSaving = savingId === agent.agent_id;
                  return (
                    <tr key={agent.agent_id} className="hover:bg-navy-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-navy-900">
                          {agent.agent_name}
                        </div>
                        <div className="text-xs text-ink-500">{agent.agent_id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-600">
                        {agent.status || 'UNKNOWN'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleToggle(agent.agent_id)}
                          disabled={isSaving}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            isAssigned
                              ? 'border-accent-600 bg-accent-600 text-white hover:bg-accent-700'
                              : 'border-accent-600 text-navy-900 hover:bg-accent-600 hover:text-white'
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
          <p className="mt-3 text-xs text-ink-500">
            Showing the first 100 agents. Refine search if you don't see the one you need.
          </p>
        )}
      </div>
    </div>
  );
}

function PlanAssignmentModal({ user, onClose, onAssigned, onError }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await planAPI.list();
        const list = response?.data || [];
        setPlans(list);
        const firstActive = list.find((plan) => plan.is_active) || list[0];
        setPlanCode(firstActive?.code || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [user?.id]);

  const handleAssign = async () => {
    if (!planCode) {
      setError('Select a plan.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await userAPI.assignPlan(user.id, {
        planCode,
        periodDays: Number(periodDays) || 30,
      });
      onAssigned();
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Assign Plan</h2>
            <p className="text-sm text-ink-600 mt-1">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-500 hover:text-ink-700"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-ink-600">Loading plans...</div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Plan
              </label>
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.code}>
                    {plan.name} ({plan.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Period (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-accent-700 text-sm bg-accent-600/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-navy-200 rounded-lg hover:bg-navy-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || saving}
            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50"
          >
            {saving ? 'Assigning...' : 'Assign Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
