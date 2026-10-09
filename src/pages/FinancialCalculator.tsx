import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calculator,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  Info,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import logoColored from "@/assets/logo-colored.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateFinancialEstimate,
  estimateAbandonmentRate,
} from "@/lib/financial-calculator";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR");

function initialNumber(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== null
    ? Math.min(max, Math.max(min, parsed))
    : fallback;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClass = {
    default: "bg-muted/30 border-border text-foreground",
    positive:
      "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200",
    negative:
      "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200",
  }[tone];

  return (
    <Card className={`p-5 ${toneClass}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-75">{detail}</p>
    </Card>
  );
}

export default function FinancialCalculator() {
  const [searchParams] = useSearchParams();
  const mobileScore = initialNumber(searchParams.get("mobileScore"), 43, 0, 100);
  const [monthlyVisitors, setMonthlyVisitors] = useState(() =>
    initialNumber(searchParams.get("traffic"), 15000, 0, 10000000),
  );
  const [averageValue, setAverageValue] = useState(() =>
    initialNumber(searchParams.get("ticket"), 250, 0, 10000000),
  );
  const [abandonmentRate, setAbandonmentRate] = useState(() =>
    estimateAbandonmentRate(mobileScore),
  );
  const [conversionRate, setConversionRate] = useState(2);
  const [recoveryRate, setRecoveryRate] = useState(50);
  const [projectCost, setProjectCost] = useState(5000);

  const estimate = useMemo(
    () =>
      calculateFinancialEstimate({
        monthlyVisitors,
        abandonmentRate,
        conversionRate,
        averageValue,
        recoveryRate,
        projectCost,
      }),
    [
      monthlyVisitors,
      abandonmentRate,
      conversionRate,
      averageValue,
      recoveryRate,
      projectCost,
    ],
  );

  const setBoundedNumber = (
    setter: (value: number) => void,
    value: string,
    min: number,
    max: number,
  ) => {
    const parsed = Number(value);
    setter(
      Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : min,
    );
  };

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
            Planejamento financeiro
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Calculadora de retorno da otimização
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Simule como o abandono de visitantes pode afetar seu faturamento e
            estime quanto da oportunidade poderia ser recuperada.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-6 p-6 sm:p-8">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-xl font-bold text-foreground">
                  Premissas da simulação
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajuste os valores para refletir a realidade do negócio. O
                abandono inicial usa a nota mobile do diagnóstico como ponto de
                partida, mas pode ser editado.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly-visitors">
                  Visitantes mensais
                </Label>
                <Input
                  id="monthly-visitors"
                  type="number"
                  min={0}
                  max={10000000}
                  step={1000}
                  value={monthlyVisitors}
                  onChange={(event) =>
                    setBoundedNumber(
                      setMonthlyVisitors,
                      event.currentTarget.value,
                      0,
                      10000000,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Acessos totais por mês
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="average-value">
                  Ticket médio ou valor do lead
                </Label>
                <Input
                  id="average-value"
                  type="number"
                  min={0}
                  max={10000000}
                  step={50}
                  value={averageValue}
                  onChange={(event) =>
                    setBoundedNumber(
                      setAverageValue,
                      event.currentTarget.value,
                      0,
                      10000000,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Valor médio de uma venda ou oportunidade
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="abandonment-rate">
                  Taxa de abandono estimada (%)
                </Label>
                <Input
                  id="abandonment-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={abandonmentRate}
                  onChange={(event) =>
                    setBoundedNumber(
                      setAbandonmentRate,
                      event.currentTarget.value,
                      0,
                      100,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Referência inicial baseada na nota mobile{" "}
                  {number.format(mobileScore)}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversion-rate">
                  Conversão estimada (%)
                </Label>
                <Input
                  id="conversion-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={conversionRate}
                  onChange={(event) =>
                    setBoundedNumber(
                      setConversionRate,
                      event.currentTarget.value,
                      0,
                      100,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Conversões esperadas entre visitantes que abandonam
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recovery-rate">
                  Oportunidade recuperável (%)
                </Label>
                <Input
                  id="recovery-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={recoveryRate}
                  onChange={(event) =>
                    setBoundedNumber(
                      setRecoveryRate,
                      event.currentTarget.value,
                      0,
                      100,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Parcela das conversões perdidas que se pretende recuperar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-cost">
                  Investimento estimado (R$)
                </Label>
                <Input
                  id="project-cost"
                  type="number"
                  min={0}
                  max={100000000}
                  step={500}
                  value={projectCost}
                  onChange={(event) =>
                    setBoundedNumber(
                      setProjectCost,
                      event.currentTarget.value,
                      0,
                      100000000,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Custo previsto para o projeto de otimização
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 border-primary/20 bg-card p-6 sm:p-8">
            <div>
              <div className="flex items-center gap-2">
                <ChartNoAxesCombined
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <h2 className="text-xl font-bold text-foreground">
                  Resultado estimado
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Valores calculados com base nas premissas informadas.
              </p>
            </div>

            <MetricCard
              icon={TrendingDown}
              label="Faturamento potencialmente perdido"
              value={currency.format(estimate.estimatedMonthlyLoss)}
              detail={`${number.format(estimate.abandonedVisitors)} visitantes abandonam por mês`}
              tone="negative"
            />

            <MetricCard
              icon={TrendingUp}
              label="Receita recuperável estimada"
              value={currency.format(estimate.estimatedMonthlyRecovery)}
              detail={`${number.format(estimate.recoverableConversions)} conversões recuperadas por mês`}
              tone="positive"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                icon={CircleDollarSign}
                label="Potencial em 12 meses"
                value={currency.format(estimate.estimatedAnnualRecovery)}
                detail="Receita recuperável estimada no ano"
                tone="positive"
              />
              <MetricCard
                icon={ChartNoAxesCombined}
                label="ROI estimado em 12 meses"
                value={
                  estimate.annualRoiPercent === null
                    ? "—"
                    : `${number.format(Math.round(estimate.annualRoiPercent))}%`
                }
                detail={
                  estimate.annualRoiPercent === null
                    ? "Informe um investimento maior que zero"
                    : "Retorno líquido projetado sobre o investimento"
                }
                tone="default"
              />
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground">
                Como chegamos à estimativa mensal
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Visitantes que abandonam</dt>
                  <dd className="font-semibold text-foreground">
                    {number.format(estimate.abandonedVisitors)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Conversões potencialmente perdidas</dt>
                  <dd className="font-semibold text-foreground">
                    {number.format(estimate.estimatedLostConversions)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Conversões recuperáveis</dt>
                  <dd className="font-semibold text-foreground">
                    {number.format(estimate.recoverableConversions)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Investimento informado</dt>
                  <dd className="font-semibold text-foreground">
                    {currency.format(projectCost)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <Clock3
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-foreground">
                  Prazo estimado de retorno
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {estimate.paybackMonths === null
                    ? "Não há retorno calculável com os valores atuais."
                    : estimate.paybackMonths < 1
                      ? "Menos de 1 mês"
                      : `${number.format(Math.ceil(estimate.paybackMonths))} meses`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                Esta simulação é apenas uma estimativa, não uma promessa de
                resultado. O impacto real depende de fatores como origem do
                tráfego, oferta, experiência do usuário e implementação.
              </p>
            </div>
          </Card>
        </section>

      </div>
    </main>
  );
}
