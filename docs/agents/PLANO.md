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

Estado em 2026-10-27 (atualizado apos o redesign): a `main` esta em `673fa5e` (2026-10-28). Tudo abaixo entrou na `main` em `1ebee98` e no Supabase `ocrjjlblxfgrvsnfalhp` (migration aplicada; funcoes `quote-interest` e `quote-request` publicadas; deploy do front pela Vercel a partir da `main`). Rollback: Instant Rollback na Vercel ou `git revert`; a tabela se desfaz com `drop table public.quote_interest_events` e `drop function public.purge_quote_interest_events`.

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

Area administrativa (publicada na `main` em 2026-10-28): ver a secao "Area administrativa da agencia" abaixo.

Outras alteracoes de 2026-10-28: a nota "Medicao com o PageSpeed Insights... Rodar o Agent Crawl" foi removida da home (o Agent Crawl segue no card proprio).

Mantenha este plano atualizado somente enquanto uma iniciativa semelhante estiver em andamento; ao conclui-la, registre o resultado sem transformar o arquivo em historico de cada tarefa cotidiana.

## Area administrativa da agencia (publicada em 2026-10-28)

Objetivo: tela restrita a agencia para ver as analises feitas (referencia de layout: `06-relatorios.html` do Claude Design).

Estado: na `main` (`673fa5e`). Rotas `/admin/login` (link por e-mail, sem senha, `shouldCreateUser: false`) e `/admin` (todas as analises salvas, mais recentes primeiro, com dominio, data, nota no celular, selo de orcamento, busca e link para o relatorio); `noindex`. Migration `20261028120000_create_agency_admin.sql` APLICADA em producao com `db push --linked` (tabela `agency_admins`, `is_agency_admin()`, `admin_list_analyses()`); administrador inicial: `bruno.meireles@agenciatupiniquim.com.br` (para incluir mais pessoas: criar o usuario no Supabase Auth e inserir o e-mail em `agency_admins`). `/reports` e `/geo-admin` redirecionam para `/admin`; as paginas antigas foram removidas. Testes em `src/test/AdminArea.test.tsx`. Verificado em producao pelo usuario: login e lista carregam.

Pendente: guardar QUEM roda o diagnostico (exige pedir e-mail na home; decisao de privacidade); Site URL e Redirect URLs do Supabase Auth devem apontar para `metrixfly.vercel.app` (o link do e-mail abriu em `localhost:3000`); conferir a RLS das tabelas `geo_*` no painel; o GEO nao e salvo no banco (so no `sessionStorage`).

Achados:
- Nao existe login no app: so um formulario de link magico oculto na pagina de GEO (`signInWithOtp`). `/geo-admin` e um placeholder e `/reports` e publica; ela le `geo_crawl_snapshots` e `geo_projects`, tabelas que NAO estao nas migrations do repositorio (existem so no Supabase), entao nao se sabe se a RLS delas protege os dados. Risco a conferir.
- O sistema nao guarda quem fez a analise: `diagnostic_reports` tem so o relatorio (dominio em `report.geo.domain`) e a data; `quote_interest_events` tem dominio, tipo de evento e sessao anonima; o contato de quem pede orcamento so vai por e-mail. Mostrar "pessoas" exigiria passar a guardar dados pessoais (decisao de privacidade).
- Autenticacao nao e autorizacao: qualquer conta com link magico entraria (por isso a checagem fica no banco). A autorizacao fica no banco (`agency_admins` + `is_agency_admin()`), e o login usa `shouldCreateUser: false`.

## Fluxo develop e captura de e-mail (2026-10-29)

Fluxo: branches de tarefa partem da `develop`, voltam por merge (`--no-ff`) e a `develop` gera o preview fixo na Vercel. Da `develop` para a `main` so com OK explicito do usuario. A `main` publicada em 2026-10-29 estava em `5b76740` (FAQ).

