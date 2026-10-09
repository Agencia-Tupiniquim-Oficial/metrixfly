import coverHeader from "@/assets/logo-colored.png";
import type { BusinessSummary, Priority } from "@/lib/business-report";
import React, { useState, useEffect } from "react";

type Props = {
  url: string;
  summary: BusinessSummary;
  editable?: boolean;
  onSummaryChange?: (updated: BusinessSummary) => void;
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Bree Serif', Georgia, serif",
};

function Page({ children, withHeader = false }: { children: React.ReactNode; withHeader?: boolean }) {
  return (
    <div
      className="bg-report-paper text-report-text mx-auto shadow-lg overflow-hidden"
      style={{ width: "100%", maxWidth: 780, minHeight: 1100, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {withHeader && (
        <div className="flex justify-center px-[92px] pt-8">
          <img
            src={coverHeader}
            alt="Logo Tupiniquim"
            className="h-24 w-24 object-contain"
          />
        </div>
      )}
      <div className={withHeader ? "px-[92px] pt-12 pb-16" : "px-[92px] py-16"}>{children}</div>
    </div>
  );
}

function EditableText({
  value,
  onChange,
  className = "",
  multiline = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  if (!onChange) return <span className={className}>{value}</span>;

  if (multiline) {
    return (
      <textarea
        defaultValue={value}
        rows={Math.max(2, Math.ceil(value.length / 70))}
        className={`w-full rounded border border-border/80 bg-background/50 p-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
        onBlur={(e) => onChange(e.currentTarget.value.trim())}
      />
    );
  }

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      className={`outline-none focus:bg-emerald-500/10 focus:ring-1 focus:ring-emerald-500 rounded px-1 ${className}`}
      onBlur={(e) => onChange(e.currentTarget.textContent?.trim() ?? "")}
    >
      {value}
    </span>
  );
}

function Bullets({
  items,
  editable = false,
  onChange,
}: {
  items: string[];
  editable?: boolean;
  onChange?: (items: string[]) => void;
}) {
  const [local, setLocal] = useState<string[]>(items ?? []);
  useEffect(() => setLocal(items ?? []), [items]);

  if (!editable) {
    return (
      <ul className="list-disc pl-10 space-y-1 text-[15px] text-[#333333] leading-relaxed">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  }

  const handleBlur = () => {
    const cleaned = local.map((l) => l.trim()).filter(Boolean);
    onChange?.(cleaned);
  };

  const updateAt = (index: number, value: string) => {
    setLocal((cur) => {
      const copy = [...cur];
      copy[index] = value;
      return copy;
    });
  };

  const addItem = () => setLocal((cur) => [...cur, ""]);
  const removeAt = (index: number) => {
    const updated = local.filter((_, i) => i !== index);
    setLocal(updated);
    onChange?.(updated.map((l) => l.trim()).filter(Boolean));
  };

  return (
    <div className="space-y-2">
      <ul className="list-disc pl-10 space-y-1 text-[15px] text-[#333333] leading-relaxed">
        {local.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              contentEditable
              suppressContentEditableWarning
              className="outline-none flex-1 rounded px-1 focus:bg-emerald-500/10 focus:ring-1 focus:ring-emerald-500"
              onInput={(e) => updateAt(i, (e.currentTarget.textContent ?? "").replace(/\u00A0/g, " "))}
              onBlur={handleBlur}
              dangerouslySetInnerHTML={{ __html: it }}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="text-xs text-muted-foreground hover:text-destructive px-1"
              aria-label="Remover item"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 pl-10">
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-medium text-[#008F4C] hover:underline"
        >
          + Adicionar ponto de impacto
        </button>
      </div>
    </div>
  );
}

export default function BusinessDocxPreview({
  url,
  summary,
  editable = false,
  onSummaryChange,
}: Props) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./i, "").toUpperCase();
    } catch {
      return "SITE";
    }
  })();

  const updateField = <K extends keyof BusinessSummary>(field: K, value: BusinessSummary[K]) => {
    if (!onSummaryChange) return;
    onSummaryChange({
      ...summary,
      [field]: value,
    });
  };

  const updatePriority = (index: number, field: keyof Priority, value: string) => {
    if (!onSummaryChange) return;
    const updatedPriorities = summary.prioridades.map((p, i) =>
      i === index ? { ...p, [field]: value } : p,
    );
    onSummaryChange({
      ...summary,
      prioridades: updatedPriorities,
    });
  };

  return (
    <div className="space-y-6">
      {/* Página 1 */}
      <Page withHeader>
        <div>
          <h1
            className="text-[28px] mb-8 text-[#008F4C]"
            style={{ fontFamily: "'Bree Serif', Georgia, serif" }}
          >
            {hostname} - RELATÓRIO EXECUTIVO
          </h1>

          <h2 className="text-[27px] pb-2 mt-8 mb-4 text-[#008F4C]" style={sectionTitleStyle}>
            Visão geral
          </h2>
          <div className="text-[15px] text-[#333333] leading-relaxed mb-6">
            <EditableText
              value={summary.resumo}
              onChange={editable ? (val) => updateField("resumo", val) : undefined}
              multiline={editable}
            />
          </div>

          <h2 className="text-[27px] pb-2 mt-8 mb-4 text-[#008F4C]" style={sectionTitleStyle}>
            O que isso significa para o negócio
          </h2>
          <div className="text-[15px] text-[#333333] leading-relaxed mb-4">
            <EditableText
              value={summary.contexto}
              onChange={editable ? (val) => updateField("contexto", val) : undefined}
              multiline={editable}
            />
          </div>

          <Bullets
            items={summary.impactoNegocio}
            editable={editable}
            onChange={editable ? (items) => updateField("impactoNegocio", items) : undefined}
          />
        </div>
      </Page>

      {/* Página 2 */}
      <Page>
        <div>
          <h2 className="text-[27px] pb-2 mt-8 mb-4 text-[#008F4C]" style={sectionTitleStyle}>
            Prioridades recomendadas
          </h2>
          <div className="space-y-6 mb-8">
            {summary.prioridades.map((priority, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-[17px] font-bold text-[#008F4C]">
                  {index + 1}.{" "}
                  <EditableText
                    value={priority.titulo}
                    onChange={editable ? (val) => updatePriority(index, "titulo", val) : undefined}
                  />
                </h3>
                <div className="text-[15px] text-[#333333] leading-relaxed">
                  <span className="font-bold">Por que importa: </span>
                  <EditableText
                    value={priority.porQueImporta}
                    onChange={editable ? (val) => updatePriority(index, "porQueImporta", val) : undefined}
                    multiline={editable}
                  />
                </div>
                <div className="text-[15px] text-[#333333] leading-relaxed">
                  <span className="font-bold">O que fazer: </span>
                  <EditableText
                    value={priority.acao}
                    onChange={editable ? (val) => updatePriority(index, "acao", val) : undefined}
                    multiline={editable}
                  />
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-[27px] pb-2 mt-8 mb-4 text-[#008F4C]" style={sectionTitleStyle}>
            Próximo passo
          </h2>
          <div className="text-[15px] text-[#333333] leading-relaxed mb-12">
            <EditableText
              value={summary.proximoPasso}
              onChange={editable ? (val) => updateField("proximoPasso", val) : undefined}
              multiline={editable}
            />
          </div>

          <p className="text-center text-sm italic text-[#666666]">
            Relatório preparado pela Tupiniquim
          </p>
        </div>
      </Page>
    </div>
  );
}
