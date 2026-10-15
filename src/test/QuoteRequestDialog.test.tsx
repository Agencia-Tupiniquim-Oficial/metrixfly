import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";
import QuoteRequestDialog from "@/features/diagnostics/components/QuoteRequestDialog";
import {
  buildDiagnosticSummary,
  validateDiagnosticPdf,
} from "@/features/diagnostics/model/quote-request";

function fillQuoteRequest() {
  fireEvent.change(screen.getByRole("textbox", { name: "Nome" }), {
    target: { value: "Ana Silva" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Empresa" }), {
    target: { value: "Exemplo Ltda." },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), {
    target: { value: "ana@example.com" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Telefone" }), {
    target: { value: "+55 41 99999-0000" },
  });
}

describe("QuoteRequestDialog", () => {
  it("submits the existing fields and form-name to the request handler", async () => {
    const onSubmitRequest = vi.fn().mockResolvedValue(undefined);
    render(<QuoteRequestDialog onSubmitRequest={onSubmitRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));
    fillQuoteRequest();
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitação de orçamento" }),
    );

    await waitFor(() => {
      expect(onSubmitRequest).toHaveBeenCalledWith({
        "form-name": "form-contato",
        name: "Ana Silva",
        company: "Exemplo Ltda.",
        email: "ana@example.com",
        phone: "+55 41 99999-0000",
      });
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps entered data and allows retry when sending fails", async () => {
    const onSubmitRequest = vi
      .fn()
      .mockRejectedValueOnce(new Error("Falha temporária"))
      .mockResolvedValueOnce(undefined);
    render(<QuoteRequestDialog onSubmitRequest={onSubmitRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));
    fillQuoteRequest();
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitação de orçamento" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha temporária");
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveValue("Ana Silva");
    expect(screen.getByRole("textbox", { name: "Empresa" })).toHaveValue("Exemplo Ltda.");
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveValue("ana@example.com");
    expect(screen.getByRole("textbox", { name: "Telefone" })).toHaveValue("+55 41 99999-0000");

    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitação de orçamento" }),
    );
    await waitFor(() => expect(onSubmitRequest).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not retain the previous mailto, manual-download, or service-description options", () => {
    render(
      <QuoteRequestDialog
        onSubmitRequest={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));

    expect(screen.queryByRole("link", { name: /e-mail/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /baixar relatório/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Descrição do serviço desejado" }),
    ).toBeNull();
    expect(screen.queryByText(/anexe o relatório/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aplicativo de e-mail não abriu/i)).not.toBeInTheDocument();
  });
});

describe("quote request payload helpers", () => {
  it("summarizes the diagnosis currently shown", () => {
    const summary = buildDiagnosticSummary(sampleDiagnosticResult);

    expect(summary).toContain("desempenho 43/100");
    expect(summary).toContain("desempenho 71/100");
    expect(summary).toContain("Carregamento Mobile Crítico (LCP em 5.8s)");
    expect(summary).toContain("Ajustar contraste de cores para conformidade WCAG AA");
  });

  it("accepts only a non-empty PDF within the supported size", () => {
    const pdf = new Blob(["%PDF-1.7 test"], { type: "application/pdf" });

    expect(() => validateDiagnosticPdf(pdf)).not.toThrow();
    expect(() =>
      validateDiagnosticPdf(new Blob(["not a pdf"], { type: "text/plain" })),
    ).toThrow("não está no formato PDF");
    expect(() =>
      validateDiagnosticPdf(new Blob([], { type: "application/pdf" })),
    ).toThrow("está vazio ou excede");
  });
});
