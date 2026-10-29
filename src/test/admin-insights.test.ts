import { describe, expect, it } from "vitest";
import type { AdminAnalysis, AdminLead } from "@/features/admin/services/admin-api";
import {
  dailySeries,
  filterByStatus,
  inRange,
  pageCount,
  presetRange,
  quoteStatus,
  sortAnalyses,
  summarize,
  toCsv,
} from "@/features/admin/services/admin-insights";

function analysis(overrides: Partial<AdminAnalysis>): AdminAnalysis {
  return {
    id: "id",
    domain: "site.com.br",
    createdAt: "2026-10-27T15:00:00",
    mobileScore: 80,
    desktopScore: 90,
    quoteOpened: 0,
    quoteSubmitted: 0,
    ...overrides,
  };
}

describe("admin date ranges", () => {
  const now = new Date("2026-10-29T12:00:00");

  it("builds the presets from today", () => {
    expect(presetRange("today", now)).toEqual({ from: "2026-10-29", to: "2026-10-29" });
    expect(presetRange("7d", now)).toEqual({ from: "2026-10-23", to: "2026-10-29" });
    expect(presetRange("30d", now)).toEqual({ from: "2026-09-30", to: "2026-10-29" });
    expect(presetRange("all", now)).toEqual({ from: "", to: "" });
  });

  it("includes both ends of the range and accepts open bounds", () => {
    const range = { from: "2026-10-27", to: "2026-10-28" };
    expect(inRange("2026-10-26T23:59:00", range)).toBe(false);
    expect(inRange("2026-10-27T00:00:00", range)).toBe(true);
    expect(inRange("2026-10-28T23:59:00", range)).toBe(true);
    expect(inRange("2026-10-29T00:00:00", range)).toBe(false);
    expect(inRange("2020-01-01T00:00:00", { from: "", to: "" })).toBe(true);
  });
});

describe("admin summary", () => {
  const leads = [
    { email: "a@x.com" },
    { email: "a@x.com" },
    { email: "b@x.com" },
  ] as AdminLead[];

  it("counts requests, conversion, the average score and unique e-mails", () => {
    const summary = summarize(
      [
        analysis({ mobileScore: 90, quoteSubmitted: 1 }),
        analysis({ mobileScore: 50 }),
        analysis({ mobileScore: null }),
        analysis({ mobileScore: 40, quoteOpened: 1 }),
      ],
      leads,
    );
    expect(summary).toMatchObject({ analyses: 4, requests: 1, conversion: 0.25, uniqueEmails: 2 });
    expect(summary.averageMobileScore).toBe(60);
  });

  it("has no conversion or average without analyses", () => {
    expect(summarize([], null)).toMatchObject({
      conversion: null,
      averageMobileScore: null,
      uniqueEmails: 0,
    });
  });
});

describe("admin lists", () => {
  it("classifies and filters by quote status", () => {
    const list = [
      analysis({ id: "a", quoteSubmitted: 2, quoteOpened: 2 }),
      analysis({ id: "b", quoteOpened: 1 }),
      analysis({ id: "c" }),
    ];
    expect(list.map(quoteStatus)).toEqual(["requested", "opened", "none"]);
    expect(filterByStatus(list, "opened").map((item) => item.id)).toEqual(["b"]);
    expect(filterByStatus(list, "all")).toHaveLength(3);
  });

  it("sorts by score with the missing ones last when ascending is not asked", () => {
    const list = [
      analysis({ id: "a", mobileScore: 50 }),
      analysis({ id: "b", mobileScore: null }),
      analysis({ id: "c", mobileScore: 90 }),
    ];
    expect(sortAnalyses(list, "score", "desc").map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(sortAnalyses(list, "score", "asc").map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("pages at least once", () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(21, 10)).toBe(3);
  });

  it("fills the days of the period, including the empty ones", () => {
    const series = dailySeries(
      [
        analysis({ createdAt: "2026-10-27T10:00:00", quoteSubmitted: 1 }),
        analysis({ createdAt: "2026-10-27T11:00:00" }),
        analysis({ createdAt: "2026-10-29T09:00:00" }),
      ],
      { from: "2026-10-27", to: "2026-10-29" },
    );
    expect(series).toEqual([
      { day: "2026-10-27", analyses: 2, requests: 1 },
      { day: "2026-10-28", analyses: 0, requests: 0 },
      { day: "2026-10-29", analyses: 1, requests: 0 },
    ]);
  });
});

describe("admin CSV", () => {
  it("quotes cells and neutralises spreadsheet formulas", () => {
    expect(toCsv([["a;b", 'diz "oi"', "=1+1", "ok"]])).toBe('"a;b";"diz ""oi""";\'=1+1;ok');
  });
});
