import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calculator, Info, TrendingDown } from "lucide-react";
import logoColored from "@/assets/logo-colored.png";
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
    <main
      className="min-h-screen py-8 sm:py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container max-w-6xl space-y-8">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/diagnostico">
            <ArrowLeft aria-hidden="true" />
            Voltar ao diagnóstico
          </Link>
        </Button>

        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <img
            src={logoColored}
            alt="Tupiniquim"
            className="mx-auto h-16 w-16 object-contain"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Simulação de otimização
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Descubra oportunidades de melhoria para seu site
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
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
          </Card>

          <Card className="space-y-6 border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <TrendingDown aria-hidden="true" className="h-5 w-5" />
              Estimativa mensal da simulação
            </div>

            {estimate && abandonmentRate !== null ? (
              <>
                <p className="font-mono text-4xl font-bold sm:text-5xl">
                  {currency.format(estimate.estimatedMonthlyLoss)}
                  <span className="ml-2 text-base font-medium">/ mês</span>
                </p>
                <div className="grid gap-4 border-t border-rose-200 pt-5 dark:border-rose-900 sm:grid-cols-2">
                  <div>
                    <p className="text-sm">Visitantes que podem desistir</p>
                    <p className="mt-1 font-mono text-xl font-semibold">
                      ~{number.format(estimate.abandonedVisitors)} acessos
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Taxa de abandono usada</p>
                    <p className="mt-1 font-mono text-xl font-semibold">
                      {abandonmentRate}%
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed">
                  <strong>Nota mobile PageSpeed: {mobileScore}/100.</strong>{" "}
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
      </div>
    </main>
  );
}
