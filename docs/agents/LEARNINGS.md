# Aprendizados tecnicos do Metrixfly

Registre aqui somente fatos tecnicos duradouros, nao obvios e ainda nao documentados em outro lugar. Nao use este arquivo como diario de tarefas ou lista de erros temporarios.

## Infraestrutura e testes

- O projeto nao usa Docker; o fluxo local parte dos scripts npm e das ferramentas ja instaladas no repositorio.
- O Vitest inclui `src/**/*.{test,spec}.{ts,tsx}`. Os smoke tests em `test/` nao fazem parte da suite Vitest padrao e precisam ser executados conforme seu proprio procedimento.

- `src/integrations/supabase/client.ts` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Sem `.env`, por exemplo em uma worktree nova, 2 suites e 6 testes falham com "supabaseUrl is required"; defina valores ficticios nessas variaveis ao rodar `npm test` (os testes mockam o Supabase). Nao copie nem leia o `.env` real.
- Deno esta instalado (2.9.x). As Edge Functions em `supabase/functions` podem ser verificadas com `deno check` e testadas com `deno test`; o projeto ainda nao tem testes de Edge Function.
- Arquivos de governanca ficam em UTF-8 sem acentos; leia com a ferramenta Read, nao com `Get-Content` sem `-Encoding utf8`, que exibe texto corrompido no Windows.

## Tipagem e dominios

- Tipos compartilhados do diagnostico ficam em `src/features/diagnostics/model/diagnose.ts`.
- Logica especifica de cada dominio pertence a `src/features/<dominio>`; componentes UI compartilhados ficam em `src/components/`.
- Segredos de integracoes externas nao pertencem ao frontend; use o ambiente de backend das Supabase Edge Functions.
