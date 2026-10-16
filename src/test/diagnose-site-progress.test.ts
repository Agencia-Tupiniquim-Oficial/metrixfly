import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { runDiagnosticWithProgress } from "@/features/diagnostics/services/diagnose-site";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe("runDiagnosticWithProgress", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: "test-access-token",
        },
      },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("streams confirmed stage updates and returns the completed diagnosis", async () => {
    const result = {
      summary: { mobile: {}, desktop: {} },
      improvements: [],
    };
    const chunks = [
      '{"type":"progress","stage":"starting","status":"completed"}\n{"type":"progress","stage":"mobile","status":"running"}\n',
      '{"type":"progress","stage":"mobile","status":"completed"}\n{"type":"progress","stage":"finalizing","status":"completed"}\n{"type":"result","data":',
      `${JSON.stringify(result)}}\n`,
    ];
    fetchMock.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
            controller.close();
          },
        }),
        { headers: { "Content-Type": "application/x-ndjson" } },
      ),
    );
    const onProgress = vi.fn();

    const diagnosis = await runDiagnosticWithProgress(
      "https://site.test",
      onProgress,
    );

    expect(diagnosis).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/diagnose-site"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          url: "https://site.test",
          progressStream: true,
        }),
      }),
    );
    expect(onProgress.mock.calls.map(([event]) => event)).toEqual([
      { type: "progress", stage: "starting", status: "completed" },
      { type: "progress", stage: "mobile", status: "running" },
      { type: "progress", stage: "mobile", status: "completed" },
      { type: "progress", stage: "finalizing", status: "completed" },
    ]);
  });

  it("converts streamed failures into errors handled by the existing recovery flow", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        '{"type":"error","message":"PageSpeed indisponível"}\n',
        { headers: { "Content-Type": "application/x-ndjson" } },
      ),
    );

    await expect(
      runDiagnosticWithProgress("https://site.test", vi.fn()),
    ).rejects.toThrow("PageSpeed indisponível");
  });

  it("accepts the legacy JSON response while the progress stream is not available", async () => {
    const result = {
      summary: { mobile: {}, desktop: {} },
      improvements: [],
    };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    const onProgress = vi.fn();

    await expect(
      runDiagnosticWithProgress("https://site.test", onProgress),
    ).resolves.toEqual(result);
    expect(onProgress).toHaveBeenCalledWith({
      type: "progress",
      stage: "finalizing",
      status: "completed",
    });
  });
});
