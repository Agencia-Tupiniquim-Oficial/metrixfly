import { describe, expect, it } from "vitest";
import {
  MAX_PARTNER_LOGOS,
  resolveReportLogos,
} from "@/features/diagnostics/model/report-branding";

const agencyLogo = "data:image/png;base64,AGENCY";
const clientLogo = "data:image/png;base64,CLIENT";
const partnerLogo = "data:image/png;base64,PARTNER";

describe("resolveReportLogos", () => {
  it("keeps the current layout by default: agency logo, then the analyzed site's logo", () => {
    expect(resolveReportLogos({ agencyLogo, clientLogo })).toEqual([
      { role: "agency", src: agencyLogo },
      { role: "client", src: clientLogo },
    ]);
  });

  it("shows only the agency logo when the analyzed site's logo is missing", () => {
    expect(resolveReportLogos({ agencyLogo, clientLogo: null })).toEqual([
      { role: "agency", src: agencyLogo },
    ]);
  });

  it("places partner logos between the agency and the analyzed site", () => {
    expect(
      resolveReportLogos({
        agencyLogo,
        clientLogo,
        branding: { partnerLogos: [partnerLogo] },
      }).map((logo) => logo.role),
    ).toEqual(["agency", "partner", "client"]);
  });

  it("ignores blank partner logos and limits how many fit in the header", () => {
    const logos = resolveReportLogos({
      agencyLogo,
      clientLogo: null,
      branding: {
        partnerLogos: ["", "   ", partnerLogo, `${partnerLogo}2`, `${partnerLogo}3`],
      },
    });

    expect(logos.filter((logo) => logo.role === "partner")).toHaveLength(
      MAX_PARTNER_LOGOS,
    );
    expect(logos.every((logo) => logo.src.trim() !== "")).toBe(true);
  });
});
