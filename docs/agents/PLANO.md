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

## Iniciativa feat/metrixfly-functionalities (publicada em 2026-10-27; pendencias abaixo)

Estado em 2026-10-27 (atualizado apos o redesign): a `main` esta em `8077e34`. Tudo abaixo entrou na `main` em `1ebee98` e no Supabase `ocrjjlblxfgrvsnfalhp` (migration aplicada; funcoes `quote-interest` e `quote-request` publicadas; deploy do front pela Vercel a partir da `main`). Rollback: Instant Rollback na Vercel ou `git revert`; a tabela se desfaz com `drop table public.quote_interest_events` e `drop function public.purge_quote_interest_events`.

Alteracoes posteriores ao plano original (pedidos do usuario):
- Removidos o link "Ver um exemplo de diagnostico" e o card `ServiceInterestCard` (T5). O campo `serviceInterest` segue aceito no e-mail e na tabela, mas o front nao o envia mais.
- `/diagnostico?url=` agora roda o diagnostico sozinho uma vez (nao em `?demo=1`) e vence um diagnostico antigo salvo no `sessionStorage` (a reidratacao ocorre depois da montagem; so o resultado da propria execucao e exibido). Teste de regressao em `DiagnosticPage.test.tsx`, verificado por mutacao. Consequencia: cada abertura de link com `?url=` consome uma analise da API.

Redesign e GEO (publicados na `main`, `a497c03` e `8077e34`):
- 5 telas novas do Claude Design (home, diagnostico em analise e resultado, GEO/AEO, relatorio compartilhado, calculadora), header compartilhado `components/app-header.tsx` (rotas em `app-header-routes.ts`), `components/score-ring.tsx`, tokens `surface-dark`, moldura do relatorio com Visualizar/Editar e botoes de PDF no cabecalho, card "Relatorio salvo" antes da faixa de orcamento. So apresentacao: `model/`, `services/`, Edge Functions e eventos nao mudaram.
- O GEO/AEO roda em paralelo com o diagnostico (`lib/geo-crawl-cache.ts`) e fica no `sessionStorage`; a pagina de GEO reaproveita ou espera esse crawl. `/diagnostico` e `/geo-aeo` sem site nem resultado salvo redirecionam para a home; os estados vazios com 3 cards foram removidos. Custo: cada diagnostico dispara tambem um crawl GEO (ate 12 paginas).
- Fluxo de entrega das telas: branches empilhadas, preview na Vercel por push da branch, merge fast-forward na `main` so com OK explicito.
- Pendente do redesign: destino do botao "Falar com a equipe" da calculadora; campo "Analisar outro site" vazio como no design; data "Analisado em" (nao e guardada); fonte Plus Jakarta Sans; anel duplicado em `features/home/components/ReportPreview.tsx`; textos "PageSpeed" mantidos ate o usuario conferir os termos da API do Google.

Pendente (usuario): criar conta GTM e definir `VITE_GTM_ID` na Vercel (Production e Preview), validar `generate_lead` no GTM Preview; testar e-mail real e linhas em `quote_interest_events`; conferir PDF e landing em celular.

Decisoes abertas: retencao dos registros (12 meses proposto, limpeza nao agendada); manter ou remover o modo demo `?demo=1`; modal de exit-intent; direcao visual e orcamento da Places API.

Proximo: melhorar o layout da home (parece vazia) em branch nova `feat/home-layout`, a partir da `main`.

Worktree `C:\Users\opera\worktrees\metrixfly`, branch `feat/metrixfly-functionalities`, base `002b6ea`. Linha de base: tsc sem erros; lint 0 erros e 9 warnings; build ok; `npm test` 25 arquivos e 94 testes ok com `VITE_SUPABASE_*` ficticias (ver `LEARNINGS.md`).

Marca oficial: **Metricfly** (decisao do usuario). Ficam como estao: "PageSpeed" (API do Google), "Tupiniquim" nos PDFs (agencia, decisao do usuario), identificadores internos (`metrixfly:campaign-attribution`, nomes de skills, `package.json`).

Decisoes registradas:
- FSD/Clean Architecture adotados de forma incremental (ver `MANIFESTO.md`); fronteiras `shared`->`features` e `features`->`app` impostas no ESLint. Divida: 3 imports entre dominios (geo-aeo, reports, financial-calculator -> diagnostics) permanecem.
- GTM: carregamento condicionado a `VITE_GTM_ID` (ID publico). Sem o ID os eventos ficam no `dataLayer` sem efeito. A conta GTM ainda sera criada pelo usuario.

