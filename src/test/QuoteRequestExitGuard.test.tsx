import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import QuoteRequestDialog from "@/features/diagnostics/components/QuoteRequestDialog";

function renderDialog(onSubmitRequest = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter initialEntries={["/diagnostico"]}>
      <Routes>
        <Route
          path="/diagnostico"
          element={
            <>
              <Link to="/calculadora-financeira">Calculadora</Link>
              <QuoteRequestDialog onSubmitRequest={onSubmitRequest} />
            </>
          }
        />
        <Route path="/calculadora-financeira" element={<p>Página da calculadora</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return onSubmitRequest;
}

function typeCompany(value: string) {
  fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Empresa" }), {
    target: { value },
  });
}

function closeDialog() {
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
}

function beforeUnloadPrevented(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("quote request exit guard", () => {
  it("does not interfere with navigation while the form is empty", () => {
    renderDialog();

    expect(beforeUnloadPrevented()).toBe(false);
    fireEvent.click(screen.getByRole("link", { name: "Calculadora" }));

    expect(screen.getByText("Página da calculadora")).toBeInTheDocument();
  });

  it("asks before leaving through a link when unsent data was typed", async () => {
    renderDialog();
    typeCompany("Exemplo Ltda.");
    closeDialog();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("link", { name: "Calculadora" }));

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("Sair sem enviar a solicitação?");
    expect(screen.queryByText("Página da calculadora")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continuar preenchendo" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Página da calculadora")).not.toBeInTheDocument();
  });

  it("navigates once the visitor confirms leaving", async () => {
    renderDialog();
    typeCompany("Exemplo Ltda.");
    closeDialog();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("link", { name: "Calculadora" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sair sem enviar" }));

    expect(await screen.findByText("Página da calculadora")).toBeInTheDocument();
  });

  it("asks the browser to confirm closing or reloading only while data is unsent", async () => {
    renderDialog();
    expect(beforeUnloadPrevented()).toBe(false);

    typeCompany("Exemplo Ltda.");
    expect(beforeUnloadPrevented()).toBe(true);

    fireEvent.change(screen.getByRole("textbox", { name: "Empresa" }), {
      target: { value: "" },
    });
    expect(beforeUnloadPrevented()).toBe(false);
  });

  it("stops guarding after the request was sent", async () => {
    renderDialog();
    typeCompany("Exemplo Ltda.");
    fireEvent.change(screen.getByRole("textbox", { name: "Nome" }), {
      target: { value: "Ana Silva" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Telefone" }), {
      target: { value: "+55 41 99999-0000" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitação de orçamento" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(beforeUnloadPrevented()).toBe(false);
  });
});
