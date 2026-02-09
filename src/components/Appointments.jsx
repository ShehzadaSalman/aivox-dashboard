import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { calcomAPI } from "../services/api";

function Appointments() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    eventTypeId: "",
    afterStart: toLocalInputValue(new Date().toISOString()),
    beforeStart: "",
    sortStart: "",
  });
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState(null);

  const {
    data: bookingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "bookings",
      filters.eventTypeId,
      filters.afterStart,
      filters.beforeStart,
      filters.sortStart,
    ],
    queryFn: async () => {
      const params = { take: 100 };
      const nowIso = new Date().toISOString();
      params.afterStart = nowIso;
      if (filters.eventTypeId.trim()) params.eventTypeId = filters.eventTypeId.trim();
      if (filters.sortStart) params.sortStart = filters.sortStart;
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

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
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

  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
  };

  const handleDelete = async (booking) => {
    const reservationId = booking.uid;
    if (!reservationId) {
      setDeleteError("Missing booking uid from Cal.com.");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this appointment?"
    );
    if (!confirmDelete) {
      return;
    }
    setDeletingId(reservationId);
    setDeleteError("");
    try {
      await calcomAPI.cancelBooking(reservationId);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (error) {
      setDeleteError(error.message || "Failed to remove appointment.");
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
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Book and manage appointments directly from Cal.com. Showing accepted appointments only.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">
              Event Type ID
            </label>
            <input
              type="text"
              value={filters.eventTypeId}
              onChange={(event) =>
                handleFilterChange("eventTypeId", event.target.value)
              }
              placeholder="3139331"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">
              After start
            </label>
            <input
              type="datetime-local"
              value={filters.afterStart}
              onChange={(event) =>
                handleFilterChange("afterStart", event.target.value)
              }
              disabled
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">
              Before start
            </label>
            <input
              type="datetime-local"
              value={filters.beforeStart}
              onChange={(event) =>
                handleFilterChange("beforeStart", event.target.value)
              }
              disabled
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">
              Sort by start
            </label>
            <select
              value={filters.sortStart}
              onChange={(event) =>
                handleFilterChange("sortStart", event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            >
              <option value="">None</option>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Loading bookings...
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-600">
          {error.message || "Failed to load bookings."}
        </div>
      ) : bookingsData?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No bookings found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {deleteError && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
              {deleteError}
            </div>
          )}
          <div className="max-h-[520px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title / Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsData.map((booking) => (
                  <tr key={booking.id || booking.uid || booking.bookingId}>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[180px] truncate">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.attendees?.[0]?.name || "--"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.attendees?.[0]?.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatReadableDateTime(booking.start)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate md:whitespace-normal md:max-w-[220px] md:truncate-0">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.title || "--"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.description || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {typeof booking.duration === "number"
                        ? `${booking.duration} min`
                        : booking.duration || "--"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[160px] truncate">
                      {booking.location ? (
                        <button
                          type="button"
                          title="Click to copy"
                          onClick={() => {
                            if (
                              typeof navigator !== "undefined" &&
                              navigator.clipboard
                            ) {
                              navigator.clipboard
                                .writeText(booking.location)
                                .then(() =>
                                  showToast("Location link copied.")
                                )
                                .catch(() =>
                                  showToast(
                                    "Failed to copy location link.",
                                    "error"
                                  )
                                );
                              return;
                            }
                            showToast(
                              "Clipboard unavailable in this browser.",
                              "error"
                            );
                          }}
                          className="text-left text-gray-700 hover:text-gray-900 cursor-pointer"
                        >
                          {booking.location}
                        </button>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {(() => {
                        const reservationId = booking.uid;
                        const isDisabled = !reservationId || deletingId === reservationId;
                        return (
                      <button
                        type="button"
                        onClick={() => handleDelete(booking)}
                        disabled={isDisabled}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === reservationId
                          ? "Removing..."
                          : "Remove"}
                      </button>
                        );
                      })()}
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

export default Appointments;

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
