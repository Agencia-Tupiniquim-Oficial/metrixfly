import { useMemo, useState } from "react";
import QuoteBand from "@/components/quote-band";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calculator, Info, TrendingDown } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  calculateFinancialEstimate,
  estimateAbandonmentRate,
} from "@/features/financial-calculator/model/financial-calculator";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR");
const DEFAULT_CONVERSION_RATE = 2;

function readMobileScore(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : null;
}

export default function FinancialCalculator() {
  const [searchParams] = useSearchParams();
  const mobileScore = readMobileScore(searchParams.get("mobileScore"));
  const [monthlyVisitors, setMonthlyVisitors] = useState(() =>
    Math.min(
      100000,
      Math.max(1000, Number(searchParams.get("traffic")) || 15000),
    ),
  );
  const [averageValue, setAverageValue] = useState(() =>
    Math.min(2000, Math.max(50, Number(searchParams.get("ticket")) || 250)),
  );

  const abandonmentRate =
    mobileScore === null ? null : estimateAbandonmentRate(mobileScore);
  const estimate = useMemo(
    () =>
      abandonmentRate === null
        ? null
        : calculateFinancialEstimate({
            monthlyVisitors,
            abandonmentRate,
            conversionRate: DEFAULT_CONVERSION_RATE,
            averageValue,
            recoveryRate: 50,
            projectCost: 5000,
          }),
    [abandonmentRate, averageValue, monthlyVisitors],
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--gradient-hero)" }}
    >
      <AppHeader />
      <main className="container max-w-6xl space-y-8 py-8 sm:py-12">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/diagnostico">
            <ArrowLeft aria-hidden="true" />
            Voltar ao diagnóstico
          </Link>
        </Button>

        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Simulação de otimização
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            Quanto a lentidão pode estar custando?
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Ajuste os dados do site para visualizar uma estimativa associada à
            nota de desempenho mobile do PageSpeed.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-8 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-bold text-foreground">
                Dados do site
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label id="monthly-visitors-label">Visitantes mensais</Label>
                <output
                  htmlFor="monthly-visitors"
                  className="font-mono font-semibold text-primary"
                >
                  {number.format(monthlyVisitors)} acessos
                </output>
              </div>
              <Slider
                id="monthly-visitors"
                aria-labelledby="monthly-visitors-label"
                min={1000}
                max={100000}
                step={1000}
                value={[monthlyVisitors]}
                onValueChange={([value]) => {
                  if (value !== undefined) setMonthlyVisitors(value);
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1.000</span>
                <span>50.000</span>
                <span>100.000</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label id="average-value-label">
                  Valor médio por conversão
                </Label>
                <output
                  htmlFor="average-value"
                  className="font-mono font-semibold text-primary"
                >
                  {currency.format(averageValue)}
                </output>
              </div>
              <Slider
                id="average-value"
                aria-labelledby="average-value-label"
                min={50}
                max={2000}
                step={50}
                value={[averageValue]}
                onValueChange={([value]) => {
                  if (value !== undefined) setAverageValue(value);
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>R$ 50</span>
                <span>R$ 1.000</span>
                <span>R$ 2.000</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use o valor médio de uma venda ou oportunidade.
              </p>
            </div>

            {abandonmentRate !== null && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3.5 text-sm">
                <span className="shrink-0 text-xl font-extrabold text-amber-700 dark:text-amber-300">
                  {mobileScore}
                </span>
                <span className="text-muted-foreground">
                  Nota mobile do diagnóstico: premissa de{" "}
                  <strong className="text-foreground">
                    {abandonmentRate}% de abandono
                  </strong>{" "}
                  e conversão de {DEFAULT_CONVERSION_RATE}%.
                </span>
              </div>
            )}
          </Card>

          <Card className="space-y-6 border-transparent bg-surface-dark p-6 text-surface-dark-foreground sm:p-8">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-300">
              <TrendingDown aria-hidden="true" className="h-5 w-5" />
              Estimativa mensal da simulação
            </div>

            {estimate && abandonmentRate !== null ? (
              <>
                <p className="font-mono text-4xl font-bold sm:text-5xl">
                  {currency.format(estimate.estimatedMonthlyLoss)}
                  <span className="ml-2 text-base font-medium">/ mês</span>
                </p>
                <div className="grid gap-4 border-t border-white/15 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm">Visitantes que podem desistir</p>
                    <p className="mt-1 font-mono text-xl font-semibold">
                      ~{number.format(estimate.abandonedVisitors)} acessos
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-surface-dark-muted">
                      Conversões que podem se perder
                    </p>
                    <p className="mt-1 font-mono text-xl font-semibold">
                      ~{number.format(estimate.estimatedLostConversions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Taxa de abandono usada</p>
                    <p className="mt-1 font-mono text-xl font-semibold">
                      {abandonmentRate}%
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-surface-dark-muted">
                  <strong className="text-surface-dark-foreground">Nota mobile PageSpeed: {mobileScore}/100.</strong>{" "}
                  Estimativa baseada em estudos do Google sobre a relação entre
                  o tempo de carregamento mobile e a desistência de compras. A
                  nota é usada como referência para a simulação, não como uma
                  medição real de abandono ou perda financeira.
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  Execute um diagnóstico PageSpeed para calcular a estimativa.
                </p>
                <p className="text-sm">
                  A nota de desempenho mobile é necessária para selecionar a
                  premissa usada nesta simulação.
                </p>
              </div>
            )}
          </Card>
        </section>

        <div className="mx-auto flex max-w-4xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Esta simulação é uma referência para explorar possíveis efeitos da
            lentidão. O PageSpeed identifica oportunidades técnicas, mas não
            mede diretamente abandono, conversões ou faturamento.
          </p>
        </div>
      </main>
      <QuoteBand location="calculadora" />
    </div>
  );
}
