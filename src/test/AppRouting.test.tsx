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
        name: "Descubra oportunidades de melhoria para seu site",
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
});
