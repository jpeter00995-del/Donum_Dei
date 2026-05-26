// === Garden Plan Algorithm — v1.0.1 / v1.3.2 ===
// Pure, side-effect-free recommendation engine.
// (Reine Empfehlungs-Funktion ohne Seiteneffekte.)
//
// Input:  UserProfile + Plant[]
// Output: RecommendedPlant[] sorted by score, bounded by garden capacity.
//
// v1.0.1 (Welle D.1 — UX fix):
//   - Mehr Sorten-Vielfalt (Mindest-Schwellen je Fläche).
//   - Kleinere realistische Mengen pro Sorte je nach Pflanz-Abstand.
//   - Harte Platz-Constraint: Gesamt-Platzbedarf <= 110% der verfügbaren Fläche.
//   - Helper `estimateAreaSqm` für Live-Platz-Indikator in der UI.
//
// v1.3.2 (Welle K — Diversity-Pick):
//   - Erste Pass picks TOP-N pro Kategorie (Fruchtgemüse, Blattgemüse,
//     Wurzelgemüse, Kräuter, Begleitpflanzen, Heilpflanzen) bevor der
//     score-basierte Fill-Pass läuft. Garantiert dass alle Kategorien
//     vertreten sind, sofern Pflanzen verfügbar.
//   - Konkretes UX-Ziel: Tomate landet im Auto-Plan für Maikels
//     Anfänger-Profil (Zone 7b, raised_bed 8 m², half).
//
// See TODO_v1.0_selbstversorger.md Task 6 + Welle D.1 + Welle K.

import type { Plant, GardenType } from './types';
import type {
  UserProfile,
  ExperienceLevel,
  SelfSufficiencyGoal,
} from './userProfile';
import { categorizePlant, PLANT_CATEGORIES } from './plantCategories';

// === 1. PUBLIC TYPES ===

/** Sowing method picked by the planner for a recommended plant. */
export type SowingMethod = 'indoor' | 'outdoor_direct' | 'transplant';

/** One row of the generated plan. */
export type RecommendedPlant = {
  /** Plant slug — matches Plant.slug. */
  plant_slug: string;
  /** Suggested number of plants to grow. */
  quantity: number;
  /** Sowing method chosen from `garden_meta.sowing_window`. */
  sowing_method: SowingMethod;
  /** Heuristic suitability score (0..1, higher = better fit). */
  score: number;
  /** Localised planner notes. */
  notes_de: string;
  notes_en: string;
};

/** Options bag, e.g. for tests. */
export type GardenPlanOptions = {
  /** Hard cap on the number of recommendations (otherwise derived from area_sqm). */
  maxRecommendations?: number;
};

// === 2. INTERNAL TUNABLES ===

/**
 * Plants per square metre per garden type — coarse upper bound on how
 * many distinct plant kinds make sense in that context.
 * (Pflanzen-Vielfalt pro qm — grobe Obergrenze pro Garten-Typ.)
 *
 * v1.0.1: deutlich erhöht für mehr Sortenvielfalt; die echte Begrenzung
 * macht jetzt der Platz-Constraint in Sektion 8.
 */
const DENSITY_PER_SQM: Record<GardenType, number> = {
  balcony: 1.2,
  raised_bed: 1.0,
  field: 0.4,
  greenhouse: 1.2,
};

/** Multiplier on output count based on self-sufficiency goal. */
const GOAL_MULTIPLIER: Record<SelfSufficiencyGoal, number> = {
  supplementary: 0.7,
  half: 1.0,
  full: 1.3,
};

/** Numeric experience for compatibility scoring (1 = beginner, 3 = expert). */
const EXP_LEVEL: Record<ExperienceLevel, number> = {
  beginner: 1,
  intermediate: 2,
  expert: 3,
};

/**
 * Mindest-Sortenvielfalt je Garten-Fläche.
 * (Minimum variety per garden area.)
 * v1.0.1: Maikels Feedback — 4 Sorten für 8 m² ist zu wenig.
 */
function minVarietyFor(area_sqm: number): number {
  if (area_sqm >= 12) return 16;
  if (area_sqm >= 8) return 12;
  if (area_sqm >= 4) return 8;
  if (area_sqm >= 2) return 5;
  return 3;
}

const MIN_RECOMMENDATIONS = 3;
const MAX_RECOMMENDATIONS_HARD_CAP = 40;

