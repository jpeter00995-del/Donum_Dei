// === Space-aware Suggestions — v1.1 Welle G ===
// Pure, side-effect-free suggestion engine for the "Living Garden Designer".
// (Reine Vorschlags-Engine für den lebendigen Garten-Designer.)
//
// Idee: Wenn der User Mengen reduziert oder Pflanzen entfernt, schlägt die
// App live vor, welche Pflanzen in den freien Platz passen würden — basierend
// auf Klimazone, Garten-Typ, Mischkultur-Beziehungen, Familien-Vielfalt und
// Permakultur-Funktionen.
//
// Input:  RecommendedPlant[] (live plan) + Plant[] (full DB) + UserProfile
// Output: SpaceSuggestion[] — Pflanzen, die NICHT im Plan sind, sortiert nach Score.
//
// See TODO_v1.0_selbstversorger.md Welle G.

import type { Plant, PermacultureFunction } from './types';
import type { UserProfile } from './userProfile';
import { areaPerPlant, estimateAreaSqm, type RecommendedPlant } from './gardenPlan';

// === 1. PUBLIC TYPES ===

/**
 * One space-aware suggestion. Quantity is the realistic amount that
 * (a) fits into the remaining free area and
 * (b) makes sense for the household size.
 *
 * (Ein platz-bewusster Vorschlag. Menge passt in den Restplatz UND
 * macht für den Haushalt Sinn.)
 */
export interface SpaceSuggestion {
  /** Slug of the suggested plant. */
  plant_slug: string;
  /** Realistic quantity based on free area + household size. */
  suggested_quantity: number;
  /** Estimated total area for `suggested_quantity` in m². */
  estimated_area_sqm: number;
  /** Heuristic score (0..100, higher = more relevant). */
  score: number;
  /** 1–3 short German reasons. */
  reasons_de: string[];
  /** 1–3 short English reasons. */
  reasons_en: string[];
  /** True when at least one good-partner is already in the plan. */
  companion_boost: boolean;
}

/** Input bag for `generateSpaceSuggestions`. */
export interface SpaceSuggestionsInput {
  /** Current (live) plan — may include unsaved edits. */
  plan: readonly RecommendedPlant[];
  /** Full plant database (typically all 188 plants). */
  plants: readonly Plant[];
  /** Persisted user profile (zone, garden, household, experience, goal). */
  profile: UserProfile;
  /** Maximum number of suggestions returned. Default 5, hard-capped at 8. */
  maxSuggestions?: number;
}

// === 2. INTERNAL CONSTANTS ===

/** Minimum free area in m² required to bother suggesting anything. */
const MIN_FREE_AREA_SQM = 0.3;

/** Hard cap on returned suggestions (UI sanity). */
const MAX_SUGGESTIONS_HARD_CAP = 8;

/** Score floor — below this we drop the suggestion entirely. */
const MIN_SCORE = 1;

/** Score modifiers. */
const SCORE_BASE = 50;
const SCORE_COMPANION_BOOST = 20;
const SCORE_FAMILY_DIVERSITY = 15;
const SCORE_DIFFICULTY_MATCH = 10;
const SCORE_PERMACULTURE_BONUS = 5;
const SCORE_SIMILARITY_PENALTY = 10;

// === 3. PUBLIC API ===

/**
 * Generate space-aware suggestions for the free area of the user's plan.
 * Pure function — returns a new array, mutates nothing.
 *
 * Algorithm (high level):
 *   1. Compute free area = profile.garden.area_sqm − sum(plan area).
 *      Bail out when free area is below MIN_FREE_AREA_SQM (plan full or
 *      already over budget).
 *   2. Filter candidates by garden_meta presence, zone match, garden-type
 *      match, NOT already in plan, and NO bad-partner conflicts with
 *      anything currently in the plan.
 *   3. Score each candidate (base 50, +20 for good-partner boost, +15 for
 *      family diversity, +10 for difficulty match, +5 for permaculture
 *      annotations, −10 if 80%+ of the plan already shares the family).
 *   4. Pick a realistic suggested quantity: min(household heuristic, max
 *      that fits the free area). Skip plants where even 1 doesn't fit.
 *   5. Sort by score DESC, tiebreak alphabetically by plant slug.
 *   6. Return top N (default 5, hard-capped at 8).
 *
 * (Lebendiger Garten-Designer: schlägt vor, was in den Restplatz passt.)
 */
