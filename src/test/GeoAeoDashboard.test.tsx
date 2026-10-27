import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GeoAeoDashboard from "@/features/geo-aeo/pages/GeoAeoDashboard";

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

describe("GeoAeoDashboard motion", () => {
  beforeEach(() => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("uses the shared entrance and card motion in the empty state", async () => {
    const { container } = render(
      <MemoryRouter>
        <GeoAeoDashboard />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Descubra se sua marca é encontrada e citada por IAs.",
      }).parentElement,
    ).toHaveClass("motion-enter");

    expect(await screen.findByText("Visibility Score")).toBeDefined();
    expect(
      screen.getByText("Visibility Score").closest(".motion-card"),
    ).not.toBeNull();
    expect(
      screen.getByText("Entity & Topic Graph").closest(".motion-card"),
    ).not.toBeNull();
    expect(container.querySelector(".motion-stagger")).not.toBeNull();
  });
});

describe("GeoAeoDashboard result", () => {
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

  beforeEach(() => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.invoke.mockResolvedValue({ data: crawl, error: null });
  });

  it("shows the overall score, the four sub scores and the sections of the report", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/geo-aeo", state: { url: "exemplo.com.br" } }]}>
        <GeoAeoDashboard />
      </MemoryRouter>,
    );

    // overall = round((32 + 22 + 64 + 20) / 4) = 35
    expect(await screen.findByRole("img", { name: "Score geral de prontidão: 35 de 100" })).toBeInTheDocument();
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
});
