# Metrixfly

Aplicação web para analisar sites e apresentar oportunidades de melhoria em performance, SEO e visibilidade em mecanismos de resposta por IA (GEO/AEO). O relatório técnico pode ser complementado por uma visão executiva e exportado para uso comercial.

## O que o projeto faz

- Analisa páginas com o PageSpeed Insights para dispositivos móveis e desktop.
- Executa rastreamento GEO/AEO por meio de funções Supabase.
- Apresenta métricas, oportunidades e recomendações em uma interface voltada a usuários de negócio.
- Gera relatórios `.docx` técnico e executivo.
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
  copilot-instructions.md       # instruções de projeto carregadas pelo Copilot
AGENTS.md                       # instruções de projeto carregadas pelo OpenCode/OMP
.agents/skills/                 # skills de referência baixadas
.husky/
  pre-commit                    # hook Git executado antes dos commits
supabase/
  functions/                   # funções de backend executadas no Supabase
  migrations/                  # migrações SQL
test/                           # smoke tests auxiliares de integrações/documentos
```

As funcionalidades específicas ficam em `src/features/<domínio>`. Elementos usados por mais de uma funcionalidade permanecem em `src/components`, `src/hooks`, `src/lib` e `src/integrations`. As funções de `supabase/functions` permanecem na estrutura esperada pelo Supabase CLI.

As instruções automáticas do Copilot estão em `.github/copilot-instructions.md`; OpenCode/OMP lê `AGENTS.md` na raiz. Ambos apontam para a governança detalhada em `docs/agents/`. OpenCode também pode descobrir skills em `.agents/skills/`, que permanece separado das regras do Metrixfly.

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
