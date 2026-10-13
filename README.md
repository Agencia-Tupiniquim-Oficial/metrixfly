# Metrixfly

Aplicação web para analisar sites e apresentar oportunidades de melhoria em performance, SEO e visibilidade em mecanismos de resposta por IA (GEO/AEO). O relatório técnico pode ser complementado por uma visão executiva e exportado para uso comercial.

## O que o projeto faz

- Analisa páginas com o PageSpeed Insights para dispositivos móveis e desktop.
- Executa rastreamento GEO/AEO por meio de funções Supabase.
- Apresenta métricas, oportunidades e recomendações em uma interface voltada a usuários de negócio.
- Gera relatórios PDF técnico, executivo e GEO/AEO.
- Inclui uma calculadora de impacto financeiro e páginas de administração e relatórios.

## Stack atual

- React 18, TypeScript e Vite.
- Tailwind CSS, shadcn/ui e Radix UI.
- React Router e TanStack Query.
- Supabase para autenticação/integração de dados e Edge Functions em Deno.
- Vitest e Testing Library para testes.

## Estrutura

```text
src/
  app/                         # composição da aplicação, provedores e rotas
  features/
    diagnostics/               # diagnóstico PageSpeed, relatórios e estado do diagnóstico
    financial-calculator/      # cálculo financeiro e tela
    geo-aeo/                   # GEO/AEO e administração relacionada
    reports/                   # consulta e exibição de relatórios
  components/
    ui/                        # componentes compartilhados shadcn/ui
  hooks/                       # hooks compartilhados
  integrations/supabase/       # cliente e tipos do Supabase
  lib/                         # utilitários compartilhados
  assets/                      # imagens importadas pela aplicação
  test/                        # configuração e testes da aplicação
docs/                           # backlog e documentação do produto
  agents/                       # governança e documentação para agentes
.github/
  copilot-instructions.md       # ponto de entrada de compatibilidade do Copilot
AGENTS.md                       # instruções principais compartilhadas
.agents/skills/                 # skills próprias do Metrixfly para agentes compatíveis
.husky/
  pre-commit                    # hook Git executado antes dos commits
supabase/
  functions/                   # funções de backend executadas no Supabase
  migrations/                  # migrações SQL
test/                           # smoke tests auxiliares de integrações/documentos
```

As funcionalidades específicas ficam em `src/features/<domínio>`. Elementos usados por mais de uma funcionalidade permanecem em `src/components`, `src/hooks`, `src/lib` e `src/integrations`. As funções de `supabase/functions` permanecem na estrutura esperada pelo Supabase CLI.

`AGENTS.md` é a fonte principal das instruções compartilhadas. `.github/copilot-instructions.md` existe como ponto de entrada para hosts do Copilot que carregam esse caminho e evita duplicar as regras. A governança detalhada está em `docs/agents/`; skills próprias do projeto são descobertas em `.agents/skills/` por OpenCode e agentes que suportam o padrão.

## Requisitos e configuração

- Node.js compatível com Vite 5.
- npm (o repositório inclui `package-lock.json`).
- Projeto Supabase configurado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no ambiente do frontend.

Segredos usados por Edge Functions, como chaves de provedores externos, devem ser configurados como secrets no Supabase; não os coloque em variáveis `VITE_*` nem no código do navegador. O arquivo `.env` local não deve ser versionado.

## Comandos

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run check
```

`npm run check` executa ESLint e os testes. Consulte [`docs/agents/GOVERNANCA.md`](./docs/agents/GOVERNANCA.md) para as regras operacionais; o pre-commit do Husky executa `lint-staged`.
