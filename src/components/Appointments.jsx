import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { calcomAPI } from "../services/api";

function Appointments() {
  const [filters, setFilters] = useState({
    eventTypeId: "",
    afterStart: "",
    beforeStart: "",
    sortStart: "",
  });

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
      if (filters.eventTypeId.trim()) params.eventTypeId = filters.eventTypeId.trim();
      if (filters.afterStart) params.afterStart = toIsoFromLocal(filters.afterStart);
      if (filters.beforeStart) params.beforeStart = toIsoFromLocal(filters.beforeStart);
      if (filters.sortStart) params.sortStart = filters.sortStart;
      const response = await calcomAPI.listBookings(params);
      const data = response || {};
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : data?.bookings || data?.data?.data || data?.data?.bookings || [];
      return list;
    },
    keepPreviousData: true,
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Book and manage appointments directly from Cal.com
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
          <div className="max-h-[520px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Event Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsData.map((booking) => (
                  <tr key={booking.id || booking.uid || booking.bookingId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.attendees?.[0]?.name || "--"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.attendees?.[0]?.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {booking.start
                        ? new Date(booking.start).toLocaleString()
                        : "--"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {booking.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {booking.eventTypeId || booking.eventType?.id || "--"}
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
