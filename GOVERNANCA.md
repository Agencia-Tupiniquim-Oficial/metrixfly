# Governança de Desenvolvimento - Metrixfly

Este projeto utiliza uma estrutura de **Esteira de Desenvolvimento Orientada a Agentes** para garantir a consistência, qualidade e manutenibilidade do código.

## Estrutura de Governança (`.agent/`)

Toda a lógica de governança está centralizada na pasta `.agent/`:

- **`MANIFESTO.md`**: Define o propósito técnico, os princípios de engenharia e as regras de ouro do projeto.
- **`INSTRUCOES.md`**: Define o fluxo de trabalho obrigatório (PLAN -> ACT -> VERIFY -> REPORT).
- **`PLANO.md`**: O "Placar de Execução" que mantém o estado atual do desenvolvimento e o backlog.
- **`LEARNINGS.md`**: A memória de longo prazo. Registra padrões, lições aprendidas e comportamentos específicos do sistema.

## Fluxo de Trabalho (Modus Operandi)

Sempre que uma tarefa for solicitada:
1. **ENTENDER**: Ler o `PLANO.md` e o `LEARNINGS.md`.
2. **PLANEJAR**: Atualizar o `PLANO.md` com as subtarefas.
3. **EXECUTAR**: Aplicar as mudanças (código e testes).
4. **VALIDAR**: Rodar os testes (`npm test`) e garantir conformidade com as regras (sem `any`, sem funções minúsculas desnecessárias).
5. **REPORTAR**: Atualizar o `PLANO.md`.

## Guardrails (Segurança)

O projeto é protegido por:
- **Husky + Lint-staged**: Bloqueia commits que não passam no `lint-staged` (ESLint).
- **Scripts de Verificação**: `npm run check` (ESLint + Vitest).
- **Rigidez na Tipagem**: Uso de `satisfies` e definições explícitas em `src/types/`.

---
*Desenvolvedores e agentes: respeitem esta estrutura. Em caso de dúvida, consulte o manifesto ou o plano.*