/**
 * Maximaler Platz-Verbrauch in Anteil der Garten-Fläche.
 * (Maximum space utilisation as fraction of garden area.)
 * 1.1 = 110 % (kleiner Puffer für vertikales Wachstum, Beipflanzungen).
 */
const MAX_SPACE_UTILISATION = 1.1;

/**
 * Welle K: Anzahl der TOP-Picks pro Kategorie im Diversity-Pass.
 * Wert 3 garantiert auch bei kleinen Gärten Sorten aus jeder Kategorie,
 * ohne das Score-Ranking völlig zu überfahren.
 * (Number of top picks per category in the diversity pass.)
 */
const DIVERSITY_TOP_PER_CATEGORY = 3;

/**
 * Welle K: Klassiker-Bonus für die Diversity-Bucket-Sortierung.
 * Nur intern verwendet, beeinflusst NICHT den globalen Score —
 * sorgt aber dafür, dass bekannte Garten-Stars (Tomate, Karotte, Basilikum, …)
 * im Top-N pro Kategorie auftauchen statt von alphabetisch früheren
 * Verwandten verdrängt zu werden.
 * (Classic-crop bonus used only for diversity bucket ordering.)
 */
const CLASSIC_CROP_BONUS: Record<string, number> = {
  // Fruchtgemüse
  'solanum-lycopersicum': 1.0,           // Tomate
  'capsicum-annuum': 0.8,                // Paprika
  'cucumis-sativus': 0.8,                // Gurke
  'cucurbita-pepo-zucchini': 0.7,        // Zucchini
  'phaseolus-vulgaris-nanus': 0.6,       // Buschbohne
  'pisum-sativum-saccharatum': 0.6,      // Zuckererbse
  'zea-mays': 0.5,                       // Mais
  // Blattgemüse
  'lactuca-sativa-capitata': 1.0,        // Kopfsalat
  'lactuca-sativa-crispa': 0.9,          // Pflücksalat
  'brassica-oleracea-capitata-alba': 0.7,// Weißkohl
  'spinacia-oleracea': 0.9,              // Spinat (falls vorhanden)
  'beta-vulgaris-cicla': 0.7,            // Mangold
  // Wurzelgemüse
  'daucus-carota-sativus': 1.0,          // Karotte
  'solanum-tuberosum': 0.9,              // Kartoffel
  'allium-cepa': 0.9,                    // Zwiebel
  'allium-sativum': 0.8,                 // Knoblauch
  'beta-vulgaris-conditiva': 0.7,        // Rote Bete
  'raphanus-sativus': 0.7,               // Radieschen (falls vorhanden)
  // Kräuter
  'ocimum-basilicum': 1.0,               // Basilikum
  'petroselinum-crispum': 0.9,           // Petersilie
  'anethum-graveolens': 0.8,             // Dill
  'mentha-piperita': 0.7,                // Pfefferminze
  'salvia-officinalis': 0.7,             // Salbei
  'thymus-vulgaris': 0.7,                // Thymian
  'rosmarinus-officinalis': 0.7,         // Rosmarin
  // Begleitpflanzen
  'tagetes-patula': 1.0,                 // Tagetes
  'tropaeolum-majus': 0.9,               // Kapuzinerkresse
  'borago-officinalis': 0.8,             // Borretsch
  // Heilpflanzen
  'matricaria-chamomilla': 0.9,          // Kamille
  'calendula-officinalis': 0.9,          // Ringelblume
  'echinacea-purpurea': 0.8,             // Echinacea
  'achillea-millefolium': 0.7,           // Schafgarbe
};

// === 3. PUBLIC API ===

/**
 * Generate a personalised garden plan from a user profile and the plant DB.
 * Pure function — returns a new array, mutates nothing.
 * (Erstellt einen Garten-Plan aus Profil + Pflanzen-DB; reine Funktion.)
 *
 * @param profile  The persisted user profile (already passed through migration).
 * @param plants   The full plant list (only entries with `garden_meta` are eligible).
 * @param options  Optional tuning knobs.
 * @returns Array of RecommendedPlant ordered by descending score.
 */
