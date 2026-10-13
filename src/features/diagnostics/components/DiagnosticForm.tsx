import { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Gauge, Globe } from "lucide-react";

type Props = {
  url: string;
  setUrl: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  loading?: boolean;
  runGeoCrawl?: (event: FormEvent) => void;
  geoLoading?: boolean;
};

export default function DiagnosticForm({
  url,
  setUrl,
  onSubmit,
  loading = false,
  runGeoCrawl,
  geoLoading = false,
}: Props) {
  return (
    <Card
      className="border-border bg-card p-2"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="exemplo.com.br"
            className="border-0 bg-transparent text-base focus-visible:ring-0"
            disabled={loading}
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="lg" disabled={loading} variant="hero">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando…
              </>
            ) : (
              <>
                <Gauge className="mr-2 h-4 w-4" /> Diagnosticar
              </>
            )}
          </Button>

          {runGeoCrawl ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={runGeoCrawl}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Geo/AEO"
              )}
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/geo-aeo">Geo/AEO</Link>
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
