# Fluxo de trabalho

Siga este procedimento para funcionalidades e correcoes. Ajuste a profundidade das verificacoes ao risco e ao escopo; nao transforme tarefas pequenas em processos artificiais.

## 1. Entender e mapear impacto

- Reescreva o pedido como criterios de aceitacao observaveis. Pergunte somente quando uma ambiguidade puder mudar comportamento, escopo, seguranca ou dados.
- Leia o codigo, os tipos, os testes e os padroes dos modulos afetados. Consulte `MANIFESTO.md` e `LEARNINGS.md` quando forem pertinentes; nao leia nem atualize documentos sem relacao com a tarefa.
- Para mudancas de produto, mantenha a logica especifica em `src/features/<dominio>` e os elementos compartilhados em `src/components`, `src/hooks`, `src/lib` ou `src/integrations`. Respeite as fronteiras do Supabase.

## 2. Conferir Git e preparar o trabalho

- Antes de editar, registre mentalmente a branch atual e examine `git status --short`, `git diff` e `git diff --cached`. Separe mudancas preexistentes das mudancas da tarefa.
- Crie uma branch com nome especifico se isso for seguro e nao misturar alteracoes preexistentes. Nao descarte, esconda ou inclua no stage mudancas alheias. Se nao conseguir isolar o trabalho com seguranca, pare e pergunte.

## 3. Implementar

- Prefira uma mudanca localizada que satisfaca os criterios, seguindo os padroes do modulo. Evite refatoracoes nao necessarias.
- Para mudanca de comportamento, acrescente ou atualize testes no seam adequado; investigue regressao com uma reproducao verificavel quando corrigir um bug.
- Nao altere banco remoto, segredos, configuracoes sensiveis ou servicos externos sem autorizacao.

## 4. Validar e revisar

- Escolha verificacoes pertinentes entre os comandos disponiveis: `npm test`, `npm run lint`, `npm run build` e `npm run check`.
- Nao ha script `typecheck` em `package.json`; para alteracoes TypeScript, use `npx tsc --noEmit -p tsconfig.app.json`. `npm run check` executa ESLint antes do Vitest; se o lint interromper o script, rode `npm test` separadamente.
- Corrija problemas introduzidos pela mudanca e repita as verificacoes afetadas. Identifique erros preexistentes sem atribui-los a tarefa nem declarar sucesso global.
- Revise `git diff` e `git diff --cached`: confirme os criterios, imports, testes, seguranca, ausencia de alteracoes incidentais e preservacao do trabalho alheio.

## Papeis e registro

- **Planejar:** transforme a tarefa em um cartao em `PLANO.md` com criterios de aceite, arquivos provaveis, testes e riscos antes de editar.
- **Executar:** siga a skill `metrixfly-implementation`, uma tarefa por vez. Registre no cartao as decisoes de nivel B, as verificacoes executadas (comando e resultado) e as pendencias.
- **Revisar:** use a skill `metrixfly-review` em contexto separado do executor, lendo apenas o diff, os criterios do cartao e as evidencias. Achados voltam ao executor; ver limites em `GOVERNANCA.md`.
- Os niveis de decisao e o limite de tentativas estao em `GOVERNANCA.md`.

## 5. Reportar

Informe o que mudou, a branch, os comandos executados e seus resultados, limitacoes ou falhas preexistentes, e o que ainda exige validacao manual. Nao declare a tarefa concluida apenas porque os arquivos foram editados.

Use `PLANO.md` somente para uma iniciativa de agentes que tenha varias etapas; atualize `LEARNINGS.md` apenas para fatos tecnicos duradouros que ainda nao estejam documentados.