export function generateGardenPlan(
  profile: UserProfile,
  plants: readonly Plant[],
  options: GardenPlanOptions = {},
): RecommendedPlant[] {
  if (!Array.isArray(plants) || plants.length === 0) return [];

  // === 3.1 Filter eligible plants ===
  const eligible = plants.filter(p => isEligible(p, profile));
  if (eligible.length === 0) return [];

  // === 3.2 Score + materialise ===
  const userExp = EXP_LEVEL[profile.experience];

  const plantBySlug = new Map<string, Plant>();
  for (const p of eligible) plantBySlug.set(p.slug, p);

  const scored: RecommendedPlant[] = eligible.map(p => {
    const score = scorePlant(p, profile, userExp);
    const sowingMethod = pickSowingMethod(p);
    const quantity = computeQuantity(profile, p);
    return {
      plant_slug: p.slug,
      quantity,
      sowing_method: sowingMethod,
      score,
      notes_de: buildNotes(p, 'de', sowingMethod, quantity),
      notes_en: buildNotes(p, 'en', sowingMethod, quantity),
    };
  });

  // === 3.3 Sort by score (stable on tie via slug) ===
  scored.sort((a, b) => (b.score - a.score) || a.plant_slug.localeCompare(b.plant_slug));

  // === 3.4 Pick under combined sort cap + space cap (Welle K diversity-aware) ===
  const cap = options.maxRecommendations ?? computeCap(profile);
  const maxSpaceSqm = profile.garden.area_sqm * MAX_SPACE_UTILISATION;
  const minVariety = minVarietyFor(profile.garden.area_sqm);

  const picked: RecommendedPlant[] = [];
  const pickedSlugs = new Set<string>();
  let usedArea = 0;

  /**
   * Helper: füge eine Empfehlung dem Plan hinzu, wenn Platz reicht.
   * Versucht zuerst die ursprüngliche Menge, dann shrink-to-fit, dann skip.
   * Respektiert Cap. Gibt true zurück wenn etwas hinzugefügt wurde.
   * (Try to add a rec, possibly shrinking it, respecting cap+space.)
   */
  const tryAdd = (rec: RecommendedPlant, allowShrink: boolean): boolean => {
    if (picked.length >= cap) return false;
    if (pickedSlugs.has(rec.plant_slug)) return false;
    const plant = plantBySlug.get(rec.plant_slug);
    if (!plant) return false;
    const area = estimateAreaSqm(rec, plant);
    if (usedArea + area <= maxSpaceSqm) {
      picked.push(rec);
      pickedSlugs.add(rec.plant_slug);
      usedArea += area;
      return true;
    }
    if (!allowShrink) return false;
    const reduced = shrinkToFit(rec, plant, maxSpaceSqm - usedArea);
    if (reduced) {
      picked.push(reduced);
      pickedSlugs.add(reduced.plant_slug);
      usedArea += estimateAreaSqm(reduced, plant);
      return true;
    }
    return false;
  };

  // === 3.4.1 Diversity-Pass: pro Kategorie TOP-N Empfehlungen einsammeln. ===
  // Sorgt dafür dass alle 6 Kategorien (sofern verfügbar) vertreten sind,
  // bevor der Score-basierte Fill-Pass läuft. Ohne dies wählt der Greedy
  // sonst nur "schnellwachsende" oder höchst-gerankte Sorten und übersieht
  // Klassiker wie Tomate für Anfänger-Profile.
  //
  // Innerhalb jeder Kategorie wird mit Klassiker-Bonus sortiert, damit
  // bekannte Stars (Tomate, Karotte, Salat, Basilikum, …) den Vortritt
  // vor weniger bekannten Verwandten haben.
  const allByCategory = new Map<string, RecommendedPlant[]>();
  for (const cat of PLANT_CATEGORIES) allByCategory.set(cat, []);
  for (const rec of scored) {
    const plant = plantBySlug.get(rec.plant_slug)!;
    const cat = categorizePlant(plant);
    allByCategory.get(cat)!.push(rec);
  }
  const byCategoryTopN = new Map<string, RecommendedPlant[]>();
  for (const cat of PLANT_CATEGORIES) {
    const bucket = allByCategory.get(cat)!;
    // Sortiere pro Kategorie: zuerst Klassiker-Bonus, dann score DESC, dann slug.
    const ranked = [...bucket].sort((a, b) => {
      const ba = CLASSIC_CROP_BONUS[a.plant_slug] ?? 0;
      const bb = CLASSIC_CROP_BONUS[b.plant_slug] ?? 0;
      if (ba !== bb) return bb - ba;
      if (a.score !== b.score) return b.score - a.score;
      return a.plant_slug.localeCompare(b.plant_slug);
    });
    byCategoryTopN.set(cat, ranked.slice(0, DIVERSITY_TOP_PER_CATEGORY));
  }
  // Round-robin durch die Kategorien — fairer als kategorie-für-kategorie.
  for (let i = 0; i < DIVERSITY_TOP_PER_CATEGORY; i++) {
    for (const cat of PLANT_CATEGORIES) {
      const bucket = byCategoryTopN.get(cat)!;
      const rec = bucket[i];
      if (!rec) continue;
      if (picked.length >= cap) break;
      // Diversity-Picks dürfen NICHT shrinken — sonst kommen sie mit
      // Größe 0 in den Plan. Wenn Platz fehlt, beim Fill-Pass shrinken.
      tryAdd(rec, false);
    }
    if (picked.length >= cap) break;
  }

  // === 3.4.2 Fill-Pass: rest des Plans nach Score auffüllen. ===
  for (const rec of scored) {
    if (picked.length >= cap) break;
    tryAdd(rec, true);
  }

  // === 3.4.3 Falls Sortenvielfalt < Mindest-Schwelle: weitere Sorten mit Min-Menge=1 anhängen. ===
  if (picked.length < minVariety) {
    for (const rec of scored) {
      if (picked.length >= minVariety) break;
      if (pickedSlugs.has(rec.plant_slug)) continue;
      const plant = plantBySlug.get(rec.plant_slug)!;
      const minRec = withQuantity(rec, plant, 1);
      const area = estimateAreaSqm(minRec, plant);
      if (usedArea + area > maxSpaceSqm) continue;
      picked.push(minRec);
      pickedSlugs.add(minRec.plant_slug);
      usedArea += area;
    }
  }

  // === 3.4.4 Final-Sortierung: nach Score absteigend (UI erwartet das). ===
  picked.sort((a, b) => (b.score - a.score) || a.plant_slug.localeCompare(b.plant_slug));

  return picked;
}

