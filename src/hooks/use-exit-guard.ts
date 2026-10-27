import { useEffect, useRef } from "react";

type ExitGuardOptions = {
  /** Guard only while there is something to lose (for example unsent form data). */
  active: boolean;
  /**
   * Called instead of navigating when a same-origin link is clicked. Closing,
   * reloading or leaving the site cannot be intercepted with a custom UI: the
   * browser shows its own confirmation through `beforeunload`.
   */
  onInternalNavigation: (target: URL) => void;
};

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function useExitGuard({ active, onInternalNavigation }: ExitGuardOptions): void {
  const onInternalNavigationRef = useRef(onInternalNavigation);
  onInternalNavigationRef.current = onInternalNavigation;

  useEffect(() => {
    if (!active) return;

    const confirmBrowserExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by some browsers; the message text itself is ignored.
      event.returnValue = "";
    };

    const interceptInternalLinks = (event: MouseEvent) => {
      if (event.defaultPrevented || !isPlainLeftClick(event)) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) return;
      if (
        target.pathname === window.location.pathname &&
        target.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onInternalNavigationRef.current(target);
    };

    window.addEventListener("beforeunload", confirmBrowserExit);
    document.addEventListener("click", interceptInternalLinks, true);
    return () => {
      window.removeEventListener("beforeunload", confirmBrowserExit);
      document.removeEventListener("click", interceptInternalLinks, true);
    };
  }, [active]);
}
