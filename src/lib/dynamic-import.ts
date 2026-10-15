export async function importPdfReports() {
  try {
    return await import("@/features/diagnostics/services/pdf-reports");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("dynamically imported module")
    ) {
      console.warn("Detected stale deployment chunk. Reloading page...", error);
      window.location.reload();
      throw new Error("Nova versão disponível. Atualizando a página...");
    }
    throw error;
  }
}
