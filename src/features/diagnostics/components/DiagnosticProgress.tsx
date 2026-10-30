import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Circle, Minus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  diagnosticWaitingPhrases,
  estimateDiagnosticPercent,
  initialDiagnosticProgress,
  resolvedStageCount,
  type DiagnosticProgressState,
  type DiagnosticProgressStatus,
} from "@/features/diagnostics/model/diagnostic-progress";

const steps = [
  {
    id: "starting",
    label: "Iniciando a análise do site",
    activity: "Validando o endereço e iniciando as consultas.",
  },
  {
    id: "mobile",
    label: "PageSpeed para dispositivos móveis",
    activity: "Executando a auditoria de performance para dispositivos móveis.",
  },
  {
    id: "desktop",
    label: "PageSpeed para desktop",
    activity: "Executando a auditoria de performance para desktop.",
  },
  {
    id: "ai",
    label: "Análise das oportunidades",
    activity: "Organizando as oportunidades e gerando recomendações.",
  },
  {
    id: "finalizing",
    label: "Preparação do diagnóstico",
    activity: "Montando os resultados para exibir o diagnóstico.",
  },
] as const;

function getStepStatusMessage(status: DiagnosticProgressStatus): string {
  switch (status) {
    case "running":
      return "Em andamento";
    case "completed":
      return "Concluído";
    case "failed":
      return "Não concluída";
    case "fallback":
      return "Concluído com alternativa";
    case "skipped":
      return "Ignorado";
    default:
      return "Pendente";
  }
}

function StepIcon({ status }: { status: DiagnosticProgressStatus }) {
  if (status === "completed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check aria-hidden="true" className="h-4 w-4" />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/20">
        <Circle
          aria-hidden="true"
          className="h-2.5 w-2.5 animate-pulse fill-current motion-reduce:animate-none"
        />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle aria-hidden="true" className="h-4 w-4" />
      </span>
    );
  }
  if (status === "fallback" || status === "skipped") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Minus aria-hidden="true" className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
      <Circle aria-hidden="true" className="h-2.5 w-2.5 fill-current" />
    </span>
  );
}

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const PHRASE_SECONDS = 5;

