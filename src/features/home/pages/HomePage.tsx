import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Gauge, Globe, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import logoColored from "@/assets/logo-colored.png";
import { pushDataLayerEvent } from "@/lib/analytics";

const steps = [
  {
    icon: Globe,
    title: "Informe o site",
    description: "Digite o endereço da página que você quer analisar.",
  },
  {
    icon: Gauge,
    title: "Analisamos a página",
    description:
      "Medimos o desempenho no celular e no computador com o PageSpeed Insights e checamos a visibilidade para buscadores e mecanismos de resposta por IA.",
  },
  {
    icon: FileText,
    title: "Receba o relatório",
    description:
      "Veja notas, métricas e oportunidades de melhoria em linguagem clara, e baixe o relatório em PDF.",
  },
];

const deliverables = [
  "Notas de desempenho, acessibilidade, boas práticas e SEO, para celular e computador.",
  "Métricas de carregamento, como o LCP, com a meta de referência de cada uma.",
  "Lista de oportunidades de melhoria explicadas para quem não é técnico.",
  "Relatório técnico e versão corporativa em PDF.",
  "Link para compartilhar o diagnóstico com a sua equipe.",
];

export default function HomePage() {
  const [address, setAddress] = useState("");
  const addressInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const focusAddress = () => {
    addressInput.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    addressInput.current?.focus();
  };

  const startDiagnostic = (event: FormEvent) => {
    event.preventDefault();
    const site = address.trim();
    if (!site) return;

    pushDataLayerEvent({ event: "cta_click", cta_id: "home_diagnose", location: "home" });
    navigate(`/diagnostico?${new URLSearchParams({ url: site }).toString()}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="container flex h-20 items-center">
        <Link to="/" aria-label="Metricfly, página inicial">
          <img src={logoColored} alt="Metricfly" className="h-12 object-contain" />
        </Link>
      </header>

      <section className="container max-w-3xl space-y-6 py-12 text-center md:py-20">
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          Diagnóstico de desempenho, SEO e visibilidade em IA para o seu site
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
          Informe o endereço do seu site e receba um relatório com notas, métricas
          e oportunidades de melhoria para a página analisada.
        </p>

        <Card
          className="border-border bg-card p-2 text-left"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <form onSubmit={startDiagnostic} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Globe aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={addressInput}
                aria-label="Endereço do site"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="exemplo.com.br"
                className="border-0 bg-transparent text-base focus-visible:ring-0"
                required
              />
            </div>
            <Button type="submit" size="lg" variant="hero">
              <Gauge aria-hidden="true" className="mr-2 h-4 w-4" />
              Diagnosticar meu site
            </Button>
          </form>
        </Card>

      </section>

      <section className="container max-w-5xl space-y-8 py-12">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Como funciona</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title}>
              <Card className="h-full space-y-3 border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="container max-w-3xl space-y-6 py-12">
        <h2 className="text-center text-2xl font-bold md:text-3xl">O que você recebe</h2>
        <ul className="space-y-3">
          {deliverables.map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted-foreground">
              <Sparkles aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container max-w-3xl space-y-4 py-12 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Comece pelo seu site</h2>
        <p className="text-muted-foreground">
          Depois do diagnóstico, nossa equipe pode ajudar a priorizar e executar as
          melhorias.
        </p>
        <Button type="button" size="lg" variant="hero" onClick={focusAddress}>
          <Search aria-hidden="true" className="mr-2 h-4 w-4" />
          Começar agora
        </Button>
        <p className="pt-6 text-xs text-muted-foreground">
          O PageSpeed Insights é um serviço do Google. Os resultados refletem o
          momento da análise e podem variar entre medições.
        </p>
      </section>
    </main>
  );
}
