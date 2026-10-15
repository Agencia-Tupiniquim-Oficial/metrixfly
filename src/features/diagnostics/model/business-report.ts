export type Priority = {
  titulo: string;
  porQueImporta: string;
  acao: string;
};

export type BusinessSummary = {
  resumo: string;
  contexto: string;
  impactoNegocio: string[];
  prioridades: Priority[];
  proximoPasso: string;
};
