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

## Iniciativa feat/metrixfly-functionalities (em andamento)

Worktree `C:\Users\opera\worktrees\metrixfly`, branch `feat/metrixfly-functionalities`, base `002b6ea`. Linha de base: tsc sem erros; lint 0 erros e 9 warnings; build ok; `npm test` 25 arquivos e 94 testes ok com `VITE_SUPABASE_*` ficticias (ver `LEARNINGS.md`).

Marca oficial: **Metricfly** (decisao do usuario). Ficam como estao: "PageSpeed" (API do Google), "Tupiniquim" nos PDFs (agencia, decisao do usuario), identificadores internos (`metrixfly:campaign-attribution`, nomes de skills, `package.json`).

Decisoes registradas:
- FSD/Clean Architecture adotados de forma incremental (ver `MANIFESTO.md`); fronteiras `shared`->`features` e `features`->`app` impostas no ESLint. Divida: 3 imports entre dominios (geo-aeo, reports, financial-calculator -> diagnostics) permanecem.
- GTM: carregamento condicionado a `VITE_GTM_ID` (ID publico). Sem o ID os eventos ficam no `dataLayer` sem efeito. A conta GTM ainda sera criada pelo usuario.

- [x] T1 marca nos e-mails e textos visiveis (`_shared/brand.ts`, `brand.test.ts`; `deno check` ok; envio real de e-mail pendente de validacao manual)
- [x] T3 cabecalho white-label dos PDFs (`model/report-branding.ts`, opcao `branding` em `create*Pdf`; aparencia visual do PDF pendente de validacao manual; a previa HTML do relatorio nao foi alterada)
- [x] T2 evento dataLayer apos envio confirmado (`lib/analytics.ts`, `services/quote-analytics.ts`, evento `generate_lead`; GTM so carrega com `VITE_GTM_ID`; validacao no GTM Preview pendente ate a conta existir)
- [x] T6 registro do clique em "Solicitar orcamento" por empresa (migration `20261027120000_create_quote_interest_events.sql` NAO aplicada; Edge Function `quote-interest` NAO publicada; retencao de 12 meses e proposta, a funcao `purge_quote_interest_events` nao esta agendada; sem limite de taxa no endpoint publico, risco registrado)
- [x] T5 pontos de conversao Search Console e Analytics (`ServiceInterestCard`, campo `serviceInterest` ate o e-mail; copy sem prometer integracao, a revisar pelo usuario)
- [x] T7 aviso de saida (`use-exit-guard`, `QuoteExitGuard`). Limites: texto ao fechar/recarregar e do navegador; botao Voltar do navegador nao e interceptavel com `BrowserRouter`; modal de exit-intent NAO implementado (decisao de produto pendente)
- [x] T4 landing explicativa em `/` (`src/features/home`); diagnostico segue em `/diagnostico`; `/?demo=1` redireciona; links "voltar ao diagnostico" agora apontam para `/diagnostico` (teste de `SharedDiagnosticReportPage` atualizado de proposito); copy a revisar pelo usuario; validacao visual mobile/desktop pendente

Decisoes de nivel B: evento `cta_click` (`cta_id`, `location`) na landing; `?url=` pre-preenche o endereco no diagnostico (sem rodar a analise automaticamente).
- [ ] T8 e T9 pesquisas (RapidAPI, ThemeForest/CodeCanyon) em `docs/research/`

Mantenha este plano atualizado somente enquanto uma iniciativa semelhante estiver em andamento; ao conclui-la, registre o resultado sem transformar o arquivo em historico de cada tarefa cotidiana.
