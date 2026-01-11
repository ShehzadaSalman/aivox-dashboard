import { useEffect, useMemo, useState } from "react";
import { leadAPI } from "../services/api";

function Leads() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeads = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const params = {};
        params.includeCount = false;
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        const response = await leadAPI.list(params);
        const data = response?.data?.leads || response?.data || [];
        const normalized = data.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          address: lead.address || "",
          agentId: lead.agent_id || lead.agentId || "",
          reason: lead.reason || "",
          agentName: lead.agent_name || lead.agentName || "",
          status: (lead.status || "").toLowerCase(),
          createdAt: lead.created_at
            ? new Date(lead.created_at).toLocaleString()
            : lead.createdAt || "",
          visitTime: lead.visit_time
            ? new Date(lead.visit_time).toLocaleString()
            : lead.visitTime || "",
        }));

        if (isMounted) {
          setLeads(normalized);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Failed to load leads.");
          setLeads([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLeads();

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const filteredLeads = useMemo(() => {
    const normalizedAgentFilter = agentFilter.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" ? true : lead.status === statusFilter;
      const matchesAgent = normalizedAgentFilter
        ? lead.agentName.toLowerCase().includes(normalizedAgentFilter)
        : true;
      return matchesStatus && matchesAgent;
    });
  }, [leads, statusFilter, agentFilter]);

  const handleDelete = async (leadId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );
    if (!confirmDelete) {
      return;
    }

    setDeletingId(leadId);
    setErrorMessage("");
    try {
      await leadAPI.delete(leadId);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete lead.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">
            Basic caller details captured by AI agents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Agent</label>
          <input
            type="text"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            placeholder="Filter by agent name"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LeadsSkeleton />
      ) : errorMessage ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-600">
          {errorMessage}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No leads available yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Visit Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Agent ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </div>
                    <div className="text-xs text-gray-500">{lead.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>{lead.email}</div>
                    <div className="text-xs text-gray-500">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {lead.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.visitTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.agentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lead.agentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleDelete(lead.id)}
                      disabled={deletingId === lead.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingId === lead.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-200">
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="px-6 py-4 grid grid-cols-6 gap-4">
            <div className="h-4 bg-gray-200 rounded col-span-1" />
            <div className="h-4 bg-gray-200 rounded col-span-1" />
            <div className="h-4 bg-gray-200 rounded col-span-1" />
            <div className="h-4 bg-gray-200 rounded col-span-1" />
            <div className="h-4 bg-gray-200 rounded col-span-1" />
            <div className="h-4 bg-gray-200 rounded col-span-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leads;
