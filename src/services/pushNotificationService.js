import OneSignal from "react-onesignal";

let initialized = false;
let initError = null;

export const initOneSignal = async () => {
  if (initialized) return;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId) {
    initError = "OneSignal App ID not configured";
    console.warn(initError);
    return;
  }

  try {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
    initialized = true;
    initError = null;
  } catch (error) {
    initError = error?.message || "OneSignal init failed";
    console.error("OneSignal init failed:", error);
  }
};

export const getInitError = () => initError;

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
  if (!initialized) {
    await initOneSignal();
  }
  if (!initialized) {
    const reason = initError || "OneSignal failed to initialize";
    console.warn("OneSignal not initialized —", reason);
    return { ok: false, error: reason };
  }
  try {
    await OneSignal.Notifications.requestPermission();
    return { ok: OneSignal.Notifications.permission === true, error: null };
  } catch (error) {
    console.error("OneSignal permission request failed:", error);
    return { ok: false, error: error?.message || "Permission request failed" };
  }
};
