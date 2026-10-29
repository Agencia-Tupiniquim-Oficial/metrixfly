# Aprendizados tecnicos do Metrixfly

Registre aqui somente fatos tecnicos duradouros, nao obvios e ainda nao documentados em outro lugar. Nao use este arquivo como diario de tarefas ou lista de erros temporarios.

## Infraestrutura e testes

- O projeto nao usa Docker; o fluxo local parte dos scripts npm e das ferramentas ja instaladas no repositorio.
- O Vitest inclui `src/**/*.{test,spec}.{ts,tsx}`. Os smoke tests em `test/` nao fazem parte da suite Vitest padrao e precisam ser executados conforme seu proprio procedimento.

- `src/integrations/supabase/client.ts` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Sem `.env`, por exemplo em uma worktree nova, 2 suites e 6 testes falham com "supabaseUrl is required"; defina valores ficticios nessas variaveis ao rodar `npm test` (os testes mockam o Supabase). Nao copie nem leia o `.env` real.
- Deno esta instalado (2.9.x). As Edge Functions em `supabase/functions` podem ser verificadas com `deno check` e testadas com `deno test`; o projeto ainda nao tem testes de Edge Function.
- Arquivos de governanca ficam em UTF-8 sem acentos; leia com a ferramenta Read, nao com `Get-Content` sem `-Encoding utf8`, que exibe texto corrompido no Windows.
- Responsividade: nao ha navegador no ambiente, entao testes do Vitest (jsdom) nao pegam estouro de layout. Para auditar, instale o Playwright FORA do repositorio (pasta temporaria: `npm i playwright` e `npx playwright install chromium`), abra o servidor local em 320, 360, 390 e 768 px e compare `scrollWidth` com `innerWidth`; anel/barra do `Progress` do Radix aparecem como falso positivo (ficam dentro de `overflow-hidden`). O modo `?demo=1` abre o resultado sem backend; o GEO e o relatorio compartilhado exigem mock da rede (`page.route`). No Git Bash, defina `MSYS_NO_PATHCONV=1` ao passar caminhos como `/admin` a scripts. O PDF gerado pelo `@react-pdf` pode ser renderizado com `pdfjs-dist` numa pagina servida localmente.

## Tipagem e dominios

- Tipos compartilhados do diagnostico ficam em `src/features/diagnostics/model/diagnose.ts`.
- Logica especifica de cada dominio pertence a `src/features/<dominio>`; componentes UI compartilhados ficam em `src/components/`.
- Segredos de integracoes externas nao pertencem ao frontend; use o ambiente de backend das Supabase Edge Functions.

## Ambiente Windows

- As copias de trabalho usam CRLF (`core.autocrlf=true`); o Git avisa "LF will be replaced by CRLF" ao fazer commit, o que e normal. Ao editar por script, normalize com `replace(/\r\n/g, "\n")` antes de casar texto.
- Python nao esta instalado; use Node (`node script.cjs`) para edicoes em lote. Scripts com muitas aspas devem ser gravados com a ferramenta Write em arquivo e executados, nao em heredoc no Bash (um heredoc com aspas misturadas falhou com "unexpected EOF").
- `.claude/settings.json` e `.claude/agents/` fazem parte do repositorio (permissoes liberadas e subagente `metrixfly-design-review`).
