import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { calcomAPI, integrationAPI } from "../services/api";
import { normalizeCalConfig } from "../utils/calConfig";

function Appointments() {
  const queryClient = useQueryClient();
  const [sortStart, setSortStart] = useState("asc");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState(null);

  const { data: calConfig } = useQuery({
    queryKey: ["integrations", "calcom"],
    queryFn: async () => {
      const response = await integrationAPI.get("calcom");
      return normalizeCalConfig(response?.data?.config);
    },
    staleTime: 60 * 1000,
  });

  const eventTypeId = calConfig?.eventTypeId || "";

  const {
    data: bookingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookings", eventTypeId, sortStart],
    queryFn: async () => {
      const params = { take: 100, afterStart: new Date().toISOString() };
      if (eventTypeId) params.eventTypeId = eventTypeId;
      if (sortStart) params.sortStart = sortStart;
      const response = await calcomAPI.listBookings(params);
      const data = response || {};
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : data?.bookings || data?.data?.data || data?.data?.bookings || [];
      return list.filter(
        (booking) => (booking.status || "").toLowerCase() === "accepted"
      );
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = (message, variant = "success") =>
    setToast({ message, variant });

  const copyLocation = (location) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(location)
        .then(() => showToast("Location link copied."))
        .catch(() => showToast("Failed to copy location link.", "error"));
      return;
    }
    showToast("Clipboard unavailable in this browser.", "error");
  };

  const handleDelete = async (booking) => {
    const reservationId = booking.uid;
    if (!reservationId) {
      setDeleteError("Missing booking reference from Cal.com.");
      return;
    }
    if (!window.confirm("Cancel this appointment? The attendee will be notified.")) {
      return;
    }
    setDeletingId(reservationId);
    setDeleteError("");
    try {
      await calcomAPI.cancelBooking(reservationId);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      showToast("Appointment cancelled.");
    } catch (err) {
      setDeleteError(err.message || "Failed to cancel appointment.");
    } finally {
      setDeletingId(null);
    }
  };

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
          <h1 className="text-3xl font-semibold text-navy-900">Appointments</h1>
          <p className="text-ink-600 mt-1">
            Upcoming appointments booked from your leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-ink-700">Sort</label>
          <select
            value={sortStart}
            onChange={(event) => setSortStart(event.target.value)}
            className="rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
          >
            <option value="asc">Soonest first</option>
            <option value="desc">Latest first</option>
          </select>
        </div>
      </div>

      {!eventTypeId && !isLoading ? (
        <div className="card-surface rounded-lg p-8 text-center text-ink-600">
          Scheduling isn't connected yet. Connect Cal.com in{" "}
          <span className="font-semibold text-navy-900">Profile → Integrations</span>{" "}
          to see appointments here.
        </div>
      ) : isLoading ? (
        <div className="card-surface rounded-lg p-8 text-center text-ink-500">
          Loading appointments...
        </div>
      ) : error ? (
        <div className="card-surface rounded-lg p-8 text-center text-accent-700">
          {error.message || "Failed to load appointments."}
        </div>
      ) : bookingsData?.length === 0 ? (
        <div className="card-surface rounded-lg p-10 text-center">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-ink-700 font-medium">No upcoming appointments.</p>
          <p className="text-ink-500 text-sm mt-1">
            Book one from the Leads page and it'll appear here.
          </p>
        </div>
      ) : (
        <>
          {deleteError && (
            <div className="rounded-lg bg-accent-600/10 border border-accent-600/20 px-4 py-3 text-sm text-accent-700">
              {deleteError}
            </div>
          )}

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {bookingsData.map((booking) => {
              const reservationId = booking.uid;
              const isDisabled = !reservationId || deletingId === reservationId;
              return (
                <div
                  key={booking.id || booking.uid || booking.bookingId}
                  className="card-surface rounded-xl p-4 space-y-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 truncate">
                      {booking.attendees?.[0]?.name || "--"}
                    </p>
                    <p className="text-xs text-ink-500 truncate">
                      {booking.attendees?.[0]?.email || ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Detail label="Time" value={formatReadableDateTime(booking.start)} />
                    <Detail label="Duration" value={formatDuration(booking.duration)} />
                    <div className="col-span-2">
                      <p className="text-xs text-ink-400 uppercase tracking-wide">Title</p>
                      <p className="text-navy-900 font-medium">{booking.title || "--"}</p>
                      {booking.description && (
                        <p className="text-xs text-ink-500">{booking.description}</p>
                      )}
                    </div>
                    {booking.location && (
                      <div className="col-span-2">
                        <p className="text-xs text-ink-400 uppercase tracking-wide">Location</p>
                        <button
                          type="button"
                          onClick={() => copyLocation(booking.location)}
                          className="text-left text-accent-700 hover:text-accent-800 underline decoration-accent-600/30 truncate block w-full"
                        >
                          {booking.location} — copy link
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-navy-100">
                    <button
                      type="button"
                      onClick={() => handleDelete(booking)}
                      disabled={isDisabled}
                      className="rounded-lg border border-accent-600/30 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-600/10 disabled:opacity-50"
                    >
                      {deletingId === reservationId ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card-surface rounded-lg overflow-hidden">
            <div className="max-h-[560px] overflow-y-auto">
              <table className="min-w-full divide-y divide-navy-100">
                <thead className="bg-navy-50">
                  <tr>
                    <Th>Attendee</Th>
                    <Th>Time</Th>
                    <Th>Title / Description</Th>
                    <Th>Duration</Th>
                    <Th>Location</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-navy-100">
                  {bookingsData.map((booking) => {
                    const reservationId = booking.uid;
                    const isDisabled =
                      !reservationId || deletingId === reservationId;
                    return (
                      <tr key={booking.id || booking.uid || booking.bookingId}>
                        <td className="px-6 py-4 text-sm max-w-[180px] truncate">
                          <div className="font-medium text-navy-900">
                            {booking.attendees?.[0]?.name || "--"}
                          </div>
                          <div className="text-xs text-ink-500">
                            {booking.attendees?.[0]?.email || ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-700">
                          {formatReadableDateTime(booking.start)}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-700 max-w-[220px]">
                          <div className="font-medium text-navy-900">
                            {booking.title || "--"}
                          </div>
                          <div className="text-xs text-ink-500">
                            {booking.description || ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-700">
                          {formatDuration(booking.duration)}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-[160px] truncate">
                          {booking.location ? (
                            <button
                              type="button"
                              onClick={() => copyLocation(booking.location)}
                              className="text-left text-accent-700 hover:text-accent-800 underline decoration-accent-600/30"
                            >
                              Copy link
                            </button>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            type="button"
                            onClick={() => handleDelete(booking)}
                            disabled={isDisabled}
                            className="rounded-lg border border-accent-600/30 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-600/10 disabled:opacity-50"
                          >
                            {deletingId === reservationId ? "Cancelling..." : "Cancel"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase ${className}`}
    >
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

function formatDuration(duration) {
  if (typeof duration === "number") {
    return `${duration} min`;
  }
  return duration || "--";
}

function formatReadableDateTime(value) {
  if (!value) {
    return "--";
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

export default Appointments;
