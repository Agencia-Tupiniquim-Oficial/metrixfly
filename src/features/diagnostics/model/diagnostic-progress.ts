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
