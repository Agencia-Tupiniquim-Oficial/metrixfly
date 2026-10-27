import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GeoAeoDashboard from "@/features/geo-aeo/pages/GeoAeoDashboard";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import {
  rememberGeoCrawl,
  resetGeoCrawlCacheForTests,
  startGeoCrawl,
} from "@/lib/geo-crawl-cache";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
    },
    functions: { invoke: mocks.invoke },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const crawl = {
  domain: "exemplo.com.br",
  crawledAt: "2026-10-27T15:55:00.000Z",
  scores: { geo: 32, aeo: 22, technical: 64, authority: 20 },
  stats: { pages: 1, indexedPages: 0, schemaPages: 0, answerPages: 0, words: 2 },
  pages: [{ url: "https://exemplo.com.br/", title: "Início", score: 44, issues: ["a", "b"] }],
  findings: [
    {
      severity: "warning",
      title: "Dados estruturados incompletos",
      description: "1 página não possui JSON-LD detectável.",
      recommendation: "Adicione Organization e WebSite.",
    },
  ],
  entities: [{ name: "Exemplo", coverage: 100, pages: 1 }],
};

const overallRing = { name: "Score geral de prontidão: 35 de 100" };

function renderGeo(entry: string | { pathname: string; state?: unknown } = "/geo-aeo") {
  return render(
    <DiagnosisProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/geo-aeo" element={<GeoAeoDashboard />} />
          <Route path="/" element={<p>pagina inicial</p>} />
        </Routes>
      </MemoryRouter>
    </DiagnosisProvider>,
  );
}

describe("GeoAeoDashboard", () => {
  beforeEach(() => {
    resetGeoCrawlCacheForTests();
    mocks.invoke.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.invoke.mockResolvedValue({ data: crawl, error: null });
  });

  it("sends a visit with no site and no earlier crawl to the home page", async () => {
    renderGeo();

    expect(await screen.findByText("pagina inicial")).toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it("keeps the crawl form and the shared entrance when a requested crawl fails", async () => {
    mocks.invoke.mockRejectedValue(new Error("offline"));
    renderGeo({ pathname: "/geo-aeo", state: { url: "exemplo.com.br" } });

    const heading = await screen.findByRole("heading", {
      name: "Descubra se sua marca é encontrada e citada por IAs.",
    });
    expect(heading.parentElement).toHaveClass("motion-enter");
    expect(screen.queryByText("Visibility Score")).toBeNull();
  });

  it("shows the overall score, the four sub scores and the sections of the report", async () => {
    renderGeo({ pathname: "/geo-aeo", state: { url: "exemplo.com.br" } });

    // overall = round((32 + 22 + 64 + 20) / 4) = 35
    expect(await screen.findByRole("img", overallRing)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "exemplo.com.br" })).toBeInTheDocument();
    for (const label of ["GEO", "AEO", "Técnico", "Autoridade"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("Dados estruturados incompletos")).toBeInTheDocument();
    expect(screen.getByText("Visibilidade por mecanismo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sinais encontrados" })).toBeInTheDocument();
    expect(screen.getByText("Exemplo")).toBeInTheDocument();

    const table = screen.getByRole("table");
    expect(within(table).getByText("https://exemplo.com.br/")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar CSV" })).toBeInTheDocument();
  });

  it("reuses the crawl already made for the site instead of crawling again", async () => {
    rememberGeoCrawl("https://www.exemplo.com.br/", crawl);
    renderGeo({ pathname: "/geo-aeo", state: { url: "exemplo.com.br" } });

    expect(await screen.findByRole("img", overallRing)).toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it("waits for the crawl started with the diagnostic and runs it only once", async () => {
    let finish: (value: unknown) => void = () => undefined;
    mocks.invoke.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    void startGeoCrawl("https://exemplo.com.br");

    renderGeo({ pathname: "/geo-aeo", state: { url: "exemplo.com.br" } });
    expect(await screen.findByText("Rastreando o site...")).toBeInTheDocument();

    finish({ data: crawl, error: null });
    expect(await screen.findByRole("img", overallRing)).toBeInTheDocument();
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
  });

  it("opens the crawl of the diagnosed site when GEO/AEO is opened from the menu", async () => {
    rememberGeoCrawl("exemplo.com.br", crawl);
    sessionStorage.setItem(
      "diagnosis:result",
      JSON.stringify({
        scoreAvailability: { mobile: true, desktop: true },
        summary: { mobile: { scores: {}, metrics: {} }, desktop: { scores: {}, metrics: {} } },
        improvements: [],
        geo: { domain: "https://exemplo.com.br/" },
      }),
    );
    try {
      renderGeo("/geo-aeo");

      expect(await screen.findByRole("img", overallRing)).toBeInTheDocument();
      expect(mocks.invoke).not.toHaveBeenCalled();
    } finally {
      sessionStorage.clear();
    }
  });
});

describe("GeoAeoDashboard reload", () => {
  beforeEach(() => {
    resetGeoCrawlCacheForTests();
    mocks.invoke.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.invoke.mockResolvedValue({ data: crawl, error: null });
  });

  it("keeps the finished crawl across a page reload", async () => {
    rememberGeoCrawl("https://exemplo.com.br/", crawl);
    expect(sessionStorage.getItem("geo-crawl:v1")).toContain("exemplo.com.br");

    // A reload empties the module memory but not sessionStorage.
    const saved = sessionStorage.getItem("geo-crawl:v1") as string;
    resetGeoCrawlCacheForTests();
    sessionStorage.setItem("geo-crawl:v1", saved);

    renderGeo({ pathname: "/geo-aeo", state: { url: "exemplo.com.br" } });

    expect(await screen.findByRole("img", overallRing)).toBeInTheDocument();
    expect(mocks.invoke).not.toHaveBeenCalled();
    sessionStorage.clear();
  });

  it("crawls the diagnosed site on demand when nothing was saved for it", async () => {
    sessionStorage.setItem(
      "diagnosis:result",
      JSON.stringify({
        scoreAvailability: { mobile: true, desktop: true },
        summary: { mobile: { scores: {}, metrics: {} }, desktop: { scores: {}, metrics: {} } },
        improvements: [],
        geo: { domain: "https://exemplo.com.br/" },
      }),
    );
    try {
      renderGeo("/geo-aeo");

      expect(await screen.findByRole("img", overallRing)).toBeInTheDocument();
      expect(mocks.invoke).toHaveBeenCalledTimes(1);
    } finally {
      sessionStorage.clear();
    }
  });
});
