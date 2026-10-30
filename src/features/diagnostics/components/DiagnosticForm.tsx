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
            id="diagnostic-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="example.com"
            className="border-0 bg-transparent text-base focus-visible:ring-0"
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            variant="hero"
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Gauge className="mr-2 h-4 w-4" /> Run diagnostic
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
              className="flex-1 sm:flex-none"
            >
              {geoLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Geo/AEO"
              )}
            </Button>
          ) : (
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link to="/geo-aeo">Geo/AEO</Link>
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
