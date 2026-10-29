import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que o Metricfly analisa no meu site?",
    answer:
      "Dois diagnósticos. O de desempenho mede velocidade, acessibilidade, boas práticas e SEO com o PageSpeed Insights, no celular e no computador. O Agent Crawl GEO/AEO verifica se o site está pronto para ser lido e citado por agentes de IA e mecanismos de resposta.",
  },
  {
    question: "Preciso criar uma conta ou instalar alguma coisa?",
    answer:
      "Não. Basta informar o endereço do site na página inicial. A análise é feita de fora, como um visitante, e não altera nada no seu site.",
  },
  {
    question: "Quanto tempo leva a análise?",
    answer:
      "O PageSpeed Insights costuma levar de 15 a 45 segundos para cada versão, celular e computador. Você acompanha cada etapa na tela enquanto o diagnóstico é montado.",
  },
  {
    question: "Posso analisar qualquer site?",
    answer:
      "O site precisa estar publicado e acessível na internet. Páginas em desenvolvimento, atrás de login ou bloqueadas para robôs não podem ser medidas.",
  },
  {
    question: "O que são GEO e AEO?",
    answer:
      "GEO (Generative Engine Optimization) e AEO (Answer Engine Optimization) são práticas para que seu conteúdo seja encontrado e citado por IAs e mecanismos de resposta, além dos buscadores tradicionais. O Agent Crawl olha o robots.txt, o sitemap.xml, o acesso dos agentes de IA e os dados estruturados (JSON-LD) das páginas.",
  },
  {
    question: "O que significam LCP, CLS e as outras métricas?",
    answer:
      "São medidas de experiência de uso. O LCP mostra em quanto tempo o conteúdo principal aparece, o CLS mede se a página “pula” enquanto carrega e o TBT indica por quanto tempo ela fica travada para interação. No relatório, cada métrica vem com a meta e uma explicação em linguagem simples.",
  },
  {
    question: "Por que o resultado muda de uma análise para outra?",
    answer:
      "O PageSpeed Insights é um serviço do Google e os resultados refletem o momento da análise. Variações entre medições são normais, por isso vale olhar a tendência e as oportunidades de melhoria, não só a nota.",
  },
  {
    question: "Como compartilho o relatório com minha equipe?",
    answer:
      "Cada diagnóstico fica salvo e gera um link que pode ser aberto por quem você enviar. Também é possível baixar o relatório técnico em PDF ou a versão corporativa, que traz um resumo para quem decide, sem jargão.",
  },
  {
    question: "Corrigir os pontos do relatório coloca meu site no topo do Google ou das IAs?",
    answer:
      "Não podemos prometer uma posição. O relatório mostra o que está atrapalhando o desempenho e a visibilidade do site e quais correções priorizar. O resultado nos buscadores e nas IAs depende de vários outros fatores.",
  },
  {
    question: "Vocês podem fazer as melhorias no meu site?",
    answer:
      "Sim. Depois do diagnóstico, a equipe da Agência Tupiniquim pode priorizar e executar as melhorias. Use o botão “Solicitar orçamento” para falar com a gente.",
  },
];

export default function FaqSection() {
  return (
    <section id="duvidas" className="container py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Dúvidas frequentes
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            Ficou com alguma pergunta? Veja as respostas.
          </h2>
        </div>
        <Accordion type="single" collapsible className="min-w-0">
          {faqs.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`faq-${index}`}>
              <AccordionTrigger className="gap-4 text-left text-base font-bold">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground md:text-base">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
