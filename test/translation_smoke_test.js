// test/translation_smoke_test.js
// Node-compatible smoke test for translation pipeline (mocked Supabase + OpenRouter)
// Run: node test/translation_smoke_test.js

// No external deps required for the smoke test. It writes a placeholder "docx" file
// to validate the flow (you'll inspect logs and the generated test-output.docx file).

import fs from 'fs/promises';

// Minimal static dictionaries
const PAGE_SPEED_SHORT_DESCRIPTIONS = {
  'unused-javascript': 'Há JavaScript carregado que não é utilizado no carregamento inicial.',
};

const PAGE_SPEED_LABELS = {
  'unused-javascript': { title: 'JavaScript não utilizado' },
  'offscreen-images': { title: 'Imagens fora da tela' },
};

// In-memory cache to simulate pagespeed_translations table
const cache = new Map();
async function getPagespeedTranslation(audit_id) {
  return cache.has(audit_id) ? cache.get(audit_id) : null;
}
async function upsertPagespeedTranslation(audit_id, translated) {
  cache.set(audit_id, translated);
}

// Mock batch translator (simulates OpenRouter response)
async function translateSummaryFields(items) {
  // pretend we send one batch and receive translations
  const map = {};
  for (const it of items) {
    // Return a Portuguese translation for known texts, otherwise pretend a translation
    const txt = String(it.text || "").trim();
    let translated;
    if (/Images are loaded offscreen/i.test(txt)) {
      translated = 'Imagens são carregadas fora da tela.';
    } else if (/There is unused JS/i.test(txt)) {
      translated = 'Há JavaScript não utilizado na página.';
    } else {
      // generic mock translation: prepend no prefix but pretend it's Portuguese
      translated = txt;
    }
    map[it.audit_id] = translated;
    // save to cache
    await upsertPagespeedTranslation(it.audit_id, map[it.audit_id]);
  }
  return map;
}

function translatePageSpeedDescription(s) { return s; }
function translatePageSpeedTitle(s) { return s; }
function translateReportText(s) { return s; }

// buildPageSpeedImprovements - simplified
function buildPageSpeedImprovements(mobile, desktop) {
  const opps = (mobile.opportunities || []).concat(desktop.opportunities || []);
  return opps.slice(0,8).map((o, i) => ({ title: `Melhoria: ${o.id}`, description: PAGE_SPEED_SHORT_DESCRIPTIONS[o.id] ?? o.rawDescription ?? '', impact: [], causes: [], recommendations: [] }));
}

// Simplified aiAnalysis applying static precedence + cache + batch translation
async function aiAnalysis(url, mobile, desktop, screenshotDataUrl) {
  const buildOpportunitiesWithPrecedence = (opps) => opps.map((o) => ({
    id: o.id,
    title: PAGE_SPEED_LABELS[o.id]?.title ?? translatePageSpeedTitle(o.title),
    rawDescription: o.rawDescription,
    descriptionStatic: PAGE_SPEED_SHORT_DESCRIPTIONS[o.id] ?? null,
    displayValue: o.displayValue,
  }));

  const summary = {
    url,
    mobile: { scores: mobile.scores, metrics: mobile.metrics, top_opportunities: buildOpportunitiesWithPrecedence(mobile.opportunities || []) },
    desktop: { scores: desktop.scores, metrics: desktop.metrics, top_opportunities: buildOpportunitiesWithPrecedence(desktop.opportunities || []) },
  };

  const collectMissing = (list) => list.filter((it) => !it.descriptionStatic).map((it) => ({ audit_id: it.id, text: it.rawDescription || '' }));
  const missing = [...collectMissing(summary.mobile.top_opportunities), ...collectMissing(summary.desktop.top_opportunities)];

  const missingById = {};
  const toTranslate = [];
  for (const it of missing) {
    const cached = await getPagespeedTranslation(it.audit_id);
    if (cached) {
      missingById[it.audit_id] = cached;
    } else {
      toTranslate.push(it);
    }
  }

  if (toTranslate.length > 0) {
    const translatedMap = await translateSummaryFields(toTranslate);
    Object.assign(missingById, translatedMap);
  }

  const finalize = (opps) => opps.map((o) => {
    const desc = o.descriptionStatic ?? missingById[o.id] ?? translatePageSpeedDescription(o.rawDescription);
    return { id: o.id, title: o.title, description: desc, displayValue: o.displayValue };
  });

  const finalSummary = {
    url,
    mobile: { scores: summary.mobile.scores, metrics: summary.mobile.metrics, top_opportunities: finalize(summary.mobile.top_opportunities) },
    desktop: { scores: summary.desktop.scores, metrics: summary.desktop.metrics, top_opportunities: finalize(summary.desktop.top_opportunities) },
  };

  // Simulate AI constructing improvements based on finalSummary
  const improvements = [];
  for (const opp of finalSummary.mobile.top_opportunities.concat(finalSummary.desktop.top_opportunities)) {
    improvements.push({ title: opp.title || `Sugestão ${opp.id}`, description: opp.description || '', impact: ['melhora de carregamento'], causes: ['excesso de recursos'], recommendations: ['otimizar recursos'] });
  }
  return { improvements: improvements.slice(0,8), uiux: null, extras: [] };
}

function buildSummaryResponse(mobile, desktop, ai) {
  const pageSpeedImprovements = buildPageSpeedImprovements(mobile, desktop);
  let finalAi = ai || { improvements: [], uiux: null, extras: [] };
  if (!Array.isArray(finalAi.improvements) || finalAi.improvements.length === 0) finalAi = { ...finalAi, improvements: pageSpeedImprovements };

  return {
    success: true,
    summary: {
      mobile: { scores: mobile.scores, metrics: mobile.metrics, screenshot: null, pagespeedScreenshot: null, opportunities: mobile.opportunities || [] },
      desktop: { scores: desktop.scores, metrics: desktop.metrics, screenshot: null, pagespeedScreenshot: null, opportunities: desktop.opportunities || [] },
      screenshot: null,
    },
    improvements: finalAi.improvements,
    uiux: finalAi.uiux,
    extras: finalAi.extras,
  };
}

async function buildDocx(url, mobile, desktop, ai) {
  // For smoke test we write a simple placeholder file named test-output.docx
  const text = `Relatório (placeholder) para ${url}\n\nImprovements:\n${ai.improvements.map(i=>`- ${i.title}: ${i.description}`).join('\n')}`;
  return Buffer.from(text, 'utf8');
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
  await fs.writeFile(outPath, buf);
  console.log('Wrote docx placeholder to', outPath);
}

run().catch((e) => { console.error(e); process.exit(1); });
