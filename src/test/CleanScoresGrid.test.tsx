import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CleanScoresGrid } from "@/features/diagnostics/components/CleanScoresGrid";

const scores = { performance: 86, accessibility: 100, bestPractices: 95, seo: 40 };

function dotsFor(metrics: Record<string, string>) {
  const { container } = render(
    <CleanScoresGrid title="Celular" scores={scores} metrics={metrics} />,
  );
  return Array.from(container.querySelectorAll("span[aria-hidden='true']")).map(
    (dot) => dot.className,
  );
}

describe("CleanScoresGrid", () => {
  it("shows every score ring with its value and the metrics with their targets", () => {
    dotsFor({ fcp: "2,8 s", lcp: "3,3 s", tbt: "10 ms", cls: "0", si: "4,3 s" });

    expect(screen.getByRole("img", { name: "Desempenho: 86 de 100" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "SEO: 40 de 100" })).toBeInTheDocument();
    expect(screen.getByText("3,3 s")).toBeInTheDocument();
    expect(screen.getByText("Meta: < 2.5s")).toBeInTheDocument();
  });

  it("marks metrics inside the target green and those outside amber", () => {
    const [fcp, lcp, tbt, cls, si] = dotsFor({
      fcp: "2,8 s",
      lcp: "2.1 s",
      tbt: "10 ms",
      cls: "0",
      si: "4,3 s",
    });

    expect(fcp).toContain("bg-warning");
    expect(lcp).toContain("bg-success");
    expect(tbt).toContain("bg-success");
    expect(cls).toContain("bg-success");
    expect(si).toContain("bg-warning");
  });

  it("compares TBT in milliseconds even when it is reported in seconds", () => {
    const [, , tbt] = dotsFor({ fcp: "1 s", lcp: "1 s", tbt: "0,5 s", cls: "0", si: "1 s" });

    expect(tbt).toContain("bg-warning");
  });

  it("leaves the dot neutral when the value cannot be read", () => {
    const [fcp] = dotsFor({ fcp: "—", lcp: "1 s", tbt: "1 ms", cls: "0", si: "1 s" });

    expect(fcp).toContain("bg-muted-foreground");
  });
});
