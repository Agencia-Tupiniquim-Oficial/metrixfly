const MAX_LOGO_BYTES = 1024 * 1024;
const MIN_LOGO_DIMENSION = 32;
const MAX_LOGO_DIMENSION = 512;
const logoRequests = new Map<string, Promise<string | null>>();

function getPublicHostname(url: string): string | null {
  try {
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !hostname.includes(".") ||
      hostname === "localhost" ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
      hostname.includes(":")
    ) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

async function fetchClientLogo(hostname: string): Promise<string | null> {
  const lookupUrl = new URL(
    `https://icon.horse/icon/${encodeURIComponent(hostname)}`,
  );

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(lookupUrl, { signal: controller.signal });
    if (!response.ok) return null;

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_LOGO_BYTES) return null;

    const blob = await response.blob();
    if (
      blob.size === 0 ||
      blob.size > MAX_LOGO_BYTES ||
      !blob.type.startsWith("image/")
    ) {
      return null;
    }

    const bitmap = await createImageBitmap(blob);
    try {
      if (
        bitmap.width < MIN_LOGO_DIMENSION ||
        bitmap.height < MIN_LOGO_DIMENSION ||
        bitmap.width > MAX_LOGO_DIMENSION ||
        bitmap.height > MAX_LOGO_DIMENSION
      ) {
        return null;
      }

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) return null;

      context.drawImage(bitmap, 0, 0);
      return canvas.toDataURL("image/png");
    } finally {
      bitmap.close();
    }
  } catch (error) {
    console.warn("Não foi possível localizar a logo do site analisado.", error);
    return null;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export function getClientLogoDataUrl(url: string): Promise<string | null> {
  const hostname = getPublicHostname(url);
  if (!hostname) return Promise.resolve(null);

  let request = logoRequests.get(hostname);
  if (!request) {
    request = fetchClientLogo(hostname);
    logoRequests.set(hostname, request);
    void request.then((logo) => {
      if (!logo && logoRequests.get(hostname) === request) {
        logoRequests.delete(hostname);
      }
    });
  }

  return request;
}
