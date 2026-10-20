import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  rewrites?: { source: string; destination: string }[];
};

describe("Vercel SPA routing", () => {
  it("rewrites direct shared-report requests to the app entry", () => {
    const config = JSON.parse(
      readFileSync("vercel.json", "utf8"),
    ) as VercelConfig;

    const rewrite = config.rewrites?.find(
      ({ source, destination }) =>
        source === "/((?!assets/).*)" && destination === "/index.html",
    );

    expect(rewrite).toBeDefined();
    expect(new RegExp(`^${rewrite?.source}$`).test(
      "/diagnostico/d158558e-15b8-43f8-96d7-b45b40ac3d80",
    )).toBe(true);
  });
});
