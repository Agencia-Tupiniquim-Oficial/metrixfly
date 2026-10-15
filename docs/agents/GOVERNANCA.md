# Governanca de desenvolvimento - Metrixfly

## Fontes de orientacao

- `AGENTS.md` e a entrada principal das instrucoes de projeto. OpenCode/OMP e hosts compatíveis com `AGENTS.md` podem carrega-lo; `.github/copilot-instructions.md` e apenas a ponte para hosts do Copilot que usam esse caminho.
- `docs/agents/INSTRUCOES.md` define o procedimento de trabalho; `MANIFESTO.md` registra principios de produto e arquitetura; `LEARNINGS.md` guarda fatos tecnicos duradouros; `PLANO.md` e reservado a iniciativas de agentes com varias etapas.
- O backlog de produto fica em `docs/roadmap.md`, nao em `PLANO.md`.
- `.agents/skills/` contem somente skills mantidas para o Metrixfly. Elas sao procedimentos sob demanda, nao substituem nem alteram as regras permanentes.

## Limites de autonomia

- Preserve alteracoes locais. Nao descarte, sobrescreva ou inclua no stage trabalho preexistente sem autorizacao.
- Crie uma branch especifica quando for seguro e apropriado; nao use stash, reset ou troca de branch para esconder conflitos. Se a branch misturar trabalho alheio a tarefa, pare e combine a proxima acao.
- Nao faca commit sem pedido explicito. Nunca faca push, merge ou deploy sem autorizacao.
- Nao aplique migracoes nem alteracoes em banco remoto, nem execute operacoes destrutivas ou irreversiveis, sem autorizacao explicita.
- Nao altere arquivos de ambiente, segredos ou configuracoes sensiveis sem necessidade e autorizacao. Nunca exponha credenciais no frontend; segredos de integracoes de backend pertencem ao ambiente seguro das Edge Functions do Supabase.
- Ao concluir, diferencie verificacoes aprovadas, falhas preexistentes, limitacoes e passos que dependem de validacao manual.

## Hooks Git

`.husky/pre-commit` executa `lint-staged`, configurado em `package.json`. Esse hook e do Git e nao depende do Copilot, OpenCode/OMP ou do provedor de IA selecionado.
