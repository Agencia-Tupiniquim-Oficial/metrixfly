import coverHeader from "@/assets/tupiniquim-report-cover.png";
import LighthouseCard from "@/components/LighthouseCard";

type Improvement = {
  title: string;
  description?: string;
  problem?: string;
  impact?: string[];
  causes?: string[];
  recommendations?: string[];
};

type SideData = {
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number };
  metrics: { fcp: string; lcp: string; tbt: string; cls: string; si: string };
  screenshot?: string | null;
  pagespeedScreenshot?: string | null;
  opportunities?: { title: string; displayValue?: string }[];
};

type Props = {
  url: string;
  mobile: SideData;
  desktop: SideData;
  improvements: Improvement[];
  uiux?: { overview?: string; diagnosis?: string[]; recommendations?: string[] } | null;
  extras?: { title: string; description: string }[];
  editable?: boolean;
  onImprovementChange?: (index: number, field: keyof Improvement, value: string) => void;
  onUiuxOverviewChange?: (value: string) => void;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[27px] pb-2 mt-10 mb-5 text-report-green-soft"
      style={{ fontFamily: "'Bree Serif', Georgia, serif" }}
    >
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-base font-bold text-report-heading mt-4 mb-1.5">{children}</h4>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-10 space-y-0.5 text-[15px] text-report-text leading-relaxed">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
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
      className="bg-report-paper text-report-text mx-auto shadow-lg overflow-hidden"
      style={{ width: "100%", maxWidth: 780, minHeight: 1100, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {withHeader && <img src={coverHeader} alt="Cabeçalho Tupiniquim" className="w-full h-auto block" />}
      <div className={withHeader ? "px-[92px] pt-12 pb-16" : "px-[92px] py-16"}>{children}</div>
    </div>
  );
}

export default function DocxPreview({
  url,
  mobile,
  desktop,
  improvements,
  uiux,
  extras,
  editable = false,
  onImprovementChange,
  onUiuxOverviewChange,
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
            className="text-[28px] mb-12 text-report-green"
            style={{ fontFamily: "'Bree Serif', Georgia, serif" }}
          >
            {hostname} - DIAGNÓSTICO DE SITE
          </h1>
          <SectionTitle>Sugestões de melhoria</SectionTitle>
          {improvements.slice(0, 2).map((imp, i) => (
            <div key={i} className="mb-8">
              <h3 className="text-[18px] font-bold text-report-heading mt-6 mb-5">
                {i + 1}. <EditableText value={imp.title} onChange={editable ? (value) => onImprovementChange?.(i, "title", value) : undefined} />
              </h3>
              {(imp.description || imp.problem) && (
                <>
                  <SubTitle>Descrição</SubTitle>
                  <p className="text-[16px] text-report-text leading-relaxed">
                    <EditableText value={imp.description ?? imp.problem ?? ""} onChange={editable ? (value) => onImprovementChange?.(i, "description", value) : undefined} />
                  </p>
                </>
              )}
              {imp.impact?.length ? (
                <>
                  <SubTitle>Impacto</SubTitle>
                  <Bullets items={imp.impact} />
                </>
              ) : null}
              {imp.causes?.length ? (
                <>
                  <SubTitle>Causas comuns</SubTitle>
                  <Bullets items={imp.causes} />
                </>
              ) : null}
              {imp.recommendations?.length ? (
                <>
                  <SubTitle>Recomendações</SubTitle>
                  <Bullets items={imp.recommendations} />
                </>
              ) : null}
            </div>
          ))}
        </div>
      </Page>

      {/* Conteúdo */}
      <Page>
        <SectionTitle>Sugestões de melhoria</SectionTitle>
        {improvements.slice(2).map((imp, i) => (
          <div key={i} className="mb-6">
            <h3 className="text-base font-bold text-report-heading mt-4 mb-2">
              {i + 3}.{" "}
              <EditableText
                value={imp.title}
                onChange={editable ? (value) => onImprovementChange?.(i + 2, "title", value) : undefined}
              />
            </h3>
            {(imp.description || imp.problem) && (
              <>
                <SubTitle>Descrição</SubTitle>
                <p className="text-[15px] text-report-text leading-relaxed">
                  <EditableText
                    value={imp.description ?? imp.problem ?? ""}
                    onChange={editable ? (value) => onImprovementChange?.(i + 2, "description", value) : undefined}
                  />
                </p>
              </>
            )}
            {imp.impact?.length ? (
              <>
                <SubTitle>Impacto</SubTitle>
                <Bullets items={imp.impact} />
              </>
            ) : null}
            {imp.causes?.length ? (
              <>
                <SubTitle>Causas comuns</SubTitle>
                <Bullets items={imp.causes} />
              </>
            ) : null}
            {imp.recommendations?.length ? (
              <>
                <SubTitle>Recomendações</SubTitle>
                <Bullets items={imp.recommendations} />
              </>
            ) : null}
          </div>
        ))}

        {uiux && (
          <>
            <SectionTitle>Melhorias de UI/UX</SectionTitle>
            {uiux.overview && (
              <p className="text-[15px] text-report-text leading-relaxed mb-3">
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
                <h3 className="text-base font-bold text-report-heading mb-1">{ex.title}</h3>
                <p className="text-[15px] text-report-text leading-relaxed">{ex.description}</p>
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

            <LighthouseCard
              title={label}
              scores={{
                performance: data.scores.performance,
                accessibility: data.scores.accessibility,
                bestPractices: data.scores.bestPractices,
                seo: data.scores.seo,
                navigation: undefined,
              }}
              metrics={{
                fcp: data.metrics.fcp,
                lcp: data.metrics.lcp,
                tbt: data.metrics.tbt,
                cls: data.metrics.cls,
                si: data.metrics.si,
              }}
            />

            {data.opportunities && data.opportunities.length > 0 && (
              <>
                <SubTitle>Diagnóstico do PageSpeed</SubTitle>
                <Bullets
                  items={data.opportunities.map((o) =>
                    o.displayValue ? `${o.title} — ${o.displayValue}` : o.title,
                  )}
                />
              </>
            )}
          </div>
        ))}
      </Page>
    </div>
  );
}
