import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("reports").select("*").order("crawledAt", { ascending: false }).limit(50);
      if (!error && data) setReports(data as any[]);
    })();
  }, []);

  return (
    <div className="container py-12">
      <h2 className="text-2xl font-semibold mb-6">Relatórios</h2>
      <div className="grid gap-4">
        {reports.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">{r.domain}</div>
                <div className="text-sm text-muted-foreground">{new Date(r.crawledAt).toLocaleString()}</div>
              </div>
              <div className="text-sm">Score GEO: <strong>{r.scores?.geo ?? "-"}</strong></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
