import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";
import {
  getPublicDiagnosticReport,
  isPublicDiagnosticReportId,
} from "@/features/diagnostics/services/diagnostic-reports";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

describe("public diagnostic report lookup", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts opaque UUIDs and rejects invalid report IDs", async () => {
    expect(isPublicDiagnosticReportId("d158558e-15b8-43f8-96d7-b45b40ac3d80"))
      .toBe(true);
    expect(isPublicDiagnosticReportId("123")).toBe(false);
    expect(await getPublicDiagnosticReport("not-a-uuid")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads a saved result by ID without changing its report data", async () => {
    const id = "d158558e-15b8-43f8-96d7-b45b40ac3d80";
    const createdAt = "2026-10-20T19:00:00.000Z";
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { id, report: sampleDiagnosticResult, created_at: createdAt },
        ]),
        { status: 200 },
      ),
    );

    await expect(getPublicDiagnosticReport(id)).resolves.toEqual({
      id,
      report: sampleDiagnosticResult,
      createdAt,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/rest/v1/rpc/get_public_diagnostic_report"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ report_id: id }),
      }),
    );
  });

  it("returns null for an unknown ID and surfaces loading failures", async () => {
    const id = "d158558e-15b8-43f8-96d7-b45b40ac3d80";
    fetchMock.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    await expect(getPublicDiagnosticReport(id)).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(
      new Response("database unavailable", { status: 500 }),
    );
    await expect(getPublicDiagnosticReport(id)).rejects.toThrow(
      "Não foi possível carregar este relatório",
    );
  });

  it("rejects malformed saved report payloads", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
          id: "d158558e-15b8-43f8-96d7-b45b40ac3d80",
          report: { summary: {}, improvements: [] },
          created_at: "2026-10-20T19:00:00.000Z",
          },
        ]),
        { status: 200 },
      ),
    );

    await expect(
      getPublicDiagnosticReport("d158558e-15b8-43f8-96d7-b45b40ac3d80"),
    ).rejects.toThrow("Este relatório está indisponível");
  });
});
