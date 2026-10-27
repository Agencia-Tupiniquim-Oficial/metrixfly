import type { BusinessSummary } from "@/features/diagnostics/model/business-report";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";

export const sampleDiagnosticResult: DiagnoseResult = {
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
      screenshot:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
      opportunities: [
        {
          title: "Reduzir JavaScript não utilizado",
          displayValue: "Economia de 2.1s",
        },
        {
          title: "Renderizar imagens em formatos modernos (WebP/AVIF)",
          displayValue: "Economia de 1.4s",
        },
        {
          title: "Eliminar recursos que bloqueiam a renderização",
          displayValue: "Economia de 0.9s",
        },
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
      screenshot:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
      opportunities: [
        {
          title: "Comprimir imagens pesadas da home",
          displayValue: "Economia de 450ms",
        },
        {
          title: "Ativar cache eficiente de arquivos estáticos",
          displayValue: "Economia de 320ms",
        },
      ],
    },
    screenshot:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
  },
  improvements: [
    {
      title: "Carregamento Mobile Crítico (LCP em 5.8s)",
      problem:
        "O conteúdo principal leva 5.8 segundos para aparecer no mobile, conforme a métrica LCP do diagnóstico.",
      impact: [
        "Demora maior para visualizar o conteúdo principal no mobile",
        "Oportunidade de melhorar os sinais técnicos de experiência da página",
        "Tempo de carregamento observado pode dificultar o acesso ao conteúdo",
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
      problem:
        "A página pula e se reposiciona enquanto carrega elementos visuais e fontes, frustrando cliques de clientes.",
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
      problem:
        "O site não possui dados estruturados Schema.org completos para organização e presença geográfica.",
      impact: [
        "Ausência de rich snippets e estrelas nas páginas de resultados",
        "Menor visibilidade em buscas geolocalizadas da região",
      ],
      causes: ["Falta de marcação JSON-LD LocalBusiness ou Organization"],
      recommendations: [
        "Injetar schema Organization com telefone, endereço e horário",
        "Integrar sitemap atualizado no Google Search Console",
      ],
    },
  ],
  uiux: {
    overview:
      "A proposta visual possui boa identidade gráfica, porém a hierarquia dos botões de ação (CTAs) compete entre si na primeira dobra e a navegação móvel apresenta espaçamentos reduzidos para toque.",
    diagnosis: [
      "Primeira dobra com múltiplos botões de cores semelhantes dispersando a atenção do cliente",
      "Contraste insuficiente em textos secundários cinzas sobre fundo claro",
      "Formulário com 6 campos obrigatórios, que exige o preenchimento de várias informações",
    ],
    recommendations: [
      "Concentrar em um único CTA primário destacado na hero section",
      "Ajustar contraste de cores para conformidade WCAG AA",
      "Reduzir formulário de contato para Nome e WhatsApp na primeira etapa",
    ],
  },
  extras: [
    {
      title: "Campos ocultos de rastreamento no formulário de contato",
      description:
        "Adicionar campos ocultos para metadados de rastreio, como origem e localização, com o objetivo de melhorar a rastreabilidade e a captura de informações dos leads. Essa melhoria aumenta consideravelmente a precisão na análise geral das estratégias da marca.",
    },
    {
      title: "WhatsApp flutuante para atendimento",
      description:
        "O site não apresenta botão flutuante de WhatsApp visível na interface. Recomenda-se implementar um ícone fixo no canto inferior direito da tela, sempre visível em todas as páginas, que abre uma conversa direta com a empresa no WhatsApp. Esse recurso reduz a fricção para o contato inicial, agiliza o atendimento e aumenta a taxa de conversão de visitantes em leads qualificados.",
    },
  ],
};

export const sampleBusinessSummary: BusinessSummary = {
  resumo:
    "O diagnóstico de website metricfly-demo.com.br registrou nota de desempenho mobile 43/100 e LCP de 5.8 segundos. Esses dados apontam demora na exibição do conteúdo principal em dispositivos móveis.",
  contexto:
    "No mobile, o conteúdo principal levou 5.8 segundos para aparecer na medição. O diagnóstico também identificou oportunidades relacionadas à transferência de JavaScript e ao carregamento de imagens.",
  impactoNegocio: [
    "O conteúdo principal demora para ficar visível na experiência mobile medida",
    "O CLS de 0.28 indica deslocamento de elementos durante o carregamento",
    "As oportunidades identificadas mostram pontos técnicos que podem ser priorizados",
  ],
  prioridades: [
    {
      titulo: "Resolução do Carregamento Mobile Lento",
      porQueImporta:
        "A nota mobile de 43/100 e o LCP de 5.8 segundos foram registrados neste diagnóstico.",
      acao: "Compressão das imagens chave para WebP e adiamento de scripts pesados.",
    },
    {
      titulo: "Estabilização Visual (Core Web Vitals)",
      porQueImporta:
        "O CLS de 0.28 indica deslocamento visual durante o carregamento, conforme a medição do diagnóstico.",
      acao: "Fixar dimensões de mídias e ajustar carregamento instantâneo de fontes.",
    },
    {
      titulo: "Revisão do formulário de contato",
      porQueImporta:
        "O formulário analisado apresenta seis campos obrigatórios, um aspecto que pode ser revisto na experiência de preenchimento.",
      acao: "Redesenhar o formulário de contato com CTA único para WhatsApp.",
    },
  ],
  proximoPasso:
    "Revisar as oportunidades listadas, priorizar as melhorias técnicas e executar um novo diagnóstico após as alterações.",
};
