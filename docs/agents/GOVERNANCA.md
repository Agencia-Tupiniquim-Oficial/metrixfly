# Governança de Desenvolvimento - Metrixfly

Este projeto mantém a governança e a documentação para agentes em `docs/agents/`:

- **`MANIFESTO.md`**: propósito, princípios técnicos e regras de engenharia.
- **`INSTRUCOES.md`**: fluxo de trabalho para mudanças.
- **`PLANO.md`**: estado de execução e backlog.
- **`LEARNINGS.md`**: padrões e aprendizados específicos do projeto.

As instruções curtas carregadas automaticamente pelo GitHub Copilot para este workspace estão em `.github/copilot-instructions.md`; OpenCode/OMP lê `AGENTS.md` na raiz. Ambos apontam para a documentação detalhada de governança e aprendizados desta pasta.

## Skills de referência

`.agents/skills/` contém as skills de referência baixadas. OpenCode/OMP descobre skills nesse local; carregue uma quando a tarefa corresponder ao seu propósito. As skills não substituem as regras do Metrixfly, que ficam em `docs/agents/`.

## Git hooks

O hook Git `.husky/pre-commit` executa `lint-staged`, configurado em `package.json`. Ele roda antes de criar um commit; não é um hook de ciclo de vida do Copilot. Mantenha os hooks Git em `.husky/`.

## Fluxo de trabalho

1. **Entender**: leia `PLANO.md` e `LEARNINGS.md`; consulte o manifesto e os módulos afetados.
2. **Planejar**: para mudanças que atravessem múltiplos módulos, registre as etapas em `PLANO.md`.
3. **Executar**: siga os padrões React, TypeScript e Tailwind existentes; organize código específico sob `src/features/<domínio>`.
4. **Validar**: rode os testes ou verificações direcionadas; antes de concluir uma mudança ampla, execute `npm run check` e `npm run build`.
5. **Reportar**: atualize `PLANO.md` e registre aprendizados duradouros quando forem relevantes.

## Guardrails

- Não exponha credenciais ou chaves secretas no frontend. Segredos de integrações externas pertencem às Edge Functions do Supabase.
- Prefira tipos explícitos e evite introduzir `any`.
- Mudanças de comportamento devem ter testes em `src/test/` ou junto ao módulo correspondente.
- `npm run check` executa ESLint e Vitest; reporte falhas preexistentes separadamente, sem ocultá-las.
