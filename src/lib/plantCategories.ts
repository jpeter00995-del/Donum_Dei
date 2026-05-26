// === Plant Categories — Welle K (v1.3.2) ===
// Algorithmische Kategorisierung der 188+ Pflanzen in 6 user-freundliche
// Garten-Kategorien. Pure, side-effect-freie Funktion.
// (Algorithmic categorisation into 6 user-friendly garden categories.)
//
// Ziel: User findet die Klassiker (Tomate, Karotte, Basilikum) sofort
// und die Empfehlungs-Liste lässt sich nach Kategorie gruppieren.
//
// Reihenfolge der Heuristik:
//   1. Hardcoded slug-Overrides (klare Ausnahmen)
//   2. Familie (Solanaceae, Cucurbitaceae, …)
//   3. permaculture_functions (medicinal, pest_repellent, …)
//   4. uses[].form (raw/spice → kraeuter, tea/tincture/salve → heilpflanzen)
//   5. Default: heilpflanzen
//
// Keine Daten-Migration der Plant-JSONs nötig — alles aus existing fields.

import type { Plant } from './types';

// === 1. PUBLIC TYPES ===

/**
 * Die 6 user-freundlichen Garten-Kategorien für die Empfehlungs-Sektion.
 * (User-friendly garden categories.)
 */
export type PlantCategory =
  /** 🍅 Tomate, Paprika, Gurke, Kürbis, Bohne, Erbse, Aubergine, Mais... */
  | 'fruchtgemuese'
  /** 🥬 Salat, Spinat, Mangold, Kohl-Familie, Rucola... */
  | 'blattgemuese'
  /** 🥕 Karotte, Kartoffel, Zwiebel, Knoblauch, Rote Bete... */
  | 'wurzelgemuese'
  /** 🌿 Basilikum, Petersilie, Dill, Salbei, Rosmarin, Thymian... */
  | 'kraeuter'
  /** 🌸 Tagetes, Kapuzinerkresse, Ringelblume, Borretsch... */
  | 'begleitpflanzen'
  /** 💊 Echinacea, Kamille, Brennnessel, Schafgarbe... (primary medical) */
  | 'heilpflanzen';

/** Geordnete Liste aller Kategorien (für UI-Reihenfolge). */
export const PLANT_CATEGORIES: readonly PlantCategory[] = [
  'fruchtgemuese',
  'blattgemuese',
  'wurzelgemuese',
  'kraeuter',
  'begleitpflanzen',
  'heilpflanzen',
] as const;

/** Emoji-Mapping pro Kategorie für UI-Labels. */
export const CATEGORY_EMOJI: Record<PlantCategory, string> = {
  fruchtgemuese: '🍅',
  blattgemuese: '🥬',
  wurzelgemuese: '🥕',
  kraeuter: '🌿',
  begleitpflanzen: '🌸',
  heilpflanzen: '💊',
};

// === 2. SLUG-OVERRIDES ===

/**
 * Hardcoded Overrides für klare Ausnahmen wo die Familie-Heuristik fehlschlägt.
 * (Slug-overrides for clear exceptions where family heuristic fails.)
 */
const OVERRIDES: Record<string, PlantCategory> = {
  // Solanaceae-Ausnahme: Kartoffel ist Knolle, kein Fruchtgemüse.
  'solanum-tuberosum': 'wurzelgemuese',
  // Amaranthaceae split: Rote Bete (Wurzel) vs. Mangold (Blatt).
  'beta-vulgaris-conditiva': 'wurzelgemuese',
  'beta-vulgaris-cicla': 'blattgemuese',
  // Poaceae: Mais ist klassisches Fruchtgemüse (Kolben), nicht Gras.
  'zea-mays': 'fruchtgemuese',
  // Apiaceae mit form="raw" aber als Küchenkraut bekannt (Petersilie-Blatt).
  'petroselinum-crispum': 'kraeuter',
  // Wurzelpetersilie bleibt aber Wurzelgemüse (über Familie-Default abgedeckt).
};

// === 3. FAMILY MAPPING ===

/**
 * Klare Familien-Zuordnungen ohne Sonderfälle.
 * (Clean family → category mappings.)
 */
const FAMILY_CATEGORY: Record<string, PlantCategory> = {
  Solanaceae: 'fruchtgemuese',
  Cucurbitaceae: 'fruchtgemuese',
  Fabaceae: 'fruchtgemuese',
  Brassicaceae: 'blattgemuese',
  Alliaceae: 'wurzelgemuese',
  Amaryllidaceae: 'wurzelgemuese', // Allium (Zwiebel, Knoblauch, Lauch, Schnittlauch)
  Lamiaceae: 'kraeuter',
  Tropaeolaceae: 'begleitpflanzen',
  Boraginaceae: 'begleitpflanzen',
};

// === 4. PUBLIC API ===

/**
 * Kategorisiere eine Pflanze nach einer Heuristik aus Familie + permaculture
 * functions + uses. Pure Funktion, kein Crash bei fehlenden Feldern.
 * (Categorise a plant via family + permaculture + uses heuristic.)
 *
 * @param plant  The plant to categorise.
 * @returns      One of the 6 garden categories.
 */
