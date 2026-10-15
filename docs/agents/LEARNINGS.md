# Aprendizados tecnicos do Metrixfly

Registre aqui somente fatos tecnicos duradouros, nao obvios e ainda nao documentados em outro lugar. Nao use este arquivo como diario de tarefas ou lista de erros temporarios.

## Infraestrutura e testes

- O projeto nao usa Docker; o fluxo local parte dos scripts npm e das ferramentas ja instaladas no repositorio.
- O Vitest inclui `src/**/*.{test,spec}.{ts,tsx}`. Os smoke tests em `test/` nao fazem parte da suite Vitest padrao e precisam ser executados conforme seu proprio procedimento.

## Tipagem e dominios

- Tipos compartilhados do diagnostico ficam em `src/features/diagnostics/model/diagnose.ts`.
- Logica especifica de cada dominio pertence a `src/features/<dominio>`; componentes UI compartilhados ficam em `src/components/`.
- Segredos de integracoes externas nao pertencem ao frontend; use o ambiente de backend das Supabase Edge Functions.
