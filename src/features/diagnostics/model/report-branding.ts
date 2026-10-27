export type ReportLogoRole = "agency" | "partner" | "client";

export type ReportLogo = { role: ReportLogoRole; src: string };

/**
 * Extension point for white-label reports. The default (no partner logos)
 * keeps the agency logo followed by the analyzed site's logo.
 */
export type ReportBranding = {
  /** Image sources (data URLs) shown between the agency and the analyzed site. */
  partnerLogos?: readonly string[];
};

/** More logos than this do not fit beside the header caption on an A4 page. */
export const MAX_PARTNER_LOGOS = 1;

export function resolveReportLogos({
  agencyLogo,
  clientLogo,
  branding,
}: {
  agencyLogo: string;
  clientLogo?: string | null;
  branding?: ReportBranding;
}): ReportLogo[] {
  const partnerLogos = (branding?.partnerLogos ?? [])
    .filter((src) => src.trim() !== "")
    .slice(0, MAX_PARTNER_LOGOS);

  return [
    { role: "agency", src: agencyLogo },
    ...partnerLogos.map((src): ReportLogo => ({ role: "partner", src })),
    ...(clientLogo ? [{ role: "client", src: clientLogo } as const] : []),
  ];
}