export function categorizePlant(plant: Plant): PlantCategory {
  // === 4.1 Slug-Override (höchste Priorität) ===
  const override = OVERRIDES[plant.slug];
  if (override) return override;

  const family = plant.family?.latin ?? '';
  const slug = plant.slug ?? '';
  const forms = (plant.uses ?? []).map(u => u.form);
  const perma = plant.permaculture_functions ?? [];
  const spacing = plant.garden_meta?.spacing_cm ?? 0;

  // === 4.2 Familie-basierte Direkt-Zuordnung ===
  const directFromFamily = FAMILY_CATEGORY[family];
  if (directFromFamily) return directFromFamily;

  // === 4.3 Familie mit Sonderfällen ===
  if (family === 'Apiaceae') {
    // Apiaceae: Kräuter (Dill, Anis, Koriander, Kümmel) vs. Wurzelgemüse
    // (Karotte, Pastinake, Sellerie). Kriterium: Verwendungs-Form.
    // - tea/spice → klassisches Küchenkraut
    // - raw → essbare Wurzel oder Stange
    const hasSpiceOrTea = forms.includes('spice') || forms.includes('tea');
    const hasRaw = forms.includes('raw');
    if (hasSpiceOrTea && !hasRaw) return 'kraeuter';
    if (hasRaw) return 'wurzelgemuese';
    // Fallback wenn nur tincture/salve: behandeln wir als Heilpflanze.
    return 'heilpflanzen';
  }

  if (family === 'Asteraceae') {
    // Asteraceae ist sehr breit: Salat, Begleitpflanzen, Heilpflanzen.
    // - Lactuca sativa = Salat → Blattgemüse
    // - Calendula (salve), Kamille (tea), Schafgarbe (tea+tincture) →
    //   Heilpflanze sobald irgend eine medizinische Form vorliegt
    // - Tagetes etc. ohne medizinische Form → Begleitpflanze
    // - Rest meist Heilpflanzen
    if (slug.startsWith('lactuca-sativa')) return 'blattgemuese';
    const hasMedical = forms.some(f =>
      f === 'tea' || f === 'tincture' || f === 'salve' || f === 'bath',
    );
    if (hasMedical) return 'heilpflanzen';
    const hasPestRepellent = perma.includes('pest_repellent');
    const hasPollinator = perma.includes('pollinator_attractor');
    if (hasPestRepellent || hasPollinator) return 'begleitpflanzen';
    return 'heilpflanzen';
  }

  // === 4.4 Permaculture-Funktionen ===
  // medicinal als primäre Permaculture-Funktion + medizinische Anwendungs-Forms
  // → klar Heilpflanze.
  const hasMedicalForm = forms.some(f =>
    f === 'tea' || f === 'tincture' || f === 'salve' || f === 'bath',
  );
  if (perma.includes('medicinal') && hasMedicalForm) {
    return 'heilpflanzen';
  }

  // Begleitpflanzen-Indikator: pest_repellent oder pollinator_attractor ohne
  // medizinische/raw/spice Verwendung.
  if (
    (perma.includes('pest_repellent') || perma.includes('pollinator_attractor'))
    && !forms.includes('raw')
    && !forms.includes('spice')
    && !hasMedicalForm
  ) {
    return 'begleitpflanzen';
  }

  // === 4.5 Fallback nach uses[].form ===
  if (forms.includes('spice')) return 'kraeuter';
  if (forms.includes('raw')) {
    // Raw essbar — könnte Frucht-, Blatt- oder Wurzelgemüse sein. Ohne
    // weitere Hinweise: kleine spacing → wahrscheinlich Blatt/Wurzel,
    // große spacing → eher Fruchtgemüse-Charakter.
    if (spacing > 0 && spacing <= 20) return 'blattgemuese';
    if (spacing >= 40) return 'fruchtgemuese';
    return 'kraeuter';
  }
  if (hasMedicalForm) return 'heilpflanzen';

  // === 4.6 Default ===
  // Pflanzen ohne brauchbare Hinweise (selten) → Heilpflanze als sicherer Default
  // (deckt sich mit Donum-Dei-Ursprung als Heilpflanzen-DB).
  return 'heilpflanzen';
}

/**
 * Gruppiere eine Pflanzen-Liste nach Kategorie. Pure Funktion.
 * Reihenfolge der Slugs innerhalb einer Kategorie bleibt erhalten (Input-Order).
 * (Group a plant list by category; preserves input order within each group.)
 *
 * @param plants  The full plant list.
 * @returns       Map<PlantCategory, Plant[]>; jede Kategorie ist immer present
 *                (auch wenn leer) für stabile UI-Iteration.
 */
export function groupPlantsByCategory(
  plants: readonly Plant[],
): Record<PlantCategory, Plant[]> {
  const out: Record<PlantCategory, Plant[]> = {
    fruchtgemuese: [],
    blattgemuese: [],
    wurzelgemuese: [],
    kraeuter: [],
    begleitpflanzen: [],
    heilpflanzen: [],
  };
  for (const p of plants) {
    out[categorizePlant(p)].push(p);
  }
  return out;
}
