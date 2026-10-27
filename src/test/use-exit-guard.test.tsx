import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useExitGuard } from "@/hooks/use-exit-guard";

function Harness({
  active,
  onInternalNavigation,
}: {
  active: boolean;
  onInternalNavigation: (url: URL) => void;
}) {
  useExitGuard({ active, onInternalNavigation });
  return (
    <div>
      <a href="/calculadora-financeira?x=1">internal</a>
      <a href="/#secao">same page hash</a>
      <a href="https://outro-site.com/">external</a>
      <a href="/geo-aeo" target="_blank" rel="noreferrer">new tab</a>
      <a href="/arquivo.pdf" download>download</a>
    </div>
  );
}

function beforeUnload(): Event {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("useExitGuard", () => {
  it("asks the browser to confirm closing or reloading only while active", () => {
    const { rerender } = render(
      <Harness active={false} onInternalNavigation={vi.fn()} />,
    );
    expect(beforeUnload().defaultPrevented).toBe(false);

    rerender(<Harness active onInternalNavigation={vi.fn()} />);
    expect(beforeUnload().defaultPrevented).toBe(true);

    rerender(<Harness active={false} onInternalNavigation={vi.fn()} />);
    expect(beforeUnload().defaultPrevented).toBe(false);
  });

  it("intercepts same-origin link clicks while active and hands over the target", () => {
    const onInternalNavigation = vi.fn();
    const { getByText } = render(
      <Harness active onInternalNavigation={onInternalNavigation} />,
    );

    const notCancelled = fireEvent.click(getByText("internal"));

    expect(notCancelled).toBe(false);
    expect(onInternalNavigation).toHaveBeenCalledTimes(1);
    const url = onInternalNavigation.mock.calls[0][0] as URL;
    expect(url.pathname + url.search).toBe("/calculadora-financeira?x=1");
  });

  it("does not interfere with navigation while inactive", () => {
    const onInternalNavigation = vi.fn();
    const { getByText } = render(
      <Harness active={false} onInternalNavigation={onInternalNavigation} />,
    );

    const link = getByText("internal");
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);

    expect(onInternalNavigation).not.toHaveBeenCalled();
  });

  it.each([
    ["external", "external links are covered by the native prompt"],
    ["same page hash", "hash-only changes keep the page"],
    ["new tab", "links that open elsewhere leave this page untouched"],
    ["download", "downloads do not leave the page"],
  ])("lets the %s link through (%s)", (label) => {
    const onInternalNavigation = vi.fn();
    const { getByText } = render(
      <Harness active onInternalNavigation={onInternalNavigation} />,
    );
    const link = getByText(label);
    // Keep jsdom from attempting a real navigation.
    link.addEventListener("click", (event) => event.preventDefault());

    fireEvent.click(link);

    expect(onInternalNavigation).not.toHaveBeenCalled();
  });

  it("lets modified clicks through so users can open links in new tabs", () => {
    const onInternalNavigation = vi.fn();
    const { getByText } = render(
      <Harness active onInternalNavigation={onInternalNavigation} />,
    );
    const link = getByText("internal");
    link.addEventListener("click", (event) => event.preventDefault());

    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { shiftKey: true });
    fireEvent.click(link, { button: 1 });

    expect(onInternalNavigation).not.toHaveBeenCalled();
  });

  it("stops listening after unmount", () => {
    const { unmount } = render(<Harness active onInternalNavigation={vi.fn()} />);
    unmount();

    expect(beforeUnload().defaultPrevented).toBe(false);
  });
});
