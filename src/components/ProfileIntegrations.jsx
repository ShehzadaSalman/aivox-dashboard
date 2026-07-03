import { useEffect, useState } from "react";
import { integrationAPI, calcomAPI } from "../services/api";
import { DEFAULT_CAL_CONFIG, normalizeCalConfig } from "../utils/calConfig";

function ProfileIntegrations() {
  const [calApiKey, setCalApiKey] = useState("");
  const [calConfig, setCalConfig] = useState(DEFAULT_CAL_CONFIG);
  const [calApiMeta, setCalApiMeta] = useState({ hasApiKey: false, apiKeyLast4: null });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { ok: boolean, msg: string }

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
    setSaving(true);
    setStatus(null);
    try {
      const payload = { config: calConfig };
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
      setStatus({ ok: true, msg: "Cal.com settings saved." });
    } catch (error) {
      setStatus({ ok: false, msg: error.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAutoCreate = async () => {
    const next = !calConfig.autoCreateAppointments;
    setCalConfig((prev) => ({ ...prev, autoCreateAppointments: next }));
    setStatus(null);
    try {
      await integrationAPI.update("calcom", {
        config: { autoCreateAppointments: next },
      });
      setStatus({
        ok: true,
        msg: next ? "Automatic booking turned on." : "Automatic booking turned off.",
      });
    } catch (error) {
      setCalConfig((prev) => ({ ...prev, autoCreateAppointments: !next }));
      setStatus({ ok: false, msg: error.message || "Failed to update." });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const res = await calcomAPI.testConnection();
      if (res?.status === "connected") {
        setStatus({ ok: true, msg: "Connected to Cal.com successfully." });
      } else {
        setStatus({
          ok: false,
          msg: res?.message || "Couldn't connect. Double-check your API key.",
        });
      }
    } catch (error) {
      setStatus({ ok: false, msg: error.message || "Connection test failed." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card-surface rounded-lg p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">Integrations</h2>
          <p className="text-sm text-ink-600">
            Connect Cal.com so your AI agent can book appointments.
          </p>
        </div>
        <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-ink-500">
          Beta
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-navy-100 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-navy-900">Cal.com</h3>
            <p className="text-sm text-ink-600">
              Powers appointment booking for your leads.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              calApiMeta.hasApiKey
                ? "bg-emerald-50 text-emerald-700"
                : "bg-navy-50 text-ink-500"
            }`}
          >
            {calApiMeta.hasApiKey ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-700">
            Cal.com API key
          </label>
          <input
            type="password"
            value={calApiKey}
            onChange={(event) => setCalApiKey(event.target.value)}
            placeholder={calApiMeta.hasApiKey ? "•••• Saved — paste a new key to replace" : "cal_live_..."}
            className="mt-2 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
          />
          <p className="mt-2 text-xs text-ink-500">
            Find this in Cal.com under Settings → Developer → API keys. Stored securely.
            {calApiMeta.hasApiKey && calApiMeta.apiKeyLast4 && (
              <> Saved key ends in {calApiMeta.apiKeyLast4}.</>
            )}
          </p>
        </div>

        {status && (
          <div
            className={`mt-4 rounded-lg px-4 py-2 text-sm ${
              status.ok
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-accent-600/10 text-accent-700 border border-accent-600/20"
            }`}
          >
            {status.msg}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveCal}
            disabled={saving}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !calApiMeta.hasApiKey}
            title={!calApiMeta.hasApiKey ? "Save your API key first" : undefined}
            className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-navy-50 disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-navy-100 p-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Automatic booking</p>
            <p className="text-xs text-ink-500">
              Book qualified leads into your calendar automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleAutoCreate}
            aria-pressed={calConfig.autoCreateAppointments}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
              calConfig.autoCreateAppointments ? "bg-accent-600" : "bg-navy-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                calConfig.autoCreateAppointments ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Advanced: Cal.com embed primitives most clients never touch */}
        <div className="mt-4 border-t border-navy-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700"
          >
            <span
              className={`inline-block transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            >
              ▸
            </span>
            Advanced settings
          </button>

          {showAdvanced && (
            <>
              <p className="mt-2 text-xs text-ink-400">
                These control the Cal.com booking embed. The defaults work for most
                setups — only change them if your agency asked you to.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AdvField label="Namespace" value={calConfig.namespace} onChange={(v) => handleCalConfigChange("namespace", v)} placeholder="30min" />
                <AdvField label="Cal.com link" value={calConfig.calLink} onChange={(v) => handleCalConfigChange("calLink", v)} placeholder="your-team/30min" />
                <AdvField label="Event type ID" value={calConfig.eventTypeId} onChange={(v) => handleCalConfigChange("eventTypeId", v)} placeholder="123456" />
                <AdvField label="Time zone" value={calConfig.timeZone} onChange={(v) => handleCalConfigChange("timeZone", v)} placeholder="America/New_York" />
                <AdvField label="Layout" value={calConfig.layout} onChange={(v) => handleCalConfigChange("layout", v)} placeholder="month_view" />
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                    <input
                      type="checkbox"
                      checked={calConfig.hideEventTypeDetails}
                      onChange={(event) => handleCalConfigChange("hideEventTypeDetails", event.target.checked)}
                      className="h-4 w-4 rounded border-navy-200 accent-accent-600"
                    />
                    Hide event details
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                    <input
                      type="checkbox"
                      checked={calConfig.useSlotsViewOnSmallScreen}
                      onChange={(event) => handleCalConfigChange("useSlotsViewOnSmallScreen", event.target.checked)}
                      className="h-4 w-4 rounded border-navy-200 accent-accent-600"
                    />
                    Slots view on mobile
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdvField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-navy-200 px-4 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
      />
    </div>
  );
}

export default ProfileIntegrations;
