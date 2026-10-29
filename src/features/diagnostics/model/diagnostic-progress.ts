export type DiagnosticProgressStage =
  | "starting"
  | "mobile"
  | "desktop"
  | "ai"
  | "finalizing";

export type DiagnosticProgressStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "fallback"
  | "skipped";

export type DiagnosticProgressEvent = {
  type: "progress";
  stage: DiagnosticProgressStage;
  status: Exclude<DiagnosticProgressStatus, "pending">;
};

export type DiagnosticProgressState = Record<
  DiagnosticProgressStage,
  DiagnosticProgressStatus
>;

export const initialDiagnosticProgress: DiagnosticProgressState = {
  starting: "pending",
  mobile: "pending",
  desktop: "pending",
  ai: "pending",
  finalizing: "pending",
};

export function applyDiagnosticProgress(
  current: DiagnosticProgressState,
  event: DiagnosticProgressEvent,
): DiagnosticProgressState {
  return { ...current, [event.stage]: event.status };
}

const STAGE_COUNT = Object.keys(initialDiagnosticProgress).length;
const STAGE_SHARE = 100 / STAGE_COUNT;
/** Share of one stage that the clock alone can fill, so only a confirmed stage reaches the next step. */
const CREEP_SHARE = 0.9;
const CREEP_TIME_CONSTANT_SECONDS = 12;

export function resolvedStageCount(progress: DiagnosticProgressState): number {
  return Object.values(progress).filter(
    (status) => status !== "pending" && status !== "running",
  ).length;
}

/**
 * Overall progress shown to the visitor: confirmed stages count in full, and the
 * stage in flight creeps forward with time without ever completing on its own.
 */
export function estimateDiagnosticPercent(
  progress: DiagnosticProgressState,
  secondsSinceStageChange: number,
): number {
  const confirmed = resolvedStageCount(progress) * STAGE_SHARE;
  const creep =
    STAGE_SHARE *
    CREEP_SHARE *
    (1 - Math.exp(-Math.max(secondsSinceStageChange, 0) / CREEP_TIME_CONSTANT_SECONDS));
  return Math.min(Math.round(confirmed + creep), 99);
}

export const diagnosticWaitingPhrases = [
  "Medindo a velocidade do seu site no celular e no computador.",
  "Verificando se buscadores e IAs conseguem ler as suas páginas.",
  "Procurando o que deixa o carregamento lento.",
  "Conferindo acessibilidade, boas práticas e SEO.",
  "Traduzindo os resultados técnicos para uma linguagem simples.",
  "Organizando as melhorias por prioridade.",
];