- [x] T1 marca nos e-mails e textos visiveis (`_shared/brand.ts`, `brand.test.ts`; `deno check` ok; envio real de e-mail pendente de validacao manual)
- [x] T3 cabecalho white-label dos PDFs (`model/report-branding.ts`, opcao `branding` em `create*Pdf`; aparencia visual do PDF pendente de validacao manual; a previa HTML do relatorio nao foi alterada)
- [x] T2 evento dataLayer apos envio confirmado (`lib/analytics.ts`, `services/quote-analytics.ts`, evento `generate_lead`; GTM so carrega com `VITE_GTM_ID`; validacao no GTM Preview pendente ate a conta existir)
- [x] T6 registro do clique em "Solicitar orcamento" por empresa (migration `20261027120000_create_quote_interest_events.sql` aplicada e Edge Function `quote-interest` publicada em 2026-10-27; retencao de 12 meses e proposta, a funcao `purge_quote_interest_events` nao esta agendada; sem limite de taxa no endpoint publico, risco registrado)
- [x] T5 pontos de conversao Search Console e Analytics (card `ServiceInterestCard` implementado e depois REMOVIDO a pedido do usuario; o campo `serviceInterest` permanece no backend sem uso no front)
- [x] T7 aviso de saida (`use-exit-guard`, `QuoteExitGuard`). Limites: texto ao fechar/recarregar e do navegador; botao Voltar do navegador nao e interceptavel com `BrowserRouter`; modal de exit-intent NAO implementado (decisao de produto pendente)
- [x] T4 landing explicativa em `/` (`src/features/home`); diagnostico segue em `/diagnostico`; `/?demo=1` redireciona; links "voltar ao diagnostico" agora apontam para `/diagnostico` (teste de `SharedDiagnosticReportPage` atualizado de proposito); copy a revisar pelo usuario; validacao visual mobile/desktop pendente

Divida preexistente encontrada (nao corrigida, fora do escopo): `deno check supabase/functions/diagnose-site/index.ts` falha com erros de tipo (TS2322 em `index.ts:172`, TS2339 em `index.ts:329` e outros); `venv/` do Python esta versionado (1253 arquivos); 3 imports entre dominios (ver acima).

Incidente de processo (corrigido): uma edicao com `[IO.File]::WriteAllText` e caminho relativo gravou na arvore original em vez da worktree. Foi revertida byte a byte e `git status` da arvore original voltou a vazio. Efeito colateral: faltava a ligacao `onOpened` em `DiagnosticPreview` na worktree, que os testes nao detectavam por mockarem essa camada; corrigido e coberto por `DiagnosticPreviewQuoteInterest.test.tsx` (verificado por mutacao). Regra pratica: nunca usar caminho relativo em .NET dentro de `cd`; usar Edit ou caminho absoluto.

Decisoes de nivel B: evento `cta_click` (`cta_id`, `location`) na landing; `?url=` pre-preenche o endereco no diagnostico (substituido: agora roda a analise, ver "Alteracoes posteriores").
- [x] T8 e T9 pesquisas em `docs/research/` (2026-10-27). Lacunas: precos do RapidAPI/OpenWeb Ninja nao confirmados; campos por SKU e regras de cache do Places nao verificados; demos do ThemeForest nao avaliadas visualmente

Area administrativa (em andamento, branch `feat/admin-panel`, nao publicada): ver a secao "Area administrativa da agencia" abaixo.

Mantenha este plano atualizado somente enquanto uma iniciativa semelhante estiver em andamento; ao conclui-la, registre o resultado sem transformar o arquivo em historico de cada tarefa cotidiana.

## Area administrativa da agencia (em andamento)

Objetivo: tela restrita a agencia para ver as analises feitas (referencia de layout: `06-relatorios.html` do Claude Design). Branch `feat/admin-panel`, sem push, sem migration aplicada.

Achados:
- Nao existe login no app: so um formulario de link magico oculto na pagina de GEO (`signInWithOtp`). `/geo-admin` e um placeholder e `/reports` e publica; ela le `geo_crawl_snapshots` e `geo_projects`, tabelas que NAO estao nas migrations do repositorio (existem so no Supabase), entao nao se sabe se a RLS delas protege os dados. Risco a conferir.
- O sistema nao guarda quem fez a analise: `diagnostic_reports` tem so o relatorio (dominio em `report.geo.domain`) e a data; `quote_interest_events` tem dominio, tipo de evento e sessao anonima; o contato de quem pede orcamento so vai por e-mail. Mostrar "pessoas" exigiria passar a guardar dados pessoais (decisao de privacidade).
- Autenticacao nao e autorizacao: qualquer conta com link magico entraria. A autorizacao fica no banco (`agency_admins` + `is_agency_admin()`), e o login usa `shouldCreateUser: false`.