export function generateSpaceSuggestions(input: SpaceSuggestionsInput): SpaceSuggestion[] {
  const { plan, plants, profile } = input;
  const maxSuggestions = Math.min(
    MAX_SUGGESTIONS_HARD_CAP,
    Math.max(1, input.maxSuggestions ?? 5),
  );

  if (!Array.isArray(plants) || plants.length === 0) return [];
  if (!profile?.garden || profile.garden.area_sqm <= 0) return [];

  // === 3.1 Free area ===
  const plantBySlug = new Map<string, Plant>();
  for (const p of plants) plantBySlug.set(p.slug, p);

  const totalArea = profile.garden.area_sqm;
  const usedArea = sumPlanArea(plan, plantBySlug);
  const freeArea = totalArea - usedArea;
  if (freeArea < MIN_FREE_AREA_SQM) return [];

  // === 3.2 Plan context ===
  const planSlugs = new Set<string>();
  for (const r of plan) planSlugs.add(r.plant_slug);

  // Sammle bad_partner-Slugs aus allen Plan-Pflanzen → harte Ausschluss-Liste.
  const blockedSlugs = new Set<string>();
  // Sammle good_partner-Slugs → wer wird von welchem Plan-Plant als Partner empfohlen.
  // Map: candidate_slug → Set of plan plant slugs that recommend it.
  const goodPartnersOf = new Map<string, Set<string>>();

  for (const r of plan) {
    const p = plantBySlug.get(r.plant_slug);
    if (!p?.companion_planting) continue;
    for (const bad of p.companion_planting.bad_partners ?? []) {
      blockedSlugs.add(bad);
    }
    for (const good of p.companion_planting.good_partners ?? []) {
      let set = goodPartnersOf.get(good);
      if (!set) {
        set = new Set();
        goodPartnersOf.set(good, set);
      }
      set.add(r.plant_slug);
    }
  }

  // Auch umgekehrt prüfen: Kandidat hat einen Plan-Plant als bad_partner.
  // (Wird in der Filter-Schleife pro Kandidat geprüft.)

  // Familien-Vielfalt: zähle pro Familie, wie viele Plan-Pflanzen sie hat.
  const familyCounts = new Map<string, number>();
  for (const r of plan) {
    const p = plantBySlug.get(r.plant_slug);
    if (!p) continue;
    const fam = familyKey(p);
    if (!fam) continue;
    familyCounts.set(fam, (familyCounts.get(fam) ?? 0) + 1);
  }
  const planTotal = plan.length;

  // === 3.3 Candidate filter + scoring ===
  const out: SpaceSuggestion[] = [];

  for (const candidate of plants) {
    if (planSlugs.has(candidate.slug)) continue;
    if (blockedSlugs.has(candidate.slug)) continue;
    if (!candidate.garden_meta) continue;

    // Klimazone — nur prüfen wenn Profil eine Zone hat (Custom-Profile skippen den Filter).
    if (profile.zone && profile.zone.trim() !== '') {
      if (!candidate.garden_meta.climate_zones.includes(profile.zone)) continue;
    }

    // Garten-Typ-Match.
    if (!candidate.garden_meta.garden_type.includes(profile.garden.type)) continue;

    // Kandidat hat selbst einen Plan-Plant als bad_partner → ausschließen.
    if (candidate.companion_planting?.bad_partners?.length) {
      let conflict = false;
      for (const bad of candidate.companion_planting.bad_partners) {
        if (planSlugs.has(bad)) { conflict = true; break; }
      }
      if (conflict) continue;
    }

    // Realistische Menge berechnen.
    const perPlantArea = areaPerPlant(candidate);
    if (perPlantArea <= 0) continue;
    const maxFitsInFree = Math.floor(freeArea / perPlantArea);
    if (maxFitsInFree < 1) continue;
    const householdDefault = householdQuantity(candidate, profile);
    const suggestedQty = Math.max(1, Math.min(householdDefault, maxFitsInFree));
    const estimatedAreaSqm = round1(perPlantArea * suggestedQty);

    // === Score ===
    let score = SCORE_BASE;

    const partnerSources = goodPartnersOf.get(candidate.slug);
    const companionBoost = !!partnerSources && partnerSources.size > 0;
    if (companionBoost) score += SCORE_COMPANION_BOOST;

    const candidateFam = familyKey(candidate);
    const famCount = candidateFam ? (familyCounts.get(candidateFam) ?? 0) : 0;
    const familyDiversity = candidateFam !== '' && famCount < 2;
    if (familyDiversity) score += SCORE_FAMILY_DIVERSITY;

    const difficultyMatch = matchesDifficulty(profile.experience, candidate.garden_meta.difficulty);
    if (difficultyMatch) score += SCORE_DIFFICULTY_MATCH;

    const hasPermaculture =
      Array.isArray(candidate.permaculture_functions) && candidate.permaculture_functions.length > 0;
    if (hasPermaculture) score += SCORE_PERMACULTURE_BONUS;

    // Vielfalts-Penalty: wenn 80%+ der Plan-Pflanzen aus derselben Familie sind
    // wie der Kandidat, dann ist er "noch mehr vom Gleichen" → −10.
    if (planTotal > 0 && candidateFam && famCount / planTotal >= 0.8) {
      score -= SCORE_SIMILARITY_PENALTY;
    }

    if (score < MIN_SCORE) continue;

    // === Reasons (max 3, companion zuerst) ===
    const partnerNames_de: string[] = [];
    const partnerNames_en: string[] = [];
    if (companionBoost && partnerSources) {
      // Bis zu 2 Partner-Namen anzeigen, sonst wird die Card zu lang.
      const partnerSlugs = [...partnerSources].slice(0, 2);
      for (const slug of partnerSlugs) {
        const partner = plantBySlug.get(slug);
        if (!partner) continue;
        partnerNames_de.push(partner.names.de);
        partnerNames_en.push(partner.names.en);
      }
    }

    const reasons_de: string[] = [];
    const reasons_en: string[] = [];

    if (companionBoost && partnerNames_de.length > 0) {
      reasons_de.push(`Passt zu ${partnerNames_de.join(', ')}`);
      reasons_en.push(`Pairs with ${partnerNames_en.join(', ')}`);
    }

    if (hasPermaculture && reasons_de.length < 3) {
      // Erste permaculture function als Label.
      const fn = candidate.permaculture_functions![0] as PermacultureFunction;
      reasons_de.push(permaLabel(fn, 'de'));
      reasons_en.push(permaLabel(fn, 'en'));
    }

    if (familyDiversity && reasons_de.length < 3) {
      reasons_de.push('Bringt Familien-Vielfalt');
      reasons_en.push('Adds family diversity');
    }

    if (difficultyMatch && reasons_de.length < 3) {
      reasons_de.push('Passt zu deinem Erfahrungslevel');
      reasons_en.push('Matches your experience level');
    }

    out.push({
      plant_slug: candidate.slug,
      suggested_quantity: suggestedQty,
      estimated_area_sqm: estimatedAreaSqm,
      score,
      reasons_de: reasons_de.slice(0, 3),
      reasons_en: reasons_en.slice(0, 3),
      companion_boost: companionBoost,
    });
  }

  // === 3.4 Sort + slice ===
  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.plant_slug.localeCompare(b.plant_slug);
  });

  return out.slice(0, maxSuggestions);
}

