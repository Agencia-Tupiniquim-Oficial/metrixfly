# Manifesto Metrixfly - performance, SEO e visibilidade em IA

O Metrixfly ajuda negocios a entender desempenho web, SEO e visibilidade em mecanismos de resposta por IA (GEO/AEO), transformando evidencias tecnicas em oportunidades de melhoria.

## Principios de engenharia

1. **Precisao:** apresente dados observados; nao invente metricas, causas ou resultados.
2. **Utilidade:** traduza resultados tecnicos em recomendacoes compreensiveis e acionaveis para pessoas de negocio.
3. **Localidade:** mantenha paginas, estado, tipos e logica especificos dentro de `src/features/<dominio>`.
4. **Compartilhamento intencional:** mantenha componentes reutilizaveis em `src/components`, hooks em `src/hooks`, utilitarios em `src/lib` e integracoes compartilhadas em `src/integrations`.
5. **Seguranca:** nao exponha credenciais de backend no navegador; respeite as fronteiras e os controles de acesso do Supabase.
6. **Confiabilidade:** mudanças de comportamento devem ter verificacoes proporcionais ao risco, incluindo testes de regressao quando apropriado.

## Arquitetura (Clean Architecture + Feature-Sliced Design, adocao incremental)

Codigo novo segue estas regras; codigo existente migra apenas quando for alterado por outro motivo, sem refatoracao em massa.

- **Camadas, com imports apenas para baixo:** `app` > `pages` > `widgets` > `features` > `entities` > `shared`. No repositorio atual, `src/app` e a camada `app`; cada dominio em `src/features/<dominio>` agrupa pages, widgets e features do dominio; `src/components`, `src/hooks`, `src/lib` e `src/integrations` fazem o papel de `shared`.
- **Fronteiras ja impostas pelo ESLint:** `shared` nao importa de `features` e `features` nao importa de `app`. Dominios nao devem importar internals de outros dominios.
- **Dominio puro:** regras, calculos e tipos em TypeScript sem React, Supabase ou navegador (`model/`). Servicos e adaptadores (`services/`, `integrations/`) implementam o acesso externo; a UI nao conhece o formato de transporte.
- **Validacao na borda:** dados externos (respostas de Edge Function, formularios, eventos) sao validados onde entram; depois disso os tipos internos sao confiaveis.
- **Efeitos de navegador atras de um modulo:** analytics, armazenamento e `window` ficam em `src/lib` ou no servico do dominio, com teste por substituicao.
- Decisao arquitetural duradoura entra em `PLANO.md` com contexto, decisao, alternativa descartada e consequencia.

## Dominios atuais

- `src/features/diagnostics`: analise PageSpeed, apresentacao e geracao de relatorios.
- `src/features/geo-aeo`: rastreamento GEO/AEO e administracao.
- `src/features/financial-calculator`: estimativas financeiras.
- `src/features/reports`: consulta e exibicao de relatorios.

`supabase/functions/` e `supabase/migrations/` preservam as convencoes do Supabase. Consulte os tipos gerados e os limites de cada dominio antes de mudar dados ou integracoes.
