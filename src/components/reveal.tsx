import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in ms, to cascade siblings. */
  delay?: number;
  as?: ElementType;
};

/** Fades and lifts its content in when it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const { ref, visible, animated } = useReveal();
  return (
    <Tag
      ref={ref}
      className={cn(animated && "reveal", visible && "is-visible", className)}
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
