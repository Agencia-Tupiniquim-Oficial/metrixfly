// src/components/ui/DownloadButton.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Props = React.ComponentProps<typeof Button> & { label?: string };

export default function DownloadButton({ label = "Baixar relatório", ...props }: Props) {
  return (
    <Button {...props} variant={props.variant ?? "hero"} className={`font-semibold ${props.className ?? ""}`}>
      <Download className="mr-2 h-5 w-5" />
      {label}
    </Button>
  );
}
