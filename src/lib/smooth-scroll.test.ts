import { describe, expect, it } from "vitest";
import { easeInOutCubic, scrollDuration } from "./smooth-scroll";

describe("easeInOutCubic", () => {
  it("starts at 0, ends at 1 and is symmetric around the middle", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });

  it("eases in and out instead of moving linearly", () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });
});

describe("scrollDuration", () => {
  it("grows with the distance and is capped", () => {
    expect(scrollDuration(0)).toBe(700);
    expect(scrollDuration(500)).toBeGreaterThan(700);
    expect(scrollDuration(-500)).toBe(scrollDuration(500));
    expect(scrollDuration(100000)).toBe(1400);
  });
});
