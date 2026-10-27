import { fireEvent, render, screen } from "@testing-library/react";
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

  it("explains what the tool does and how a diagnostic works", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /desempenho, SEO e visibilidade/i,
    );
    expect(
      screen.getByRole("heading", { name: "Como funciona" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("heading", { name: "O que você recebe" })).toBeInTheDocument();
  });

  it("sends the entered site to the diagnostic page", () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Endereço do site" }), {
      target: { value: "  exemplo.com.br/loja " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Diagnosticar meu site" }));

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

  it("links to the demo diagnostic without running a real analysis", () => {
    renderHome();

    expect(screen.getByRole("link", { name: "Ver um exemplo de diagnóstico" })).toHaveAttribute(
      "href",
      "/diagnostico?demo=1",
    );
  });

  it("records the start of a diagnostic from the home page", () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: "Endereço do site" }), {
      target: { value: "exemplo.com.br" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Diagnosticar meu site" }));

    expect(testWindow.dataLayer).toEqual([
      { event: "cta_click", cta_id: "home_diagnose", location: "home" },
    ]);
  });

  it("does not promise results it cannot guarantee", () => {
    renderHome();

    expect(document.body.textContent).not.toMatch(/garant|100%|dobr|aument[ae]\s+(suas\s+)?vendas/i);
  });
});
