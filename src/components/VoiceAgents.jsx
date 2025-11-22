import { mockAgents } from "../mockData";

function VoiceAgents() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Voice Agents</h2>
        <p className="text-gray-600 mt-2">
          Manage and monitor your AI voice agents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {agent.name}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  agent.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {agent.status}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4">{agent.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Type:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    agent.type === "inbound"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {agent.type.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600 text-sm">Total Calls:</span>
                <span className="text-gray-800 font-semibold">
                  {agent.totalCalls.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-gray-600 text-sm font-medium mb-2">
            Total Agents
          </h4>
          <p className="text-3xl font-bold text-gray-800">
            {mockAgents.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-gray-600 text-sm font-medium mb-2">
            Active Agents
          </h4>
          <p className="text-3xl font-bold text-green-600">
            {mockAgents.filter((a) => a.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-gray-600 text-sm font-medium mb-2">
            Total Calls
          </h4>
          <p className="text-3xl font-bold text-blue-600">
            {mockAgents
              .reduce((sum, a) => sum + a.totalCalls, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VoiceAgents;
