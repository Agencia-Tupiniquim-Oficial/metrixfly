import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminAnalysis } from "@/features/admin/services/admin-api";
import type { SortDirection, SortKey } from "@/features/admin/services/admin-insights";

function scoreClasses(score: number) {
  if (score >= 90) return { text: "text-emerald-700 dark:text-emerald-300", bar: "bg-success" };
  if (score >= 50) return { text: "text-amber-700 dark:text-amber-300", bar: "bg-warning" };
  return { text: "text-rose-700 dark:text-rose-300", bar: "bg-destructive" };
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">-</span>;
  const tone = scoreClasses(score);
  return (
    <div className="flex items-center gap-3">
      <span className={`w-8 font-extrabold ${tone.text}`}>{score}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function QuoteBadge({ analysis }: { analysis: AdminAnalysis }) {
  if (analysis.quoteSubmitted > 0) {
    return (
      <Badge className="whitespace-nowrap border-transparent bg-success text-primary-foreground">
        Pediu orçamento
      </Badge>
    );
  }
  if (analysis.quoteOpened > 0) {
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        Abriu o formulário
      </Badge>
    );
  }
  return <span className="text-muted-foreground">-</span>;
}

type SortHeaderProps = {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
};

function SortHeader({ label, column, sortKey, direction, onSort, className = "" }: SortHeaderProps) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={`px-6 py-3.5 font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${active ? "text-primary" : "opacity-60"}`} />
      </button>
    </th>
  );
}

type AdminAnalysesTableProps = {
  analyses: AdminAnalysis[];
  emails: Map<string, string>;
  sortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
};

export function AdminAnalysesTable({
  analyses,
  emails,
  sortKey,
  direction,
  onSort,
}: AdminAnalysesTableProps) {
  const sort = { sortKey, direction, onSort };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="bg-muted/40 text-muted-foreground">
            <SortHeader label="Domínio" column="domain" {...sort} />
            <th scope="col" className="px-6 py-3.5 font-semibold">
              E-mail
            </th>
            <SortHeader label="Data da análise" column="date" {...sort} />
            <SortHeader label="Desempenho no celular" column="score" className="w-56" {...sort} />
            <th scope="col" className="px-6 py-3.5 font-semibold">
              Orçamento
            </th>
            <th scope="col" className="px-6 py-3.5">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {analyses.map((analysis) => (
            <tr
              key={analysis.id}
              className="border-t border-border transition-colors hover:bg-muted/30"
            >
              <td className="max-w-72 break-words px-6 py-4 font-bold">{analysis.domain}</td>
              <td className="px-6 py-4">
                {emails.get(analysis.id) ?? <span className="text-muted-foreground">-</span>}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                {new Date(analysis.createdAt).toLocaleString("pt-BR")}
              </td>
              <td className="px-6 py-4">
                <ScoreCell score={analysis.mobileScore} />
              </td>
              <td className="px-6 py-4">
                <QuoteBadge analysis={analysis} />
              </td>
              <td className="px-6 py-4 text-right">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/diagnostico/${analysis.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir o relatório de ${analysis.domain}`}
                  >
                    Abrir
                    <ExternalLink aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
