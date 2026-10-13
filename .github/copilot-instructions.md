# Instrucoes do projeto

- Leia `docs/agents/INSTRUCOES.md` e `docs/agents/MANIFESTO.md` antes de alterar codigo; consulte `docs/agents/LEARNINGS.md` para restricoes conhecidas.
- Para tarefas que envolvam varios modulos, registre as etapas em `docs/agents/PLANO.md`.
- Codigo de produto especifico fica em `src/features/<dominio>`; reutilizaveis ficam em `src/components`, `src/hooks`, `src/lib` e `src/integrations`.
- Mantenha as Edge Functions e migracoes nas pastas padrao `supabase/functions` e `supabase/migrations`.
- Valide mudancas com os scripts existentes em `package.json`; para mudancas de estrutura, execute testes, TypeScript e build.
- `.agents/skills/` e material de referencia baixado. Consulte uma skill quando ela for relevante; as politicas do Metrixfly ficam em `docs/agents/`.