// === 4. INTERNAL HELPERS ===

/** Sum total area of a live plan in m². */
function sumPlanArea(plan: readonly RecommendedPlant[], plantBySlug: Map<string, Plant>): number {
  let sum = 0;
  for (const r of plan) {
    const p = plantBySlug.get(r.plant_slug);
    if (!p) continue;
    sum += estimateAreaSqm(r, p);
  }
  return sum;
}

/** Round a number to one decimal place. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Family identity used for diversity scoring. Uses the Latin family name
 * when present; falls back to empty string (treated as "unknown family").
 * (Familien-Identität für Vielfalts-Score.)
 */
function familyKey(plant: Plant): string {
  const lat = plant.family?.latin?.trim()?.toLowerCase() ?? '';
  return lat;
}

/**
 * Does the candidate's difficulty match the user's experience level?
 *   beginner    → difficulty 1
 *   intermediate→ difficulty 1 or 2
 *   expert      → any difficulty
 * (Match Erfahrungslevel ↔ Garten-Schwierigkeit.)
 */
function matchesDifficulty(
  experience: UserProfile['experience'],
  difficulty: number,
): boolean {
  if (experience === 'expert') return true;
  if (experience === 'intermediate') return difficulty <= 2;
  return difficulty === 1;
}

/**
 * Heuristic household quantity by plant category (derived from slug + spacing).
 * Mirrors the spirit of `computeQuantity` in gardenPlan.ts but with a more
 * generous "this is a fresh add" stance and clearer per-plant target counts.
 * (Heuristische Menge je nach Pflanzen-Familie/Spacing pro Haushalt.)
 */
