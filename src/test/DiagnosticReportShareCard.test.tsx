import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticReportShareCard } from "@/features/diagnostics/components/DiagnosticReportShareCard";

const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const reportUrl = "https://metrixfly.vercel.app/diagnostico/report-uuid";

describe("DiagnosticReportShareCard", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });
    writeText.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the saved report URL and sharing guidance", () => {
    render(<DiagnosticReportShareCard reportUrl={reportUrl} />);

    expect(
      screen.getByRole("heading", { name: "Relatório salvo com sucesso" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: reportUrl })).toHaveAttribute(
      "href",
      reportUrl,
    );
    expect(
      screen.getByText(/Qualquer pessoa com o link pode abrir./),
    ).toBeInTheDocument();
  });

  it("copies the full URL and temporarily confirms success", async () => {
    writeText.mockResolvedValue(undefined);
    render(<DiagnosticReportShareCard reportUrl={reportUrl} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copiar link do relatório" }),
      );
    });

    expect(writeText).toHaveBeenCalledWith(reportUrl);
    expect(
      screen.getByRole("button", { name: "Link copiado!" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Link copiado com sucesso!",
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Link copiado com sucesso!" }),
    );

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(
      screen.getByRole("button", { name: "Copiar link do relatório" }),
    ).toBeInTheDocument();
  });

  it("reports clipboard errors and leaves the manual URL available", async () => {
    writeText.mockRejectedValue(new Error("Clipboard permission denied"));
    render(<DiagnosticReportShareCard reportUrl={reportUrl} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copiar link do relatório" }),
      );
    });

    expect(screen.getByRole("link", { name: reportUrl })).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Não foi possível copiar o link",
        variant: "destructive",
      }),
    );
  });
});
