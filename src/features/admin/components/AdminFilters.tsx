import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  presetRange,
  type DateRange,
  type RangePreset,
  type StatusFilter,
} from "@/features/admin/services/admin-insights";

export type AdminFilterState = {
  preset: RangePreset;
  range: DateRange;
  status: StatusFilter;
  term: string;
};

export const defaultFilters: AdminFilterState = {
  preset: "all",
  range: { from: "", to: "" },
  status: "all",
  term: "",
};

const presets: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "all", label: "Tudo" },
];

const statuses: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos os orçamentos" },
  { value: "requested", label: "Pediu orçamento" },
  { value: "opened", label: "Abriu o formulário" },
  { value: "none", label: "Sem orçamento" },
];

const fieldLabel = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const control =
  "min-h-11 rounded-xl border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type AdminFiltersProps = {
  value: AdminFilterState;
  onChange: (next: AdminFilterState) => void;
};

export function AdminFilters({ value, onChange }: AdminFiltersProps) {
  const dirty = value.preset !== "all" || value.status !== "all" || value.term.trim() !== "";

  return (
    <Card className="border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="space-y-1.5">
          <p className={fieldLabel}>Período</p>
          <div role="group" aria-label="Período" className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                size="sm"
                variant={value.preset === preset.value ? "default" : "outline"}
                aria-pressed={value.preset === preset.value}
                onClick={() =>
                  onChange({ ...value, preset: preset.value, range: presetRange(preset.value) })
                }
                className="min-h-10"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1.5">
            <span className={fieldLabel}>De</span>
            <input
              type="date"
              aria-label="Data inicial"
              value={value.range.from}
              max={value.range.to || undefined}
              onChange={(event) =>
                onChange({
                  ...value,
                  preset: "custom",
                  range: { ...value.range, from: event.target.value },
                })
              }
              className={`${control} block`}
            />
          </label>
          <label className="space-y-1.5">
            <span className={fieldLabel}>Até</span>
            <input
              type="date"
              aria-label="Data final"
              value={value.range.to}
              min={value.range.from || undefined}
              onChange={(event) =>
                onChange({
                  ...value,
                  preset: "custom",
                  range: { ...value.range, to: event.target.value },
                })
              }
              className={`${control} block`}
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className={fieldLabel}>Orçamento</span>
          <select
            aria-label="Filtrar por orçamento"
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as StatusFilter })}
            className={`${control} block`}
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <div className="min-w-56 flex-1 space-y-1.5">
          <span className={fieldLabel}>Busca</span>
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Buscar domínio ou e-mail"
              placeholder="Buscar domínio ou e-mail"
              value={value.term}
              onChange={(event) => onChange({ ...value, term: event.target.value })}
              className="h-10 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>
        </div>

        {dirty && (
          <Button type="button" variant="ghost" onClick={() => onChange(defaultFilters)}>
            <X aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </Card>
  );
}
