import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCampaignTrackingForSubmission,
  CAMPAIGN_PARAMETERS,
  captureCampaignTracking,
  clearCampaignTracking,
} from "@/features/diagnostics/model/campaign-tracking";

const testParameters = {
  matchtype: "matchtypeValue",
  device: "deviceValue",
  adposition: "adpositionValue",
  placement: "placementValue",
  targetid: "targetidValue",
  feeditemid: "feeditemidValue",
  adgroupid: "adgroupidValue",
  target: "targetValue",
  gclid: "gclidValue",
  utm_term: "utm_termValue",
  utm_content: "utm_contentValue",
  utm_id: "utm_idValue",
  utm_source_platform: "utm_source_platformValue",
  utm_source: "utm_sourceValue",
  utm_campaign: "utm_campaignValue",
  utm_medium: "utm_mediumValue",
  devicemodel: "devicemodelValue",
};

describe("campaign tracking", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("captures every supported parameter from the campaign URL", () => {
    const query = new URLSearchParams(testParameters).toString();
    const attribution = captureCampaignTracking({
      search: `?${query}`,
      href: `https://metrixfly.com/?${query}`,
    });

    expect(attribution.parameters).toEqual(testParameters);
    expect(attribution.entryUrl).toBe(`https://metrixfly.com/?${query}`);
    expect(CAMPAIGN_PARAMETERS).toHaveLength(17);
  });

  it("preserves attribution without query parameters and replaces it for a new campaign", () => {
    const initial = captureCampaignTracking({
      search: "?utm_source=google&gclid=click-1",
      href: "https://metrixfly.com/?utm_source=google&gclid=click-1",
    });
    const onNextPage = captureCampaignTracking({
      search: "",
      href: "https://metrixfly.com/diagnostico",
    });
    const withEmptyParameters = captureCampaignTracking({
      search: "?utm_source=&gclid=",
      href: "https://metrixfly.com/diagnostico?utm_source=&gclid=",
    });
    const withCampaignQuery = captureCampaignTracking({
      search: "?utm_source=google&gclid=click-1",
      href: "https://metrixfly.com/diagnostico?utm_source=google&gclid=click-1",
    });
    const nextCampaign = captureCampaignTracking({
      search: "?utm_source=bing",
      href: "https://metrixfly.com/?utm_source=bing",
    });

    expect(onNextPage).toEqual(initial);
    expect(withEmptyParameters).toEqual(initial);
    expect(withCampaignQuery).toEqual(initial);
    expect(nextCampaign.parameters.utm_source).toBe("bing");
    expect(nextCampaign.parameters.gclid).toBe("");
    expect(nextCampaign.entryUrl).toBe("https://metrixfly.com/?utm_source=bing");
  });

  it("creates usable submission metadata when campaign parameters are absent", () => {
    const submission = buildCampaignTrackingForSubmission(
      {
        search: "",
        href: "https://metrixfly.com/diagnostico",
      },
      new Date("2026-10-20T19:00:00.000Z"),
    );

    expect(submission.parameters).toEqual(
      Object.fromEntries(CAMPAIGN_PARAMETERS.map((name) => [name, ""])),
    );
    expect(submission.entryUrl).toBe("https://metrixfly.com/diagnostico");
    expect(submission.formUrl).toBe("https://metrixfly.com/diagnostico");
    expect(submission.convertedAt).toBe("2026-10-20T19:00:00.000Z");
  });

  it("does not reuse a successful conversion's campaign for a later one", () => {
    captureCampaignTracking({
      search: "?utm_source=google&gclid=click-1",
      href: "https://metrixfly.com/?utm_source=google&gclid=click-1",
    });
    clearCampaignTracking();

    const laterConversion = buildCampaignTrackingForSubmission({
      search: "",
      href: "https://metrixfly.com/diagnostico",
    });

    expect(laterConversion.parameters.utm_source).toBe("");
    expect(laterConversion.parameters.gclid).toBe("");
    expect(laterConversion.entryUrl).toBe("https://metrixfly.com/diagnostico");
  });
});
