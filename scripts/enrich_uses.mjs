#!/usr/bin/env node
// === 1. KOPF / HEAD ===
// Welle H: Anreicherung aller uses[].description Felder mit echten Texten
// statt Placeholder "Traditionelle Anwendung — siehe Wikipedia-Artikel...".
// Strategie 3 Stufen:
//   1) Wikipedia Use-/Verwendungs-Sektion scrapen (DE+EN)
//   2) Description-basiert: aus plant.description ableiten
//   3) Fallback: kuratierter Text aus form + target + family
//
// Idempotent: lässt bereits angereicherte Plants unangetastet
// (erkannt am "siehe Wikipedia"-String — Marker für Placeholder).
//
// Usage:
//   node scripts/enrich_uses.mjs            # alle Plants
//   node scripts/enrich_uses.mjs --limit 5  # nur erste 5 (Test)
//   node scripts/enrich_uses.mjs --slug X   # nur eine spezifische Pflanze
//   node scripts/enrich_uses.mjs --dry      # nichts schreiben, nur Report

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLANTS_DIR = path.resolve(__dirname, '..', 'src', 'data', 'plants');

// === 2. KONSTANTEN / CONSTANTS ===

// Mehrere bekannte Placeholder-Muster erkennen (Welle-A Scraper + Welle-D etc.)
const PLACEHOLDER_MARKERS = [
  'siehe Wikipedia-Artikel',
  'see Wikipedia article',
  'siehe Wikipedia und klassische Garten-Literatur',
  'see Wikipedia and classic garden literature',
  'siehe Volksheilkunde',
  'see folk medicine',
  'siehe Wikipedia-Artikel und Fachliteratur',
  'see Wikipedia article and specialist literature',
];

// Sleep zwischen Wikipedia-Calls (ms) — Rate-Limit Schutz
const SLEEP_MS = 120;

// Wikipedia-Section-Titel die wir als "Verwendung" interpretieren
const USE_SECTION_TITLES_DE = [
  'Verwendung', 'Nutzung', 'Heilkunde', 'Heilwirkung', 'Anwendung',
  'Heilanwendung', 'Verwendung in der Küche', 'Kulinarisches',
  'Volksmedizin', 'Heilpflanze', 'Wirkstoffe und Verwendung',
  'Verwendung als Heilpflanze', 'Kulturelle Bedeutung', 'Medizin',
  'Verwendung als Gewürz', 'Gartenbau', 'Speisepflanze',
  'Verwendung als Lebensmittel', 'Inhaltsstoffe und Verwendung',
];
const USE_SECTION_TITLES_EN = [
  'Uses', 'Use', 'Culinary uses', 'Medicinal uses', 'Medicinal use',
  'Traditional medicine', 'Cultivation and uses', 'In cuisine',
  'Cooking', 'Food', 'Herbalism', 'Traditional use',
  'Cultural significance', 'Folk medicine', 'Phytotherapy',
];

// Bibliothek: Form-Labels für Stufe-3-Fallback (DE + EN)
const FORM_LABEL = {
  tea:      { de: 'Aufguss als Tee',                   en: 'infusion as tea' },
  tincture: { de: 'alkoholischer Auszug (Tinktur)',    en: 'alcoholic extract (tincture)' },
  salve:    { de: 'Salbe zur äußerlichen Anwendung',   en: 'salve for external use' },
  bath:     { de: 'Badezusatz',                        en: 'bath additive' },
  raw:      { de: 'frisch verwendet',                  en: 'used fresh' },
  spice:    { de: 'als Gewürz in der Küche',           en: 'as a culinary spice' },
};

