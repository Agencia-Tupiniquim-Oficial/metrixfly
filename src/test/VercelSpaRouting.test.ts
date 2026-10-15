import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  rewrites?: { source: string; destination: string }[];
};

describe("Vercel SPA routing", () => {
  it("rewrites direct route requests to the app entry without changing the URL", () => {
    const config = JSON.parse(
      readFileSync("vercel.json", "utf8"),
    ) as VercelConfig;

    expect(config.rewrites).toContainEqual({
      source: "/calculadora-financeira",
      destination: "/index.html",
    });
  });
});
