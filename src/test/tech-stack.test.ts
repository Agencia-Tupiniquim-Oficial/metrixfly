import { describe, expect, it, vi } from "vitest";
import {
  buildTechStackInsights,
  fetchTechStack,
  normalizeStackflyResponse,
  summarizeTechStackForPrompt,
  type TechStackItem,
} from "../../supabase/functions/_shared/tech-stack.ts";
import { groupTechStack, hasTechStack } from "@/features/diagnostics/model/tech-stack";

// Resposta real de GET /api/v1/stack?url=agenciatupiniquim.com.br (2026-11-04), sem `grouped`.
const agencyResponse = {
  url: "https://agenciatupiniquim.com.br",
  finalUrl: "https://www.agenciatupiniquim.com.br/",
  analyzedAt: "2026-11-04T17:20:30.099Z",
  count: 7,
  technologies: [
    { name: "Google Tag Manager", categories: ["Tag managers"], confidence: 100, version: null, website: "http://www.google.com/tagmanager", implied: false },
    { name: "Nginx", categories: ["Web servers", "Reverse proxies"], confidence: 100, version: null, website: "http://nginx.org/en", implied: false },
    { name: "SiteGround", categories: ["PaaS", "Hosting"], confidence: 100, version: null, website: "https://www.siteground.com", implied: false },
    { name: "WordPress", categories: ["CMS", "Blogs"], confidence: 100, version: null, website: "https://wordpress.org", implied: false },
    { name: "WP Rocket", categories: ["Caching", "WordPress plugins"], confidence: 100, version: "3.23.3.3", website: "http://wp-rocket.me", implied: false },
    { name: "PHP", categories: ["Programming languages"], confidence: 100, version: null, website: "http://php.net", implied: true },
    { name: "MySQL", categories: ["Databases"], confidence: 100, version: null, website: "http://mysql.com", implied: true },
  ],
  grouped: {},
  cached: true,
};

const item = (
  name: string,
  categories: string[],
  version: string | null = null,
  implied = false,
): TechStackItem => ({ name, categories, version, implied });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("normalizeStackflyResponse", () => {
  it("keeps name, categories, version and implied from the real response", () => {
    const stack = normalizeStackflyResponse(agencyResponse);

    expect(stack).not.toBeNull();
    expect(stack?.source).toBe("stackfly");
    expect(stack?.analyzedAt).toBe("2026-11-04T17:20:30.099Z");
    expect(stack?.technologies).toHaveLength(7);
    expect(stack?.technologies[4]).toEqual(
      item("WP Rocket", ["Caching", "WordPress plugins"], "3.23.3.3"),
    );
    expect(stack?.technologies[3].version).toBeNull();
    expect(stack?.technologies[5].implied).toBe(true);
  });

  it("rejects unexpected shapes and drops invalid or duplicated items", () => {
    expect(normalizeStackflyResponse(null)).toBeNull();
    expect(normalizeStackflyResponse({ error: "x", code: "TIMEOUT" })).toBeNull();

    const stack = normalizeStackflyResponse({
      technologies: [
        { name: "  WordPress  ", categories: ["CMS", 3], version: "" },
        { name: "wordpress", categories: ["CMS"] },
        { categories: ["CMS"] },
        "texto",
      ],
    });
    expect(stack?.technologies).toEqual([item("WordPress", ["CMS"])]);
  });

  it("caps the number of technologies saved in the report", () => {
    const stack = normalizeStackflyResponse({
      technologies: Array.from({ length: 100 }, (_, i) => ({ name: `Tech ${i}`, categories: [] })),
    });
    expect(stack?.technologies).toHaveLength(60);
  });
});

describe("buildTechStackInsights", () => {
  const titles = (technologies: TechStackItem[], mobilePerformance?: number | null) =>
    buildTechStackInsights(technologies, { mobilePerformance }).map((insight) => insight.title);

  it("returns nothing when no technology was detected", () => {
    expect(buildTechStackInsights([])).toEqual([]);
  });

  it("flags WordPress without a cache plugin, and not when one exists", () => {
    const wordpress = item("WordPress", ["CMS"]);
    const cdn = item("Cloudflare", ["CDN"]);
    expect(titles([wordpress, cdn])).toEqual(["Cache de páginas não identificado"]);
    expect(titles([wordpress, cdn, item("WP Rocket", ["Caching", "WordPress plugins"])])).toEqual([]);
  });

  it("flags a missing CDN", () => {
    expect(titles([item("Nginx", ["Web servers"])])).toEqual([
      "Rede de distribuição de conteúdo (CDN) não identificada",
    ]);
  });

  it("points to the page builder only when mobile performance is low", () => {
    const stack = [item("Cloudflare", ["CDN"]), item("Elementor", ["Page builders", "WordPress plugins"])];
    expect(titles(stack, 35)).toContain("Construtor visual pode estar pesando no celular");
    expect(titles(stack, 80)).not.toContain("Construtor visual pode estar pesando no celular");
    expect(titles(stack, null)).not.toContain("Construtor visual pode estar pesando no celular");
  });

  it("lists publicly exposed CMS and plugin versions, ignoring libraries and implied items", () => {
    const insights = buildTechStackInsights([
      item("Cloudflare", ["CDN"]),
      item("Elementor", ["Page builders", "WordPress plugins"], "3.25.4"),
      item("WooCommerce", ["Ecommerce", "WordPress plugins"], "9.1"),
      item("jQuery", ["JavaScript libraries"], "3.7.1"),
      item("PHP", ["Programming languages"], "8.2", true),
    ]);
    const exposed = insights.find((insight) => insight.title === "Versões de componentes expostas publicamente");
    expect(exposed?.description).toContain("Elementor 3.25.4 e WooCommerce 9.1");
    expect(exposed?.description).not.toContain("jQuery");
    expect(exposed?.description).not.toContain("PHP");
  });

  it("produces the expected insights for the agency site", () => {
    const stack = normalizeStackflyResponse(agencyResponse);
    expect(titles(stack!.technologies, 60)).toEqual([
      "Rede de distribuição de conteúdo (CDN) não identificada",
      "Versões de componentes expostas publicamente",
    ]);
  });
});

