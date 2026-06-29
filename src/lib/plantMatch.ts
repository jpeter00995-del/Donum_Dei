// === Donum Dei — Latin→Slug-Matching für Foto-Erkennung ===
// REINE Funktionen, KEIN Daten-Import (kein loadPlants!), damit dieses Modul
// gefahrlos auch im Client-Bundle (PlantIdentifier-Island) landen darf.
// Der Index wird zur Build-Zeit im Astro-Frontmatter via buildLatinIndex(loadAllPlants())
// erzeugt und als schlankes DTO an das Island gereicht.

// === 1. NORMALISIERUNG ===
// Botanische Namen sind unsauber (Autoren, Hybriden, Subspecies, Groß/Klein).
// Ziel: alles auf "gattung art" (lowercase, ohne Diakritika/Autor/Rang) bringen.
//
//   "Actaea racemosa L."              → "actaea racemosa"
//   "Actaea racemosa (L.) Nutt."      → "actaea racemosa"
//   "Actaea × hybrida"                → "actaea hybrida"
//   "Salix x rubens"                  → "salix rubens"
//   "Taraxacum officinale subsp. vulgare" → "taraxacum officinale"
//   "ACTAEA RACEMOSA"                 → "actaea racemosa"
export function normalizeLatin(name: string): string {
  if (!name) return '';
  const cleaned = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Diakritika entfernen
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // Autor in Klammern entfernen: (L.) Nutt.
    .replace(/×/g, ' ') // Hybrid-Zeichen
    .replace(/[.,;]/g, ' '); // Punkte/Kommas (z. B. "l." → "l")
  const tokens = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((tok) => tok !== 'x'); // ASCII-Hybridmarker zwischen Gattung/Art
  // Nur Gattung + Art behalten → schneidet Autoren UND Rang-Marker (subsp./var./f.) ab.
  return tokens.slice(0, 2).join(' ');
}

// === 2. INDEX-AUFBAU (Build-Zeit) ===
// Erwartet Objekte mit { slug, names: { latin } } (= Plant). Bewusst lose typisiert,
// damit dieses reine Modul nicht von den Daten-Typen abhängt.
export interface LatinIndexEntry {
  slug: string;
  names: { latin?: string | null };
}

export function buildLatinIndex(plants: LatinIndexEntry[]): Record<string, string> {
  const index: Record<string, string> = {};
  for (const p of plants) {
    const key = normalizeLatin(p.names?.latin ?? '');
    if (key && !(key in index)) index[key] = p.slug; // erster Treffer gewinnt
  }
  return index;
}

// === 3. LOOKUP ===
export function matchSlug(latin: string, index: Record<string, string>): string | null {
  const key = normalizeLatin(latin);
  if (!key) return null;
  return index[key] ?? null;
}
