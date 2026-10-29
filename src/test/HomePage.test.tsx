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

function renderHome() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnostico" element={<Destination />} />
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

  it("answers common questions in an accordion linked from the menu", () => {
    renderHome();

    expect(screen.getByRole("link", { name: "Dúvidas" })).toHaveAttribute(
      "href",
      "#duvidas",
    );
    expect(
      screen.getByRole("heading", { name: /Ficou com alguma pergunta/ }),
    ).toBeInTheDocument();

    const question = screen.getByRole("button", {
      name: /Quanto tempo leva a análise/,
    });
    expect(question).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/de 15 a 45 segundos/)).toBeVisible();
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

  it("has no address field: the site is entered on the diagnostic page", () => {
    renderHome();

    expect(screen.queryByRole("textbox", { name: "Endereço do site" })).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("main")).getAllByRole("link", { name: "Diagnosticar meu site" })[0],
    );

    expect(screen.getByText("destino:/diagnostico")).toBeInTheDocument();
  });

  it("does not offer the example diagnostic link", () => {
    renderHome();

    expect(
      screen.queryByRole("link", { name: "Ver um exemplo de diagnóstico" }),
    ).not.toBeInTheDocument();
  });

  it("records the start of a diagnostic from the home page", () => {
    renderHome();

    fireEvent.click(
      within(screen.getByRole("main")).getAllByRole("link", { name: "Diagnosticar meu site" })[0],
    );

    expect(testWindow.dataLayer).toEqual([
      { event: "cta_click", cta_id: "home_diagnose", location: "home" },
    ]);
  });

  it("sends the diagnostic and Agent Crawl cards to the diagnostic page", () => {
    renderHome();

    for (const name of ["Diagnosticar desempenho", "Rodar Agent Crawl"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", "/diagnostico");
    }
  });

  it("keeps only the quote button in the closing band", () => {
    renderHome();

    const band = screen
      .getByRole("heading", { name: /Achou os problemas/ })
      .closest("section")!;
    expect(within(band).getByRole("link", { name: "Solicitar orçamento" })).toHaveAttribute(
      "href",
      "/diagnostico",
    );
    expect(within(band).queryByRole("link", { name: "Diagnosticar meu site" })).toBeNull();
    expect(within(band).queryByRole("button", { name: "Diagnosticar meu site" })).toBeNull();
  });

  it("does not show the PageSpeed note under the address field", () => {
    renderHome();

    expect(screen.queryByText(/Medição com o PageSpeed Insights/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Rodar o Agent Crawl GEO/AEO" }),
    ).not.toBeInTheDocument();
    // The Agent Crawl remains reachable from its own card.
    expect(screen.getByRole("link", { name: "Rodar Agent Crawl" })).toBeInTheDocument();
  });

  it("does not promise results it cannot guarantee", () => {
    renderHome();

    expect(document.body.textContent).not.toMatch(/garant|100%|dobr|aument[ae]\s+(suas\s+)?vendas/i);
  });
});
