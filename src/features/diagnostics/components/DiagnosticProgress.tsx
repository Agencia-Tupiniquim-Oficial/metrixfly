import { useEffect, useState } from "react";
import { AlertCircle, Check, Circle, Loader2, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  initialDiagnosticProgress,
  type DiagnosticProgressState,
  type DiagnosticProgressStatus,
} from "@/features/diagnostics/model/diagnostic-progress";

const steps = [
  { id: "starting", label: "Iniciando a análise do site" },
  { id: "mobile", label: "Consultando o PageSpeed para dispositivos móveis" },
  { id: "desktop", label: "Consultando o PageSpeed para desktop" },
  { id: "ai", label: "Analisando oportunidades de melhoria" },
  { id: "finalizing", label: "Preparando o diagnóstico final" },
] as const;

function getStepStatusMessage(status: DiagnosticProgressStatus): string {
  switch (status) {
    case "running":
      return "Em andamento";
    case "completed":
      return "Concluída";
    case "failed":
      return "Não concluída";
    case "fallback":
      return "Análise alternativa";
    case "skipped":
      return "Indisponível";
    default:
      return "Aguardando";
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
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2
          aria-hidden="true"
          className="h-4 w-4 animate-spin motion-reduce:animate-none"
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
                {activeStep?.label ?? "Conectando ao serviço de diagnóstico"}
              </p>
            </div>
            <span
              aria-label={`Tempo decorrido: ${elapsedSeconds} segundos`}
              className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {elapsedSeconds}s
            </span>
          </div>

          <div
            aria-label="Progresso indeterminado"
            className="mb-6 h-1.5 overflow-hidden rounded-full bg-primary/10"
            role="progressbar"
          >
            <div className="h-full w-1/3 rounded-full bg-primary animate-diagnostic-progress" />
          </div>

          <ol className="space-y-4">
            {steps.map(({ id, label }) => {
              const status = progress[id];
              return (
                <li className="flex items-center gap-3" key={id}>
                  <StepIcon status={status} />
                  <span
                    className={`min-w-0 flex-1 text-sm ${
                      status === "running" || status === "completed"
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`hidden shrink-0 text-xs sm:inline ${
                      status === "failed"
                        ? "text-destructive"
                        : status === "running"
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {getStepStatusMessage(status)}
                  </span>
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
