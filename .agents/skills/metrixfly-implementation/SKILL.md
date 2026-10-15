---
name: metrixfly-implementation
description: "Use when implementing or changing a Metrixfly feature or behavior. Guides impact analysis, safe Git workflow, project conventions, validation, and handoff."
---

# Implementacao no Metrixfly

Use junto com `AGENTS.md` e `docs/agents/INSTRUCOES.md`; esses arquivos definem as regras permanentes do projeto.

## Procedimento

1. Transforme o pedido em criterios de aceitacao observaveis. Identifique o dominio, callers, dados, integracoes e testes que podem ser afetados.
2. Leia as instrucoes aplicaveis, o codigo e os testes relacionados. Confira os tipos existentes e mantenha a mudanca dentro do dominio apropriado.
3. Antes de editar, verifique branch, `git status --short`, `git diff` e `git diff --cached`. Preserve trabalho preexistente. Crie uma branch de tarefa apenas se isso nao misturar mudancas alheias; nunca use reset ou stash para contornar o estado local.
4. Implemente a menor solucao completa que satisfaz os criterios. Nao generalize nem refatore areas sem relacao. Mudancas de comportamento devem ter teste de regressao adequado.
5. Escolha verificacoes de acordo com o risco: `npm test`, `npm run lint`, `npm run build`, `npm run check` e, para TypeScript, `npx tsc --noEmit -p tsconfig.app.json`. Se `npm run check` parar no ESLint, execute Vitest separadamente e informe os resultados de cada comando.
6. Corrija problemas introduzidos e repita as verificacoes afetadas. Revise os diffs staged e unstaged para confirmar criterios, seguranca, ausencia de alteracoes incidentais e preservacao do trabalho do usuario.
7. Entregue um resumo da implementacao, branch, verificacoes e resultados, limitacoes e validacao manual pendente.

Nao faca commit, push, merge, deploy, alteracoes remotas ou operacoes destrutivas sem autorizacao explicita.
