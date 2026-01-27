import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { integrationAPI } from "../services/api";
import { DEFAULT_CAL_CONFIG, normalizeCalConfig } from "../utils/calConfig";

function CalendarEmbed({ config }) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: config.namespace });
      cal("ui", {
        hideEventTypeDetails: config.hideEventTypeDetails,
        layout: config.layout,
      });
    })();
  }, [config.hideEventTypeDetails, config.layout, config.namespace]);

  return (
    <div className="h-[680px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Cal
        namespace={config.namespace}
        calLink={config.calLink}
        style={{ width: "100%", height: "100%", overflow: "scroll" }}
        config={{
          layout: config.layout,
          useSlotsViewOnSmallScreen: config.useSlotsViewOnSmallScreen ? "true" : "false",
        }}
      />
    </div>
  );
}

function Appointments() {
  const [calConfig, setCalConfig] = useState(DEFAULT_CAL_CONFIG);

  useEffect(() => {
    let isMounted = true;
    const loadIntegration = async () => {
      try {
        const response = await integrationAPI.get("calcom");
        if (!isMounted) {
          return;
        }
        const integration = response?.data || null;
        setCalConfig(normalizeCalConfig(integration?.config));
      } catch {
        if (isMounted) {
          setCalConfig(DEFAULT_CAL_CONFIG);
        }
      }
    };
    loadIntegration();

    const handleConfigUpdate = () => loadIntegration();
    window.addEventListener("cal:config-updated", handleConfigUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("cal:config-updated", handleConfigUpdate);
    };
  }, []);

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

      <CalendarEmbed config={calConfig} />
    </div>
  );
}

export default Appointments;