// === 4. ELIGIBILITY ===

function isEligible(plant: Plant, profile: UserProfile): boolean {
  const gm = plant.garden_meta;
  if (!gm) return false;

  // Klimazone muss matchen (vereinfacht: exakte Übereinstimmung des Labels).
  if (!gm.climate_zones.includes(profile.zone)) return false;

  // Garten-Typ muss passen.
  if (!gm.garden_type.includes(profile.garden.type)) return false;

  // Mindestens ein Aussaat-Fenster muss da sein, sonst nicht planbar.
  const sw = gm.sowing_window;
  if (!sw.indoor && !sw.outdoor_direct && !sw.transplant) return false;

  return true;
}

// === 5. SCORING ===

/**
 * Score a plant 0..1 for the given profile. Higher is a better fit.
 * - Difficulty matched against user experience (closer = higher).
 * - Garden-type specificity bonus when the plant lists only the user's type.
 * (Score 0..1 für das Profil — je höher, desto besser geeignet.)
 */
function scorePlant(plant: Plant, profile: UserProfile, userExp: number): number {
  const gm = plant.garden_meta!;
  // Difficulty match: 1.0 wenn Erfahrung >= Schwierigkeit, sonst skaliert.
  const diffGap = userExp - gm.difficulty; // -2..+2
  let diffScore: number;
  if (diffGap >= 0) {
    // User ist erfahren genug — leicht abnehmend für "zu leicht für zu erfahrene Person".
    diffScore = diffGap === 0 ? 1.0 : 0.85;
  } else {
    // User unterfordert die Pflanze nicht — Pflanze ist eine Nummer anspruchsvoller.
    // Diff=-1 (z.B. Anfänger + diff-2-Klassiker wie Tomate) bekommt 0.75
    // damit klassische Gemüse-Stars trotzdem im Anfänger-Plan landen.
    diffScore = diffGap === -1 ? 0.75 : 0.25;
  }

  // Spezifität: Pflanze, die nur für genau diesen Garten-Typ markiert ist,
  // bekommt einen kleinen Bonus gegenüber Allroundern.
  const specificity = gm.garden_type.length === 1 ? 0.15 : 0.0;

  // Quick-win Bonus: kurze Reifezeit ist für Anfänger ein Mehrwert.
  const fastBonus =
    profile.experience === 'beginner' && gm.days_to_harvest <= 60 ? 0.1 : 0.0;

  // Zonen-Treffsicherheit: kleine Bias auf Plants, deren Zonen-Range schmal ist
  // (lokal angepasste Sorten als bessere Wahl).
  const zoneFocus = gm.climate_zones.length <= 2 ? 0.05 : 0.0;

  const raw = 0.7 * diffScore + specificity + fastBonus + zoneFocus;
  return clamp01(raw);
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return Math.round(x * 1000) / 1000;
}