// Target-Labels für Stufe-3-Fallback (DE + EN)
const TARGET_LABEL = {
  digestion:         { de: 'bei Verdauungsbeschwerden',                  en: 'for digestive complaints' },
  menstrual:         { de: 'bei Menstruationsbeschwerden',               en: 'for menstrual complaints' },
  wound:             { de: 'bei kleinen Wunden',                         en: 'for minor wounds' },
  skin:              { de: 'bei Hautproblemen',                          en: 'for skin issues' },
  urinary:           { de: 'bei Harnwegsbeschwerden',                    en: 'for urinary complaints' },
  circulation:       { de: 'zur Unterstützung der Durchblutung',         en: 'to support circulation' },
  air_quality:       { de: 'zur Verbesserung der Raumluft',              en: 'to improve indoor air quality' },
  throat:            { de: 'bei Halsbeschwerden',                        en: 'for sore throat' },
  respiratory:       { de: 'bei Atemwegsbeschwerden',                    en: 'for respiratory complaints' },
  immune:            { de: 'zur Stärkung der Abwehrkräfte',              en: 'to support the immune system' },
  nerves:            { de: 'bei nervlicher Anspannung',                  en: 'for nervous tension' },
  bruise:            { de: 'bei Prellungen und Blutergüssen',            en: 'for bruises and contusions' },
  muscle:            { de: 'bei Muskelverspannungen',                    en: 'for muscle tension' },
  nutrition:         { de: 'als nährstoffreiches Lebensmittel',          en: 'as a nutrient-rich food' },
  iron:              { de: 'als eisenreiche Nahrung',                    en: 'as an iron-rich food' },
  vitamin_c:         { de: 'als Vitamin-C-Quelle',                       en: 'as a vitamin C source' },
  eye:               { de: 'bei Augenbeschwerden',                       en: 'for eye complaints' },
  vision:            { de: 'zur Unterstützung der Sehkraft',             en: 'to support vision' },
  liver:             { de: 'zur Unterstützung der Leberfunktion',        en: 'to support liver function' },
  heart:             { de: 'zur Unterstützung der Herzfunktion',         en: 'to support heart function' },
  hydration:         { de: 'zur Flüssigkeitszufuhr',                     en: 'for hydration' },
  inflammation:      { de: 'bei Entzündungen',                           en: 'for inflammation' },
  fever:             { de: 'bei fieberhaften Erkältungen',               en: 'for feverish colds' },
  joint:             { de: 'bei Gelenkbeschwerden',                      en: 'for joint complaints' },
  connective_tissue: { de: 'zur Pflege des Bindegewebes',                en: 'to support connective tissue' },
  rheumatism:        { de: 'bei rheumatischen Beschwerden',              en: 'for rheumatic complaints' },
  pain:              { de: 'bei leichten Schmerzen',                     en: 'for mild pain' },
  lymph:             { de: 'zur Unterstützung des Lymphsystems',         en: 'to support the lymphatic system' },
  sleep:             { de: 'als beruhigender Schlafhelfer',              en: 'as a calming sleep aid' },
  memory:            { de: 'zur Unterstützung des Gedächtnisses',        en: 'to support memory' },
  pest_control:      { de: 'zur Schädlingsabwehr im Garten',             en: 'as a garden pest deterrent' },
  protein:           { de: 'als pflanzliche Eiweißquelle',               en: 'as a plant protein source' },
  energy:            { de: 'als energiereiches Lebensmittel',            en: 'as an energy-rich food' },
  bones:             { de: 'zur Unterstützung der Knochengesundheit',    en: 'to support bone health' },
  dental:            { de: 'zur Mundpflege',                             en: 'for oral care' },
  headache:          { de: 'bei Kopfschmerzen',                          en: 'for headache' },
  nausea:            { de: 'bei Übelkeit',                               en: 'for nausea' },
};

// === 3. UTILS ===

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isPlaceholder(use) {
  const de = use?.description?.de || '';
  const en = use?.description?.en || '';
  const both = de + ' ' + en;
  return PLACEHOLDER_MARKERS.some(m => both.includes(m));
}

