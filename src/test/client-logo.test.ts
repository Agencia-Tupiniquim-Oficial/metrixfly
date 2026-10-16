import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientLogoDataUrl } from "@/features/diagnostics/services/client-logo";

describe("getClientLogoDataUrl", () => {
  function imageResponse(blob: Blob): Response {
    const response = new Response(null, { status: 200 });
    vi.spyOn(response, "blob").mockResolvedValue(blob);
    return response;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not query a logo for local or invalid hosts", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getClientLogoDataUrl("http://localhost:8080")).resolves.toBeNull();
    await expect(getClientLogoDataUrl("http://127.0.0.1")).resolves.toBeNull();
    await expect(getClientLogoDataUrl("not a url")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("converts an available, sufficiently large site icon into an embedded PNG", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      imageResponse(new Blob(["image"], { type: "image/png" })),
    );
    const close = vi.fn();
    const drawImage = vi.fn();
    const toDataURL = vi.fn().mockReturnValue("data:image/png;base64,c2l0ZQ==");
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockImplementation(toDataURL);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 64, height: 64, close }),
    );
    try {
      await expect(
        getClientLogoDataUrl("https://client-logo-found.test/path"),
      ).resolves.toBe("data:image/png;base64,c2l0ZQ==");
    } finally {
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
    }

    const requestUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestUrl.hostname).toBe("icon.horse");
    expect(requestUrl.pathname).toBe("/icon/client-logo-found.test");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("uses only Tupiniquim when the lookup returns no client logo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(
      getClientLogoDataUrl("https://no-client-logo.test"),
    ).resolves.toBeNull();
  });

  it("ignores tiny default icons", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      imageResponse(new Blob(["image"], { type: "image/png" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 16, height: 16, close: vi.fn() }),
    );

    await expect(
      getClientLogoDataUrl("https://default-icon-only.test"),
    ).resolves.toBeNull();
  });
});
