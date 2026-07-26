// === Pre-Deploy-Gate: Wikipedia-Signaturen in Pflanzen-Beschreibungen ===
// Nutzung: node scripts/scan_descriptions.mjs   (Exit 1 bei Funden)
// Zielt auf ECHTE Wikipedia-Einleitungs-Signaturen, nicht auf normale Botanik-Prosa.
import { readFileSync, readdirSync } from 'node:fs';
const base = new URL('../src/data/plants/', import.meta.url);
const files = readdirSync(base).filter(f => f.endsWith('.json'));
const PAT = [
  // DE — taxonomische Wikipedia-Floskeln
  /ist eine Pflanzenart/i, /ist eine( \w+)? Art (der|aus der) Gattung/i,
  /ist die einzige (Pflanzen)?art/i, /innerhalb der Familie/i, /Art der Gattung/i,
  // EN — Wikipedia-Einleitungs-Floskeln
  /commonly known as/i, /\bis a species of\b/i, /formerly (known as|classified|L\.)/i,
  /is a (flowering|herbaceous|perennial|annual|biennial|deciduous) plant in the family/i,
  /is a species of/i,
  /(of|in) the family [A-Z][a-z]+aceae/,
  /is an? \\w+ (plant|tree|shrub|herb|vine) of the family/i,
];
const hits = [];
const norm = s => (s||'').toLowerCase().replace(/[^a-zäöüß ]/g,'').split(/\s+/).filter(Boolean);
const first8 = new Map();
for (const f of files) {
  let d; try { d = JSON.parse(readFileSync(new URL(f, base))); } catch { continue; }
  if (!d.description) continue;
  for (const lang of ['de','en']) {
    const t = d.description[lang] || '';
    if (PAT.some(r => r.test(t))) hits.push(`${f} [${lang}] WIKIPEDIA-SIGNATUR`);
    const key = norm(t).slice(0,8).join(' ');
    if (key) { if (first8.has(key)) hits.push(`${f} [${lang}] identischer Einstieg wie ${first8.get(key)}`); else first8.set(key,f); }
  }
}
if (hits.length) { console.log('FAIL — '+hits.length+' Befund(e):'); hits.forEach(h=>console.log('  '+h)); process.exit(1); }
console.log('OK — keine Wikipedia-Signaturen, keine identischen Einstiege.');