// Wikipedia-Markup grob entfernen
// (Wikitext-Klammern, Refs, Templates, HTML-Tags) → simpler Text
function cleanWikitext(text) {
  if (!text) return '';
  let t = text;
  // <ref>...</ref> raus
  t = t.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  t = t.replace(/<ref[^>]*\/>/gi, '');
  // <!-- comments -->
  t = t.replace(/<!--[\s\S]*?-->/g, '');
  // [[File:...]] / [[Datei:...]] / [[Image:...]] komplette Bild-Links (inkl. innerer [[]]) entfernen
  // (Bilder enthalten oft "mini|", "thumb|" pipes — komplett raus)
  for (let i = 0; i < 4; i++) {
    t = t.replace(/\[\[(?:File|Datei|Image|Bild):[^\[\]]*(?:\[\[[^\[\]]*\]\][^\[\]]*)*\]\]/gi, '');
  }
  // {{templates}} raus (auch verschachtelt — 3-fach iteriert reicht für die meisten Fälle)
  for (let i = 0; i < 4; i++) t = t.replace(/\{\{[^{}]*\}\}/g, '');
  // [[link|text]] → text;   [[link]] → link
  t = t.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  t = t.replace(/\[\[([^\]]+)\]\]/g, '$1');
  // [http://... text] → text;   [http://...] → ''
  t = t.replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1');
  t = t.replace(/\[https?:\/\/\S+\]/g, '');
  // restliche HTML-Tags
  t = t.replace(/<[^>]+>/g, '');
  // '''bold''' und ''italic'' → plain
  t = t.replace(/'''([^']+)'''/g, '$1');
  t = t.replace(/''([^']+)''/g, '$1');
  // Header-Marker
  t = t.replace(/^={2,}\s*[^=]+\s*={2,}\s*$/gm, '');
  // Listen-Punkte, Doppelpunkte am Zeilenanfang
  t = t.replace(/^[*#:;]+\s*/gm, '');
  // table-syntax-rests
  t = t.replace(/\{\|[\s\S]*?\|\}/g, '');
  // Image-Caption-Reste (gallery, etc.) — einzelne Zeilen die mit "mini|", "thumb|", "links|" beginnen
  t = t.replace(/^(?:mini|thumb|hochkant|links|rechts|center|left|right|miniatur)\|[^\n]*$/gim, '');
  // Inline-Reste: "mini|...txt" / "thumb|...txt" — entferne bis zum nächsten Punkt+Space
  t = t.replace(/\b(?:mini|thumb|hochkant|miniatur)\|[^.!?\n]*[.!?]\s*/gi, '');
  // multiple whitespace
  t = t.replace(/\s+/g, ' ').trim();
  // Leerzeichen am Satzanfang
  t = t.replace(/^[\s,;:.\-—|]+/, '');
  return t;
}

// Schneide auf vollständige Sätze, max maxChars
function truncateToSentences(text, maxChars = 480) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  // letzten Satzende-Punkt finden
  const lastDot = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  );
  if (lastDot > 100) return slice.slice(0, lastDot + 1).trim();
  return slice.trim() + '…';
}

// "hilft gegen / heilt" → "wird traditionell bei ... eingesetzt"
// (sanfter Stilfilter, kein medizinischer Beratungs-Ton)
function neutralizeMedicalTone(text, lang = 'de') {
  if (!text) return text;
  let t = text;
  if (lang === 'de') {
    t = t.replace(/heilt\b/gi, 'wird traditionell angewendet bei');
    t = t.replace(/\bhilft gegen\b/gi, 'wird traditionell eingesetzt bei');
    t = t.replace(/\bhilft bei\b/gi, 'wird traditionell eingesetzt bei');
    t = t.replace(/\bkuriert\b/gi, 'wird traditionell verwendet bei');
  } else {
    t = t.replace(/\bcures?\b/gi, 'is traditionally used for');
    t = t.replace(/\bheals?\b/gi, 'is traditionally applied to');
  }
  return t;
}

// === 4. WIKIPEDIA-FETCH ===

async function fetchWithRetry(url, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'DonumDei/1.1 (offline plant DB; contact: maikelganske913@gmail.com)',
        },
      });
      if (resp.ok) return await resp.json();
      lastErr = new Error(`HTTP ${resp.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < retries) await sleep(400 * (attempt + 1));
  }
  throw lastErr;
}

// page-title aus Wikipedia-URL ziehen
// https://de.wikipedia.org/wiki/Ringelblume → "Ringelblume"
function extractTitleFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/wiki\/([^?#]+)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}

// Section-Liste + bestimmten Section-Wikitext über Wikipedia API holen
async function fetchUseSection(lang, pageTitle) {
  if (!pageTitle) return null;
  const apiBase = `https://${lang}.wikipedia.org/w/api.php`;
  // Schritt 1: Sektionsliste holen
  const sectionsUrl = `${apiBase}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&redirects=1&origin=*`;
  let sectionsData;
  try {
    sectionsData = await fetchWithRetry(sectionsUrl);
  } catch (e) {
    return { error: 'fetch_sections_failed', message: e.message };
  }
  const sections = sectionsData?.parse?.sections;
  if (!sections) return { error: 'no_sections' };

  const candidates = lang === 'de' ? USE_SECTION_TITLES_DE : USE_SECTION_TITLES_EN;
  const lower = candidates.map(c => c.toLowerCase());
  let match = null;
  // Exakter Match bevorzugt
  for (const s of sections) {
    const lt = (s.line || '').toLowerCase().trim();
    if (lower.includes(lt)) { match = s; break; }
  }
  // Sonst: Substring-Match (z.B. "Verwendung in der Volksheilkunde")
  if (!match) {
    for (const s of sections) {
      const lt = (s.line || '').toLowerCase();
      if (lower.some(c => lt.includes(c))) { match = s; break; }
    }
  }
  if (!match) return { error: 'no_use_section', sections_seen: sections.map(s => s.line) };

  // Schritt 2: Diesen Section-Wikitext laden
  const wtUrl = `${apiBase}?action=parse&page=${encodeURIComponent(pageTitle)}&section=${match.index}&prop=wikitext&format=json&redirects=1&origin=*`;
  let wtData;
  try {
    wtData = await fetchWithRetry(wtUrl);
  } catch (e) {
    return { error: 'fetch_section_failed', message: e.message };
  }
  const wikitext = wtData?.parse?.wikitext?.['*'];
  if (!wikitext) return { error: 'no_wikitext' };

  const cleaned = cleanWikitext(wikitext);
  if (!cleaned || cleaned.length < 40) return { error: 'too_short', got: cleaned };

  return { text: cleaned, section: match.line };
}