// === 6. SOWING METHOD ===

/**
 * Pick a single sowing method per simple priority: outdoor_direct > transplant > indoor.
 * (Auswahl der Aussaat-Methode nach einfacher Prioritätsliste.)
 */
function pickSowingMethod(plant: Plant): SowingMethod {
  const sw = plant.garden_meta!.sowing_window;
  if (sw.outdoor_direct) return 'outdoor_direct';
  if (sw.transplant) return 'transplant';
  return 'indoor';
}

// === 7. QUANTITY ===

/**
 * Heuristische Stück-Empfehlung pro Sorte abhängig von Pflanz-Abstand,
 * Garten-Typ und Versorgungs-Ziel.
 * (Per-variety quantity heuristic based on spacing, garden type and goal.)
 *
 * Faustregeln pro Person bei goal=half:
 *   - sehr klein (≤15 cm): 8 Stück (Salat, Radieschen, Karotte, Spinat, Erbse, …)
 *   - klein     (16-25 cm): 4 Stück (Kräuter, Petersilie, Basilikum, Rote Beete, …)
 *   - mittel    (26-45 cm): 2 Stück (Mangold, Brokkoli, Fenchel, Stangenbohne, …)
 *   - groß      (46-70 cm): 1 Stück (Kohl, Tomate, Paprika, Aubergine, …)
 *   - sehr groß (>70 cm):   1 Stück pro 2 Personen (Kürbis, Zucchini)
 */
function computeQuantity(profile: UserProfile, plant: Plant): number {
  const spacing = plant.garden_meta!.spacing_cm;
  const household = Math.max(1, profile.household_size);
  const goalMult = GOAL_MULTIPLIER[profile.self_sufficiency_goal];

  let perPerson: number;
  if (spacing <= 15) perPerson = 8;
  else if (spacing <= 25) perPerson = 4;
  else if (spacing <= 45) perPerson = 2;
  else if (spacing <= 70) perPerson = 1;
  else perPerson = 0.5;

  // Begleitpflanzen (Calendula, Tagetes, Borago, Tropaeolum, Nepeta cataria u.ä.)
  // brauchen nur kleine Mengen — heuristisch über difficulty=1 + spacing 25..40 cm.
  // Wir verzichten hier auf eine Whitelist; spacing-Tabelle deckt das gut ab.

  const raw = perPerson * household * goalMult;
  return Math.max(1, Math.round(raw));
}

/** Helper: gleiche Empfehlung, neue Menge + neu erzeugte Notizen. */
function withQuantity(rec: RecommendedPlant, plant: Plant, quantity: number): RecommendedPlant {
  const q = Math.max(1, Math.round(quantity));
  return {
    ...rec,
    quantity: q,
    notes_de: buildNotes(plant, 'de', rec.sowing_method, q),
    notes_en: buildNotes(plant, 'en', rec.sowing_method, q),
  };
}

/**
 * Reduziere die Menge so, dass die Sorte in den verbleibenden Platz passt.
 * Gibt `null` zurück, wenn selbst eine einzige Pflanze nicht mehr reinpasst.
 * (Try to shrink quantity to fit remaining area, or null if even one won't fit.)
 */
function shrinkToFit(
  rec: RecommendedPlant,
  plant: Plant,
  remainingSqm: number,
): RecommendedPlant | null {
  if (remainingSqm <= 0) return null;
  const perPlant = areaPerPlant(plant);
  if (perPlant <= 0) return null;
  const fits = Math.floor(remainingSqm / perPlant);
  if (fits < 1) return null;
  const q = Math.min(rec.quantity, fits);
  if (q < 1) return null;
  return withQuantity(rec, plant, q);
}

// === 8. SPACE ESTIMATION ===

