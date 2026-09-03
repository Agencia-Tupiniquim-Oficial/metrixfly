import { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Gauge, Globe } from "lucide-react";

type Props = {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading?: boolean;
  runGeoCrawl?: (e: FormEvent) => void;
  geoLoading?: boolean;
};

export default function DiagnosticForm({ url, setUrl, onSubmit, loading, runGeoCrawl, geoLoading }: Props) {
  return (
    <Card className="p-2 bg-card border-border" style={{ boxShadow: "var(--shadow-card)" }}>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center flex-1 px-3 gap-2">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="exemplo.com.br"
            className="border-0 bg-transparent focus-visible:ring-0 text-base"
            disabled={loading}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="lg" disabled={loading} variant="hero" className="font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando…</> : <><Gauge className="w-4 h-4 mr-2" /> Diagnosticar</>}
          </Button>
          {runGeoCrawl ? (
            <Button type="button" size="lg" variant="outline" onClick={runGeoCrawl} disabled={geoLoading}>
              {geoLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Geo/AEO"}
            </Button>
          ) : (
            <Button asChild variant="outline"><Link to="/geo-aeo">Geo/AEO</Link></Button>
          )}
        </div>
      </form>
    </Card>
  );
}
