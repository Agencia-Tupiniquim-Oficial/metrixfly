# Instrucoes dos agentes

Use `docs/agents/INSTRUCOES.md` como fluxo de trabalho e `docs/agents/GOVERNANCA.md` como limites de autonomia. Consulte `docs/agents/MANIFESTO.md` para os principios do produto e `docs/agents/LEARNINGS.md` quando houver restricoes tecnicas pertinentes.

- Antes de editar, identifique criterios de aceitacao, leia o codigo e os testes relacionados e confira branch, `git status` e diffs staged/unstaged. Preserve alteracoes preexistentes; nao as descarte, sobrescreva ou inclua no stage sem autorizacao.
- Crie uma branch de tarefa quando isso for seguro e nao misturar trabalho preexistente. Se nao for seguro, nao faca stash/reset nem troque de branch; explique o bloqueio e pergunte se necessario.
- Codigo especifico de produto fica em `src/features/<dominio>`; codigo compartilhado fica em `src/components`, `src/hooks`, `src/lib` ou `src/integrations`. Edge Functions e migracoes permanecem em `supabase/functions` e `supabase/migrations`.
- Use somente comandos e verificacoes existentes em `package.json` ou comandos TypeScript confirmados na configuracao. Analise o diff final e reporte branch, verificacoes executadas, limitacoes e validacao manual pendente.
- Nao faca commit, push, merge, deploy, operacoes destrutivas ou mudancas remotas sem autorizacao explicita.
- Skills especificas do projeto ficam em `.agents/skills/`; carregue uma somente quando seu gatilho e objetivo corresponderem a tarefa.
