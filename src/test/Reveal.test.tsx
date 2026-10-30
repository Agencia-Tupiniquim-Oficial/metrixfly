import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "@/components/reveal";

describe("Reveal", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is visible from the start when IntersectionObserver is missing", () => {
    render(<Reveal>conteudo</Reveal>);
    const el = screen.getByText("conteudo");
    expect(el).toHaveClass("is-visible");
    expect(el).not.toHaveClass("reveal");
  });

  it("stays hidden until it scrolls into view, then shows once", () => {
    let callback: IntersectionObserverCallback = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    render(<Reveal>conteudo</Reveal>);
    const el = screen.getByText("conteudo");
    expect(el).toHaveClass("reveal");
    expect(el).not.toHaveClass("is-visible");

    act(() =>
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(el).toHaveClass("is-visible");
    expect(disconnect).toHaveBeenCalled();
  });

  it("shows at once with reduced motion", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    render(<Reveal>conteudo</Reveal>);
    expect(screen.getByText("conteudo")).toHaveClass("is-visible");
  });
});
