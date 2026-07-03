import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { integrationAPI, leadAPI } from "../services/api";
import { DEFAULT_CAL_CONFIG, normalizeCalConfig } from "../utils/calConfig";
import BookingModal from "./BookingModal";
import FilterPanel from "./FilterPanel";

const DEFAULT_SMS_CONFIG = {
  defaultCountryCode: "+1",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
];

const STATUS_STYLES = {
  new: "bg-accent-600/10 text-accent-700 border-accent-600/20",
  contacted: "bg-gold-500/15 text-gold-600 border-gold-500/30",
  qualified: "bg-navy-700/10 text-navy-800 border-navy-700/20",
};

const normalizeCountryCode = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return DEFAULT_SMS_CONFIG.defaultCountryCode;
  }
  if (trimmed.startsWith("+")) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    return `+${trimmed}`;
  }
  return trimmed;
};

const hasCountryCode = (phone) => {
  const trimmed = String(phone || "").trim();
  if (!trimmed) {
    return false;
  }
  return trimmed.startsWith("+") || trimmed.startsWith("00");
};

const applyDefaultCountryCode = (phone, defaultCountryCode) => {
  const trimmed = String(phone || "").trim();
  if (!trimmed) {
    return "";
  }
  if (hasCountryCode(trimmed)) {
    return trimmed;
  }
  const normalizedCode = normalizeCountryCode(defaultCountryCode);
  const normalizedPhone = trimmed.replace(/^0+/, "");
  return `${normalizedCode}${normalizedPhone}`.trim();
};

const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
const smsHref = (phone) => `sms:${String(phone || "").replace(/[^\d+]/g, "")}`;

