export async function getDiagnosticErrorMessage(error: unknown): Promise<string> {
  if (
    error instanceof Error &&
    error.message &&
    error.message !== "Edge Function returned a non-2xx status code"
  ) {
    return error.message;
  }

  if (error && typeof error === "object" && "context" in error) {
    const errorWithContext = error as Record<string, unknown>;
    const context = errorWithContext.context;

    if (context instanceof Response) {
      try {
        const body = (await context.clone().json()) as { error?: string };
        if (body.error) return body.error;
      } catch {
        // The response may not contain JSON; keep the generic function error below.
      }
    }
  }

  return error instanceof Error ? error.message : "Tente novamente";
}
