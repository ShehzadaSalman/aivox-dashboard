function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Control your preferences and notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Usage alerts</p>
              <p className="text-xs text-gray-500">Email me at 80% and 100% usage.</p>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm">
              Coming soon
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Weekly summary</p>
              <p className="text-xs text-gray-500">Receive weekly call summaries.</p>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm">
              Coming soon
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
          <p className="text-sm text-gray-600">
            Update your plan or payment method from your billing portal.
          </p>
          <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">
            Open billing portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
