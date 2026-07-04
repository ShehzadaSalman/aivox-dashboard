import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  CountrySelectorDropdown,
  FlagImage,
  defaultCountries,
  parseCountry,
} from "react-international-phone";
import "react-international-phone/style.css";
import { integrationAPI, utilityAPI } from "../services/api";
import { requestNotificationPermission } from "../services/pushNotificationService";
import { useAuth } from "../contexts/AuthContext";

const IntegrationSection = lazy(() => import("./ProfileIntegrations"));

const DEFAULT_SMS_CONFIG = {
  defaultCountryCode: "+1",
};

const normalizeDialCode = (value) => String(value || "").replace(/[^\d]/g, "");

const findCountryByDialCode = (dialCode) => {
  const normalized = normalizeDialCode(dialCode);
  if (!normalized) {
    return null;
  }
  for (const country of defaultCountries) {
    const parsed = parseCountry(country);
    if (parsed.dialCode === normalized) {
      return parsed;
    }
  }
  return null;
};

const findCountryByIso2 = (iso2) => {
  if (!iso2) return null;
  for (const country of defaultCountries) {
    const parsed = parseCountry(country);
    if (parsed.iso2 === iso2) {
      return parsed;
    }
  }
  return null;
};

function Settings() {
  const { isSuperAdmin } = useAuth();
  const [planUsage, setPlanUsage] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState("");
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS_CONFIG);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [smsCountryIso2, setSmsCountryIso2] = useState("us");
  const [smsCountryOpen, setSmsCountryOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message, variant = "success") => setToast({ message, variant });

  useEffect(() => {
    let isMounted = true;
    const loadPlanUsage = async () => {
      setPlanLoading(true);
      setPlanError("");
      try {
        const response = await utilityAPI.getPlanUsage();
        if (isMounted) {
          setPlanUsage(response?.data || null);
        }
      } catch (error) {
        if (isMounted) {
          setPlanError(error.message || "Failed to load plan usage.");
        }
      } finally {
        if (isMounted) {
          setPlanLoading(false);
        }
      }
    };
    loadPlanUsage();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadSmsIntegration = async () => {
      setSmsError("");
      try {
        const response = await integrationAPI.get("sms");
        if (!isMounted) {
          return;
        }
        const integration = response?.data || null;
        const nextConfig = {
          ...DEFAULT_SMS_CONFIG,
          ...(integration?.config || {}),
        };
        setSmsConfig(nextConfig);
        const matchedCountry =
          findCountryByDialCode(nextConfig.defaultCountryCode) ||
          findCountryByIso2("us");
        setSmsCountryIso2(matchedCountry?.iso2 || "us");
      } catch (error) {
        if (isMounted) {
          setSmsError(error.message || "Failed to load SMS settings.");
          setSmsConfig(DEFAULT_SMS_CONFIG);
          setSmsCountryIso2("us");
        }
      }
    };
    loadSmsIntegration();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSmsSave = async () => {
    const nextCode = smsConfig.defaultCountryCode.trim();
    if (!/^\+\d{1,4}$/.test(nextCode)) {
      setSmsError("Enter a valid country code like +1 or +44.");
      return;
    }
    setSmsSaving(true);
    setSmsError("");
    try {
      await integrationAPI.update("sms", {
        config: { defaultCountryCode: nextCode },
      });
      showToast("Default country code saved.");
    } catch (error) {
      setSmsError(error.message || "Failed to update SMS settings.");
    } finally {
      setSmsSaving(false);
    }
  };

  const selectedSmsCountry = useMemo(
    () => findCountryByIso2(smsCountryIso2),
    [smsCountryIso2]
  );

  const handleSelectSmsCountry = (country) => {
    setSmsCountryIso2(country.iso2);
    setSmsConfig((prev) => ({
      ...prev,
      defaultCountryCode: `+${country.dialCode}`,
    }));
    setSmsCountryOpen(false);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${
              toast.variant === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div>
        <h1 className="mb-2 text-3xl font-semibold text-navy-900">Settings</h1>
        <p className="text-ink-600">Control your preferences, notifications, and integrations.</p>
      </div>

      {/* Plan & Usage */}
      <div className="card-surface rounded-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-navy-900">Plan &amp; Usage</h2>
            <p className="text-sm text-ink-500">
              {planUsage?.plan?.name
                ? `${planUsage.plan.name} plan`
                : "No active plan found"}
            </p>
          </div>
          {planUsage?.plan && (
            <div className="text-sm text-ink-600">
              {planUsage.plan.monthly_minutes_limit} minutes/month
            </div>
          )}
        </div>
        {planLoading ? (
          <div className="mt-4 text-sm text-ink-500">Loading usage…</div>
        ) : planError ? (
          <div className="mt-4 text-sm text-accent-700">{planError}</div>
        ) : planUsage?.plan ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Used</span>
              <span className="font-semibold text-navy-900">
                {formatMinutes(planUsage.usage?.used_minutes)} min
              </span>
            </div>
            <div className="h-2 bg-navy-50 rounded-full overflow-hidden">
              <div
                className="h-2 transition-all rounded-full bg-emerald-500"
                style={{ width: `${planUsage.usage?.usage_percent || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Remaining</span>
              <span className="font-semibold text-navy-900">
                {formatMinutes(planUsage.usage?.remaining_minutes)} min
              </span>
            </div>
            <div className="text-xs text-ink-500">
              Billing period: {formatDate(planUsage.usage?.period_start)} –{" "}
              {formatDate(planUsage.usage?.period_end)}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-ink-500">
            Assign a subscription to start tracking usage.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <div className="card-surface rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-navy-900">Notifications</h2>
          <PushNotificationToggle />
          <div className="flex items-center justify-between opacity-70">
            <div>
              <p className="text-sm font-medium text-navy-900">Usage alerts</p>
              <p className="text-xs text-ink-500">Email me at 80% and 100% usage.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-navy-50 text-ink-500 text-xs font-medium">
              Coming soon
            </span>
          </div>
          <div className="flex items-center justify-between opacity-70">
            <div>
              <p className="text-sm font-medium text-navy-900">Weekly summary</p>
              <p className="text-xs text-ink-500">Receive weekly call summaries.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-navy-50 text-ink-500 text-xs font-medium">
              Coming soon
            </span>
          </div>
        </div>

        {/* Billing */}
        <div className="card-surface rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-navy-900">Billing</h2>
          <p className="text-sm text-ink-600">
            Your plan is managed by your account manager. To upgrade, change, or ask
            about your plan, get in touch and we'll sort it out.
          </p>
          <a
            href="mailto:support@candibly.online?subject=Plan%20change%20request"
            className="inline-flex btn-primary"
          >
            Contact us about billing
          </a>
        </div>

        {/* SMS */}
        <div className="card-surface rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Text messages (SMS)</h2>
            <p className="text-sm text-ink-500">
              How we format phone numbers when texting your leads.
            </p>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-ink-700">
              Default country code
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSmsCountryOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={smsCountryOpen}
                className="flex items-center w-full gap-3 px-4 py-2 border border-navy-200 rounded-lg focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
              >
                <FlagImage iso2={smsCountryIso2} size="20px" />
                <span className="text-sm text-ink-700">
                  {selectedSmsCountry?.name || "Select country"}
                </span>
                <span className="ml-auto text-sm font-medium text-navy-900">
                  {selectedSmsCountry?.dialCode
                    ? `+${selectedSmsCountry.dialCode}`
                    : smsConfig.defaultCountryCode}
                </span>
              </button>
              <CountrySelectorDropdown
                show={smsCountryOpen}
                selectedCountry={smsCountryIso2}
                onSelect={handleSelectSmsCountry}
                onClose={() => setSmsCountryOpen(false)}
                className="absolute z-50 w-full mt-2"
              />
            </div>
            <p className="mt-2 text-xs text-ink-500">
              Used when a phone number doesn't include a country code.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSmsSave}
              disabled={smsSaving}
              className="btn-primary disabled:opacity-60"
            >
              {smsSaving ? "Saving…" : "Save country code"}
            </button>
            {smsError && <p className="text-xs text-accent-700">{smsError}</p>}
          </div>
        </div>
      </div>

      {/* Integrations (end clients) */}
      {!isSuperAdmin() && (
        <Suspense fallback={null}>
          <IntegrationSection />
        </Suspense>
      )}
    </div>
  );
}

function PushNotificationToggle() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");

  const handleEnable = async () => {
    setRequesting(true);
    setError("");
    const result = await requestNotificationPermission();
    const current = typeof Notification !== "undefined" ? Notification.permission : "default";
    setPermission(current);
    if (!result.ok && current !== "granted") {
      setError(result.error || "Could not enable notifications.");
    }
    setRequesting(false);
  };

  if (permission === "granted") {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy-900">Push notifications</p>
          <p className="text-xs text-ink-500">Receive alerts for new leads and appointments.</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
          Enabled
        </span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy-900">Push notifications</p>
          <p className="text-xs text-accent-700">
            Blocked by browser. On iPhone: Settings → Safari → {window.location.hostname} → Notifications → Allow.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-accent-600/10 text-accent-700 text-sm font-medium">
          Blocked
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy-900">Push notifications</p>
          <p className="text-xs text-ink-500">Receive alerts for new leads and appointments.</p>
        </div>
        <button
          type="button"
          onClick={handleEnable}
          disabled={requesting}
          className="px-3 py-1.5 rounded-full bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 disabled:opacity-60"
        >
          {requesting ? "Requesting…" : "Enable"}
        </button>
      </div>
      {error && <p className="text-xs text-accent-700">{error}</p>}
    </div>
  );
}

function formatMinutes(value) {
  if (value === null || value === undefined) {
    return "0";
  }
  return Number(value).toFixed(1).replace(/\.0$/, "");
}

function formatDate(value) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleDateString();
}

export default Settings;
