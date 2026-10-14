import { describe, expect, it } from "vitest";
import {
  analyzeRobotsTxt,
  robotsTxtUrlForDomain,
} from "@/features/geo-aeo/lib/robots";

const robots = (content: string) =>
  analyzeRobotsTxt({
    available: true,
    url: "https://example.com/robots.txt",
    content,
  });

describe("GEO/AEO robots visibility", () => {
  it("uses wildcard rules unless a matching agent group exists", () => {
    const result = robots(
      [
        "User-agent: *",
        "Disallow: /",
        "User-agent: Googlebot",
        "Allow: /",
      ].join("\n"),
    );

    expect(result.chatgpt.status).toBe("blocked");
    expect(result.gemini.status).toBe("partially-restricted");
    expect(result.gemini.agents[0].status).toBe("allowed");
    expect(result.gemini.agents[1].status).toBe("blocked");
    expect(result.perplexity.status).toBe("blocked");
  });

  it("keeps empty wildcard groups separate from later agent-specific groups", () => {
    const result = robots(
      ["User-agent: *", "", "User-agent: Googlebot", "Disallow: /"].join("\n"),
    );

    expect(result.gemini.agents[0].status).toBe("blocked");
    expect(result.gemini.agents[1].status).toBe("allowed");
    expect(result.perplexity.status).toBe("allowed");
  });

  it("treats an empty Disallow as a group directive", () => {
    const result = robots(
      [
        "User-agent: *",
        "Disallow:",
        "User-agent: Googlebot",
        "Disallow: /",
      ].join("\n"),
    );

    expect(result.gemini.agents[0].status).toBe("blocked");
    expect(result.gemini.agents[1].status).toBe("allowed");
    expect(result.perplexity.status).toBe("allowed");
  });

  it("combines repeated agent groups and reports partial restrictions", () => {
    const result = robots(
      [
        "User-agent: OAI-SearchBot",
        "Disallow: /private",
        "User-agent: OAI-SearchBot",
        "Allow: /",
        "User-agent: GPTBot",
        "Disallow: /",
        "Allow: /public",
      ].join("\n"),
    );

    expect(result.chatgpt.status).toBe("partially-restricted");
    expect(result.chatgpt.agents[0].status).toBe("partially-restricted");
    expect(result.chatgpt.agents[1].status).toBe("partially-restricted");
    expect(result.chatgpt.agents[1].explanation).toContain("Disallow: /");
    expect(result.chatgpt.agents[1].explanation).toContain("Allow: /public");
  });

  it("applies the more-specific Allow rule over a site-wide Disallow", () => {
    const result = robots(
      ["User-agent: OAI-SearchBot", "Disallow: /", "Allow: /*"].join("\n"),
    );

    expect(result.chatgpt.agents[0].status).toBe("allowed");
    expect(result.chatgpt.status).toBe("allowed");
  });

  it("parses Content-Signal separately from access rules", () => {
    const result = robots(
      [
        "User-agent: *",
        "Disallow: /",
        "Content-Signal: search=yes, ai-input=no, ai-train=no",
      ].join("\n"),
    );

    expect(result.perplexity.status).toBe("blocked");
    expect(result.contentSignals).toEqual({
      search: "yes",
      aiInput: "no",
      aiTrain: "no",
    });
  });

  it("interprets the live-site robots format with signals and specific agents", () => {
    const result = robots(
      [
        "# Content-Signal definitions are comments, not access rules",
        "User-agent: *",
        "Content-Signal: search=yes,ai-input=yes,ai-train=no",
        "Allow: /",
        "User-agent: ClaudeBot",
        "Allow: /",
        "User-agent: GPTBot",
        "Allow: /",
        "User-agent: Google-Extended",
        "Allow: /",
      ].join("\n"),
    );

    expect(result.status).toBe("allowed");
    expect(result.chatgpt.agents[0].status).toBe("allowed");
    expect(result.chatgpt.agents[1].status).toBe("allowed");
    expect(result.gemini.agents[0].status).toBe("allowed");
    expect(result.gemini.agents[1].status).toBe("allowed");
    expect(result.perplexity.agents[0].status).toBe("allowed");
    expect(result.contentSignals).toEqual({
      search: "yes",
      aiInput: "yes",
      aiTrain: "no",
    });
  });

  it("does not treat missing Content-Signal as a crawl restriction", () => {
    const result = robots("User-agent: *\nAllow: /");

    expect(result.status).toBe("allowed");
    expect(result.contentSignals).toEqual({
      search: "unspecified",
      aiInput: "unspecified",
      aiTrain: "unspecified",
    });
  });

  it("does not infer access or signals when robots.txt cannot be fetched", () => {
    const result = analyzeRobotsTxt({
      available: false,
      url: "https://example.com/robots.txt",
      content: null,
    });

    expect(result.chatgpt.status).toBe("unverifiable");
    expect(result.gemini.status).toBe("unverifiable");
    expect(result.perplexity.status).toBe("unverifiable");
    expect(result.contentSignals.search).toBe("unverifiable");
  });

  it("interprets returned content even if the collection flag is stale", () => {
    const result = analyzeRobotsTxt(
      {
        available: false,
        url: "",
        content: "User-agent: *\nDisallow: /",
      },
      "example.com",
    );

    expect(result.available).toBe(true);
    expect(result.status).toBe("blocked");
    expect(result.robotsUrl).toBe("https://example.com/robots.txt");
  });

  it("builds the robots URL from the analyzed domain when the response omits it", () => {
    const result = analyzeRobotsTxt(
      { available: true, url: "", content: "User-agent: *\nDisallow: /private" },
      "example.com",
    );

    expect(result.robotsUrl).toBe("https://example.com/robots.txt");
    expect(result.status).toBe("partially-restricted");
    expect(result.explanation).toContain("Disallow: /private");
  });

  it("preserves an explicitly analyzed HTTP origin when constructing the URL", () => {
    expect(robotsTxtUrlForDomain("http://example.com/path")).toBe(
      "http://example.com/robots.txt",
    );
  });

  it("does not treat an HTML fallback page as a valid robots.txt", () => {
    const result = robots(
      "<!doctype html><html><body>Not found</body></html>",
    );

    expect(result.chatgpt.status).toBe("unverifiable");
    expect(result.perplexity.status).toBe("unverifiable");
  });

  it("ignores Content-Signal text inside comments and reports conflicting declarations", () => {
    const result = robots(
      [
        "# Content-Signal: search=no",
        "Content-Signal: search=yes",
        "Content-Signal: search=no, ai-train=yes",
      ].join("\n"),
    );

    expect(result.contentSignals.search).toBe("conflicting");
    expect(result.contentSignals.aiInput).toBe("unspecified");
    expect(result.contentSignals.aiTrain).toBe("yes");
  });
});
