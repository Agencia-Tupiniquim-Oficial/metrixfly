import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/app/App";

describe("application route fallback", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    window.history.replaceState(
      {},
      "",
      "/calculadora-financeira?mobileScore=43&traffic=15000&ticket=250",
    );
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
  });

  it("loads the estimate route directly and retains all query parameters", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Quanto a lentidão pode estar custando?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Visitantes mensais" }),
    ).toHaveAttribute("aria-valuenow", "15000");
    expect(
      screen.getByRole("slider", { name: "Valor médio por conversão" }),
    ).toHaveAttribute("aria-valuenow", "250");
    expect(screen.getByText(/Nota mobile PageSpeed: 43\/100\./)).toBeInTheDocument();
  });

  it("shows the explanatory home page on the root route", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /Do endereço ao relatório em três passos/ }),
    ).toBeInTheDocument();
  });

  it("shows the address form on /diagnostico and sends /geo-aeo without a site there", async () => {
    for (const path of ["/diagnostico", "/geo-aeo"]) {
      window.history.replaceState({}, "", path);
      const { unmount } = render(<App />);

      expect(await screen.findByPlaceholderText("example.com")).toBeInTheDocument();
      expect(window.location.pathname).toBe("/diagnostico");
      unmount();
    }
  });

  it("redirects old demo links on the root to the diagnostic page", () => {
    window.history.replaceState({}, "", "/?demo=1");
    render(<App />);

    expect(window.location.pathname).toBe("/diagnostico");
    expect(window.location.search).toBe("?demo=1");
    expect(screen.getByText("Boletim de Saúde Digital")).toBeInTheDocument();
  });
});
