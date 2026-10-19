import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GeoAeoDashboard from "@/features/geo-aeo/pages/GeoAeoDashboard";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("GeoAeoDashboard motion", () => {
  beforeEach(() => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("uses the shared entrance and card motion in the empty state", async () => {
    const { container } = render(
      <MemoryRouter>
        <GeoAeoDashboard />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Descubra se sua marca é encontrada e citada por IAs.",
      }).parentElement,
    ).toHaveClass("motion-enter");

    expect(await screen.findByText("Visibility Score")).toBeDefined();
    expect(
      screen.getByText("Visibility Score").closest(".motion-card"),
    ).not.toBeNull();
    expect(
      screen.getByText("Entity & Topic Graph").closest(".motion-card"),
    ).not.toBeNull();
    expect(container.querySelector(".motion-stagger")).not.toBeNull();
  });
});
