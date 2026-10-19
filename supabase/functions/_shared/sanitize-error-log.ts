const sensitiveLogField =
  /^(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password)$/i;

function sanitizeLogValue(value: unknown, secrets: readonly string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, secrets));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveLogField.test(key)
          ? "[REDACTED]"
          : sanitizeLogValue(entry, secrets),
      ]),
    );
  }
  if (typeof value === "string") {
    return sanitizeLogText(value, secrets);
  }
  return value;
}

function sanitizeLogText(text: string, secrets: readonly string[]): string {
  let sanitized = text
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(
      /(["']?(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi,
      '$1"[REDACTED]"',
    )
    .replace(
      /([?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password)=)[^&#\s]+/gi,
      "$1[REDACTED]",
    );

  for (const secret of secrets) {
    if (secret) sanitized = sanitized.split(secret).join("[REDACTED]");
  }
  return sanitized;
}

export function sanitizeErrorLogDetails(
  details: string,
  secrets: readonly string[] = [],
): string {
  try {
    return JSON.stringify(
      sanitizeLogValue(JSON.parse(details), secrets),
    ).slice(0, 4000);
  } catch {
    return sanitizeLogText(details, secrets).slice(0, 4000);
  }
}

export function formatErrorForLog(
  error: unknown,
  secrets: readonly string[] = [],
): string {
  const details =
    error instanceof Error
      ? error.stack ?? `${error.name}: ${error.message}`
      : String(error);
  return sanitizeErrorLogDetails(details, secrets);
}
