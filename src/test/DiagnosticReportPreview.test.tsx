import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DiagnosticReportPreview from "@/features/diagnostics/components/DiagnosticReportPreview";

describe("DiagnosticReportPreview", () => {
  it("shows the improvement section title only on the first page", () => {
    render(
      <DiagnosticReportPreview
        url="https://site.test"
        mobile={{ scores: { performance: 72, accessibility: 91, bestPractices: 88, seo: 96 }, metrics: {} }}
        desktop={{ scores: { performance: 94, accessibility: 98, bestPractices: 95, seo: 99 }, metrics: {} }}
        improvements={[
          { title: "Reduzir solicitações" },
          { title: "Reduzir JavaScript" },
          { title: "Otimizar CSS" },
        ]}
      />,
    );

    expect(
      screen.getAllByRole("heading", { name: "Sugestões de melhoria", level: 2 }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "3. Otimizar CSS", level: 3 }),
    ).toBeTruthy();
  });
});
