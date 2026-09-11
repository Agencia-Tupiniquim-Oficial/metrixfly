// src/components/ui/IconButton.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";

export type IconButtonProps = Omit<ButtonProps, "size"> & {
  "aria-label": string;
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={props.variant ?? "ghost"}
      size={"icon"}
      className={cn("p-0 rounded-md", className)}
      {...props}
    >
      {children}
    </Button>
  );
});

IconButton.displayName = "IconButton";

export default IconButton;
