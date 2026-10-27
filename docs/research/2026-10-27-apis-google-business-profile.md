# Pesquisa: APIs para ampliar o diagnostico com dados do Perfil da Empresa no Google (T8)

Data da consulta: 2026-10-27. Pesquisa de leitura publica: nenhuma conta, chave, cartao ou plano foi criado ou contratado.

## Pergunta

Que APIs poderiam trazer dados de Perfil da Empresa no Google (antigo Google Meu Negocio) para o diagnostico da Metricfly, e qual combina com a arquitetura (Edge Functions, chaves no backend) e com o modelo de negocio (diagnosticar sites de terceiros, prospects)?

## Resultado resumido

| Opcao | O que oferece | Acesso | Custo/limites confirmados | Encaixe |
|---|---|---|---|---|
| Google Business Profile APIs (oficial) | Gerenciar perfis, posts, fotos, avaliacoes de locais que voce administra | Exige conta Google, projeto Cloud, conta de organizacao, perfil verificado e ativo ha 60+ dias e site no perfil; acesso solicitado por formulario e aprovado pelo Google | Cota 0 QPM ate aprovar; 300 QPM depois (documentacao oficial) | Serve para o futuro, para clientes que autorizem (OAuth). Nao serve para diagnosticar um prospect qualquer |
| Google Places API (New) (oficial) | Dados publicos de um local: endereco, telefone, nota, avaliacoes, horarios, fotos | Chave de API de projeto Cloud com cobranca ativada; chave fica na Edge Function | Cobranca por SKU, ver tabela abaixo | Melhor encaixe para dados de terceiros |
| APIs de terceiros (por exemplo OpenWeb Ninja "Local Business Data") | Dados de listagens do Google Maps | Conta no fornecedor; pode haver listagem no RapidAPI | Plano gratuito e precos NAO confirmados em fonte primaria | Risco de dependencia e de termos; nao recomendado como primeira escolha |

### Places API (New): precos (fonte: pagina oficial de precos, "Last updated 2026-10-23 UTC"; USD por 1.000 requisicoes, primeira faixa ate 100.000/mes)

| SKU | Franquia gratuita mensal | Preco |
|---|---|---|
| Text Search (IDs Only) | ilimitada | sem cobranca listada |
| Text Search Pro | 5.000 | 32,00 |
| Text Search Enterprise | 1.000 | 35,00 |
| Place Details Essentials | 10.000 | 5,00 |
| Place Details Pro | 5.000 | 17,00 |
| Place Details Enterprise | 1.000 | 20,00 |
| Place Details Enterprise + Atmosphere | 1.000 | 25,00 |

Os resultados de busca traziam valores conflitantes para esses SKUs; os numeros acima vem da pagina oficial buscada diretamente.

## O que NAO foi confirmado

- Quais campos (nota, quantidade de avaliacoes, horarios, fotos, categorias, status) pertencem a qual SKU. Consultar "Place Data Fields" antes de estimar custo.
- Regras de exibicao, atribuicao e armazenamento/cache dos dados do Places. A pagina de visao geral nao as menciona; os Termos da Plataforma Google Maps precisam ser lidos antes de persistir dados em `diagnostic_reports`.
- Se as APIs do Perfil da Empresa permitem ler perfis de terceiros. A documentacao liga a elegibilidade a perfis que o solicitante gerencia (proprios ou de clientes), mas nao afirma isso como restricao de leitura.
- Plano gratuito, preco e limites do "Local Business Data" no RapidAPI ou no portal do fornecedor: as paginas obtidas nao traziam precos. Apenas um resumo de terceiros cita 100 requisicoes/mes gratuitas e US$ 25/mes para a faixa inicial; trate como nao verificado.
- Se esses fornecedores de terceiros tem autorizacao do Google para os dados que revendem (termos e legalidade).
- Tempo de aprovacao do acesso ao Perfil da Empresa: ha relatos de espera de semanas no forum do Google (anedoticos, nao oficiais).

## Recomendacao

1. Para diagnosticar sites de terceiros, avaliar primeiro a **Places API (New)** chamada pela Edge Function, com franquia gratuita e orcamento/alertas de cobranca definidos antes. Comecar por poucos campos (nota e quantidade de avaliacoes) e medir o custo real.
2. Tratar a **Business Profile API** como fase posterior, para clientes que concedam acesso ao proprio perfil. Exige solicitar acesso ao Google, o que depende de voce.
3. Nao adotar API de terceiros sem confirmar plano, termos e origem dos dados.

## Decisoes que dependem de voce

- Orcamento mensal aceitavel e conta Google Cloud com cobranca (nao criei nada).
- Aceitar ou nao armazenar dados do Places junto ao relatorio salvo (depende dos termos acima).
- Se o produto deve oferecer, no futuro, o fluxo "conecte seu Perfil da Empresa".

## Fontes

- Precos: https://developers.google.com/maps/billing-and-pricing/pricing
- Visao geral do Places API (New): https://developers.google.com/maps/documentation/places/web-service/overview
- Pre-requisitos do Perfil da Empresa: https://developers.google.com/my-business/content/prereqs
- Visao geral e limites do Perfil da Empresa: https://developers.google.com/my-business/content/overview e https://developers.google.com/my-business/content/limits
- Fornecedor de terceiros (precos nao exibidos nas paginas obtidas): https://www.openwebninja.com/api/local-business-data
- Relatos de espera de aprovacao (forum, anedoticos): https://discuss.google.dev/t/gbp-api-escalation-basic-access-pending-14-days-requests-per-minute-locked-at-0/393020
