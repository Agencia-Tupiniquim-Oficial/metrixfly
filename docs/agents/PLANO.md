# Placar de Execução - Metrixfly

### Fase 1: Refatoração Técnica e Limpeza (Em curso)
- [x] Configuração da governança do projeto (`docs/agents/`)
- [x] Centralizar tipagens de diagnóstico (`src/features/diagnostics/model/diagnose.ts`)
- [x] Centralizar tratamento de erros (`src/features/diagnostics/services/error-handler.ts`)
- [x] Simplificar protótipos: Remover VariantA, VariantB e switcher no Index.tsx

### Fase 2: Organização da Estrutura (Em curso)
- [x] Agrupar código ativo por funcionalidade: diagnóstico, GEO/AEO, relatórios e calculadora.
- [x] Manter módulos compartilhados e componentes shadcn em locais comuns estáveis.
- [x] Atualizar documentação para descrever a stack e o produto atuais.
- [x] Validar imports, build, TypeScript e testes; registrar o estado do lint.

Validação da reorganização (2026-10-13): `npm test` (10 testes), `npm run build` e `npx tsc --noEmit -p tsconfig.app.json` passaram. `npm run lint` continua bloqueado por erros preexistentes distribuídos pelo repositório; os arquivos reorganizados verificados isoladamente não têm erros de lint.

### Fase 3: Organização da Governança e Agentes (Concluída)
- [x] Centralizar a governança em `docs/agents/` e mover para lá `GOVERNANCA.md`.
- [x] Criar instruções enxutas para Copilot em `.github/copilot-instructions.md` e OpenCode/OMP em `AGENTS.md`.
- [x] Preservar `.agents/skills/` como pacote de skills de referência e `.husky/` como configuração dos hooks Git.
- [x] Atualizar README e referências de caminhos.

### Funcionalidades Implementadas (Done)
- [x] Integração base com API PageSpeed
- [x] Estrutura de Componentes UI
- [x] Integração Supabase
- [x] Geração de pré-visualização de relatórios de negócios
- [x] Dashboard de GEO/AEO

### Pendências (Backlog - Futuro)
- Itens de produto ainda não priorizados: [`docs/roadmap.md`](../roadmap.md).
