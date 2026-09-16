// test/translation_smoke_test.ts
// Smoke test for translation pipeline (mocked Supabase + OpenRouter)
import { Document, Packer, Paragraph, TextRun } from "https://esm.sh/docx@8.5.0";

// Minimal static dictionaries
const PAGE_SPEED_SHORT_DESCRIPTIONS: Record<string,string> = {
  "unused-javascript": "Há JavaScript carregado que não é utilizado no carregamento inicial.",
};

const PAGE_SPEED_LABELS: Record<string, { title?: string }> = {
  "unused-javascript": { title: "JavaScript não utilizado" },
  "offscreen-images": { title: "Imagens fora da tela" },
};

// In-memory cache to simulate pagespeed_translations table
const cache = new Map<string,string>();
async function getPagespeedTranslation(audit_id: string): Promise<string|null> {
  return cache.has(audit_id) ? cache.get(audit_id)! : null;
}
async function upsertPagespeedTranslation(audit_id:string, translated:string) {
  cache.set(audit_id, translated);
}

// Mock batch translator (simulates OpenRouter response)
async function translateSummaryFields(items: Array<{audit_id:string, text:string}>) {
  // pretend we send one batch and receive translations
  const map: Record<string,string> = {};
  for (const it of items) {
    // simplistic translation
    map[it.audit_id] = `PT-BR: ${it.text}`;
    // save to cache
    await upsertPagespeedTranslation(it.audit_id, map[it.audit_id]);
  }
  return map;
}

function translatePageSpeedDescription(s: string) { return s; }
function translatePageSpeedTitle(s: string) { return s; }
function translateReportText(s: string) { return s; }

// buildPageSpeedImprovements - simplified
function buildPageSpeedImprovements(mobile:any, desktop:any) {
  const opps = (mobile.opportunities || []).concat(desktop.opportunities || []);
  return opps.slice(0,8).map((o:any,i:number) => ({ title: `Melhoria: ${o.id}`, description: PAGE_SPEED_SHORT_DESCRIPTIONS[o.id] ?? o.rawDescription || '', impact: [], causes: [], recommendations: [] }));
}

// Simplified aiAnalysis applying static precedence + cache + batch translation
async function aiAnalysis(url:string, mobile:any, desktop:any, screenshotDataUrl: string|null) {
  const buildOpportunitiesWithPrecedence = (opps:any[]) => opps.map((o:any)=>({ id:o.id, title: PAGE_SPEED_LABELS[o.id]?.title ?? translatePageSpeedTitle(o.title), rawDescription: o.rawDescription, descriptionStatic: PAGE_SPEED_SHORT_DESCRIPTIONS[o.id] ?? null, displayValue: o.displayValue }));
  const summary = { url, mobile:{scores: mobile.scores, metrics: mobile.metrics, top_opportunities: buildOpportunitiesWithPrecedence(mobile.opportunities||[])}, desktop:{scores: desktop.scores, metrics: desktop.metrics, top_opportunities: buildOpportunitiesWithPrecedence(desktop.opportunities||[])} };

  const collectMissing = (list:any[]) => list.filter(it=>!it.descriptionStatic).map(it=>({ audit_id: it.id, text: it.rawDescription ?? '' }));
  const missing = [...collectMissing(summary.mobile.top_opportunities), ...collectMissing(summary.desktop.top_opportunities)];

  const missingById: Record<string,string> = {};
  const toTranslate: Array<{audit_id:string,text:string}> = [];
  for (const it of missing) {
    const cached = await getPagespeedTranslation(it.audit_id);
    if (cached) missingById[it.audit_id] = cached; else toTranslate.push(it);
  }
  if (toTranslate.length>0) {
    const translated = await translateSummaryFields(toTranslate);
    Object.assign(missingById, translated);
  }

  const finalize = (opps:any[])=>opps.map((o:any)=>({ id:o.id, title:o.title, description: o.descriptionStatic ?? missingById[o.id] ?? translatePageSpeedDescription(o.rawDescription), displayValue:o.displayValue }));
  const finalSummary = { url, mobile:{scores:summary.mobile.scores, metrics:summary.mobile.metrics, top_opportunities: finalize(summary.mobile.top_opportunities)}, desktop:{scores:summary.desktop.scores, metrics:summary.desktop.metrics, top_opportunities: finalize(summary.desktop.top_opportunities)} };

  // Simulate AI constructing improvements based on finalSummary
  const improvements = [];
  for (const opp of finalSummary.mobile.top_opportunities.concat(finalSummary.desktop.top_opportunities)) {
    improvements.push({ title: opp.title || `Sugestão ${opp.id}`, description: opp.description || '', impact:['melhora de carregamento'], causes:['excesso de recursos'], recommendations:['otimizar recursos'] });
  }
  return { improvements: improvements.slice(0,8), uiux: null, extras: [] };
}

function buildSummaryResponse(mobile:any, desktop:any, ai:any) {
  const pageSpeedImprovements = buildPageSpeedImprovements(mobile, desktop);
  let finalAi = ai ?? { improvements: [], uiux: null, extras: [] };
  if (!Array.isArray(finalAi?.improvements) || finalAi.improvements.length === 0) finalAi = { ...finalAi, improvements: pageSpeedImprovements };
  return { success:true, summary: { mobile:{ scores: mobile.scores, metrics: mobile.metrics, opportunities: mobile.opportunities }, desktop:{ scores: desktop.scores, metrics: desktop.metrics, opportunities: desktop.opportunities }, screenshot: null }, improvements: finalAi.improvements, uiux: finalAi.uiux, extras: finalAi.extras };
}

async function buildDocx(url:string, mobile:any, desktop:any, ai:any) {
  const doc = new Document({ sections:[{ children:[ new Paragraph({ children:[ new TextRun({ text: `Relatório para ${url}` }) ] }) ] }] });
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// Test runner
async function run() {
  const url = 'https://example.com';
  const mobile = { scores:{performance:50, accessibility:90, bestPractices:80, seo:70}, metrics:{}, opportunities:[{id:'unused-javascript', title:'Unused JavaScript', rawDescription:'There is unused JS', displayValue:'200KB'}, {id:'offscreen-images', title:'Offscreen images', rawDescription:'Images are loaded offscreen', displayValue:'150KB'}] };
  const desktop = { scores:{performance:60, accessibility:95, bestPractices:85, seo:75}, metrics:{}, opportunities:[] };

  console.log('Cache before', Array.from(cache.entries()));
  const ai = await aiAnalysis(url, mobile, desktop, null);
  console.log('AI result:', JSON.stringify(ai, null, 2));
  console.log('Cache after', Array.from(cache.entries()));

  const summary = buildSummaryResponse(mobile, desktop, ai);
  console.log('Summary:', JSON.stringify(summary, null, 2));

  const buf = await buildDocx(url, mobile, desktop, ai);
  const outPath = './test-output.docx';
  await Deno.writeFile(outPath, buf);
  console.log('Wrote docx to', outPath);
}

run().catch(e=>{ console.error(e); Deno.exit(1); });
