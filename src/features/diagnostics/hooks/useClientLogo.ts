import { useEffect, useState } from "react";
import { getClientLogoDataUrl } from "@/features/diagnostics/services/client-logo";

export function useClientLogo(url: string): string | null {
  const [loadedLogo, setLoadedLogo] = useState<{
    url: string;
    dataUrl: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    void getClientLogoDataUrl(url).then((dataUrl) => {
      if (active && dataUrl) setLoadedLogo({ url, dataUrl });
    });

    return () => {
      active = false;
    };
  }, [url]);

  return loadedLogo?.url === url ? loadedLogo.dataUrl : null;
}
