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
  opportunities?: { title: string; displayValue?: string }[];
};

type Props = {
  url: string;
  mobile: SideData;
  desktop: SideData;
  improvements: Improvement[];
  uiux?: { overview?: string; diagnosis?: string[]; recommendations?: string[] } | null;
  extras?: { title: string; description: string }[];
};

const GREEN = "#008F45";
const DARK_GREEN = "#006633";

// Banner replica do header do .docx
function Header() {
  return (
    <div className="relative h-20 overflow-hidden" style={{ background: GREEN }}>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,.15) 0 8px, transparent 8px 16px)",
        }}
      />
      <div className="relative h-full flex items-center px-10">
        <span
          className="text-white text-2xl tracking-wide"
          style={{ fontFamily: "'Bree Serif', Georgia, serif" }}
        >
          tupiniquim
        </span>
      </div>
      <div className="h-1.5" style={{ background: DARK_GREEN }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl pb-2 mt-10 mb-5 border-b-2"
      style={{ fontFamily: "'Bree Serif', Georgia, serif", color: GREEN, borderColor: GREEN }}
    >
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-base font-bold text-black mt-4 mb-1.5">{children}</h4>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-1 text-[13px] text-neutral-800 leading-relaxed">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white text-black mx-auto shadow-lg"
      style={{ width: "100%", maxWidth: 780, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <Header />
      <div className="px-12 py-10">{children}</div>
    </div>
  );
}

export default function DocxPreview({ url, mobile, desktop, improvements, uiux, extras }: Props) {
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
      <Page>
        <div className="text-center py-24">
          <p className="text-xs tracking-widest text-neutral-500 font-bold mb-3">DIAGNÓSTICO DE SITE</p>
          <h1
            className="text-5xl mb-4"
            style={{ fontFamily: "'Bree Serif', Georgia, serif", color: GREEN }}
          >
            {hostname}
          </h1>
          <p className="text-sm italic text-neutral-500">{url}</p>
        </div>
      </Page>

      {/* Conteúdo */}
      <Page>
        <h3 className="text-base font-bold mb-2" style={{ color: DARK_GREEN }}>
          {hostname} - DIAGNÓSTICO DE SITE
        </h3>

        <SectionTitle>Sugestões de melhoria</SectionTitle>
        {improvements.map((imp, i) => (
          <div key={i} className="mb-6">
            <h3 className="text-base font-bold text-black mt-4 mb-2">
              {i + 1}. {imp.title}
            </h3>
            {(imp.description || imp.problem) && (
              <>
                <SubTitle>Descrição</SubTitle>
                <p className="text-[13px] text-neutral-800 leading-relaxed">
                  {imp.description ?? imp.problem}
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
              <p className="text-[13px] text-neutral-800 leading-relaxed mb-3">{uiux.overview}</p>
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
                <h3 className="text-base font-bold text-black mb-1">{ex.title}</h3>
                <p className="text-[13px] text-neutral-800 leading-relaxed">{ex.description}</p>
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
            <h3 className="text-base font-bold text-black mb-2">{label}:</h3>
            <p className="text-[13px] text-neutral-800 leading-relaxed mb-3">
              De acordo com a ferramenta PageSpeed Insights, a performance da página em dispositivos{" "}
              {label.toLowerCase()} está com a pontuação de {data.scores.performance}/100 em desempenho,{" "}
              {data.scores.accessibility}/100 em acessibilidade, {data.scores.bestPractices}/100 em práticas
              recomendadas e {data.scores.seo}/100 em SEO.
            </p>
            {data.screenshot && (
              <div className="flex justify-center my-4">
                <img
                  src={data.screenshot}
                  alt={`Screenshot ${label}`}
                  className="border border-neutral-200 rounded"
                  style={{ maxHeight: label === "Mobile" ? 360 : 260 }}
                />
              </div>
            )}
            <SubTitle>Métricas principais</SubTitle>
            <Bullets
              items={[
                `First Contentful Paint: ${data.metrics.fcp}`,
                `Largest Contentful Paint: ${data.metrics.lcp}`,
                `Total Blocking Time: ${data.metrics.tbt}`,
                `Cumulative Layout Shift: ${data.metrics.cls}`,
                `Speed Index: ${data.metrics.si}`,
              ]}
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
