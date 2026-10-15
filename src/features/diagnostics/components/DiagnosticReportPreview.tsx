import coverHeader from "@/assets/logo-colored.png";
import LighthouseCard from "@/features/diagnostics/components/LighthouseCard";
import React, { useState, useEffect, useRef } from "react";
import {
  DIAGNOSTIC_REPORT_COLORS,
  DIAGNOSTIC_REPORT_FONTS,
  DIAGNOSTIC_REPORT_LAYOUT,
  DIAGNOSTIC_REPORT_TYPOGRAPHY,
} from "@/features/diagnostics/components/diagnostic-report-design";
import type {
  Improvement,
  PageSummary,
  UiUxSummary,
} from "@/features/diagnostics/model/diagnose";

type Props = {
  url: string;
  mobile: PageSummary;
  desktop: PageSummary;
  improvements: Improvement[];
  uiux?: UiUxSummary | null;
  extras?: { title: string; description: string }[];
  editable?: boolean;
  onImprovementChange?: (index: number, field: keyof Improvement, value: string | string[]) => void;
  onUiuxOverviewChange?: (value: string) => void;
  onHeaderChange?: (url: string) => void;
  onOpportunitiesChange?: (device: "desktop" | "mobile", items: string[]) => void;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-normal"
      style={{
        color: DIAGNOSTIC_REPORT_COLORS.greenSoft,
        fontFamily: DIAGNOSTIC_REPORT_FONTS.webHeading,
        ...DIAGNOSTIC_REPORT_TYPOGRAPHY.section,
      }}
    >
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="font-bold"
      style={{
        color: DIAGNOSTIC_REPORT_COLORS.heading,
        ...DIAGNOSTIC_REPORT_TYPOGRAPHY.subheading,
      }}
    >
      {children}
    </h4>
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
      <ul
        className="list-disc pl-10 space-y-0.5"
        style={{
          color: DIAGNOSTIC_REPORT_COLORS.text,
          fontSize: DIAGNOSTIC_REPORT_TYPOGRAPHY.bullet.fontSize,
          lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.bullet.lineHeight,
        }}
      >
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
  const removeAt = (index: number) => setLocal((cur) => cur.filter((_, i) => i !== index));

  return (
    <div>
      <ul
        className="list-disc pl-10 space-y-0.5"
        style={{
          color: DIAGNOSTIC_REPORT_COLORS.text,
          fontSize: DIAGNOSTIC_REPORT_TYPOGRAPHY.bullet.fontSize,
          lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.bullet.lineHeight,
        }}
      >
        {local.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              contentEditable
              suppressContentEditableWarning
              className="outline-none flex-1 whitespace-pre-wrap"
              onInput={(e) => updateAt(i, (e.currentTarget.textContent ?? "").replace(/\u00A0/g, " "))}
              onBlur={handleBlur}
              dangerouslySetInnerHTML={{ __html: it }}
            />
            <button
              type="button"
              onClick={() => {
                removeAt(i);
                // call onChange after removal
                setTimeout(() => onChange?.(local.filter((_, idx) => idx !== i).map((l) => l.trim()).filter(Boolean)), 0);
              }}
              className="text-xs text-muted-foreground"
              aria-label="Remover item"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <button type="button" onClick={addItem} className="text-sm text-primary underline">
          Adicionar item
        </button>
        <p className="text-xs text-muted-foreground mt-1">Pressione fora do campo para salvar.</p>
      </div>
    </div>
  );
}

function EditableText({ value, onChange, className = "" }: { value: string; onChange?: (value: string) => void; className?: string }) {
  if (!onChange) return <>{value}</>;
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      className={`outline-none focus:bg-report-green-soft/10 focus:ring-1 focus:ring-report-green-soft ${className}`}
      onBlur={(event) => onChange(event.currentTarget.textContent ?? "")}
    >
      {value}
    </span>
  );
}

