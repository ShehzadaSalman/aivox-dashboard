import OneSignal from "react-onesignal";

let initialized = false;

export const initOneSignal = async () => {
  if (initialized) return;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId) {
    console.warn("OneSignal App ID not configured");
    return;
  }

  try {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
    initialized = true;
  } catch (error) {
    console.error("OneSignal init failed:", error);
  }
};

export const loginOneSignalUser = async (userId) => {
  if (!initialized || !userId) return;
  try {
    await OneSignal.login(userId);
  } catch (error) {
    console.error("OneSignal login failed:", error);
  }
};

export const logoutOneSignalUser = async () => {
  if (!initialized) return;
  try {
    await OneSignal.logout();
  } catch (error) {
    console.error("OneSignal logout failed:", error);
  }
};

export const requestNotificationPermission = async () => {
  if (!initialized) return false;
  try {
    await OneSignal.Notifications.requestPermission();
    return OneSignal.Notifications.permission;
  } catch (error) {
    console.error("OneSignal permission request failed:", error);
    return false;
  }
};
