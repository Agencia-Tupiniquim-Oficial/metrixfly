const MIN_DURATION_MS = 700;
const MAX_EXTRA_DURATION_MS = 700;
const EXTRA_DURATION_DISTANCE_PX = 3500;

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Longer trips take longer, up to a cap, so short and long jumps both feel gentle. */
export function scrollDuration(distance: number): number {
  const ratio = Math.min(Math.abs(distance) / EXTRA_DURATION_DISTANCE_PX, 1);
  return MIN_DURATION_MS + ratio * MAX_EXTRA_DURATION_MS;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Animates the window scroll to `top`; any wheel, touch or key input cancels it. */
export function smoothScrollTo(top: number): void {
  const maxTop = document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.min(Math.max(top, 0), Math.max(maxTop, 0));
  const start = window.scrollY;
  const distance = target - start;

  if (prefersReducedMotion() || Math.abs(distance) < 1) {
    window.scrollTo({ top: target, behavior: "instant" });
    return;
  }

  const duration = scrollDuration(distance);
  const startTime = performance.now();
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo({ top: start + distance * easeInOutCubic(progress), behavior: "instant" });
    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  };

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  frame = requestAnimationFrame(step);
}

/** Smooth-scrolls in-page `#anchor` links; returns the cleanup function. */
export function enableAnchorSmoothScroll(): () => void {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href^='#']");
    const hash = link?.getAttribute("href");
    if (!hash || hash.length < 2) return;

    const element = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!element) return;

    event.preventDefault();
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    smoothScrollTo(element.getBoundingClientRect().top + window.scrollY - offset);
    history.pushState(null, "", hash);
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
