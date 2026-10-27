export const BRAND_NAME = "Metricfly";

export function quoteEmailSubject(): string {
  return `[${BRAND_NAME}] Novo orçamento`;
}

export function quoteEmailHeading(): string {
  return `Nova solicitação de orçamento - ${BRAND_NAME}`;
}