/**
 * Geschätzter Platz pro Einzel-Pflanze in m² aus `garden_meta.spacing_cm`.
 * Annahme: spacing entspricht der Seitenlänge eines Quadrats.
 * (Estimated space per single plant in m² from spacing_cm.)
 */
export function areaPerPlant(plant: Plant): number {
  const spacing = plant.garden_meta?.spacing_cm;
  if (!spacing || spacing <= 0) return 0;
  return (spacing * spacing) / 10000; // cm² → m²
}

/**
 * Geschätzter Platzbedarf einer Empfehlung in m² (quantity × spacing²).
 * Pure Funktion, auch für die UI verwendet (Live-Platz-Indikator).
 * (Estimated total area of a recommendation in m².)
 */
export function estimateAreaSqm(rec: RecommendedPlant, plant: Plant): number {
  return areaPerPlant(plant) * Math.max(0, rec.quantity);
}

/**
 * Summiere Platzbedarf aller Empfehlungen, gegeben eine Plant-Lookup-Map oder -Liste.
 * (Sum total area across all recommendations.)
 */
export function totalAreaSqm(
  recs: readonly RecommendedPlant[],
  plants: readonly Plant[] | Map<string, Plant>,
): number {
  const lookup: Map<string, Plant> =
    plants instanceof Map
      ? plants
      : new Map(plants.map(p => [p.slug, p]));
  let sum = 0;
  for (const r of recs) {
    const p = lookup.get(r.plant_slug);
    if (!p) continue;
    sum += estimateAreaSqm(r, p);
  }
  return sum;
}

// === 9. CAP ===

function computeCap(profile: UserProfile): number {
  const density = DENSITY_PER_SQM[profile.garden.type];
  const goalMult = GOAL_MULTIPLIER[profile.self_sufficiency_goal];
  const base = profile.garden.area_sqm * density * goalMult;
  const rounded = Math.round(base);
  const minVar = minVarietyFor(profile.garden.area_sqm);
  // Cap nie unter Mindest-Vielfalt (wird durch Platz separat begrenzt).
  if (rounded < minVar) return minVar;
  if (rounded < MIN_RECOMMENDATIONS) return MIN_RECOMMENDATIONS;
  if (rounded > MAX_RECOMMENDATIONS_HARD_CAP) return MAX_RECOMMENDATIONS_HARD_CAP;
  return rounded;
}

// === 10. NOTES ===

function buildNotes(plant: Plant, locale: 'de' | 'en', method: SowingMethod, quantity: number): string {
  const gm = plant.garden_meta!;
  const monthLabel = (m: number, l: 'de' | 'en') =>
    (l === 'de'
      ? ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])[m - 1];

  const window =
    method === 'indoor'
      ? gm.sowing_window.indoor
      : method === 'transplant'
      ? gm.sowing_window.transplant
      : gm.sowing_window.outdoor_direct;

  // Platzbedarf für diese Empfehlung in m² (gerundet auf 0.1).
  const areaSqm = Math.round(((gm.spacing_cm * gm.spacing_cm) / 10000) * quantity * 10) / 10;
  const areaStr = areaSqm > 0
    ? (locale === 'de' ? `ca. ${areaSqm.toLocaleString('de-DE')} m² Platz` : `approx. ${areaSqm} m² space`)
    : '';

  if (!window) {
    if (locale === 'de') {
      return areaStr
        ? `${quantity} Pflanzen empfohlen · ${areaStr}.`
        : `${quantity} Pflanzen empfohlen.`;
    }
    return areaStr
      ? `Recommended: ${quantity} plants · ${areaStr}.`
      : `Recommended: ${quantity} plants.`;
  }

  const range = `${monthLabel(window.start_month, locale)}–${monthLabel(window.end_month, locale)}`;
  const methodLabel =
    locale === 'de'
      ? { indoor: 'Vorkultur', outdoor_direct: 'Direktsaat', transplant: 'Pflanzen' }[method]
      : { indoor: 'Pre-sow indoors', outdoor_direct: 'Direct sow', transplant: 'Transplant' }[method];

  if (locale === 'de') {
    return `${quantity} Pflanzen empfohlen · ${areaStr} · ${methodLabel} ${range}.`;
  }
  return `Recommended: ${quantity} plants · ${areaStr} · ${methodLabel} ${range}.`;
}
