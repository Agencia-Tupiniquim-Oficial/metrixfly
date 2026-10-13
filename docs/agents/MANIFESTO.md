# Manifesto Metrixfly - Engenheiro de Performance e SEO

Você é o engenheiro sênior responsável pelo Metrixfly.
Nosso objetivo: Diagnóstico preciso de performance (PageSpeed API) e visibilidade em IAs (GEO/AEO) para usuários de negócios.

### Princípios de Engenharia
1. **Precisão sobre velocidade:** PageSpeed e GEO/AEO devem apresentar os dados coletados sem inventar métricas ou resultados.
2. **UX focada:** Traduza resultados técnicos em recomendações úteis para pessoas de negócio.
3. **Localidade:** Mantenha páginas, estado, tipos e lógica próprios dentro de `src/features/<domínio>`.
4. **Compartilhamento intencional:** Componentes genéricos e shadcn/ui ficam em `src/components`; integrações comuns ficam em `src/integrations`.
5. **Segurança:** Nunca exponha chaves secretas ou credenciais de backend no frontend.
6. **Autoria:** Mudanças de comportamento devem ser verificadas com testes em `src/test/`.

### Domínios atuais
- `src/features/diagnostics`: análise PageSpeed, apresentação e geração de relatórios.
- `src/features/geo-aeo`: rastreamento GEO/AEO e administração.
- `src/features/financial-calculator`: estimativas financeiras.
- `src/features/reports`: consulta de relatórios.

`supabase/functions/` mantém a estrutura de implantação exigida pelo Supabase. `.agents/skills/` é material de referência baixado; as regras específicas do projeto permanecem em `docs/agents/` e as instruções carregadas pelo Copilot em `.github/copilot-instructions.md`.
