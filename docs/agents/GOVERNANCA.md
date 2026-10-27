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

## Niveis de decisao

Os limites acima valem sempre. Dentro deles, use estes niveis para decidir se o agente segue sozinho ou pergunta.

- **A - decida e siga:** nomes, estrutura interna de modulos, testes, correcao de defeitos introduzidos pela propria tarefa, estilo conforme o dominio e escolha entre alternativas equivalentes de baixo risco.
- **B - decida e registre em `PLANO.md`:** dependencia de desenvolvimento nova, componente ou modulo compartilhado novo, nome de evento ou campo, mudanca compativel de contrato entre frontend e Edge Function, e qualquer desvio do plano aprovado.
- **C - pare e pergunte:** texto comercial e promessas de produto, coleta ou retencao de dado pessoal, politica de acesso (RLS), aplicar migracao, deploy, IDs e contas de servicos externos, contratacao ou cadastro, mudanca de escopo, commit, push e merge.

Lacuna de informacao que nao puder ser verificada no codigo, nos testes ou em documentacao oficial vira registro de incerteza em `PLANO.md`; prossiga com o que for independente e bloqueie apenas a parte afetada.

## Ciclo de correcao e parada

- Limite de 3 tentativas por verificacao que falha. Pare antes se o mesmo erro se repetir duas vezes ou se uma tentativa nao reduzir as falhas.
- Ao parar, registre sintoma, hipoteses descartadas e tentativas em `PLANO.md`, marque a tarefa como bloqueada e siga para outra independente.
- A revisao independente tem no maximo 2 rodadas; uma terceira vira decisao do usuario.
- Resultados vem de comandos executados; "deve passar" nao e resultado. Afirmacao sobre o repositorio cita arquivo e linha ou o comando que a provou.
- Versoes e APIs de bibliotecas e servicos externos vem da documentacao oficial da versao em uso, com a data da consulta registrada; nunca da memoria.
- No maximo duas frentes de implementacao simultaneas, cada uma em worktree propria ou em arquivos disjuntos.

## Hooks Git

`.husky/pre-commit` executa `lint-staged`, configurado em `package.json`. Esse hook e do Git e nao depende do Copilot, OpenCode/OMP ou do provedor de IA selecionado.
