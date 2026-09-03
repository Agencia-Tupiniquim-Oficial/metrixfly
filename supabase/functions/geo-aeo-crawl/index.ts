const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const absolute = (href: string, base: URL) => { try { return new URL(href, base).href.split("#")[0]; } catch { return null; } };

async function fetchText(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "SpeedLink-AgentCrawl/1.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`O site retornou HTTP ${res.status}.`);
  return { text: await res.text(), url: res.url };
}

function analyzePage(url: string, html: string) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] || "";
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ").replace(/\s+/g, " ").trim();
  const schema = (html.match(/application\/ld\+json/gi) || []).length;
  const faqs = (html.match(/faq|perguntas frequentes|frequently asked/gi) || []).length;
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) !== null;
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  const imagesWithoutAlt = images.filter(m => !/\balt=["'][^"']+["']/i.test(m[0])).length;
  const internalLinks = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].length;
  const issues: string[] = [];
  if (!title) issues.push("Sem title");
  if (!description) issues.push("Sem meta description");
  if (h1.length !== 1) issues.push(h1.length ? "Mais de um H1" : "Sem H1");
  if (text.length < 500) issues.push("Conteúdo curto");
  if (!schema) issues.push("Sem dados estruturados");
  if (!faqs && text.length > 1000) issues.push("Sem bloco de perguntas e respostas");
  if (!canonical) issues.push("Sem canonical");
  if (imagesWithoutAlt) issues.push(`${imagesWithoutAlt} imagem(ns) sem alt`);
  const score = Math.max(0, Math.round(100 - issues.length * 14 + (schema ? 8 : 0) + (faqs ? 5 : 0)));
  return { url, title, score, issues, text, schema, faqs, canonical, noindex, images: images.length, imagesWithoutAlt, internalLinks };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return response(null);
  try {
    const { url } = await req.json();
    const base = new URL(url);
    if (!["http:", "https:"].includes(base.protocol)) return response({ error: "Informe uma URL HTTP ou HTTPS." }, 400);
    const visited = new Set<string>();
    const pages: ReturnType<typeof analyzePage>[] = [];
    const queue = [base.href];
    while (queue.length && pages.length < 12) {
      const current = queue.shift()!;
      const normalized = absolute(current, base);
      if (!normalized || visited.has(normalized) || new URL(normalized).hostname !== base.hostname) continue;
      visited.add(normalized);
      try {
        const fetched = await fetchText(normalized);
        const page = analyzePage(fetched.url, fetched.text);
        pages.push(page);
        for (const match of fetched.text.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
          const link = absolute(match[1], new URL(fetched.url));
          if (link && new URL(link).hostname === base.hostname && !visited.has(link)) queue.push(link);
        }
      } catch (error) { console.warn("Página ignorada", normalized, error); }
    }
    if (!pages.length) return response({ error: "Não foi possível acessar nenhuma página do domínio." }, 502);
    let robots = ""; let sitemap = ""; let llms = "";
    try { robots = (await fetchText(new URL("/robots.txt", base).href)).text; } catch { /* optional file */ }
    try { sitemap = (await fetchText(new URL("/sitemap.xml", base).href)).text; } catch { /* optional file */ }
    try { llms = (await fetchText(new URL("/llms.txt", base).href)).text; } catch { /* optional experimental file */ }
    const avg = (key: "score" | "schema" | "faqs") => Math.round(pages.reduce((sum, page) => sum + (key === "score" ? page.score : page[key] ? 100 : 0), 0) / pages.length);
    const words = pages.reduce((sum, page) => sum + page.text.split(/\s+/).length, 0);
    const schemaPages = pages.filter(p => p.schema).length;
    const answerPages = pages.filter(p => p.faqs || p.text.length > 1200).length;
    const entityCounts = new Map<string, number>();
    for (const page of pages) {
      const headings = [...page.text.matchAll(/(?:^|\.)\s*([A-ZÁÀÃÉÊÍÓÔÕÚÇ][^.!?]{2,60})/g)].slice(0, 8);
      for (const match of headings) {
        const entity = match[1].trim().replace(/\s+/g, " ");
        if (entity.length > 3) entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
      }
    }
    const entities = [...entityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, pages: count, coverage: Math.round((count / pages.length) * 100) }));
    const technical = Math.min(100, Math.round(avg("score") * .65 + (robots ? 15 : 0) + (sitemap ? 20 : 0)));
    const aeo = Math.min(100, Math.round(avg("score") * .5 + (avg("faqs") * .25) + (answerPages / pages.length) * 25));
    const geo = Math.min(100, Math.round(aeo * .55 + (schemaPages / pages.length) * 25 + (robots ? 10 : 0) + (sitemap ? 10 : 0)));
    return response({
      domain: base.hostname, crawledAt: new Date().toISOString(),
      scores: { geo, aeo, technical, authority: Math.min(100, Math.round((schemaPages / pages.length) * 45 + (answerPages / pages.length) * 35 + 20)) },
      stats: { pages: pages.length, indexedPages: pages.filter(p => !p.noindex && !p.issues.includes("Conteúdo curto")).length, schemaPages, answerPages, words },
      technicalDetails: {
        robots: Boolean(robots), sitemap: Boolean(sitemap), llmsTxt: Boolean(llms),
        noindexPages: pages.filter(p => p.noindex).length,
        canonicalPages: pages.filter(p => p.canonical).length,
        images: pages.reduce((sum, p) => sum + p.images, 0),
        imagesWithoutAlt: pages.reduce((sum, p) => sum + p.imagesWithoutAlt, 0),
        internalLinks: pages.reduce((sum, p) => sum + p.internalLinks, 0),
      },
      visibility: { chatgpt: null, gemini: null, perplexity: null },
      pages: pages.map(({ text, schema, faqs, canonical, noindex, images, imagesWithoutAlt, internalLinks, ...page }) => ({
        ...page, schema: Boolean(schema), faqs: Boolean(faqs), canonical, noindex, images, imagesWithoutAlt, internalLinks,
      })),
      findings: [
        ...(!robots ? [{ severity: "warning", title: "robots.txt não encontrado", description: "Agentes de busca e IA não têm instruções explícitas para rastreamento.", recommendation: "Publique robots.txt com sitemap e regras claras." }] : []),
        ...(!sitemap ? [{ severity: "warning", title: "Sitemap XML não encontrado", description: "A descoberta de URLs importantes fica menos eficiente.", recommendation: "Gere e envie um sitemap.xml atualizado." }] : []),
        ...(schemaPages < pages.length ? [{ severity: "warning", title: "Dados estruturados incompletos", description: `${pages.length - schemaPages} páginas não possuem JSON-LD detectável.`, recommendation: "Adicione Organization, WebSite, BreadcrumbList, Article e FAQPage quando aplicável." }] : []),
        ...(pages.some(p => p.imagesWithoutAlt) ? [{ severity: "warning", title: "Imagens sem texto alternativo", description: `${pages.reduce((sum, p) => sum + p.imagesWithoutAlt, 0)} imagem(ns) não têm alt.`, recommendation: "Descreva imagens importantes com alt útil e contextual." }] : []),
        ...(pages.some(p => p.noindex) ? [{ severity: "critical", title: "Páginas marcadas como noindex", description: `${pages.filter(p => p.noindex).length} página(s) estão impedidas de entrar no índice.`, recommendation: "Confirme se o noindex é intencional em páginas estratégicas." }] : []),
      ],
      entities,
      citations: [],
    });
  } catch (error) { console.error("geo-aeo-crawl error", error); return response({ error: error instanceof Error ? error.message : "Erro ao rastrear domínio." }, 500); }
});
