import type { BusinessSummary } from "@/lib/business-report";

export type DiagnosticScores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};

export type DiagnosticMetrics = {
  fcp: string;
  lcp: string;
  tbt: string;
  cls: string;
  si: string;
};

export type DiagnosticSideData = {
  scores: DiagnosticScores;
  metrics: DiagnosticMetrics;
  screenshot?: string | null;
  opportunities?: { title: string; displayValue?: string }[];
};

export type DiagnosticImprovement = {
  title: string;
  description?: string;
  problem?: string;
  impact?: string[];
  causes?: string[];
  recommendations?: string[];
};

export type DiagnosticResult = {
  summary: {
    mobile: DiagnosticSideData;
    desktop: DiagnosticSideData;
    screenshot: string | null;
  };
  improvements: DiagnosticImprovement[];
  uiux?: {
    overview?: string;
    diagnosis?: string[];
    recommendations?: string[];
  } | null;
  extras?: { title: string; description: string }[];
  docx?: string;
  geo?: unknown;
};

export const sampleDiagnosticResult: DiagnosticResult = {
  summary: {
    mobile: {
      scores: {
        performance: 43,
        accessibility: 82,
        bestPractices: 75,
        seo: 88,
      },
      metrics: {
        fcp: "3.4s",
        lcp: "5.8s",
        tbt: "680ms",
        cls: "0.28",
        si: "4.9s",
      },
      screenshot: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
      opportunities: [
        { title: "Reduzir JavaScript não utilizado", displayValue: "Economia de 2.1s" },
        { title: "Renderizar imagens em formatos modernos (WebP/AVIF)", displayValue: "Economia de 1.4s" },
        { title: "Eliminar recursos que bloqueiam a renderização", displayValue: "Economia de 0.9s" },
      ],
    },
    desktop: {
      scores: {
        performance: 71,
        accessibility: 90,
        bestPractices: 85,
        seo: 92,
      },
      metrics: {
        fcp: "1.4s",
        lcp: "2.6s",
        tbt: "120ms",
        cls: "0.05",
        si: "2.1s",
      },
      screenshot: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
      opportunities: [
        { title: "Comprimir imagens pesadas da home", displayValue: "Economia de 450ms" },
        { title: "Ativar cache eficiente de arquivos estáticos", displayValue: "Economia de 320ms" },
      ],
    },
    screenshot: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
  },
  improvements: [
    {
      title: "Carregamento Mobile Crítico (LCP em 5.8s)",
      problem: "O tempo até o maior elemento da tela carregar ultrapassa 5 segundos na conexão 4G comum, provocando abandono precoce de usuários.",
      impact: [
        "Aumento de ~35% na taxa de rejeição no celular",
        "Perda de posições no ranking do Google Mobile-First",
        "Queda direta no retorno de campanhas pagas (Google Ads/Meta Ads)",
      ],
      causes: [
        "Banner principal sem pré-carregamento e em formato JPG não otimizado",
        "Tags de rastreamento de terceiros bloqueando o thread principal",
      ],
      recommendations: [
        "Converter a imagem hero para WebP com preload prioritário",
        "Adicionar lazy-loading em seções abaixo da dobra",
        "Adiar a execução de scripts analíticos secundários",
      ],
    },
    {
      title: "Deslocamento Visual da Página (CLS = 0.28)",
      problem: "A página pula e se reposiciona enquanto carrega elementos visuais e fontes, frustrando cliques de clientes.",
      impact: [
        "Cliques acidentais em elementos errados",
        "Penalização nos Core Web Vitals do Google",
      ],
      causes: [
        "Falta de dimensões explícitas (width/height) nos banners e logo",
        "Fontes web carregadas sem fallback com display swap",
      ],
      recommendations: [
        "Definir aspect-ratio fixo para todos os blocos de mídia",
        "Configurar font-display: swap no arquivo de estilos principal",
      ],
    },
    {
      title: "Oportunidades de SEO Estruturado & Local",
      problem: "O site não possui dados estruturados Schema.org completos para organização e presença geográfica.",
      impact: [
        "Ausência de rich snippets e estrelas nas páginas de resultados",
        "Menor visibilidade em buscas geolocalizadas da região",
      ],
      causes: [
        "Falta de marcação JSON-LD LocalBusiness ou Organization",
      ],
      recommendations: [
        "Injetar schema Organization com telefone, endereço e horário",
        "Integrar sitemap atualizado no Google Search Console",
      ],
    },
  ],
  uiux: {
    overview: "A proposta visual possui boa identidade gráfica, porém a hierarquia dos botões de ação (CTAs) compete entre si na primeira dobra e a navegação móvel apresenta espaçamentos reduzidos para toque.",
    diagnosis: [
      "Primeira dobra com múltiplos botões de cores semelhantes dispersando a atenção do cliente",
      "Contraste insuficiente em textos secundários cinzas sobre fundo claro",
      "Formulário com 6 campos obrigatórios gerando atrito na conversão inicial",
    ],
    recommendations: [
      "Concentrar em um único CTA primário destacado na hero section",
      "Ajustar contraste de cores para conformidade WCAG AA",
      "Reduzir formulário de contato para Nome e WhatsApp na primeira etapa",
    ],
  },
};

export const sampleBusinessSummary: BusinessSummary = {
  resumo:
    "O website speedlink-demo.com.br possui fundamentos visuais modernos, mas opera com grave lentidão mobile (LCP de 5.8s e score de performance 43/100). Isso afeta diretamente a conversão de leads e o custo de aquisição em campanhas pagas.",
  contexto:
    "Mais de 70% do tráfego atual acessa via smartphone. Um carregamento acima de 4 segundos gera perda estimada de até 35% dos visitantes antes mesmo da primeira visualização.",
  impactoNegocio: [
    "Desperdício de orçamento em anúncios por causa da alta taxa de desistência mobile",
    "Perda de clientes para concorrentes com sites mais rápidos na mesma região",
    "Frustração do usuário por instabilidade visual (botões que mudam de posição ao carregar)",
  ],
  prioridades: [
    {
      titulo: "Resolução do Carregamento Mobile Lento",
      porQueImporta:
        "Reduz a perda imediata de visitantes e diminui o custo por lead em campanhas de tráfego pago.",
      acao:
        "Compressão das imagens chave para WebP e adiamento de scripts pesados.",
    },
    {
      titulo: "Estabilização Visual (Core Web Vitals)",
      porQueImporta:
        "Evita cliques errados e garante conformidade com as diretrizes do Google para ranqueamento.",
      acao:
        "Fixar dimensões de mídias e ajustar carregamento instantâneo de fontes.",
    },
    {
      titulo: "Simplificação da Captação de Leads",
      porQueImporta:
        "Gera aumento imediato no volume de contatos sem necessidade de aumentar o investimento em marketing.",
      acao:
        "Redesenhar o formulário de contato com CTA único para WhatsApp.",
    },
  ],
  proximoPasso:
    "Agendar um plano de implementação de 14 dias para aplicar o pacote de aceleração técnica e otimização de conversão.",
};
