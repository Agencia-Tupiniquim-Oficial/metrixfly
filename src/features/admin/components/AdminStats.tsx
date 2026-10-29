import type { ReactNode } from "react";
import { BarChart3, Mail, Percent, Smartphone, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AdminSummary, DayBucket } from "@/features/admin/services/admin-insights";

type StatProps = { icon: ReactNode; label: string; value: string; hint?: string };

function Stat({ icon, label, value, hint }: StatProps) {
  return (
    <Card className="border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <p className="text-sm font-medium">{label}</p>
        <span aria-hidden="true" className="rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

export function AdminStats({
  summary,
  emailsAvailable,
}: {
  summary: AdminSummary;
  emailsAvailable: boolean;
}) {
  return (
    <section aria-label="Resumo do período" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Stat
        icon={<BarChart3 className="h-4 w-4" />}
        label="Análises"
        value={String(summary.analyses)}
        hint="no período filtrado"
      />
      <Stat
        icon={<Target className="h-4 w-4" />}
        label="Pedidos de orçamento"
        value={String(summary.requests)}
      />
      <Stat
        icon={<Percent className="h-4 w-4" />}
        label="Conversão"
        value={summary.conversion === null ? "-" : percent.format(summary.conversion)}
        hint="análises que viraram pedido"
      />
      <Stat
        icon={<Smartphone className="h-4 w-4" />}
        label="Desempenho médio"
        value={summary.averageMobileScore === null ? "-" : String(summary.averageMobileScore)}
        hint="no celular, de 0 a 100"
      />
      <Stat
        icon={<Mail className="h-4 w-4" />}
        label="E-mails captados"
        value={emailsAvailable ? String(summary.uniqueEmails) : "-"}
        hint="contatos únicos"
      />
    </section>
  );
}

const dayLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export function AdminDailyChart({ series }: { series: DayBucket[] }) {
  const peak = Math.max(1, ...series.map((bucket) => bucket.analyses));
  return (
    <Card className="border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">Análises por dia</h2>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-primary/40" /> Análises
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-success" /> Com pedido
          </span>
        </p>
      </div>
      {series.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem análises no período.</p>
      ) : (
        <ul
          aria-label="Análises por dia"
          className="mt-4 flex h-36 items-end gap-1.5 overflow-x-auto pb-1"
        >
          {series.map((bucket) => {
            const label = dayLabel.format(new Date(`${bucket.day}T12:00:00`));
            return (
              <li
                key={bucket.day}
                title={`${label}: ${bucket.analyses} análise(s), ${bucket.requests} pedido(s)`}
                className="flex h-full min-w-5 flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {bucket.analyses > 0 ? bucket.analyses : ""}
                </span>
                <span
                  aria-hidden="true"
                  className="relative w-full overflow-hidden rounded-t bg-primary/40"
                  style={{ height: `${Math.max(2, (bucket.analyses / peak) * 100)}%` }}
                >
                  {bucket.analyses > 0 && (
                    <span
                      className="absolute inset-x-0 bottom-0 bg-success"
                      style={{ height: `${(bucket.requests / bucket.analyses) * 100}%` }}
                    />
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
