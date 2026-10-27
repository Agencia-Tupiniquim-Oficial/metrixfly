const APP_HEADER_ROUTES = ["/diagnostico", "/geo-aeo", "/calculadora-financeira"];

/** Pages whose header carries its own theme toggle, so the floating one is hidden. */
export function hasInlineThemeToggle(pathname: string): boolean {
  // /diagnostico/:reportId is the shared report, which has its own simple header.
  return APP_HEADER_ROUTES.includes(pathname) || pathname.startsWith("/diagnostico/");
}
