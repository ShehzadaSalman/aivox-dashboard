// Pass through static files to the network before OneSignal handles anything
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/manifest.json' || url.pathname.endsWith('.webmanifest')) {
    event.respondWith(fetch(event.request));
    return;
  }
});

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