describe("summarizeTechStackForPrompt", () => {
  it("lists name, version and categories", () => {
    expect(
      summarizeTechStackForPrompt({
        technologies: [item("WP Rocket", ["Caching", "WordPress plugins"], "3.23.3.3"), item("Sem categoria", [])],
      }),
    ).toEqual(["WP Rocket 3.23.3.3 (Caching, WordPress plugins)", "Sem categoria"]);
    expect(summarizeTechStackForPrompt(null)).toEqual([]);
  });
});

describe("fetchTechStack", () => {
  it("calls the endpoint with the encoded site URL and returns the normalized stack", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(agencyResponse));

    const result = await fetchTechStack("https://agenciatupiniquim.com.br/?a=1", {
      fetch: fetchMock,
      endpoint: "https://stack.test/api/v1/stack",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://stack.test/api/v1/stack?url=https%3A%2F%2Fagenciatupiniquim.com.br%2F%3Fa%3D1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.stack.technologies).toHaveLength(7);
  });

  it.each([
    [429, { error: "Muitas requisições", code: "RATE_LIMITED" }, "Stackfly respondeu 429 (RATE_LIMITED)"],
    [504, { error: "Demorou", code: "TIMEOUT" }, "Stackfly respondeu 504 (TIMEOUT)"],
    [502, "não é json", "Stackfly respondeu 502"],
  ])("returns an error without throwing on HTTP %s", async (status, body, error) => {
    const fetchMock = vi.fn().mockResolvedValue(
      typeof body === "string" ? new Response(body, { status }) : jsonResponse(body, status),
    );
    await expect(fetchTechStack("site.test", { fetch: fetchMock })).resolves.toEqual({ ok: false, error });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error for an unexpected 200 body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    await expect(fetchTechStack("site.test", { fetch: fetchMock })).resolves.toEqual({
      ok: false,
      error: "Stackfly retornou um formato inesperado",
    });
  });

  it("aborts after the timeout and on network errors without throwing", async () => {
    const hanging = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    await expect(fetchTechStack("site.test", { fetch: hanging, timeoutMs: 10 })).resolves.toEqual({
      ok: false,
      error: "Stackfly não respondeu em 0 s",
    });

    const failing = vi.fn().mockRejectedValue(new TypeError("network down"));
    await expect(fetchTechStack("site.test", { fetch: failing })).resolves.toEqual({
      ok: false,
      error: "Falha ao consultar o Stackfly: network down",
    });
  });
});

describe("groupTechStack", () => {
  it("groups each technology once, in report order, with versions", () => {
    const stack = normalizeStackflyResponse(agencyResponse)!;
    const groups = groupTechStack({ ...stack, insights: [] });

    expect(groups).toEqual([
      { label: "Plataforma", items: ["WordPress"] },
      { label: "Cache e entrega de conteúdo", items: ["WP Rocket 3.23.3.3"] },
      { label: "Servidor e hospedagem", items: ["Nginx", "SiteGround"] },
      { label: "Linguagens e banco de dados", items: ["PHP", "MySQL"] },
      { label: "Análise e marketing", items: ["Google Tag Manager"] },
    ]);
  });

  it("puts unknown categories under 'Outras tecnologias' and handles missing data", () => {
    expect(
      groupTechStack({ source: "stackfly", analyzedAt: null, insights: [], technologies: [item("Algo", ["Categoria nova"])] }),
    ).toEqual([{ label: "Outras tecnologias", items: ["Algo"] }]);
    expect(groupTechStack(null)).toEqual([]);
    expect(hasTechStack(null)).toBe(false);
    expect(hasTechStack({ source: "stackfly", analyzedAt: null, insights: [], technologies: [] })).toBe(false);
  });
});
