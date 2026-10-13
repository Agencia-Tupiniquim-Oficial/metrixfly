# Project instructions

- Before changing code, read `docs/agents/INSTRUCOES.md` and `docs/agents/MANIFESTO.md`; read `docs/agents/LEARNINGS.md` for project-specific constraints.
- For work spanning multiple modules, read and update `docs/agents/PLANO.md`.
- Product code belongs in `src/features/<domain>`; shared code belongs in `src/components`, `src/hooks`, `src/lib`, or `src/integrations`.
- Keep Supabase Edge Functions and migrations in `supabase/functions` and `supabase/migrations`.
- Validate changes with the scripts in `package.json`; structural changes require tests, a TypeScript check, and a production build.
- `.agents/skills/` contains reference skills. Load relevant `SKILL.md` files when the task matches their purpose.
