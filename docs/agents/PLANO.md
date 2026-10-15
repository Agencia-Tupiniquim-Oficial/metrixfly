# Plano de evolucao da governanca de agentes

Este arquivo acompanha somente iniciativas de agentes e skills que tenham varias etapas. Nao e um checklist obrigatorio para cada tarefa nem o backlog de produto; funcionalidades futuras estao em [`docs/roadmap.md`](../roadmap.md).

## Organizacao do projeto - concluida

- [x] Organizar funcionalidades em `src/features/` por dominio.
- [x] Manter governanca em `docs/agents/` e instrucoes de workspace na raiz.
- [x] Identificar scripts, testes, verificacao TypeScript e limitações atuais do lint.

## Fluxo Metrixfly de desenvolvimento assistido por IA

- [x] Definir hierarquia de instrucoes e limites de autonomia.
- [x] Alinhar o fluxo de trabalho com a arquitetura e os comandos reais do projeto.
- [x] Selecionar referencias uteis do pacote AI Hero e criar skills proprias concisas.
- [x] Isolar ou remover skills de referencia que nao fazem parte do fluxo do projeto.
- [x] Validar caminhos, frontmatter, testes e diff final.

As referencias conceituais selecionadas foram `codebase-design`, `tdd`, `diagnosing-bugs`, `code-review` e `domain-modeling`. Seus principios foram adaptados ao Metrixfly; as copias originais e o arquivo de lock do pacote foram removidos, sem dependencia de runtime do repositorio externo.

Mantenha este plano atualizado somente enquanto uma iniciativa semelhante estiver em andamento; ao conclui-la, registre o resultado sem transformar o arquivo em historico de cada tarefa cotidiana.
