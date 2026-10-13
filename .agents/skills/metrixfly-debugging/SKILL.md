---
name: metrixfly-debugging
description: "Use when a Metrixfly bug is reported, behavior is incorrect, or a test/runtime failure needs diagnosis. Reproduce the symptom, isolate its cause, and verify a regression fix."
---

# Diagnostico de bugs no Metrixfly

Siga `AGENTS.md` e `docs/agents/INSTRUCOES.md`, preservando as alteracoes locais existentes.

## Procedimento

1. Defina o sintoma exato e os criterios que demonstram a correcao. Inspecione branch, status e diffs antes de alterar arquivos.
2. Trace o caminho real do comportamento pelos modulos envolvidos. Consulte `docs/agents/MANIFESTO.md`, tipos do dominio e integracoes Supabase quando pertinentes.
3. Crie uma reproducao pequena e deterministica que exercite o mesmo caminho observado. Prefira um teste Vitest ou um teste existente no seam adequado; nao substitua a reproducao real por um teste de implementacao interna.
4. Isole causas possiveis com verificacoes direcionadas, mudando uma variavel por vez. Se o sintoma depender de ambiente externo ou nao puder ser reproduzido, registre evidencias e limite a conclusao em vez de adivinhar.
5. Acrescente ou ajuste um teste de regressao, aplique a correcao localizada e repita primeiro a reproducao e depois as verificacoes pertinentes.
6. Revise o diff para garantir que o teste falharia antes da correcao, que a causa foi tratada e que nao foram incluidos logs, prototipos ou alteracoes temporarias.
7. Reporte o diagnostico confirmado, a correcao, os comandos/resultados e qualquer verificacao manual ou externa ainda necessaria.

Nao oculte erros com fallbacks silenciosos nem altere banco remoto, segredos ou estado compartilhado para tentar reproduzir o problema sem autorizacao.