function PercentRing({ percent }: { percent: number }) {
  return (
    <svg
      aria-hidden="true"
      className="h-32 w-32 -rotate-90"
      viewBox="0 0 120 120"
    >
      <circle cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="8" className="stroke-primary/15" />
      <circle
        cx="60"
        cy="60"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(percent / 100) * RING_LENGTH} ${RING_LENGTH}`}
        className="stroke-primary transition-[stroke-dasharray] duration-700 motion-reduce:transition-none"
      />
    </svg>
  );
}

export function DiagnosticProgress({
  progress = initialDiagnosticProgress,
  domain,
}: {
  progress?: DiagnosticProgressState;
  domain?: string;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setElapsedSeconds((elapsed) => elapsed + 1),
      1000,
    );
    return () => window.clearInterval(interval);
  }, []);

  const activeStep = steps.find(({ id }) => progress[id] === "running");
  const resolvedStepCount = resolvedStageCount(progress);
  const stageKey = steps.map(({ id }) => progress[id]).join("|");
  const [stageMark, setStageMark] = useState({ key: stageKey, at: 0 });
  useEffect(() => {
    setStageMark((current) =>
      current.key === stageKey ? current : { key: stageKey, at: elapsedSeconds },
    );
    // Only a change of stage restarts the clock; the seconds themselves must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey]);
  const peakPercent = useRef(0);
  peakPercent.current = Math.max(
    peakPercent.current,
    estimateDiagnosticPercent(
      progress,
      stageMark.key === stageKey ? elapsedSeconds - stageMark.at : 0,
    ),
  );
  const percent = peakPercent.current;
  const phrase =
    diagnosticWaitingPhrases[
      Math.floor(elapsedSeconds / PHRASE_SECONDS) % diagnosticWaitingPhrases.length
    ];
  const hasProgressData = Object.values(progress).some(
    (status) => status !== "pending",
  );
  const hasFailedStep = Object.values(progress).some(
    (status) => status === "failed",
  );
  const isUsingFallback = progress.ai === "fallback" || progress.ai === "skipped";

  return (
    <section
      aria-labelledby="diagnostic-progress-title"
      className="mx-auto max-w-3xl space-y-7"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative mb-2 flex h-32 w-32 items-center justify-center">
          <PercentRing percent={percent} />
          <span className="absolute text-3xl font-extrabold tabular-nums text-foreground">
            {percent}%
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Diagnóstico de desempenho
        </p>
        <h2
          className="break-words text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
          id="diagnostic-progress-title"
        >
          {domain ? `Analisando ${domain}` : "Estamos analisando seu site"}
        </h2>
        <p className="text-lg font-semibold text-foreground">
          Aguarde enquanto o Metricfly finaliza a análise.
        </p>
        <p className="text-muted-foreground">
          Pode deixar a aba aberta: o relatório aparece aqui assim que ficar
          pronto.
        </p>
        <div className="mt-4 flex min-h-[4.5rem] w-full items-center justify-center">
          <p
            key={phrase}
            aria-hidden="true"
            className="motion-enter inline-flex max-w-xl items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-lg font-bold leading-snug text-primary md:text-xl"
          >
            <Sparkles aria-hidden="true" className="h-5 w-5 shrink-0" />
            {phrase}
          </p>
        </div>
      </div>

      <Card
        className="motion-enter overflow-hidden border-border bg-card text-left"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="p-5 sm:p-7">
          <div className="mb-5">
            <p
              aria-live="polite"
              className="text-base font-semibold text-foreground"
            >
              {activeStep?.activity ??
                "Aguardando a confirmação do serviço de diagnóstico."}
            </p>
          </div>

          <div className="mb-6">
            {hasProgressData && (
              <p className="mb-1.5 text-right text-xs text-muted-foreground">
                {resolvedStepCount} de {steps.length} etapas processadas
              </p>
            )}
            <div
              aria-label="Progresso do diagnóstico"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percent}
              aria-valuetext={`${percent}% concluído`}
              className="h-1.5 overflow-hidden rounded-full bg-primary/10"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <ol className="space-y-4">
            {steps.map(({ id, label }) => {
              const status = progress[id];
              return (
                <li
                  aria-current={status === "running" ? "step" : undefined}
                  className={`-mx-3 flex items-start gap-3 rounded-lg p-3 transition-colors duration-300 motion-reduce:transition-none sm:items-center ${
                    status === "running" ? "bg-primary/[0.06]" : ""
                  }`}
                  key={id}
                >
                  <StepIcon status={status} />
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <span
                      className={`block text-sm ${
                        status === "running" || status === "completed"
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs sm:mt-0 sm:shrink-0 ${
                        status === "failed"
                          ? "text-destructive"
                          : status === "running"
                            ? "font-medium text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {getStepStatusMessage(status)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {hasFailedStep && (
            <p
              aria-live="polite"
              className="mt-5 text-sm text-amber-700 dark:text-amber-300"
            >
              Uma das consultas não foi concluída. O diagnóstico continuará com
              os dados disponíveis.
            </p>
          )}
          {isUsingFallback && !hasFailedStep && (
            <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
              A análise inteligente está indisponível agora; vamos preparar o
              diagnóstico com os dados técnicos disponíveis.
            </p>
          )}
          {elapsedSeconds >= 60 && (
            <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
              A análise está levando mais tempo que o habitual, mas continua em
              andamento.
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-3" aria-hidden="true">
        <span className="text-xs font-semibold text-muted-foreground">
          Prévia do resultado
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <Card
              key={item}
              className="flex items-center gap-4 border-border bg-card p-5"
            >
              <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-2.5 w-3/5 rounded bg-muted" />
                <div className="h-4 w-2/5 rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
