import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { calcomAPI, integrationAPI, leadAPI } from "../services/api";
import { DEFAULT_CAL_CONFIG, normalizeCalConfig } from "../utils/calConfig";

const DEFAULT_SMS_CONFIG = {
  defaultCountryCode: "+1",
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
  return `${normalizedCode} ${trimmed}`.trim();
};

function Leads() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [appointmentLead, setAppointmentLead] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    eventTypeId: "",
    start: "",
    timezone: "",
    attendeeName: "",
    attendeeEmail: "",
  });
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentSaving, setAppointmentSaving] = useState(false);
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
        status: (lead.status || "").toLowerCase(),
        createdAt: formatReadableDateTime(lead.created_at || lead.createdAt),
        visitTime: formatReadableDateTime(lead.visit_time || lead.visitTime),
        visitTimeRaw: lead.visit_time || lead.visitTime || "",
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
    try {
      await leadAPI.delete(leadId);
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (error) {
      // keep error message in modal if needed
    } finally {
      setDeletingId(null);
    }
  };

  const openAppointmentModal = (lead) => {
    const visitDate = lead.visitTimeRaw ? new Date(lead.visitTimeRaw) : null;
    const hasValidVisit = visitDate && !Number.isNaN(visitDate.getTime());
    const startIso = hasValidVisit ? visitDate.toISOString() : "";
    setAppointmentLead(lead);
    setAppointmentError("");
    setAppointmentForm({
      eventTypeId: calConfig.eventTypeId || "",
      start: startIso,
      timezone:
        calConfig.timeZone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "",
      attendeeName: lead.name || "",
      attendeeEmail: lead.email || "",
    });
  };

  const closeAppointmentModal = () => {
    if (appointmentSaving) {
      return;
    }
    setAppointmentLead(null);
  };

  const handleAppointmentChange = (field, value) => {
    setAppointmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAppointment = async () => {
    if (!appointmentLead) {
      return;
    }
    setAppointmentError("");

    const { eventTypeId, start, attendeeName, attendeeEmail, timezone } =
      appointmentForm;

    if (!eventTypeId.trim()) {
      setAppointmentError("Event Type ID is required.");
      return;
    }
    if (!start) {
      setAppointmentError("Start time is required.");
      return;
    }
    if (!timezone.trim()) {
      setAppointmentError("Timezone is required.");
      return;
    }
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setAppointmentError("Attendee name and email are required.");
      return;
    }

    setAppointmentSaving(true);
    try {
      const payload = {
        eventTypeId: eventTypeId.trim(),
        start,
        attendee: {
          name: attendeeName.trim(),
          email: attendeeEmail.trim(),
          timeZone: timezone.trim(),
        },
        metadata: {
          leadId: appointmentLead.id,
          phone: appointmentLead.phone || undefined,
          address: appointmentLead.address || undefined,
          reason: appointmentLead.reason || undefined,
          company: appointmentLead.company || undefined,
          agentId: appointmentLead.agentId || undefined,
        },
      };
      await calcomAPI.reserveSlot(payload);
      setAppointmentLead(null);
      setToast({ message: "Appointment created successfully.", variant: "success" });
    } catch (error) {
      setAppointmentError(error.message || "Failed to create appointment.");
    } finally {
      setAppointmentSaving(false);
    }
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setToast(null);
    }, 3000);
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

      {isLoading && leads.length === 0 ? (
        <LeadsSkeleton />
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-600">
          {error.message || "Failed to load leads."}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No leads available yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto md:overflow-x-visible">
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
                  <td className="px-4 py-3 whitespace-nowrap md:whitespace-normal">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </div>
                    <div className="text-xs text-gray-500">{lead.company}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap md:whitespace-normal text-sm text-gray-700">
                    <div>{lead.email}</div>
                    <div className="text-xs text-gray-500">
                      {formatLeadPhone(lead.phone)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate md:whitespace-normal md:max-w-[220px] md:truncate-0">
                    {lead.address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate md:whitespace-normal md:max-w-[200px] md:truncate-0">
                    {lead.reason}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap md:whitespace-normal text-sm text-gray-700">
                    {lead.visitTime}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap md:whitespace-normal text-sm text-gray-700">
                    {lead.agentName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap md:whitespace-normal text-sm text-gray-500">
                    {lead.createdAt}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openAppointmentModal(lead)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        Create Appointment
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingId === lead.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === lead.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {appointmentLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create Appointment
                </h2>
                <p className="text-sm text-gray-600">
                  Schedule {appointmentLead.name} using Cal.com.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAppointmentModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {appointmentError && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {appointmentError}
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Type ID
                </label>
                <input
                  type="text"
                  value={appointmentForm.eventTypeId}
                  onChange={(event) =>
                    handleAppointmentChange("eventTypeId", event.target.value)
                  }
                  placeholder="123456"
                  readOnly={Boolean(calConfig.eventTypeId)}
                  disabled={Boolean(calConfig.eventTypeId)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
                {calConfig.eventTypeId && (
                  <p className="mt-2 text-xs text-gray-500">
                    Managed from Profile → Integrations.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <input
                  type="text"
                  value={appointmentForm.timezone}
                  onChange={(event) =>
                    handleAppointmentChange("timezone", event.target.value)
                  }
                  placeholder="America/Los_Angeles"
                  required
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start time
                </label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(appointmentForm.start)}
                  min={toLocalInputValue(new Date().toISOString())}
                  onChange={(event) =>
                    handleAppointmentChange(
                      "start",
                      toIsoFromLocal(event.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {appointmentForm.start
                    ? formatReadableStart(appointmentForm.start)
                    : "Select a future time for this appointment."}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attendee Name
                </label>
                <input
                  type="text"
                  value={appointmentForm.attendeeName}
                  onChange={(event) =>
                    handleAppointmentChange("attendeeName", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attendee Email
                </label>
                <input
                  type="email"
                  value={appointmentForm.attendeeEmail}
                  onChange={(event) =>
                    handleAppointmentChange("attendeeEmail", event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAppointmentModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                disabled={appointmentSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAppointment}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                disabled={appointmentSaving}
              >
                {appointmentSaving ? "Creating..." : "Create Appointment"}
              </button>
            </div>
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

function toLocalInputValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

function toIsoFromLocal(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString();
}

function formatReadableStart(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default Leads;

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
