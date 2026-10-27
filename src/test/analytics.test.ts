import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadGoogleTagManager,
  pushDataLayerEvent,
} from "@/lib/analytics";

type TestWindow = Window & { dataLayer?: Record<string, unknown>[] };
const testWindow = window as TestWindow;

beforeEach(() => {
  delete testWindow.dataLayer;
  document.head.innerHTML = "";
});

afterEach(() => {
  delete testWindow.dataLayer;
});

describe("pushDataLayerEvent", () => {
  it("creates the dataLayer when GTM is not installed and records the event", () => {
    pushDataLayerEvent({ event: "generate_lead", lead_source: "test" });

    expect(testWindow.dataLayer).toEqual([
      { event: "generate_lead", lead_source: "test" },
    ]);
  });

  it("appends to an existing dataLayer without replacing it", () => {
    const existing = [{ event: "gtm.js" }];
    testWindow.dataLayer = existing;

    pushDataLayerEvent({ event: "generate_lead" });

    expect(testWindow.dataLayer).toBe(existing);
    expect(existing).toHaveLength(2);
  });
});

describe("loadGoogleTagManager", () => {
  it("does nothing when no container id is configured", () => {
    expect(loadGoogleTagManager(undefined)).toBe(false);
    expect(loadGoogleTagManager("")).toBe(false);
    expect(document.querySelector("script[src*='googletagmanager']")).toBeNull();
    expect(testWindow.dataLayer).toBeUndefined();
  });

  it("rejects values that are not GTM container ids", () => {
    expect(loadGoogleTagManager("GTM-1\"><script>")).toBe(false);
    expect(loadGoogleTagManager("UA-12345-1")).toBe(false);
    expect(document.querySelector("script[src*='googletagmanager']")).toBeNull();
  });

  it("injects the container script once and starts the dataLayer", () => {
    expect(loadGoogleTagManager("GTM-ABC123")).toBe(true);
    expect(loadGoogleTagManager("GTM-ABC123")).toBe(true);

    const scripts = document.querySelectorAll("script[src*='googletagmanager']");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].getAttribute("src")).toBe(
      "https://www.googletagmanager.com/gtm.js?id=GTM-ABC123",
    );
    expect(testWindow.dataLayer?.[0]).toMatchObject({ event: "gtm.js" });
  });
});
