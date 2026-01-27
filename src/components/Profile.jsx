import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { integrationAPI } from "../services/api";
import { DEFAULT_CAL_CONFIG, normalizeCalConfig } from "../utils/calConfig";

function Profile() {
  const { user } = useAuth();
  const [calApiKey, setCalApiKey] = useState("");
  const [calConfig, setCalConfig] = useState(DEFAULT_CAL_CONFIG);
  const [calApiMeta, setCalApiMeta] = useState({ hasApiKey: false, apiKeyLast4: null });

  useEffect(() => {
    let isMounted = true;
    const loadIntegration = async () => {
      try {
        const response = await integrationAPI.get("calcom");
        if (!isMounted) {
          return;
        }
        const integration = response?.data || null;
        if (integration) {
          setCalConfig(normalizeCalConfig(integration.config));
          setCalApiMeta({
            hasApiKey: integration.hasApiKey,
            apiKeyLast4: integration.apiKeyLast4 || null,
          });
        } else {
          setCalConfig(DEFAULT_CAL_CONFIG);
          setCalApiMeta({ hasApiKey: false, apiKeyLast4: null });
        }
      } catch {
        if (isMounted) {
          setCalConfig(DEFAULT_CAL_CONFIG);
        }
      }
    };
    loadIntegration();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCalConfigChange = (field, value) => {
    setCalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCal = async () => {
    try {
      const payload = {
        config: calConfig,
      };
      if (calApiKey.trim()) {
        payload.apiKey = calApiKey.trim();
      }
      const response = await integrationAPI.update("calcom", payload);
      const integration = response?.data || null;
      if (integration) {
        setCalApiMeta({
          hasApiKey: integration.hasApiKey,
          apiKeyLast4: integration.apiKeyLast4 || null,
        });
      }
      setCalApiKey("");
      window.dispatchEvent(new CustomEvent("cal:config-updated"));
    } catch {
      // Keep local edits; backend errors are surfaced via console for now.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account details.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Name" value={user?.name || "Not set"} />
          <ProfileField label="Email" value={user?.email || "Not set"} />
          <ProfileField label="Phone" value={user?.phone || "Not set"} />
          <ProfileField
            label="Phone Verified"
            value={user?.phone_verified_at ? "Yes" : "No"}
          />
          <ProfileField label="Role" value={user?.role || "Unknown"} />
          <ProfileField label="Status" value={user?.status || "Unknown"} />
          <ProfileField
            label="Member Since"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Integrations & APIs</h2>
            <p className="text-sm text-gray-600">
              Connect external services to power scheduling and automation.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            Beta
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Cal.com</h3>
                <p className="text-sm text-gray-600">
                  Use Cal.com to manage appointment booking for your AI agents.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Available
              </span>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Cal.com API Key
              </label>
              <input
                type="password"
                value={calApiKey}
                onChange={(event) => setCalApiKey(event.target.value)}
                placeholder="sk_live_..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
              <p className="mt-2 text-xs text-gray-500">
                This key is stored securely and used to sync calendars and events.
              </p>
              {calApiMeta.hasApiKey && (
                <p className="mt-1 text-xs text-gray-500">
                  Saved key ending in {calApiMeta.apiKeyLast4}
                </p>
              )}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Namespace
                  </label>
                  <input
                    type="text"
                    value={calConfig.namespace}
                    onChange={(event) =>
                      handleCalConfigChange("namespace", event.target.value)
                    }
                    placeholder="30min"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cal.com Link
                  </label>
                  <input
                    type="text"
                    value={calConfig.calLink}
                    onChange={(event) =>
                      handleCalConfigChange("calLink", event.target.value)
                    }
                    placeholder="aivox-agency/30min"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Event Type ID
                  </label>
                  <input
                    type="text"
                    value={calConfig.eventTypeId}
                    onChange={(event) =>
                      handleCalConfigChange("eventTypeId", event.target.value)
                    }
                    placeholder="123456"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    value={calConfig.timeZone}
                    onChange={(event) =>
                      handleCalConfigChange("timeZone", event.target.value)
                    }
                    placeholder="America/New_York"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Layout
                  </label>
                  <input
                    type="text"
                    value={calConfig.layout}
                    onChange={(event) =>
                      handleCalConfigChange("layout", event.target.value)
                    }
                    placeholder="month_view"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={calConfig.hideEventTypeDetails}
                      onChange={(event) =>
                        handleCalConfigChange(
                          "hideEventTypeDetails",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    Hide event details
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={calConfig.useSlotsViewOnSmallScreen}
                      onChange={(event) =>
                        handleCalConfigChange(
                          "useSlotsViewOnSmallScreen",
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    Slots view on mobile
                  </label>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveCal}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save API Key
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default Profile;
