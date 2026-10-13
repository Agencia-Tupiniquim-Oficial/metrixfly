# Manifesto Metrixfly - performance, SEO e visibilidade em IA

O Metrixfly ajuda negocios a entender desempenho web, SEO e visibilidade em mecanismos de resposta por IA (GEO/AEO), transformando evidencias tecnicas em oportunidades de melhoria.

## Principios de engenharia

1. **Precisao:** apresente dados observados; nao invente metricas, causas ou resultados.
2. **Utilidade:** traduza resultados tecnicos em recomendacoes compreensiveis e acionaveis para pessoas de negocio.
3. **Localidade:** mantenha paginas, estado, tipos e logica especificos dentro de `src/features/<dominio>`.
4. **Compartilhamento intencional:** mantenha componentes reutilizaveis em `src/components`, hooks em `src/hooks`, utilitarios em `src/lib` e integracoes compartilhadas em `src/integrations`.
5. **Seguranca:** nao exponha credenciais de backend no navegador; respeite as fronteiras e os controles de acesso do Supabase.
6. **Confiabilidade:** mudanças de comportamento devem ter verificacoes proporcionais ao risco, incluindo testes de regressao quando apropriado.

## Dominios atuais

- `src/features/diagnostics`: analise PageSpeed, apresentacao e geracao de relatorios.
- `src/features/geo-aeo`: rastreamento GEO/AEO e administracao.
- `src/features/financial-calculator`: estimativas financeiras.
- `src/features/reports`: consulta e exibicao de relatorios.

`supabase/functions/` e `supabase/migrations/` preservam as convencoes do Supabase. Consulte os tipos gerados e os limites de cada dominio antes de mudar dados ou integracoes.
