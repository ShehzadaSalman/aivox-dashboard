import { useEffect, useState } from "react";
import { utilityAPI } from "../services/api";

function Settings() {
  const [planUsage, setPlanUsage] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Control your preferences and notifications.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
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