// === 5. STUFE 2: AUS DESCRIPTION ABLEITEN ===

// Wenn plant.description einen 2. Absatz oder Verwendungs-Hinweise enthält
function extractFromDescription(plant, lang) {
  const desc = plant.description?.[lang] || '';
  if (!desc) return null;
  // Splittet an Sätzen — suche nach Sätzen mit "verwendet/Anwendung/Heilung/gegessen/Gewürz"
  const sentences = desc.match(/[^.!?]+[.!?]+/g) || [];
  const useKeywordsDe = /\b(verwendet|verwendung|anwendung|heilkun|heilpflanze|heilwirk|essbar|gegessen|gegart|gekocht|salat|gewürz|tee|tinktur|salbe|nahrungsmittel|kulturpflanze|nutzpflanze|gemüse)/i;
  const useKeywordsEn = /\b(used|use|edible|medicinal|herbal|cooking|cooked|salad|spice|tea|tincture|salve|food|cultivat|vegetable)/i;
  const re = lang === 'de' ? useKeywordsDe : useKeywordsEn;
  const hits = sentences.filter(s => re.test(s)).map(s => s.trim());
  if (hits.length === 0) return null;
  const joined = hits.slice(0, 3).join(' ').trim();
  if (joined.length < 30) return null;
  return joined;
}

// === 6. STUFE 3: KURATIERTER FALLBACK ===

