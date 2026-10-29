import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  Briefcase,
  Check,
  FileText,
  Gauge,
  Link2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import logoColored from "@/assets/logo-colored.png";
import { pushDataLayerEvent } from "@/lib/analytics";
import { enableAnchorSmoothScroll } from "@/lib/smooth-scroll";
import QuoteBand from "@/components/quote-band";
import FaqSection from "../components/FaqSection";
import PdfMockup from "../components/PdfMockup";
import ReportPreview from "../components/ReportPreview";

const BACK_TO_TOP_OFFSET = 400;

const navLinks = [
  { href: "#diagnosticos", label: "Diagnósticos" },
  { href: "#como", label: "Como funciona" },
  { href: "#recebe", label: "O que você recebe" },
  { href: "#duvidas", label: "Dúvidas" },
];

const diagnostics = [
  {
    icon: Gauge,
    title: "Diagnóstico de desempenho",
    description:
      "Auditoria completa com o PageSpeed Insights, no celular e no computador, traduzida em prioridades.",
    items: [
      "Notas de desempenho, acessibilidade, boas práticas e SEO",
      "FCP, LCP, TBT, CLS e Speed Index com a meta de cada um",
      "Sugestões com impacto, causas comuns e recomendação",
      "Simulação do potencial de melhoria",
    ],
  },
  {
    icon: Sparkles,
    title: "Agent Crawl GEO/AEO",
    description:
      "Descubra se o seu site está pronto para ser lido por agentes de IA e mecanismos de resposta.",
    items: [
      "Score de prontidão: GEO, AEO, técnico e autoridade",
      "robots.txt, sitemap.xml e acesso dos agentes de IA",
      "Dados estruturados (JSON-LD) e entidades por página",
      "Recomendações prioritárias e exportação em CSV",
    ],
  },
];

const steps = [
  {
    title: "Informe o site",
    description: "Digite o endereço da página que você quer analisar.",
  },
  {
    title: "Analisamos a página",
    description:
      "Medimos o desempenho no celular e no computador e checamos a visibilidade para buscadores e IAs. Você acompanha cada etapa na tela.",
  },
  {
    title: "Receba o relatório",
    description:
      "Notas, métricas e oportunidades em linguagem clara, com PDF e link para compartilhar.",
  },
];

const deliverables: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileText,
    title: "Relatório técnico em PDF",
    description: "Cada sugestão com descrição, impacto, causas comuns e recomendação.",
  },
  {
    icon: Briefcase,
    title: "Versão corporativa",
    description: "Resumo para quem decide, sem jargão técnico.",
  },
  {
    icon: Link2,
    title: "Link para compartilhar",
    description: "O diagnóstico fica salvo e pode ser aberto pela sua equipe.",
  },
];

const eyebrow = "text-xs font-bold uppercase tracking-widest text-primary";

export default function HomePage() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => enableAnchorSmoothScroll(), []);

  useEffect(() => {
    const update = () => setShowBackToTop(window.scrollY > BACK_TO_TOP_OFFSET);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const trackDiagnose = (ctaId: string) => () =>
    pushDataLayerEvent({ event: "cta_click", cta_id: ctaId, location: "home" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <nav
          aria-label="Principal"
          className="container flex flex-wrap items-center justify-between gap-4 py-4"
        >
          <Link to="/" aria-label="Metricfly, página inicial" className="flex items-center gap-2.5">
            <img src={logoColored} alt="" className="h-10 w-10 object-contain" />
            <span className="text-xl font-extrabold tracking-tight">Metricfly</span>
          </Link>
          <div className="flex items-center gap-7">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
              >
                {label}
              </a>
            ))}
            <Button asChild variant="hero" className="hidden sm:inline-flex">
              <Link to="/diagnostico" onClick={trackDiagnose("home_header_diagnose")}>
                Diagnosticar meu site
              </Link>
            </Button>
            <ThemeToggle inline />
          </div>
        </nav>
      </header>

      <main>
        <section id="topo" className="border-b border-border bg-secondary/60">
          <div className="container grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-14">
            <div className="flex min-w-0 flex-col gap-6">
              <p className="inline-flex self-start rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary">
                Desempenho · SEO · Visibilidade em IA
              </p>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                Seu site carrega rápido, aparece no Google e é{" "}
                <span className="text-primary">citado por IAs</span>?
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Receba notas, métricas e oportunidades de melhoria
                explicadas para quem não é técnico, com relatório em PDF pronto para
                compartilhar.
              </p>

              <Button asChild size="lg" variant="hero" className="self-start">
                <Link to="/diagnostico" onClick={trackDiagnose("home_diagnose")}>
                  <Gauge aria-hidden="true" className="mr-2 h-4 w-4" />
                  Diagnosticar meu site
                </Link>
              </Button>
            </div>

            <ReportPreview />
          </div>
        </section>

        <section id="diagnosticos" className="container space-y-10 py-16 md:py-24">
          <div className="max-w-2xl space-y-3">
            <p className={eyebrow}>Dois diagnósticos</p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Como o site funciona hoje, e se ele vai ser encontrado amanhã.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {diagnostics.map(({ icon: Icon, title, description, items }, index) => (
              <Card key={title} className="flex flex-col gap-4 border-border bg-card p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                </span>
                <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
                <ul className="space-y-2.5 text-sm">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {index === 0 ? (
                    <Button asChild variant="hero">
                      <Link to="/diagnostico" onClick={trackDiagnose("home_card_performance")}>
                        Diagnosticar desempenho
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link to="/diagnostico" onClick={trackDiagnose("home_card_crawl")}>
                        Rodar Agent Crawl
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="como" className="border-y border-border bg-secondary/60">
          <div className="container space-y-10 py-16 md:py-24">
            <div className="max-w-2xl space-y-3">
              <p className={eyebrow}>Como funciona</p>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                Do endereço ao relatório em três passos.
              </h2>
            </div>
            <ol className="grid gap-8 md:grid-cols-3">
              {steps.map(({ title, description }, index) => (
                <li key={title} className="flex flex-col gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="recebe" className="container py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-5">
              <p className={eyebrow}>O que você recebe</p>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                Um relatório para decidir, não só para ler.
              </h2>
              <ul className="space-y-4">
                {deliverables.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold">{title}</span>
                      <span className="text-sm text-muted-foreground">{description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <PdfMockup />
          </div>
        </section>

        <FaqSection />

        <QuoteBand location="home" />
      </main>

      <footer className="border-t border-border">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img src={logoColored} alt="" className="h-7 w-7 object-contain" />
            <span>Metricfly · uma ferramenta da Agência Tupiniquim</span>
          </div>
          <p className="max-w-lg">
            O PageSpeed Insights é um serviço do Google. Os resultados refletem o
            momento da análise e podem variar entre medições.
          </p>
        </div>
      </footer>

      {showBackToTop && (
        <Button
          asChild
          variant="hero"
          size="icon"
          className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg md:bottom-6 md:right-6"
        >
          <a href="#topo" aria-label="Voltar ao topo">
            <ArrowUp aria-hidden="true" />
          </a>
        </Button>
      )}
    </div>
  );
}
