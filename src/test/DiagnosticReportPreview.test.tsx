import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DiagnosticReportPreview from "@/features/diagnostics/components/DiagnosticReportPreview";
import {
  getPageSpeedAuditTitle,
  normalizePageSpeedDescription,
} from "../../supabase/functions/_shared/pagespeed-translations.ts";

describe("DiagnosticReportPreview", () => {
  it("renders normalized PageSpeed opportunity titles from the diagnostic result", () => {
    const sourceTitles = [
      "Forced reflow",
      "Heading elements are not in a sequentially-descending order",
      "Minimize main-thread work",
      "LCP breakdown",
      "Buttons do not have an accessible name",
      '`[user-scalable="no"]` is used in the `<meta name="viewport">` element or the `[maximum-scale]` attribute is less than 5.',
    ];
    const titles = sourceTitles.map(
      (title) => getPageSpeedAuditTitle("", title) ?? title,
    );
    const mobile = {
      scores: { performance: 72, accessibility: 91, bestPractices: 88, seo: 96 },
      metrics: {},
      opportunities: titles.map((title) => ({ title })),
    };

    render(
      <DiagnosticReportPreview
        url="https://site.test"
        mobile={mobile}
        desktop={{ scores: { performance: 94, accessibility: 98, bestPractices: 95, seo: 99 }, metrics: {} }}
        improvements={[]}
      />,
    );

    for (const title of titles) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    for (const sourceTitle of sourceTitles) {
      expect(screen.queryByText(sourceTitle)).toBeNull();
    }
  });

  it("renders normalized Portuguese PageSpeed descriptions", () => {
    const findings = [
      {
        id: "button-name",
        source: "Buttons do not have an accessible name.",
      },
      {
        id: "forced-reflow-insight",
        source: "Forced reflow occurs when JavaScript queries layout properties.",
      },
      {
        id: "meta-viewport",
        source:
          "The user-scalable setting and maximum-scale can prevent users from zooming.",
      },
    ];
    const improvements = findings.map(({ id, source }) => ({
      title: getPageSpeedAuditTitle(id) ?? "Melhoria técnica",
      description: normalizePageSpeedDescription(id, source, undefined),
    }));

    render(
      <DiagnosticReportPreview
        url="https://site.test"
        mobile={{ scores: { performance: 72, accessibility: 91, bestPractices: 88, seo: 96 }, metrics: {} }}
        desktop={{ scores: { performance: 94, accessibility: 98, bestPractices: 95, seo: 99 }, metrics: {} }}
        improvements={improvements}
      />,
    );

    expect(screen.getByText(improvements[0].description)).toBeTruthy();
    expect(screen.getByText(improvements[1].description)).toBeTruthy();
    expect(screen.getByText(improvements[2].description)).toBeTruthy();
    expect(screen.queryByText(findings[0].source)).toBeNull();
    expect(screen.queryByText(findings[1].source)).toBeNull();
    expect(screen.queryByText(findings[2].source)).toBeNull();
  });

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

  it("groups cover, remaining recommendations, and performance consistently", () => {
    const { container } = render(
      <DiagnosticReportPreview
        url="https://site.test"
        mobile={{ scores: { performance: 72, accessibility: 91, bestPractices: 88, seo: 96 }, metrics: {} }}
        desktop={{ scores: { performance: 94, accessibility: 98, bestPractices: 95, seo: 99 }, metrics: {} }}
        improvements={[
          { title: "Primeira melhoria" },
          { title: "Segunda melhoria" },
          { title: "Terceira melhoria" },
          { title: "Quarta melhoria" },
        ]}
        uiux={{ overview: "Resumo de UI/UX" }}
        extras={[{ title: "Sugestão extra", description: "Descrição extra" }]}
      />,
    );
    const pages = container.querySelectorAll("div.mx-auto");

    expect(pages).toHaveLength(3);
    expect(pages[0].textContent).toContain("1. Primeira melhoria");
    expect(pages[0].textContent).toContain("2. Segunda melhoria");
    expect(pages[0].textContent).not.toContain("Terceira melhoria");
    expect(pages[1].textContent).toContain("3. Terceira melhoria");
    expect(pages[1].textContent).toContain("4. Quarta melhoria");
    expect(pages[1].textContent).toContain("Resumo de UI/UX");
    expect(pages[1].textContent).toContain("Sugestão extra");
    expect(pages[1].textContent).not.toContain("Performance");
    expect(pages[2].textContent).toContain("Performance");
  });
});
