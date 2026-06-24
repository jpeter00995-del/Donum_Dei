// === Audit: Giftpflanzen-Daten auf konkrete Fehler prüfen ===
// Deterministischer Scan (keine KI-Raterei) über alle Pflanzen-JSONs.
// Aufruf: node scripts/audit_toxic_plants.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'src', 'data', 'plants');
const files = readdirSync(dir).filter(f => f.endsWith('.json'));

const ENC = /%[0-9A-Fa-f]{2}/;           // kaputte URL-Kodierung (z.B. %C3%A4)
const isInternal = u => u?.internal_external === 'internal' || u?.internal_external === 'both';
const findings = [];
let toxicCount = 0;

for (const f of files) {
  let p;
  try { p = JSON.parse(readFileSync(join(dir, f), 'utf8')); }
  catch (e) { findings.push([f, 'PARSE', `JSON kaputt: ${e.message}`]); continue; }

  const s = p.safety ?? {};
  const uses = p.uses ?? [];
  const internalUses = uses.filter(isInternal);

  // --- (A) Encoding-Artefakte in NUTZER-sichtbaren Namen/Alt (alle Pflanzen) ---
  const nameDe = p.names?.de ?? '', nameEn = p.names?.en ?? '';
  if (ENC.test(nameDe) || ENC.test(nameEn)) findings.push([f, 'ENCODING', `Name kaputt kodiert: "${nameDe}" / "${nameEn}"`]);
  const altDe = p.image?.alt?.de ?? '', altEn = p.image?.alt?.en ?? '';
  if (ENC.test(altDe) || ENC.test(altEn)) findings.push([f, 'ENCODING', `Bild-Alt kaputt kodiert: "${altDe}" / "${altEn}"`]);

  if (s.toxicity_level !== 'toxic') continue;   // ab hier nur hochgiftige
  toxicCount++;

  // --- (B) Warnung fehlt/leer ---
  if (!s.warnings?.de?.trim() || !s.warnings?.en?.trim())
    findings.push([f, 'WARN-MISSING', 'safety.warnings DE oder EN leer']);

  // --- (C) Widerspruch: external_only=true, aber innere Anwendung vorhanden ---
  if (s.external_only === true && internalUses.length > 0)
    findings.push([f, 'CONTRADICT', `external_only=true, aber ${internalUses.length} innere Anwendung(en)`]);

  // --- (D) pet_toxic fehlt (unvollständig) ---
  if (s.pet_toxic === undefined)
    findings.push([f, 'PET-UNKNOWN', 'pet_toxic nicht gesetzt']);

  // --- (E) innere Anwendung mit "gut belegt"-Evidenz bei tödlich giftig (verdächtig) ---
  for (const u of internalUses)
    if (u.evidence_level === 'ema_well_established')
      findings.push([f, 'EVIDENCE?', `innere Anwendung als 'ema_well_established' markiert (giftig!) form=${u.form}`]);

  // --- (F) Anwendung ohne Quelle ---
  uses.forEach((u, i) => {
    if (!Array.isArray(u.source_ids) || u.source_ids.length === 0)
      findings.push([f, 'NO-SOURCE', `uses[${i}] (form=${u.form}) ohne source_ids`]);
  });
}

// === Ausgabe ===
const byType = {};
for (const [, type] of findings) byType[type] = (byType[type] ?? 0) + 1;

console.log(`Pflanzen gesamt: ${files.length} | davon toxicity_level='toxic': ${toxicCount}`);
console.log(`Befunde: ${findings.length}`);
console.log('Nach Typ:', JSON.stringify(byType));
console.log('---');
for (const [file, type, msg] of findings.sort((a, b) => a[1].localeCompare(b[1])))
  console.log(`[${type}] ${file}: ${msg}`);