function Page({ children, withHeader = false }: { children: React.ReactNode; withHeader?: boolean }) {
  return (
    <div
      className="mx-auto shadow-lg overflow-hidden"
      style={{
        width: "100%",
        maxWidth: DIAGNOSTIC_REPORT_LAYOUT.pageWidth,
        minHeight: DIAGNOSTIC_REPORT_LAYOUT.pageMinHeight,
        backgroundColor: DIAGNOSTIC_REPORT_COLORS.paper,
        color: DIAGNOSTIC_REPORT_COLORS.text,
        fontFamily: DIAGNOSTIC_REPORT_FONTS.webBody,
      }}
    >
      {withHeader && (
        <div
          className="flex justify-center"
          style={{
            paddingLeft: DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX,
            paddingRight: DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX,
            paddingTop: DIAGNOSTIC_REPORT_LAYOUT.coverTopPadding,
          }}
        >
          <img
            src={coverHeader}
            alt="Logo Tupiniquim"
            className="h-24 w-24 object-contain"
          />
        </div>
      )}
      <div
        style={{
          paddingLeft: DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX,
          paddingRight: DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX,
          paddingTop: withHeader ? 48 : DIAGNOSTIC_REPORT_LAYOUT.pagePaddingY,
          paddingBottom: withHeader ? 64 : DIAGNOSTIC_REPORT_LAYOUT.pagePaddingY,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function DiagnosticReportPreview({
  url,
  mobile,
  desktop,
  improvements,
  uiux,
  extras,
  editable = false,
  onImprovementChange,
  onUiuxOverviewChange,
  onOpportunitiesChange,
}: Props) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace("www.", "").toUpperCase();
    } catch {
      return "SITE";
    }
  })();

  return (
    <div className="space-y-6">
      {/* Capa */}
      <Page withHeader>
        <div>
          <h1
            className="font-normal"
            style={{
              color: DIAGNOSTIC_REPORT_COLORS.green,
              fontFamily: DIAGNOSTIC_REPORT_FONTS.webHeading,
              ...DIAGNOSTIC_REPORT_TYPOGRAPHY.title,
            }}
          >
            {hostname} - DIAGNÓSTICO DE SITE
          </h1>
          <SectionTitle>Sugestões de melhoria</SectionTitle>
          {improvements.slice(0, DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount).map((imp, i) => (
            <div
              key={i}
              style={{ marginBottom: DIAGNOSTIC_REPORT_LAYOUT.coverImprovementGap }}
            >
              <h3
                className="font-bold"
                style={{
                  color: DIAGNOSTIC_REPORT_COLORS.heading,
                  ...DIAGNOSTIC_REPORT_TYPOGRAPHY.coverImprovementTitle,
                }}
              >
                {i + 1}. <EditableText value={imp.title} onChange={editable ? (value) => onImprovementChange?.(i, "title", value) : undefined} />
              </h3>
              {(imp.description || imp.problem) && (
                <>
                  <SubTitle>Descrição</SubTitle>
                  <p
                    style={{
                      color: DIAGNOSTIC_REPORT_COLORS.text,
                      ...DIAGNOSTIC_REPORT_TYPOGRAPHY.coverDescription,
                    }}
                  >
                    <EditableText value={imp.description ?? imp.problem ?? ""} onChange={editable ? (value) => onImprovementChange?.(i, "description", value) : undefined} />
                  </p>
                </>
              )}
              {imp.impact?.length ? (
                <>
                  <SubTitle>Impacto</SubTitle>
                  <Bullets items={imp.impact} editable={editable} onChange={editable ? (items) => onImprovementChange?.(i, "impact", items) : undefined} />
                </>
              ) : null}
              {imp.causes?.length ? (
                <>
                  <SubTitle>Causas comuns</SubTitle>
                  <Bullets items={imp.causes} editable={editable} onChange={editable ? (items) => onImprovementChange?.(i, "causes", items) : undefined} />
                </>
              ) : null}
              {imp.recommendations?.length ? (
                <>
                  <SubTitle>Recomendações</SubTitle>
                  <Bullets items={imp.recommendations} editable={editable} onChange={editable ? (items) => onImprovementChange?.(i, "recommendations", items) : undefined} />
                </>
              ) : null}
            </div>
          ))}
        </div>
      </Page>

      {/* Conteúdo */}
      <Page>
        {improvements.slice(DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount).map((imp, i) => (
          <div
            key={i}
            style={{ marginBottom: DIAGNOSTIC_REPORT_LAYOUT.contentImprovementGap }}
          >
            <h3
              className="font-bold"
              style={{
                color: DIAGNOSTIC_REPORT_COLORS.heading,
                ...DIAGNOSTIC_REPORT_TYPOGRAPHY.contentImprovementTitle,
              }}
            >
              {i + DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount + 1}.{" "}
              <EditableText
                value={imp.title}
                onChange={editable ? (value) => onImprovementChange?.(i + DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount, "title", value) : undefined}
              />
            </h3>
            {(imp.description || imp.problem) && (
              <>
                <SubTitle>Descrição</SubTitle>
                <p
                  style={{
                    color: DIAGNOSTIC_REPORT_COLORS.text,
                    ...DIAGNOSTIC_REPORT_TYPOGRAPHY.description,
                  }}
                >
                  <EditableText
                    value={imp.description ?? imp.problem ?? ""}
                    onChange={editable ? (value) => onImprovementChange?.(i + DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount, "description", value) : undefined}
                  />
                </p>
              </>
            )}
            {imp.impact?.length ? (
              <>
                <SubTitle>Impacto</SubTitle>
                <Bullets items={imp.impact} editable={editable} onChange={editable ? (items) => onImprovementChange?.(i + DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount, "impact", items) : undefined} />
              </>
            ) : null}
            {imp.causes?.length ? (
              <>
                <SubTitle>Causas comuns</SubTitle>
                <Bullets items={imp.causes} editable={editable} onChange={editable ? (items) => onImprovementChange?.(i + DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount, "causes", items) : undefined} />
              </>
            ) : null}
            {imp.recommendations?.length ? (
              <>
                <SubTitle>Recomendações</SubTitle>
                <Bullets items={imp.recommendations} editable={editable} onChange={editable ? (items) => onImprovementChange?.(i + DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount, "recommendations", items) : undefined} />
              </>
            ) : null}
          </div>
        ))}

        {uiux && (
          <>
            <SectionTitle>Melhorias de UI/UX</SectionTitle>
            {uiux.overview && (
              <p
                className="mb-3"
                style={{
                  color: DIAGNOSTIC_REPORT_COLORS.text,
                  ...DIAGNOSTIC_REPORT_TYPOGRAPHY.description,
                }}
              >
                <EditableText value={uiux.overview} onChange={editable ? onUiuxOverviewChange : undefined} />
              </p>
            )}
            {uiux.diagnosis?.length ? (
              <>
                <SubTitle>Diagnóstico</SubTitle>
                <Bullets items={uiux.diagnosis} />
              </>
            ) : null}
            {uiux.recommendations?.length ? (
              <>
                <SubTitle>Recomendações</SubTitle>
                <Bullets items={uiux.recommendations} />
              </>
            ) : null}
          </>
        )}

        {extras && extras.length > 0 && (
          <>
            <SectionTitle>Sugestões extras</SectionTitle>
            {extras.map((ex, i) => (
              <div key={i} className="mb-4">
                <h3
                  className="font-bold mb-1"
                  style={{
                    color: DIAGNOSTIC_REPORT_COLORS.heading,
                    ...DIAGNOSTIC_REPORT_TYPOGRAPHY.extraTitle,
                    marginTop: 0,
                  }}
                >
                  {ex.title}
                </h3>
                <p
                  style={{
                    color: DIAGNOSTIC_REPORT_COLORS.text,
                    ...DIAGNOSTIC_REPORT_TYPOGRAPHY.description,
                  }}
                >
                  {ex.description}
                </p>
              </div>
            ))}
          </>
        )}
      </Page>

      {/* Performance */}
      <Page>
        <SectionTitle>Performance</SectionTitle>
        {([["Desktop", desktop], ["Mobile", mobile]] as const).map(([label, data]) => (
          <div key={label} className="mb-8">
            <h3 className="text-base font-bold text-report-heading mb-2">{label}:</h3>
            {/* Substituído: renderização textual + Bullets -> LighthouseCard */}

            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
              <LighthouseCard
                title={label}
                scores={data.scores}
                metrics={data.metrics}
              />
            </div>
            {data.opportunities && data.opportunities.length > 0 && (
              <>
                <SubTitle>Diagnóstico do PageSpeed</SubTitle>
                <Bullets
                  items={data.opportunities.map((o) =>
                    o.displayValue ? `${o.title} — ${o.displayValue}` : o.title,
                  )}
                  editable={editable}
                  onChange={editable ? (items) => onOpportunitiesChange?.(label === "Desktop" ? "desktop" : "mobile", items) : undefined}
                />
              </>
            )}
          </div>
        ))}
      </Page>
    </div>
  );
}
