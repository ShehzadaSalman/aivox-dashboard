import { useState, useMemo } from "react";
import { mockCallHistory, mockAgents } from "../mockData";
import { formatUSD } from "../services/currency";

function CallHistory() {
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [playingAudio, setPlayingAudio] = useState(null);

  // Filter calls based on selected agent
  const filteredCalls = useMemo(() => {
    if (selectedAgent === "all") {
      return mockCallHistory;
    }
    return mockCallHistory.filter((call) => call.agentName === selectedAgent);
  }, [selectedAgent]);

  const totalCostCents = filteredCalls.reduce((sum, call) => sum + call.cost, 0);

  // Get unique agent names for filter
  const agentNames = useMemo(() => {
    const names = [...new Set(mockCallHistory.map((call) => call.agentName))];
    return names.sort();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Call History</h2>
          <p className="mt-2 text-gray-600">
            View all voice agent calls and associated costs
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-3">
          <label
            htmlFor="agent-filter"
            className="text-sm font-medium text-gray-700"
          >
            Filter by Agent:
          </label>
          <select
            id="agent-filter"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-4 py-2 transition bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Agents</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Total Calls
          </h4>
          <p className="text-3xl font-bold text-gray-800">
            {filteredCalls.length}
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h4 className="mb-2 text-sm font-medium text-gray-600">Total Cost</h4>
          <p className="text-3xl font-bold text-blue-600">
            {formatUSD(totalCostCents)}
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Average Cost
          </h4>
          <p className="text-3xl font-bold text-purple-600">
            {formatUSD(
              filteredCalls.length > 0 ? totalCostCents / filteredCalls.length : 0
            )}
          </p>
        </div>
      </div>

      {/* Call History Table */}
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Agent Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Cost
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCalls.map((call) => (
                <tr key={call.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {call.agentName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        call.agentType === "inbound"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {call.agentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {call.phoneNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {call.duration}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {call.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {JSON.stringify(call.status)}
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        call.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatUSD(call.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {call.recordingUrl ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setPlayingAudio(
                              playingAudio === call.id ? null : call.id
                            )
                          }
                          className="px-3 py-1 text-xs font-medium text-white transition bg-blue-500 rounded-lg hover:bg-blue-600"
                        >
                          {playingAudio === call.id ? "⏸ Pause" : "▶ Play"}
                        </button>
                        {playingAudio === call.id && (
                          <audio
                            src={call.recordingUrl}
                            controls
                            autoPlay
                            className="h-8"
                            onEnded={() => setPlayingAudio(null)}
                            onPause={() => setPlayingAudio(null)}
                          />
                        )}
                      </div>
                    ) : (
                        <span className="text-xs italic text-gray-400">
                        No recording
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CallHistory;
