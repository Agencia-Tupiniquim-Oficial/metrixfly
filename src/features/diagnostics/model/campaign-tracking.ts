export const CAMPAIGN_PARAMETERS = [
  "matchtype",
  "device",
  "adposition",
  "placement",
  "targetid",
  "feeditemid",
  "adgroupid",
  "target",
  "gclid",
  "devicemodel",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_source_platform",
] as const;

export type CampaignParameter = (typeof CAMPAIGN_PARAMETERS)[number];

export type CampaignTrackingParameters = Record<CampaignParameter, string>;

export type CampaignAttribution = {
  parameters: CampaignTrackingParameters;
  entryUrl: string;
};

export type CampaignTracking = CampaignAttribution & {
  formUrl: string;
  convertedAt: string;
};

type BrowserLocation = Pick<Location, "search" | "href">;

const STORAGE_KEY = "metrixfly:campaign-attribution";
let inMemoryAttribution: CampaignAttribution | null = null;

function emptyParameters(): CampaignTrackingParameters {
  return Object.fromEntries(
    CAMPAIGN_PARAMETERS.map((parameter) => [parameter, ""]),
  ) as CampaignTrackingParameters;
}

function isCampaignAttribution(value: unknown): value is CampaignAttribution {
  if (!value || typeof value !== "object") return false;
  const attribution = value as Partial<CampaignAttribution>;
  if (
    typeof attribution.entryUrl !== "string" ||
    !attribution.parameters ||
    typeof attribution.parameters !== "object"
  ) {
    return false;
  }
  return CAMPAIGN_PARAMETERS.every(
    (parameter) => typeof attribution.parameters?.[parameter] === "string",
  );
}

function readStoredAttribution(): CampaignAttribution | null {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      inMemoryAttribution = null;
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    if (isCampaignAttribution(parsed)) {
      inMemoryAttribution = parsed;
      return parsed;
    }
    console.warn("Saved campaign attribution has an invalid format.");
  } catch (error) {
    console.warn("Unable to read saved campaign attribution.", error);
  }
  return inMemoryAttribution;
}

function saveAttribution(attribution: CampaignAttribution): void {
  inMemoryAttribution = attribution;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch (error) {
    console.warn("Unable to save campaign attribution.", error);
  }
}

export function captureCampaignTracking(
  location: BrowserLocation,
): CampaignAttribution {
  const query = new URLSearchParams(location.search);
  const parameters = emptyParameters();
  let hasCampaignValue = false;

  for (const parameter of CAMPAIGN_PARAMETERS) {
    const value = query.get(parameter)?.trim() ?? "";
    parameters[parameter] = value;
    if (value) hasCampaignValue = true;
  }

  const previous = readStoredAttribution();
  const hasNewCampaign =
    hasCampaignValue &&
    (!previous ||
      CAMPAIGN_PARAMETERS.some(
        (parameter) =>
          parameters[parameter] !== previous.parameters[parameter],
      ));
  const attribution = hasNewCampaign
    ? { parameters, entryUrl: location.href }
    : previous ?? { parameters, entryUrl: location.href };

  saveAttribution(attribution);
  return attribution;
}

export function clearCampaignTracking(): void {
  inMemoryAttribution = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to clear saved campaign attribution.", error);
  }
}

export function buildCampaignTrackingForSubmission(
  location: BrowserLocation,
  convertedAt = new Date(),
): CampaignTracking {
  return {
    ...captureCampaignTracking(location),
    formUrl: location.href,
    convertedAt: convertedAt.toISOString(),
  };
}
