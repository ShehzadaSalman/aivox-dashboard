export const DEFAULT_CAL_CONFIG = {
  namespace: "30min",
  calLink: "",
  eventTypeId: "",
  timeZone: "",
  autoCreateAppointments: false,
  layout: "month_view",
  hideEventTypeDetails: false,
  useSlotsViewOnSmallScreen: true,
};

export const normalizeCalConfig = (config = {}) => ({
  ...DEFAULT_CAL_CONFIG,
  ...(config || {}),
});
