import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuoteRequestDialog from "@/features/diagnostics/components/QuoteRequestDialog";

function fill() {
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

describe("QuoteRequestDialog interest signals", () => {
  it("reports each opening once with the general interest by default", () => {
    const onOpened = vi.fn();
    render(
      <QuoteRequestDialog
        onSubmitRequest={vi.fn().mockResolvedValue(undefined)}
        onOpened={onOpened}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));
    expect(onOpened).toHaveBeenCalledTimes(1);
    expect(onOpened).toHaveBeenCalledWith("general");

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it("does not report anything until the visitor opens the dialog", () => {
    const onOpened = vi.fn();
    render(
      <QuoteRequestDialog
        onSubmitRequest={vi.fn().mockResolvedValue(undefined)}
        onOpened={onOpened}
      />,
    );

    expect(onOpened).not.toHaveBeenCalled();
  });

  it("adds the service interest to the submitted request only when one is set", async () => {
    const onSubmitRequest = vi.fn().mockResolvedValue(undefined);
    render(
      <QuoteRequestDialog
        onSubmitRequest={onSubmitRequest}
        serviceInterest="search_console"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));
    fill();
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitação de orçamento" }),
    );

    await waitFor(() =>
      expect(onSubmitRequest).toHaveBeenCalledWith(
        expect.objectContaining({ serviceInterest: "search_console" }),
      ),
    );
  });
});
