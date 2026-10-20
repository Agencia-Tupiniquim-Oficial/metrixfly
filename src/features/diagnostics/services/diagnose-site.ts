import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";
import type {
  DiagnosticProgressEvent,
} from "@/features/diagnostics/model/diagnostic-progress";
import { supabase } from "@/integrations/supabase/client";

type StreamMessage =
  | DiagnosticProgressEvent
  | {
      type: "result";
      data: {
        diagnosis: DiagnoseResult;
        reportId: string | null;
        persistenceError: string | null;
      };
    }
  | { type: "error"; message: string };

export type DiagnosticRunResult = {
  diagnosis: DiagnoseResult;
  reportId: string | null;
  persistenceError: string | null;
};

function parseDiagnosticRunResult(value: unknown): DiagnosticRunResult {
  if (
    value &&
    typeof value === "object" &&
    "diagnosis" in value &&
    value.diagnosis &&
    typeof value.diagnosis === "object"
  ) {
    const result = value as Partial<DiagnosticRunResult>;
    return {
      diagnosis: result.diagnosis as DiagnoseResult,
      reportId: typeof result.reportId === "string" ? result.reportId : null,
      persistenceError:
        typeof result.persistenceError === "string"
          ? result.persistenceError
          : null,
    };
  }

  return {
    diagnosis: value as DiagnoseResult,
    reportId: null,
    persistenceError:
      "O servidor não retornou um link permanente. Atualize a função de diagnóstico para habilitar o salvamento.",
  };
}

function parseStreamMessage(line: string): StreamMessage | null {
  if (!line.trim()) return null;
  return JSON.parse(line) as StreamMessage;
}

export async function runDiagnosticWithProgress(
  url: string,
  onProgress: (event: DiagnosticProgressEvent) => void,
): Promise<DiagnosticRunResult> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!projectUrl || !publishableKey) {
    throw new Error("A conexão com o serviço de diagnóstico não está configurada.");
  }

  const response = await fetch(`${projectUrl}/functions/v1/diagnose-site`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? publishableKey}`,
      apikey: publishableKey,
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
    },
    body: JSON.stringify({ url, progressStream: true }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error ?? `Não foi possível gerar o diagnóstico (${response.status}).`,
    );
  }

  if (!response.body) {
    throw new Error("O serviço de diagnóstico não retornou uma resposta.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const result = (await response.json()) as
      | (DiagnoseResult & { error?: string })
      | (DiagnosticRunResult & { error?: string });
    if (result.error) throw new Error(result.error);
    onProgress({ type: "progress", stage: "finalizing", status: "completed" });
    return parseDiagnosticRunResult(result);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";

  const handleLine = (line: string): DiagnosticRunResult | null => {
    const message = parseStreamMessage(line);
    if (!message) return null;
    if (message.type === "progress") {
      onProgress(message);
      return null;
    }
    if (message.type === "error") throw new Error(message.message);
    return parseDiagnosticRunResult(message.data);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffered += decoder.decode(value, { stream: !done });
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? "";

    for (const line of lines) {
      const result = handleLine(line);
      if (result) {
        return result;
      }
    }

    if (done) break;
  }

  if (buffered.trim()) {
    const result = handleLine(buffered);
    if (result) return result;
  }

  throw new Error("O serviço encerrou a conexão antes de concluir o diagnóstico.");
}