Entregue na `develop` (validacao do usuario pendente no preview):
- `fix/diagnostic-layout-overflow`: dominio em linha propria acima da barra de busca no resultado.
- `feat/home-cta-flow`: home sem campo de URL (botoes levam a `/diagnostico`); `/diagnostico` e `/geo-aeo` sem site nao redirecionam mais para a home (o GEO vai para `/diagnostico`); faixa "Achou os problemas?" so com "Solicitar orcamento" em todas as paginas publicas (`components/quote-band.tsx`). Fora do relatorio, "Solicitar orcamento" leva a `/diagnostico`, porque o pedido de orcamento depende de um diagnostico (PDF e resumo). Decisao de nivel B; alternativa descartada: formulario geral sem diagnostico (exige mudar a Edge Function `quote-request`).
- `feat/diagnostic-progress`: porcentagem geral estimada (etapas confirmadas + avanco por tempo, teto de 99%), mensagem "Aguarde enquanto o Metricfly finaliza a analise" e frases rotativas (rascunho do texto: usuario deve aprovar). Marca grafada "Metricfly", conforme decisao registrada.
- `feat/report-email-gate`: popup obrigatorio de e-mail com o relatorio desfocado ate informar (so visual: o relatorio ja esta no navegador). O e-mail fica salvo com o site e o id do relatorio e aparece no painel admin (coluna "E-mail" e tabela de contatos com a contagem de analises). O e-mail fica lembrado no navegador (`localStorage`, chave `metrixfly:report-lead-email`); novas analises do mesmo navegador sao registradas sem pedir de novo. Se o registro falhar, o relatorio e liberado mesmo assim e o aviso aparece. Nao se aplica ao modo demo nem ao relatorio compartilhado.

PENDENTE (autorizacao do usuario): aplicar a migration `20261029120000_create_report_leads.sql` (tabela `report_leads`, funcoes `submit_report_lead` para anon e `admin_list_report_leads` para a agencia). Ate la, o popup libera o relatorio mas nao grava o e-mail, e o painel mostra "Nao foi possivel carregar os e-mails agora". O Supabase e unico (producao): a migration vale tambem para o site publicado. Riscos: a funcao publica nao tem limite de taxa (volume de e-mails falsos possivel); o texto de consentimento do popup e um rascunho a aprovar; retencao dos e-mails nao definida.

### Estado ao fim de 2026-10-29 (para retomar sem o historico do chat)

- `main` = `5b76740` (publicada em producao: FAQ, menu fixo, rolagem suave, botao de voltar ao topo). `develop` = branch de integracao com as 4 branches acima ja mescladas (ultimo merge `5ed581c`). Branches de tarefa remotas: `fix/diagnostic-layout-overflow`, `feat/home-cta-flow`, `feat/diagnostic-progress`, `feat/report-email-gate`, `feat/home-faq`, `feat/home-sticky-header-smooth-scroll`.
- Proximo passo do usuario: validar o preview da `develop` na Vercel (menu, home sem campo, `/diagnostico`, progresso, popup de e-mail, admin). Depois: decidir sobre a migration `20261029120000`, aprovar textos e pedir o merge `develop` -> `main`.
- Vercel: projeto `metrixfly` no time `tupinquim`; o conector MCP da Vercel esta autenticado e permite consultar deploys e previews (somente leitura nesta iniciativa).
- Skill `metrixfly-design` e subagente `metrixfly-design-review` criados para avaliar pedidos visuais antes de implementar; nao foram usados na rodada das 4 branches.
- Itens ainda abertos: lista de decisoes pendentes acima (migration, textos, retencao, limite de taxa, destino do "Solicitar orcamento" fora do relatorio, formulario geral de orcamento, link da faixa nas paginas internas).

### feat/quote-band-flow (2026-10-29, na `develop`)

Pedido do usuario: o "Solicitar orcamento" da faixa final passa a depender de haver diagnostico. Com diagnostico rodado, abre no proprio lugar o mesmo formulario (Nome, Empresa, E-mail, Telefone) da pagina de resultado, que envia o e-mail com o PDF. Sem diagnostico, leva a `/diagnostico` (router state `openQuote`) e, assim que o relatorio fica pronto, o formulario abre sozinho; o popup de e-mail do relatorio nao aparece nesse caso.
- `hooks/use-quote-request.ts` (novo): logica de envio do orcamento extraida da `DiagnosticPage`, sem mudar o comportamento; usada pela pagina e pelo botao da faixa.
- `components/QuoteBandAction.tsx` (novo) e `components/quote-band.tsx` (agora recebe o botao como filho). `QuoteRequestDialog` ganhou modo controlado (`open`, `onOpenChange`, `showTrigger`).
- O e-mail digitado no formulario de orcamento tambem libera o relatorio e grava o lead (mesma funcao `submit_report_lead`; depende da migration pendente). Se o formulario for fechado sem enviar, o popup de e-mail aparece.
- Na propria `/diagnostico` sem resultado, o botao da faixa registra a intencao, rola ate o campo do site e foca nele.
- Divida: paginas de outros dominios (home, geo-aeo, calculadora) importam `QuoteBandAction` de `features/diagnostics`; `useOptionalDiagnosis` foi adicionado ao contexto para o botao nao quebrar fora do provedor.
