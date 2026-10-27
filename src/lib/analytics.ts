export type DataLayerEvent = { event: string } & Record<string, unknown>;

type AnalyticsWindow = Window & { dataLayer?: Record<string, unknown>[] };

const GTM_CONTAINER_ID = /^GTM-[A-Z0-9]+$/;

function getDataLayer(): Record<string, unknown>[] {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  return analyticsWindow.dataLayer;
}

/**
 * Pushes an event to the GTM dataLayer. Safe when GTM is not installed: the
 * event is only queued and nothing is sent anywhere. Analytics must never
 * break the user flow, so failures are logged and swallowed.
 */
export function pushDataLayerEvent(event: DataLayerEvent): void {
  try {
    getDataLayer().push(event);
  } catch (error) {
    console.warn("Unable to push analytics event.", error);
  }
}

/**
 * Injects the Google Tag Manager container when a valid id is configured
 * (public identifier, e.g. VITE_GTM_ID). Without an id nothing is loaded.
 */
export function loadGoogleTagManager(containerId: string | undefined): boolean {
  if (!containerId || !GTM_CONTAINER_ID.test(containerId)) return false;

  const src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  const alreadyLoaded = Array.from(document.scripts).some(
    (script) => script.getAttribute("src") === src,
  );
  if (alreadyLoaded) return true;

  getDataLayer().push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
  return true;
}