function buildFallback(use, plant, lang) {
  const form = FORM_LABEL[use.form]?.[lang] || (lang === 'de' ? 'Anwendung' : 'preparation');
  const targets = (use.target || []).map(t => TARGET_LABEL[t]?.[lang]).filter(Boolean);
  let familyName = plant.family?.[lang] || plant.family?.latin || '';
  const plantName = plant.names?.[lang] || plant.names?.latin || '';

  // De-doublette: wenn familyName schon "family" oder "gewächse" enthält,
  // nicht nochmal "family" anhängen
  let familySuffix = '';
  if (familyName) {
    if (lang === 'de') {
      // "Korbblütler" → "der Korbblütler"; "Lippenblütler" → "der Lippenblütler"
      familySuffix = ` Pflanze aus der Familie der ${familyName} — typische Verwendung in der europäischen Volksheilkunde bzw. Küche.`;
    } else {
      // EN: "Daisy family" → "Daisy family"; "Mint family" → vermeiden "family family"
      const familyNorm = /family$/i.test(familyName.trim()) ? familyName : `${familyName} family`;
      familySuffix = ` A member of the ${familyNorm} — common in European folk medicine and culinary tradition.`;
    }
  }

  if (lang === 'de') {
    let txt = `${plantName} wird traditionell als ${form}`;
    if (targets.length === 1) txt += ` ${targets[0]} verwendet`;
    else if (targets.length >= 2) txt += ` ${targets.slice(0, -1).join(', ')} sowie ${targets[targets.length - 1]} verwendet`;
    else txt += ' eingesetzt';
    txt += '.';
    txt += familySuffix;
    return txt.trim();
  } else {
    let txt = `${plantName} is traditionally used as ${form}`;
    if (targets.length === 1) txt += ` ${targets[0]}`;
    else if (targets.length >= 2) txt += ` ${targets.slice(0, -1).join(', ')} and ${targets[targets.length - 1]}`;
    txt += '.';
    txt += familySuffix;
    return txt.trim();
  }
}

// === 7. PRO-USE ENRICHMENT ===

// Wikipedia-Texte werden pro Pflanze gecached — eine Pflanze hat oft mehrere uses,
// die alle dieselbe Wikipedia-Section nutzen können.
async function enrichUse(use, plant, wikiCache) {
  let sourceLevel = null;
  let de = null, en = null;

  // STUFE 1: Wikipedia
  if (!wikiCache.fetched) {
    const deUrl = plant.sources?.find(s => s.url?.includes('de.wikipedia.org'))?.url;
    const enUrl = plant.sources?.find(s => s.url?.includes('en.wikipedia.org'))?.url;
    const deTitle = extractTitleFromUrl(deUrl);
    const enTitle = extractTitleFromUrl(enUrl);

    if (deTitle) {
      wikiCache.de = await fetchUseSection('de', deTitle);
      await sleep(SLEEP_MS);
    }
    if (enTitle) {
      wikiCache.en = await fetchUseSection('en', enTitle);
      await sleep(SLEEP_MS);
    }
    wikiCache.fetched = true;
  }

  if (wikiCache.de?.text) {
    de = truncateToSentences(neutralizeMedicalTone(wikiCache.de.text, 'de'));
  }
  if (wikiCache.en?.text) {
    en = truncateToSentences(neutralizeMedicalTone(wikiCache.en.text, 'en'));
  }
  if (de && en) sourceLevel = 'wikipedia';
  else if (de || en) sourceLevel = 'wikipedia_partial';

  // STUFE 2: Description-basiert (für fehlende Sprache)
  if (!de) {
    const fromDesc = extractFromDescription(plant, 'de');
    if (fromDesc) {
      de = truncateToSentences(neutralizeMedicalTone(fromDesc, 'de'));
      sourceLevel = sourceLevel ? sourceLevel + '+description' : 'description';
    }
  }
  if (!en) {
    const fromDesc = extractFromDescription(plant, 'en');
    if (fromDesc) {
      en = truncateToSentences(neutralizeMedicalTone(fromDesc, 'en'));
      sourceLevel = sourceLevel ? sourceLevel + '+description' : 'description';
    }
  }

  // STUFE 3: Fallback
  if (!de) { de = buildFallback(use, plant, 'de'); sourceLevel = (sourceLevel ? sourceLevel + '+' : '') + 'fallback'; }
  if (!en) { en = buildFallback(use, plant, 'en'); sourceLevel = (sourceLevel ? sourceLevel + '+' : '') + 'fallback'; }

  return { de, en, level: sourceLevel };
}

// === 8. PRO-PLANT ENRICHMENT ===

