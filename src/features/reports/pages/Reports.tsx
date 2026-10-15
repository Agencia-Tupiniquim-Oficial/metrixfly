import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { loadRecentReports, type RecentReport } from "@/features/reports/services/recent-reports";

export default function Reports() {
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const recentReports = await loadRecentReports();
        if (isMounted) setReports(recentReports);
      } catch (error) {
        console.error("Unable to load recent GEO reports", error);
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os relatórios.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container py-12">
      <h2 className="text-2xl font-semibold mb-6">Relatórios</h2>
      {errorMessage && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      {loading && <p className="mb-4 text-sm text-muted-foreground">Carregando relatórios...</p>}
      {!loading && !errorMessage && reports.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Ainda não há rastreamentos GEO/AEO salvos.
        </p>
      )}
      <div className="grid gap-4">
        {reports.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">{r.domain}</div>
                <div className="text-sm text-muted-foreground">{new Date(r.crawledAt).toLocaleString()}</div>
              </div>
              <div className="text-sm">
                Score GEO: <strong>{r.geoScore ?? "-"}</strong>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
