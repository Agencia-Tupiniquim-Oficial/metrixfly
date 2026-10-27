import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ServiceInterestCard from "@/features/diagnostics/components/ServiceInterestCard";

describe("ServiceInterestCard", () => {
  it("offers a separate call to action for Search Console and Analytics", () => {
    render(
      <ServiceInterestCard
        onSubmitQuoteRequest={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Quero ajuda com o Search Console" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quero ajuda com o Analytics" }),
    ).toBeInTheDocument();
  });

  it("does not claim an integration with Google services", () => {
    render(
      <ServiceInterestCard
        onSubmitQuoteRequest={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.queryByText(/integra/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conectad/i)).not.toBeInTheDocument();
  });

  it("reports the interest when each dialog opens", () => {
    const onQuoteDialogOpen = vi.fn();
    render(
      <ServiceInterestCard
        onSubmitQuoteRequest={vi.fn().mockResolvedValue(undefined)}
        onQuoteDialogOpen={onQuoteDialogOpen}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Quero ajuda com o Search Console" }),
    );
    expect(onQuoteDialogOpen).toHaveBeenLastCalledWith("search_console");
  });

  it("submits the request with the interest of the clicked button", async () => {
    const onSubmitQuoteRequest = vi.fn().mockResolvedValue(undefined);
    render(<ServiceInterestCard onSubmitQuoteRequest={onSubmitQuoteRequest} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Quero ajuda com o Analytics" }),
    );
    for (const [label, value] of [
      ["Nome", "Ana Silva"],
      ["Empresa", "Exemplo Ltda."],
      ["E-mail", "ana@example.com"],
      ["Telefone", "+55 41 99999-0000"],
    ]) {
      fireEvent.change(screen.getByRole("textbox", { name: label }), {
        target: { value },
      });
    }
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar solicitação de orçamento" }),
    );

    await waitFor(() =>
      expect(onSubmitQuoteRequest).toHaveBeenCalledWith(
        expect.objectContaining({ serviceInterest: "analytics" }),
      ),
    );
  });
});
