import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HomePage } from "@/features/home";

type TestWindow = Window & { dataLayer?: Record<string, unknown>[] };
const testWindow = window as TestWindow;

function Destination() {
  const location = useLocation();
  return <p>{`destino:${location.pathname}${location.search}`}</p>;
}

function CrawlDestination() {
  const location = useLocation();
  const state = location.state as { url?: string } | null;
  return <p>{`crawl:${state?.url ?? "vazio"}`}</p>;
}

function heroForm() {
  return screen.getByRole("textbox", { name: "Endereço do site" }).closest("form")!;
}

function renderHome() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnostico" element={<Destination />} />
        <Route path="/geo-aeo" element={<CrawlDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    testWindow.dataLayer = [];
  });

  afterEach(() => {
    delete testWindow.dataLayer;
  });

  it("explains what the tool does and how a diagnostic works", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /citado por IAs/i,
    );
    expect(
      screen.getByRole("heading", { name: /Do endereço ao relatório em três passos/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(
      screen.getByRole("heading", { name: /Um relatório para decidir/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/O PageSpeed Insights é um serviço do Google/),
    ).toBeInTheDocument();
  });

  it("sends the entered site to the diagnostic page", () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Endereço do site" }), {
      target: { value: "  exemplo.com.br/loja " },
    });
    fireEvent.click(within(heroForm()).getByRole("button", { name: "Diagnosticar meu site" }));

    expect(
      screen.getByText("destino:/diagnostico?url=exemplo.com.br%2Floja"),
    ).toBeInTheDocument();
  });

  it("does not navigate when the address is blank", () => {
    renderHome();

    fireEvent.submit(screen.getByRole("textbox", { name: "Endereço do site" }).closest("form")!);

    expect(screen.queryByText(/^destino:/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("does not offer the example diagnostic link", () => {
    renderHome();

    expect(
      screen.queryByRole("link", { name: "Ver um exemplo de diagnóstico" }),
    ).not.toBeInTheDocument();
  });

  it("records the start of a diagnostic from the home page", () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Endereço do site" }), {
      target: { value: "exemplo.com.br" },
    });
    fireEvent.click(within(heroForm()).getByRole("button", { name: "Diagnosticar meu site" }));

    expect(testWindow.dataLayer).toEqual([
      { event: "cta_click", cta_id: "home_diagnose", location: "home" },
    ]);
  });

  it("sends the typed address to the Agent Crawl page", () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Endereço do site" }), {
      target: { value: "exemplo.com.br" },
    });
    fireEvent.click(screen.getByRole("link", { name: "Rodar Agent Crawl" }));

    expect(screen.getByText("crawl:exemplo.com.br")).toBeInTheDocument();
  });

  it("focuses the address field from the call-to-action buttons outside the hero", () => {
    renderHome();
    const input = screen.getByRole("textbox", { name: "Endereço do site" });

    for (const name of ["Diagnosticar desempenho", "Solicitar orçamento"]) {
      input.blur();
      fireEvent.click(screen.getByRole("button", { name }));
      expect(input).toHaveFocus();
    }
    expect(screen.queryByText(/^destino:/)).not.toBeInTheDocument();
  });

  it("does not promise results it cannot guarantee", () => {
    renderHome();

    expect(document.body.textContent).not.toMatch(/garant|100%|dobr|aument[ae]\s+(suas\s+)?vendas/i);
  });
});
