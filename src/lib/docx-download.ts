const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: DOCX_MIME_TYPE });
}

export function docxResponseToBlob(data: unknown): Blob {
  if (data instanceof Blob) {
    return data.type === DOCX_MIME_TYPE
      ? data
      : new Blob([data], { type: DOCX_MIME_TYPE });
  }

  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: DOCX_MIME_TYPE });
  }

  if (data && typeof data === "object" && "docx" in data) {
    const encodedDocx = (data as { docx?: unknown }).docx;
    if (typeof encodedDocx === "string" && encodedDocx.length > 0) {
      return base64ToBlob(encodedDocx);
    }
  }

  throw new Error("A função não retornou um arquivo .docx válido.");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
