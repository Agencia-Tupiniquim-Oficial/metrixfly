import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

describe("theme preference", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("toggles between light and dark and persists the selection", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const darkButton = await screen.findByRole("button", {
      name: "Ativar tema escuro",
    });
    fireEvent.click(darkButton);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.getItem("metrixfly-theme")).toBe("dark");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ativar tema claro" }),
    );
    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
      expect(localStorage.getItem("metrixfly-theme")).toBe("light");
    });
  });
});
