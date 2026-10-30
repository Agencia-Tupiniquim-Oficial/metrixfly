import { useEffect, useRef, useState } from "react";

const canObserve = () =>
  typeof window !== "undefined" &&
  typeof IntersectionObserver !== "undefined" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Tells when an element has scrolled into view, once. Without IntersectionObserver
 * or with reduced motion it is visible from the start, so nothing stays hidden.
 */
export function useReveal<T extends Element = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [animated] = useState(canObserve);
  const [visible, setVisible] = useState(!animated);

  useEffect(() => {
    const element = ref.current;
    if (!animated || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [animated]);

  return { ref, visible, animated };
}