function householdQuantity(plant: Plant, profile: UserProfile): number {
  const household = Math.max(1, profile.household_size ?? 1);
  const slug = plant.slug.toLowerCase();
  const spacing = plant.garden_meta?.spacing_cm ?? 30;

  // Slug-basierte Heuristik (kürzeste Wege erst).
  // Riesen: Kürbis, Mais — wenige pro Familie.
  if (/(kurbis|kuerbis|kürbis|pumpkin|mais|maize|corn|zucchini|courgette|melone|melon)/.test(slug)) {
    return Math.max(2, Math.round(2 + household * 0.5));
  }
  // Kohl/Frucht-Gemüse: Tomate, Paprika, Aubergine, Kohl, Brokkoli, Blumenkohl, Wirsing
  if (/(kohl|cabbage|tomate|tomato|paprika|pepper|aubergine|eggplant|brokkoli|broccoli|blumenkohl|cauliflower|rosenkohl|brussels|wirsing|savoy|kohlrabi)/.test(slug)) {
    return Math.max(2, Math.round(2 * household + 1));
  }
  // Hülsenfrüchte
  if (/(bohne|bean|erbse|pea|linse|lentil|kichererbse|chickpea)/.test(slug)) {
    return Math.max(6, Math.round(8 * household));
  }
  // Blattgemüse / kleine Sortenpflanzen
  if (/(salat|lettuce|spinat|spinach|rucola|arugula|rocket|radieschen|radish|karotte|carrot|möhre|mohre|moehre|mangold|chard|feldsalat|lambs?-?lettuce)/.test(slug)) {
    return Math.max(8, Math.round(12 * household));
  }
  // Dauer-Kräuter
  if (/(basilikum|basil|petersilie|parsley|schnittlauch|chives|dill|thymian|thyme|oregano|rosmarin|rosemary|salbei|sage|minze|mint|koriander|coriander|cilantro)/.test(slug)) {
    return Math.max(2, Math.min(4, household + 1));
  }

  // Spacing-Fallback (analog zu gardenPlan.computeQuantity):
  //   ≤15 cm → 8/Person, ≤25 cm → 4, ≤45 cm → 2, ≤70 cm → 1, sonst 0.5.
  let perPerson: number;
  if (spacing <= 15) perPerson = 8;
  else if (spacing <= 25) perPerson = 4;
  else if (spacing <= 45) perPerson = 2;
  else if (spacing <= 70) perPerson = 1;
  else perPerson = 0.5;

  return Math.max(1, Math.round(perPerson * household));
}

/** Pre-baked permaculture-function labels (subset of i18n keys, EN-fallback). */
function permaLabel(fn: PermacultureFunction, locale: 'de' | 'en'): string {
  const de: Record<PermacultureFunction, string> = {
    nitrogen_fixer: 'Stickstoff-Fixierer',
    pest_repellent: 'Schädlings-Abwehr',
    ground_cover: 'Bodendecker',
    pollinator_attractor: 'Bestäuber-Magnet',
    root_loosener: 'Wurzel-Lockerer',
    dynamic_accumulator: 'Nährstoff-Sammler',
    vertical_high: 'Hohe Schicht',
    vertical_mid: 'Mittlere Schicht',
    vertical_low: 'Niedrige Schicht',
    shade_provider: 'Schattenspender',
    aromatic_repellent: 'Aromatischer Repeller',
    edible_flower: 'Essbare Blüte',
    medicinal: 'Heilpflanze',
    microclimate: 'Mikroklima-Schöpfer',
  };
  const en: Record<PermacultureFunction, string> = {
    nitrogen_fixer: 'Nitrogen Fixer',
    pest_repellent: 'Pest Repellent',
    ground_cover: 'Ground Cover',
    pollinator_attractor: 'Pollinator Magnet',
    root_loosener: 'Root Loosener',
    dynamic_accumulator: 'Dynamic Accumulator',
    vertical_high: 'High Layer',
    vertical_mid: 'Mid Layer',
    vertical_low: 'Low Layer',
    shade_provider: 'Shade Provider',
    aromatic_repellent: 'Aromatic Repeller',
    edible_flower: 'Edible Flower',
    medicinal: 'Medicinal',
    microclimate: 'Microclimate Creator',
  };
  return (locale === 'de' ? de : en)[fn] ?? fn;
}
