import { useEffect, useMemo, useState } from "react";
import {
  CountrySelectorDropdown,
  FlagImage,
  defaultCountries,
  parseCountry,
} from "react-international-phone";
import "react-international-phone/style.css";
import { integrationAPI, utilityAPI } from "../services/api";
import { DEFAULT_CAL_CONFIG, normalizeCalConfig } from "../utils/calConfig";

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
  const [planUsage, setPlanUsage] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState("");
  const [calConfig, setCalConfig] = useState(DEFAULT_CAL_CONFIG);
  const [calSaving, setCalSaving] = useState(false);
  const [calError, setCalError] = useState("");
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS_CONFIG);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [smsCountryIso2, setSmsCountryIso2] = useState("us");
  const [smsCountryOpen, setSmsCountryOpen] = useState(false);

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
    const loadIntegration = async () => {
      setCalError("");
      try {
        const response = await integrationAPI.get("calcom");
        if (!isMounted) {
          return;
        }
        const integration = response?.data || null;
        setCalConfig(normalizeCalConfig(integration?.config));
      } catch (error) {
        if (isMounted) {
          setCalError(error.message || "Failed to load Cal.com settings.");
          setCalConfig(DEFAULT_CAL_CONFIG);
        }
      }
    };
    loadIntegration();
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

  const handleToggleAutoCreate = async () => {
    const nextValue = !calConfig.autoCreateAppointments;
    setCalConfig((prev) => ({ ...prev, autoCreateAppointments: nextValue }));
    setCalSaving(true);
    setCalError("");
    try {
      await integrationAPI.update("calcom", {
        config: { autoCreateAppointments: nextValue },
      });
    } catch (error) {
      setCalConfig((prev) => ({
        ...prev,
        autoCreateAppointments: !nextValue,
      }));
      setCalError(error.message || "Failed to update Cal.com settings.");
    } finally {
      setCalSaving(false);
    }
  };

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
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Control your preferences and notifications.</p>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Plan & Usage</h2>
            <p className="text-sm text-gray-500">
              {planUsage?.plan?.name
                ? `${planUsage.plan.name} plan`
                : "No active plan found"}
            </p>
          </div>
          {planUsage?.plan && (
            <div className="text-sm text-gray-600">
              {planUsage.plan.monthly_minutes_limit} minutes/month
            </div>
          )}
        </div>
        {planLoading ? (
          <div className="mt-4 text-sm text-gray-500">Loading usage...</div>
        ) : planError ? (
          <div className="mt-4 text-sm text-red-600">{planError}</div>
        ) : planUsage?.plan ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Used</span>
              <span className="font-semibold text-gray-900">
                {formatMinutes(planUsage.usage?.used_minutes)} min
              </span>
            </div>
                <div className="h-2 bg-gray-200 rounded-full">
              <div
                    className="h-2 transition-all rounded-full bg-emerald-500"
                style={{ width: `${planUsage.usage?.usage_percent || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Remaining</span>
              <span className="font-semibold text-gray-900">
                {formatMinutes(planUsage.usage?.remaining_minutes)} min
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Billing period: {formatDate(planUsage.usage?.period_start)} -{" "}
              {formatDate(planUsage.usage?.period_end)}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500">
            Assign a subscription to start tracking usage.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 space-y-4 bg-white rounded-lg shadow">
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

        <div className="p-6 space-y-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
          <p className="text-sm text-gray-600">
            Update your plan or payment method from your billing portal.
          </p>
          <button className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg">
            Open billing portal
          </button>
        </div>

        <div className="p-6 space-y-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Automate appointment creation
              </p>
              <p className="text-xs text-gray-500">
                Automatically create Cal.com bookings when leads are qualified.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoCreate}
              disabled={calSaving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                calConfig.autoCreateAppointments ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  calConfig.autoCreateAppointments ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {calError && <p className="text-xs text-red-600">{calError}</p>}
        </div>

        <div className="p-6 space-y-4 bg-white rounded-lg shadow">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Default country code
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSmsCountryOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={smsCountryOpen}
                className="flex items-center w-full gap-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <FlagImage iso2={smsCountryIso2} size="20px" />
                <span className="text-sm text-gray-700">
                  {selectedSmsCountry?.name || "Select country"}
                </span>
                <span className="ml-auto text-sm font-medium text-gray-900">
                  {selectedSmsCountry?.dialCode
                    ? `+${selectedSmsCountry.dialCode}`
                    : smsConfig.defaultCountryCode}
                </span>
                <span className="text-gray-400">▾</span>
              </button>
              <CountrySelectorDropdown
                show={smsCountryOpen}
                selectedCountry={smsCountryIso2}
                onSelect={handleSelectSmsCountry}
                onClose={() => setSmsCountryOpen(false)}
                className="absolute z-50 w-full mt-2"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Used when a phone number doesn't include a country code.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSmsSave}
              disabled={smsSaving}
              className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg disabled:opacity-60"
            >
              {smsSaving ? "Saving..." : "Save Country Code"}
            </button>
            {smsError && <p className="text-xs text-red-600">{smsError}</p>}
          </div>
        </div>
      </div>
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
