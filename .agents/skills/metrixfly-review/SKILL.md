---
name: metrixfly-review
description: "Use to review a Metrixfly working-tree diff, branch, or proposed change for requirement gaps, correctness, architecture drift, security risks, and regressions."
---

# Revisao de mudancas no Metrixfly

Revise o diff contra os criterios de aceitacao e as convencoes em `AGENTS.md`, `docs/agents/GOVERNANCA.md` e `docs/agents/MANIFESTO.md`. Esta skill e de leitura; nao altere arquivos durante a revisao.

## Procedimento

1. Identifique a branch/base e leia `git status --short`, `git diff` e `git diff --cached`. Separe alteracoes preexistentes e nao assuma que todo o diff pertence a tarefa.
2. Compare cada mudanca com os criterios de aceitacao, os callers afetados, os tipos, a arquitetura por dominio e os testes.
3. Procure falhas de logica, erros de dados/estado, tratamento de erros insuficiente, mudancas sem teste, compatibilidade quebrada e escopo incidental.
4. Para seguranca, examine validacao de entrada, autorizacao, exposicao de dados/segredos, limites entre navegador e Edge Functions, consultas e politicas Supabase, e riscos em migracoes ou operacoes remotas.
5. Diferencie defeitos introduzidos de problemas preexistentes. Nao reporte preferencia de estilo como bug nem trate avisos do linter como falhas funcionais.
6. Apresente findings primeiro, em ordem de severidade, citando arquivo/linha e impacto; inclua uma avaliacao de confianca. Se nao encontrar problemas, diga que nao encontrou findings e liste lacunas de cobertura relevantes.

Nao faca commit, push, merge, deploy ou correcoes durante a revisao, a menos que o usuario tambem tenha pedido explicitamente essa acao.
