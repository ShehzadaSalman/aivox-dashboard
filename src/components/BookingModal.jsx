import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { calcomAPI } from "../services/api";

const DEFAULT_TIMEZONE =
  (typeof Intl !== "undefined" &&
    Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  "UTC";

// Groups flat Cal.com slots into { dayKey, dayLabel, slots: [...] } buckets,
// keyed by the local calendar day so the user picks a day, then a time.
function groupSlotsByDay(slots, timeZone) {
  const buckets = new Map();
  slots.forEach((slot) => {
    const date = new Date(slot.start);
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const dayKey = date.toLocaleDateString("en-CA", { timeZone });
    if (!buckets.has(dayKey)) {
      buckets.set(dayKey, {
        dayKey,
        dayLabel: date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone,
        }),
        slots: [],
      });
    }
    buckets.get(dayKey).slots.push(slot);
  });
  return Array.from(buckets.values()).sort((a, b) =>
    a.dayKey.localeCompare(b.dayKey)
  );
}

function formatSlotTime(start, timeZone) {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

function formatConfirmation(start, timeZone) {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

function BookingModal({ lead, calConfig, onClose, onBooked }) {
  const timeZone = calConfig?.timeZone || DEFAULT_TIMEZONE;
  const eventTypeId = calConfig?.eventTypeId || "";
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [attendeeName, setAttendeeName] = useState(lead?.name || "");
  const [attendeeEmail, setAttendeeEmail] = useState(lead?.email || "");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    data: slots = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["available-slots", eventTypeId, timeZone],
    enabled: Boolean(eventTypeId),
    queryFn: async () => {
      const response = await calcomAPI.getAvailableSlots({
        eventTypeId,
        timezone: timeZone,
      });
      return response?.slots || [];
    },
    staleTime: 60 * 1000,
  });

  const days = useMemo(
    () => groupSlotsByDay(slots, timeZone),
    [slots, timeZone]
  );

  const activeDayKey = selectedDayKey || days[0]?.dayKey || null;
  const activeDay = days.find((day) => day.dayKey === activeDayKey) || null;

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setSubmitError("Please pick a time slot.");
      return;
    }
    if (!attendeeName.trim() || !attendeeEmail.trim()) {
      setSubmitError("Attendee name and email are required.");
      return;
    }
    setSubmitError("");
    setSaving(true);
    try {
      await calcomAPI.reserveSlot({
        eventTypeId,
        start: selectedSlot.start,
        attendee: {
          name: attendeeName.trim(),
          email: attendeeEmail.trim(),
          timeZone,
        },
        metadata: {
          leadId: lead.id,
          phone: lead.phone || undefined,
          address: lead.address || undefined,
          reason: lead.reason || undefined,
          company: lead.company || undefined,
          agentId: lead.agentId || undefined,
        },
      });
      onBooked({
        leadId: lead.id,
        when: formatConfirmation(selectedSlot.start, timeZone),
      });
    } catch (err) {
      setSubmitError(err.message || "Failed to create appointment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-navy-900">
              Book appointment
            </h2>
            <p className="text-sm text-ink-600">
              Pick an open time for {lead.name}. We'll send them a confirmation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-ink-500 hover:text-ink-700 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!eventTypeId ? (
          <div className="mt-6 rounded-lg border border-navy-100 bg-navy-50 px-4 py-6 text-center text-sm text-ink-600">
            Scheduling isn't connected yet. Ask your admin to connect Cal.com in{" "}
            <span className="font-semibold text-navy-900">
              Profile → Integrations
            </span>{" "}
            to start booking appointments.
          </div>
        ) : (
          <>
            {submitError && (
              <div className="mt-4 rounded-lg bg-accent-600/10 border border-accent-600/20 px-4 py-2 text-sm text-accent-700">
                {submitError}
              </div>
            )}

            {isLoading ? (
              <div className="mt-6 space-y-3 animate-pulse">
                <div className="h-9 w-full rounded bg-navy-100" />
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 rounded bg-navy-100" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-lg bg-accent-600/10 border border-accent-600/20 px-4 py-4 text-sm text-accent-700">
                {error.message || "Couldn't load available times."}
              </div>
            ) : days.length === 0 ? (
              <div className="mt-6 rounded-lg border border-navy-100 bg-navy-50 px-4 py-6 text-center text-sm text-ink-600">
                No open times in the next two weeks.
              </div>
            ) : (
              <>
                {/* Day selector */}
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    Day
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => {
                      const isActive = day.dayKey === activeDayKey;
                      return (
                        <button
                          key={day.dayKey}
                          type="button"
                          onClick={() => {
                            setSelectedDayKey(day.dayKey);
                            setSelectedSlot(null);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            isActive
                              ? "border-accent-600 bg-accent-600 text-white"
                              : "border-navy-200 text-ink-700 hover:bg-navy-50"
                          }`}
                        >
                          {day.dayLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    Time ({timeZone})
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {activeDay?.slots.map((slot) => {
                      const isSelected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                            isSelected
                              ? "border-accent-600 bg-accent-600 text-white"
                              : "border-navy-200 text-ink-700 hover:bg-navy-50"
                          }`}
                        >
                          {formatSlotTime(slot.start, timeZone)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Attendee */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-ink-700">
                      Attendee name
                    </label>
                    <input
                      type="text"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700">
                      Attendee email
                    </label>
                    <input
                      type="email"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-500">
                    {selectedSlot
                      ? `Selected: ${formatConfirmation(
                          selectedSlot.start,
                          timeZone
                        )}`
                      : "Select a time to continue."}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-navy-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={saving || !selectedSlot}
                      className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
                    >
                      {saving ? "Booking..." : "Confirm booking"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BookingModal;
