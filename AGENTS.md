# Instrucoes dos agentes

Use `docs/agents/INSTRUCOES.md` como fluxo de trabalho e `docs/agents/GOVERNANCA.md` como limites de autonomia. Consulte `docs/agents/MANIFESTO.md` para os principios do produto e `docs/agents/LEARNINGS.md` quando houver restricoes tecnicas pertinentes.

## Fluxo obrigatorio

Antes de implementar qualquer tarefa:

1. Identifique os criterios de aceitacao e consulte as instrucoes e skills aplicaveis.
2. Leia o codigo e os testes relacionados para entender a implementacao existente.
3. Confira a branch atual, `git status` e os diffs staged e unstaged.
4. Trabalhe em uma branch especifica para a tarefa, criada a partir da base apropriada, sempre que isso for seguro. Se houver alteracoes preexistentes que possam ser afetadas, preserve-as e explique o bloqueio antes de trocar de branch.
5. Implemente apenas o escopo solicitado, seguindo os padroes existentes e evitando refatoracoes nao solicitadas.
6. Execute os testes, verificacoes de tipos e lint pertinentes, usando comandos existentes em `package.json` ou comandos TypeScript confirmados na configuracao.
7. Revise o diff final para identificar alteracoes inesperadas ou fora do escopo.
8. Informe a branch utilizada, os arquivos alterados, as verificacoes executadas, as limitacoes e a validacao manual pendente.

## Preservacao do trabalho

Preserve alteracoes preexistentes. Nao descarte, sobrescreva, reverta ou inclua alteracoes no stage sem autorizacao.

Ao continuar um trabalho iniciado por outra IA, verifique o estado real do repositorio, a branch, os diffs e os testes. Nao presuma que a etapa anterior foi concluida corretamente.

Nao faca stash, reset ou troca de branch que possa colocar alteracoes locais em risco. Se nao for seguro prosseguir, explique o bloqueio e pergunte como continuar.

## Organizacao do codigo

Codigo especifico de produto fica em `src/features/<dominio>`. Codigo compartilhado fica em `src/components`, `src/hooks`, `src/lib` ou `src/integrations`. Edge Functions e migracoes permanecem em `supabase/functions` e `supabase/migrations`.

Skills especificas do projeto ficam em `.agents/skills/`. Carregue uma skill somente quando seu gatilho e objetivo corresponderem a tarefa.

## Limites de autonomia

Nao faca commit, push, merge, deploy, publicacao em producao, operacoes destrutivas ou mudancas remotas sem autorizacao explicita.

Nao declare testes aprovados sem executa-los. Se uma verificacao nao puder ser executada, informe o motivo e nao a apresente como concluida.

Essas regras se aplicam independentemente da IA ou ferramenta utilizada.