function Leads() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [bookedLeads, setBookedLeads] = useState({});
  const [bookingLead, setBookingLead] = useState(null);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const {
    data: leadsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["leads", statusFilter],
    queryFn: async () => {
      const params = { includeCount: false };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await leadAPI.list(params);
      const data = response?.data?.leads || response?.data || [];
      return data.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        address: lead.address || "",
        agentId: lead.agent_id || lead.agentId || "",
        reason: lead.reason || "",
        agentName: lead.agent_name || lead.agentName || "",
        status: (lead.status || "new").toLowerCase(),
        bookedAt: lead.booked_at || lead.bookedAt || null,
        createdAt: formatReadableDateTime(lead.created_at || lead.createdAt),
        visitTime: formatReadableDateTime(lead.visit_time || lead.visitTime),
      }));
    },
    keepPreviousData: true,
  });

  const { data: calIntegrationData } = useQuery({
    queryKey: ["integrations", "calcom"],
    queryFn: async () => {
      const response = await integrationAPI.get("calcom");
      return normalizeCalConfig(response?.data?.config);
    },
    staleTime: 60 * 1000,
  });

  const { data: smsIntegrationData } = useQuery({
    queryKey: ["integrations", "sms"],
    queryFn: async () => {
      const response = await integrationAPI.get("sms");
      return response?.data?.config || {};
    },
    staleTime: 60 * 1000,
  });

  const calConfig = calIntegrationData || DEFAULT_CAL_CONFIG;
  const defaultCountryCode = normalizeCountryCode(
    smsIntegrationData?.defaultCountryCode ||
      DEFAULT_SMS_CONFIG.defaultCountryCode
  );
  const leads = leadsData || [];

  const formatLeadPhone = useMemo(() => {
    return (phone) => applyDefaultCountryCode(phone, defaultCountryCode);
  }, [defaultCountryCode]);

  const showToast = (message, variant = "success") =>
    setToast({ message, variant });

  const statusOf = (lead) => statusOverrides[lead.id] || lead.status;

  const filteredLeads = useMemo(() => {
    const normalizedAgentFilter = agentFilter.trim().toLowerCase();
    return leads.filter((lead) => {
      const status = statusOverrides[lead.id] || lead.status;
      const matchesStatus = statusFilter === "all" ? true : status === statusFilter;
      const matchesAgent = normalizedAgentFilter
        ? lead.agentName.toLowerCase().includes(normalizedAgentFilter)
        : true;
      return matchesStatus && matchesAgent;
    });
  }, [leads, statusFilter, agentFilter, statusOverrides]);

  const handleStatusChange = async (lead, nextStatus) => {
    const previous = statusOf(lead);
    if (nextStatus === previous) {
      return;
    }
    setStatusOverrides((prev) => ({ ...prev, [lead.id]: nextStatus }));
    setSavingStatusId(lead.id);
    try {
      await leadAPI.updateStatus(lead.id, nextStatus);
      showToast(`Marked as ${nextStatus}.`);
    } catch (err) {
      setStatusOverrides((prev) => ({ ...prev, [lead.id]: previous }));
      showToast(err.message || "Failed to update status.", "error");
    } finally {
      setSavingStatusId(null);
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }
    setDeletingId(leadId);
    try {
      await leadAPI.delete(leadId);
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (err) {
      showToast(err.message || "Failed to delete lead.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBooked = ({ leadId, when }) => {
    setBookedLeads((prev) => ({ ...prev, [leadId]: when }));
    setBookingLead(null);
    showToast(`Appointment booked${when ? ` for ${when}` : ""}.`);
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["appointments-count"] });
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg ${
              toast.variant === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
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
        <h1 className="text-3xl font-semibold text-navy-900">Leads</h1>
        <p className="text-ink-600 mt-1">
          Follow up with callers your AI captured and turn them into appointments.
        </p>
      </div>

      <FilterPanel
        open={filtersOpen}
        onToggle={() => setFiltersOpen((o) => !o)}
        activeCount={
          (agentFilter.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)
        }
        onClear={() => {
          setAgentFilter("");
          setStatusFilter("all");
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Agent
            </label>
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Filter by agent name"
              className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterPanel>

      {isLoading && leads.length === 0 ? (
        <LeadsSkeleton />
      ) : error ? (
        <div className="card-surface rounded-lg p-6 text-center text-accent-700">
          {error.message || "Failed to load leads."}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="card-surface rounded-lg p-10 text-center">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-ink-700 font-medium">No leads to follow up yet.</p>
          <p className="text-ink-500 text-sm mt-1">
            When your AI captures a caller's details, they'll show up here ready to book.
          </p>
        </div>
      ) : (
        <div className="card-surface rounded-lg overflow-x-auto">
          <table className="min-w-[920px] w-full divide-y divide-navy-100">
            <thead className="bg-navy-50">
              <tr>
                <Th>Lead</Th>
                <Th>Contact</Th>
                <Th>Agent</Th>
                <Th>Captured</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-navy-100">
              {filteredLeads.map((lead) => {
                const status = statusOf(lead);
                const phone = formatLeadPhone(lead.phone);
                const booked =
                  bookedLeads[lead.id] ||
                  (lead.bookedAt ? formatReadableDateTime(lead.bookedAt) : null);
                return (
                  <tr key={lead.id} className="align-top hover:bg-navy-50/60">
                    <td className="px-4 py-3 max-w-[260px]">
                      <div className="font-medium text-navy-900">
                        {lead.reason || "New caller"}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {lead.name}
                        {lead.company ? ` · ${lead.company}` : ""}
                      </div>
                      {lead.visitTime && (
                        <div className="text-xs text-ink-400 mt-1">
                          Wants: {lead.visitTime}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-ink-700">{phone || "—"}</div>
                      <div className="text-xs text-ink-500 truncate max-w-[200px]">
                        {lead.email || "—"}
                      </div>
                      {phone && (
                        <div className="flex gap-3 mt-1">
                          <a
                            href={telHref(phone)}
                            className="text-xs font-semibold text-accent-700 hover:text-accent-800"
                          >
                            Call
                          </a>
                          <a
                            href={smsHref(phone)}
                            className="text-xs font-semibold text-accent-700 hover:text-accent-800"
                          >
                            Text
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {lead.agentName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600 whitespace-nowrap">
                      {lead.createdAt || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {booked && (
                        <div className="mb-1.5">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            ✓ Booked
                          </span>
                          <div className="text-xs text-ink-400 mt-0.5">{booked}</div>
                        </div>
                      )}
                      <label className="sr-only" htmlFor={`status-${lead.id}`}>
                        Update status
                      </label>
                      <select
                        id={`status-${lead.id}`}
                        value={status}
                        disabled={savingStatusId === lead.id}
                        onChange={(e) => handleStatusChange(lead, e.target.value)}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold capitalize focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20 disabled:opacity-50 ${
                          STATUS_STYLES[status] || STATUS_STYLES.new
                        }`}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingLead(lead)}
                          className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700"
                        >
                          {booked ? "Book again" : "Book"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(lead.id)}
                          disabled={deletingId === lead.id}
                          className="rounded-lg border border-accent-600/30 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-600/10 disabled:opacity-50"
                        >
                          {deletingId === lead.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {bookingLead && (
        <BookingModal
          lead={bookingLead}
          calConfig={calConfig}
          onClose={() => setBookingLead(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function LeadsSkeleton() {
  return (
    <div className="card-surface rounded-lg overflow-hidden animate-pulse">
      <div className="bg-navy-50 h-11 border-b border-navy-100" />
      <div className="divide-y divide-navy-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 px-4 py-4">
            {Array.from({ length: 6 }).map((__, i) => (
              <div key={i} className="h-4 bg-navy-100 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatReadableDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
}

export default Leads;
