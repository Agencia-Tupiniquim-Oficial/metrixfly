# Pesquisa: API do Stackfly para o diagnostico

Data da consulta: 2026-11-04. Fontes: chamada real a `https://stackfly.vercel.app/api/v1/stack?url=agenciatupiniquim.com.br`, pagina `https://stackfly.vercel.app/` e repositorio publico `Agencia-Tupiniquim-Oficial/stackfly` (branch `master`: `README.md`, `API_DOCS.md`, `FLUXO_API.md`, `.env.example`, `src/app/api/v1/stack/route.ts`, `src/lib/api/stack-handler.ts`, `src/lib/analyzer/collect.ts`).

## Contrato

- `GET /api/v1/stack?url=<dominio ou URL>`. Sem chave nem cadastro. Esquema opcional (`exemplo.com` vira `https://exemplo.com`); so http/https e portas 80, 443, 8080, 8443.
- CORS aberto (`Access-Control-Allow-Origin: *`).
- Resposta 200:

```json
{
  "url": "https://agenciatupiniquim.com.br",
  "finalUrl": "https://www.agenciatupiniquim.com.br/",
  "analyzedAt": "2026-11-04T17:20:30.099Z",
  "count": 7,
  "technologies": [
    { "name": "WP Rocket", "categories": ["Caching", "WordPress plugins"], "confidence": 100, "version": "3.23.3.3", "website": "https://wp-rocket.me", "implied": false }
  ],
  "grouped": { "Caching": [] },
  "cached": true
}
```

- Erros: `{ "error": "<mensagem>", "code": "<CODIGO>" }`. 400 `MISSING_URL`/`INVALID_URL`/`UNSUPPORTED_PROTOCOL`, 403 `BLOCKED_TARGET`, 429 `RATE_LIMITED` (com `Retry-After`), 500 `INTERNAL_ERROR`, 502 `DNS_RESOLUTION_FAILED`/`NAVIGATION_FAILED`, 503 `SERVER_BUSY`/`BROWSER_UNAVAILABLE`, 504 `TIMEOUT`.

## Limites

- Analise com Chromium headless: prazo total de 45 s (`maxDuration` 60 s na Vercel).
- Limite de 10 requisicoes por minuto por IP (janela fixa). As Edge Functions do Supabase saem por IPs compartilhados.
- Cache de 1 h por URL canonica no proprio Stackfly; falhas nao sao cacheadas.

## O que a API nao traz

- Nao ha campos de vulnerabilidade, CVE ou "versao desatualizada".
- Versao depende das fingerprints do Wappalyzer; no site da agencia o WordPress veio com `version: null` e so o WP Rocket trouxe versao. Tecnologias implicitas (`implied: true`, ex.: PHP e MySQL a partir do WordPress) vem sem versao.

## Uso no Metricfly

Chamada opcional, em paralelo ao PageSpeed, dentro da Edge Function `diagnose-site` (ver `supabase/functions/_shared/tech-stack.ts`). Qualquer falha omite a secao "Tecnologias do site".