async function enrichPlant(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const plant = JSON.parse(raw);
  const slug = plant.slug;

  const placeholderUses = (plant.uses || []).filter(isPlaceholder);
  if (placeholderUses.length === 0) {
    return { slug, status: 'skipped_no_placeholder' };
  }

  const wikiCache = { fetched: false, de: null, en: null };
  const levels = [];

  for (const use of plant.uses) {
    if (!isPlaceholder(use)) continue;
    const result = await enrichUse(use, plant, wikiCache);
    use.description.de = result.de;
    use.description.en = result.en;
    levels.push(result.level);
  }

  // Wikipedia-Fetch-Status für Report
  const wikiStatus = {
    de: wikiCache.de?.text ? 'ok' : (wikiCache.de?.error || 'no_url'),
    en: wikiCache.en?.text ? 'ok' : (wikiCache.en?.error || 'no_url'),
  };

  // Höchste erreichte Stufe bestimmen für Report
  let bestLevel = 'fallback';
  if (levels.some(l => l === 'wikipedia')) bestLevel = 'wikipedia';
  else if (levels.some(l => l && l.startsWith('wikipedia'))) bestLevel = 'wikipedia_partial';
  else if (levels.some(l => l && l.includes('description'))) bestLevel = 'description';

  return {
    slug, status: 'enriched',
    uses_enriched: placeholderUses.length,
    levels, bestLevel,
    wiki: wikiStatus,
    plant, // für Schreib-Phase
  };
}

// === 9. MAIN ===

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry');
  let limit = null;
  let onlySlug = null;
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--limit') limit = parseInt(process.argv[i + 1], 10);
    if (process.argv[i] === '--slug') onlySlug = process.argv[i + 1];
  }

  let files = (await fs.readdir(PLANTS_DIR))
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(PLANTS_DIR, f))
    .sort();
  if (onlySlug) files = files.filter(f => path.basename(f, '.json') === onlySlug);
  if (limit) files = files.slice(0, limit);

  console.log(`[enrich_uses] processing ${files.length} plants (dry=${dryRun})`);
  const report = [];
  const startedAt = Date.now();

  for (let i = 0; i < files.length; i++) {
    const fp = files[i];
    const slug = path.basename(fp, '.json');
    try {
      const res = await enrichPlant(fp);
      report.push(res);
      if (res.status === 'enriched' && !dryRun) {
        await fs.writeFile(fp, JSON.stringify(res.plant, null, 2) + '\n', 'utf8');
      }
      const tag = res.status === 'skipped_no_placeholder' ? 'skip' : res.bestLevel;
      console.log(`  [${i + 1}/${files.length}] ${slug} → ${tag}`);
    } catch (e) {
      report.push({ slug, status: 'error', error: e.message });
      console.error(`  [${i + 1}/${files.length}] ${slug} → ERROR ${e.message}`);
    }
  }

  // === Summary ===
  const enriched = report.filter(r => r.status === 'enriched');
  const skipped  = report.filter(r => r.status === 'skipped_no_placeholder');
  const errored  = report.filter(r => r.status === 'error');
  const byLevel = { wikipedia: 0, wikipedia_partial: 0, description: 0, fallback: 0 };
  for (const r of enriched) byLevel[r.bestLevel] = (byLevel[r.bestLevel] || 0) + 1;

  const fallbackPlants = enriched.filter(r => r.bestLevel === 'fallback').map(r => r.slug);
  const partialPlants = enriched.filter(r => r.bestLevel === 'wikipedia_partial').map(r => r.slug);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n=== Enrichment Report ===`);
  console.log(`Processed: ${report.length}, enriched: ${enriched.length}, skipped: ${skipped.length}, errored: ${errored.length}`);
  console.log(`Levels: ${JSON.stringify(byLevel)}`);
  console.log(`Elapsed: ${elapsed}s`);
  if (errored.length) console.log(`Errors:`, errored.map(r => `${r.slug}: ${r.error}`));

  // Report-Datei für späteres Review
  const reportPath = path.resolve(__dirname, '..', '_backups', '2026-05-18_wave_H', 'enrich_report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({
    started_at: new Date(startedAt).toISOString(),
    elapsed_seconds: parseFloat(elapsed),
    total: report.length,
    enriched: enriched.length, skipped: skipped.length, errored: errored.length,
    levels: byLevel,
    fallback_plants: fallbackPlants,
    partial_plants: partialPlants,
    errors: errored,
    per_plant: report.map(r => ({
      slug: r.slug, status: r.status, bestLevel: r.bestLevel,
      uses_enriched: r.uses_enriched, wiki: r.wiki,
    })),
  }, null, 2));
  console.log(`Report written: ${path.relative(process.cwd(), reportPath)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
