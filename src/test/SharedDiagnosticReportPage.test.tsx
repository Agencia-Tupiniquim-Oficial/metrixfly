import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";
import SharedDiagnosticReportPage from "@/features/diagnostics/pages/SharedDiagnosticReportPage";
import { getPublicDiagnosticReport } from "@/features/diagnostics/services/diagnostic-reports";

const { createDiagnosticReportPdf, downloadPdf } = vi.hoisted(() => ({
  createDiagnosticReportPdf: vi.fn(),
  downloadPdf: vi.fn(),
}));

vi.mock("@/features/diagnostics/services/diagnostic-reports", () => ({
  getPublicDiagnosticReport: vi.fn(),
}));

vi.mock("@/features/diagnostics/components/DiagnosticReportPreview", () => ({
  default: ({ url }: { url: string }) => (
    <div data-testid="saved-report-preview">{url}</div>
  ),
}));

vi.mock("@/lib/dynamic-import", () => ({
  importPdfReports: vi.fn().mockResolvedValue({
    createDiagnosticReportPdf,
    downloadPdf,
    reportPdfFilename: vi.fn(() => "diagnostico.pdf"),
  }),
}));

const reportId = "d158558e-15b8-43f8-96d7-b45b40ac3d80";
const report = {
  ...sampleDiagnosticResult,
  geo: { domain: "https://example.com/" },
};

function renderSharedReport() {
  return render(
    <MemoryRouter initialEntries={[`/diagnostico/${reportId}`]}>
      <Routes>
        <Route
          path="/diagnostico/:reportId"
          element={<SharedDiagnosticReportPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SharedDiagnosticReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicDiagnosticReport).mockResolvedValue({
      id: reportId,
      report,
      createdAt: "2026-10-20T19:00:00.000Z",
    });
    createDiagnosticReportPdf.mockResolvedValue(
      new Blob(["%PDF-1.7"], { type: "application/pdf" }),
    );
  });

  it("loads the saved report directly by its URL ID", async () => {
    renderSharedReport();

    expect(
      await screen.findByTestId("saved-report-preview"),
    ).toHaveTextContent("https://example.com/");
    expect(getPublicDiagnosticReport).toHaveBeenCalledWith(reportId);
  });

  it("shows the domain, the creation date and a closing call to action to the home page", async () => {
    renderSharedReport();

    expect(
      await screen.findByRole("heading", { level: 1, name: "https://example.com/" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Relatório criado em/)).toBeInTheDocument();
    expect(screen.getByText("Gerado com Metricfly")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Diagnosticar meu site" }),
    ).toHaveAttribute("href", "/");
  });

  it("generates a PDF from the saved report data", async () => {
    renderSharedReport();
    fireEvent.click(
      await screen.findByRole("button", { name: "Baixar relatório em PDF" }),
    );

    await waitFor(() => {
      expect(createDiagnosticReportPdf).toHaveBeenCalledWith(
        "https://example.com/",
        report,
      );
      expect(downloadPdf).toHaveBeenCalledWith(
        expect.any(Blob),
        "diagnostico.pdf",
      );
    });
  });

  it("shows an explicit unavailable state for an unknown report", async () => {
    vi.mocked(getPublicDiagnosticReport).mockResolvedValueOnce(null);
    renderSharedReport();

    expect(
      await screen.findByText("Não encontramos um relatório com este identificador."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar ao diagnóstico" }),
    ).toHaveAttribute("href", "/diagnostico");
  });
});
