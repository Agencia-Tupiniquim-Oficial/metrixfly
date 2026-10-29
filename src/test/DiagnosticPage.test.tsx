import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import logoColored from "@/assets/logo-colored.png";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";

const { runDiagnosticWithProgress, startGeoCrawl } = vi.hoisted(() => ({
  runDiagnosticWithProgress: vi.fn((..._args: unknown[]) => new Promise(() => {})),
  startGeoCrawl: vi.fn((..._args: unknown[]) => Promise.resolve(null)),
}));

vi.mock("@/lib/geo-crawl-cache", () => ({ startGeoCrawl }));

vi.mock("@/features/diagnostics/services/diagnose-site", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/diagnostics/services/diagnose-site")>()),
  runDiagnosticWithProgress,
}));

function renderWithProviders(initialEntries: string[] = ["/diagnostico"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DiagnosisProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/diagnostico" element={<DiagnosticPage />} />
            <Route path="/" element={<p>pagina inicial</p>} />
          </Routes>
        </MemoryRouter>
      </DiagnosisProvider>
    </QueryClientProvider>
  );
}

describe("Diagnostic experience", () => {
  it("asks for the site when a visit has no site and no saved diagnostic", async () => {
    runDiagnosticWithProgress.mockClear();
    renderWithProviders(["/diagnostico"]);

    expect(await screen.findByPlaceholderText("exemplo.com.br")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Diagnosticar/ })).toBeInTheDocument();
    expect(runDiagnosticWithProgress).not.toHaveBeenCalled();
  });

  it("starts the GEO crawl together with the diagnostic, but not in demo mode", () => {
    startGeoCrawl.mockClear();
    renderWithProviders(["/diagnostico?url=exemplo.com.br%2Floja"]);
    expect(startGeoCrawl).toHaveBeenCalledTimes(1);
    expect(startGeoCrawl).toHaveBeenCalledWith("https://exemplo.com.br/loja");

    startGeoCrawl.mockClear();
    renderWithProviders(["/diagnostico?demo=1"]);
    expect(startGeoCrawl).not.toHaveBeenCalled();
  });

  it("shows the shared header on the diagnostic page", () => {
    renderWithProviders(["/diagnostico?url=exemplo.com.br"]);

    expect(
      screen.getByRole("link", { name: "Metricfly, página inicial" }).querySelector("img"),
    ).toHaveAttribute("src", logoColored);
    expect(screen.getByRole("link", { name: "GEO/AEO" })).toHaveAttribute(
      "href",
      "/geo-aeo",
    );
  });

  it("prefills the address and starts the diagnostic received from the home page", () => {
    runDiagnosticWithProgress.mockClear();
    renderWithProviders(["/diagnostico?url=exemplo.com.br%2Floja"]);

    expect(
      screen.getByRole("heading", { name: "Analisando exemplo.com.br/loja" }),
    ).toBeInTheDocument();
    expect(runDiagnosticWithProgress).toHaveBeenCalledTimes(1);
    expect(runDiagnosticWithProgress.mock.calls[0][0]).toBe(
      "https://exemplo.com.br/loja",
    );
  });

  it("ignores a diagnostic saved from an earlier visit when an address is requested", async () => {
    runDiagnosticWithProgress.mockClear();
    sessionStorage.setItem(
      "diagnosis:result",
      JSON.stringify({
        ...sampleDiagnosticResult,
        geo: { domain: "https://antigo.com.br/" },
      }),
    );
    try {
      renderWithProviders(["/diagnostico?url=novo.com.br"]);

      await waitFor(() =>
        expect(runDiagnosticWithProgress).toHaveBeenCalledTimes(1),
      );
      expect(runDiagnosticWithProgress.mock.calls[0][0]).toBe(
        "https://novo.com.br",
      );
      expect(
        screen.getByRole("heading", { name: "Analisando novo.com.br" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Boletim de Saúde Digital")).toBeNull();
    } finally {
      sessionStorage.clear();
    }
  });

  it("does not start a diagnostic without an address or in demo mode", () => {
    runDiagnosticWithProgress.mockClear();
    renderWithProviders(["/diagnostico"]);
    renderWithProviders(["/diagnostico?demo=1&url=exemplo.com.br"]);

    expect(runDiagnosticWithProgress).not.toHaveBeenCalled();
  });

  it("renders a populated diagnostic when demo mode is enabled", () => {
    renderWithProviders(["/diagnostico?demo=1"]);
    expect(screen.getByText("Boletim de Saúde Digital")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Auditoria técnica" })).toBeDefined();
    expect(screen.getByText("Versão corporativa")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Celular" }).closest(".motion-card"),
    ).not.toBeNull();
  });

  it("exposes the optimization estimate as a link with its diagnostic parameters", () => {
    renderWithProviders(["/diagnostico?demo=1"]);
    const estimateLink = screen.getByRole("link", {
      name: "Abrir estimativa de otimização",
    });

    expect(estimateLink).toHaveAttribute(
      "href",
      "/calculadora-financeira?mobileScore=43&traffic=15000&ticket=250",
    );
  });
});

describe("Diagnostic result address bar", () => {
  it("shows the analyzed address without the protocol and the trailing slash", async () => {
    sessionStorage.setItem(
      "diagnosis:result",
      JSON.stringify({
        ...sampleDiagnosticResult,
        geo: { domain: "https://safetyrentalsplataformas.com.br/" },
      }),
    );
    try {
      renderWithProviders(["/diagnostico"]);

      expect(
        await screen.findByRole("heading", { level: 1, name: "safetyrentalsplataformas.com.br" }),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("exemplo.com.br")).toHaveValue(
        "safetyrentalsplataformas.com.br",
      );
    } finally {
      sessionStorage.clear();
    }
  });
});
