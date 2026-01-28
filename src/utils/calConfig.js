export const DEFAULT_CAL_CONFIG = {
  namespace: "30min",
  calLink: "aivox-agency/30min",
  eventTypeId: "3139330",
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
