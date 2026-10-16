import { useEffect, useState } from "react";
import { AlertCircle, Check, Circle, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  initialDiagnosticProgress,
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

export function DiagnosticProgress({
  progress = initialDiagnosticProgress,
}: {
  progress?: DiagnosticProgressState;
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
  const resolvedStepCount = Object.values(progress).filter(
    (status) => status !== "pending" && status !== "running",
  ).length;
  const hasProgressData = Object.values(progress).some(
    (status) => status !== "pending",
  );
  const hasFailedStep = Object.values(progress).some(
    (status) => status === "failed",
  );
  const isUsingFallback = progress.ai === "fallback" || progress.ai === "skipped";

  return (
    <section aria-labelledby="diagnostic-progress-title">
      <Card className="mx-auto mt-8 max-w-2xl overflow-hidden border-border bg-card text-left shadow-md">
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-lg font-semibold text-foreground sm:text-xl"
                id="diagnostic-progress-title"
              >
                Estamos analisando seu site
              </h2>
              <p
                aria-live="polite"
                className="mt-1 text-sm text-muted-foreground"
              >
                {activeStep?.activity ??
                  "Aguardando a confirmação do serviço de diagnóstico."}
              </p>
            </div>
          </div>

          <div className="mb-6">
            {hasProgressData && (
              <p className="mb-1.5 text-right text-xs text-muted-foreground">
                {resolvedStepCount} de {steps.length} etapas processadas
              </p>
            )}
            <div
              aria-label={
                hasProgressData
                  ? "Progresso das etapas do diagnóstico"
                  : "Progresso indeterminado"
              }
              aria-valuemax={steps.length}
              aria-valuemin={0}
              aria-valuenow={hasProgressData ? resolvedStepCount : undefined}
              aria-valuetext={
                hasProgressData
                  ? `${resolvedStepCount} de ${steps.length} etapas processadas`
                  : undefined
              }
              className="h-1.5 overflow-hidden rounded-full bg-primary/10"
              role="progressbar"
            >
              {hasProgressData ? (
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${(resolvedStepCount / steps.length) * 100}%`,
                  }}
                />
              ) : (
                <div className="h-full w-1/3 rounded-full bg-primary animate-diagnostic-progress motion-reduce:animate-none" />
              )}
            </div>
          </div>

          <ol className="space-y-4">
            {steps.map(({ id, label }) => {
              const status = progress[id];
              return (
                <li className="flex items-start gap-3 sm:items-center" key={id}>
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
    </section>
  );
}
