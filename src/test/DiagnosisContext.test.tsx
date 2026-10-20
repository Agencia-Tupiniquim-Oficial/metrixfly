import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DiagnosisProvider, useDiagnosis } from "@/features/diagnostics/state/DiagnosisContext";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";

function SavedDiagnosisState() {
  const { diagnostic, diagnosticReportId } = useDiagnosis();
  return (
    <div>
      <span>{diagnostic?.geo?.domain}</span>
      <span>{diagnosticReportId}</span>
    </div>
  );
}

describe("DiagnosisProvider session restoration", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("restores diagnostic data and its permanent report ID without clearing storage", async () => {
    const reportId = "d158558e-15b8-43f8-96d7-b45b40ac3d80";
    sessionStorage.setItem("diagnosis:result", JSON.stringify(sampleDiagnosticResult));
    sessionStorage.setItem("diagnosis:report-id", reportId);

    render(
      <DiagnosisProvider>
        <SavedDiagnosisState />
      </DiagnosisProvider>,
    );

    expect(await screen.findByText(reportId)).toBeInTheDocument();
    await waitFor(() => {
      expect(sessionStorage.getItem("diagnosis:result")).not.toBeNull();
      expect(sessionStorage.getItem("diagnosis:report-id")).toBe(reportId);
    });
  });
});
