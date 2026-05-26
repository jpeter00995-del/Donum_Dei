// === Companion-Planting Suggestions — v1.0 Task 17 ===
// Pure, side-effect-free suggestion engine.
// (Reine Vorschlags-Engine für gute Mischkultur-Partner.)
//
// Input:  RecommendedPlant[] (current plan) + Plant[] (full database)
// Output: Suggestion[] — top-N partners that are NOT yet in the plan.
//
// See TODO_v1.0_selbstversorger.md Task 17.

import type { Plant } from './types';
import type { RecommendedPlant } from './gardenPlan';

// === 1. PUBLIC TYPES ===

/**
 * One suggested companion. `source_plant_slugs` lists ALL plants in the
 * user's plan that recommend `suggested_slug` (deduplicated — each
 * suggested plant appears only once).
 *
 * `reason_de` / `reason_en` are optional free-form notes from one of
 * the source plants. (Dedupliziert — jede empfohlene Pflanze nur 1×.)
 */
export interface Suggestion {
  /** All in-plan plant slugs that recommend `suggested_slug`. */
  source_plant_slugs: string[];
  /** Primary source plant slug (first one — backwards-compat). */
  source_plant_slug: string;
  /** Slug of the suggested companion plant. */
  suggested_slug: string;
  /** Optional German note. */
  reason_de?: string;
  /** Optional English note. */
  reason_en?: string;
  /** Citation of the relationship table. */
  source: string;
}

// === 2. SUGGESTION ENGINE ===

/**
 * Generate up to `max` companion suggestions per source plant.
 * Rules:
 *   - Only suggest plants that exist in `plants` and are NOT already in `plan`.
 *   - Per source plant, keep at most `max` suggestions (default 3) to avoid
 *     overwhelming the user.
 *   - Global cap: 3 × max suggestions. If more candidates exist, the
 *     "most-recommended" ones win (highest count of source plants
 *     proposing them; tie-break: alphabetical slug for stability).
 *
 * (Generiert max 3 Vorschläge pro Quell-Pflanze; global max 9. Bei
 * Overflow gewinnen die Pflanzen, die von den meisten Plan-Pflanzen
 * vorgeschlagen werden — Mehrfach-Empfehlungen sind „wertvoller".)
 */
export function generateSuggestions(
  plan: readonly RecommendedPlant[],
  plants: readonly Plant[],
  max: number = 3,
): Suggestion[] {
  const inPlan = new Set<string>();
  for (const r of plan) inPlan.add(r.plant_slug);

  // Set aller existierenden Slugs für schnellen Existenz-Check.
  const exists = new Set<string>();
  const bySlug = new Map<string, Plant>();
  for (const p of plants) {
    exists.add(p.slug);
    bySlug.set(p.slug, p);
  }

  // Aggregate: pro suggested_slug sammeln WELCHE source_plants ihn empfehlen.
  const aggregated = new Map<
    string,
    { sources: string[]; reason_de?: string; reason_en?: string; source: string }
  >();
  for (const slug of inPlan) {
    const src = bySlug.get(slug);
    if (!src?.companion_planting) continue;
    const good = src.companion_planting.good_partners ?? [];
    for (const partnerSlug of good) {
      if (partnerSlug === slug) continue;
      if (inPlan.has(partnerSlug)) continue;
      if (!exists.has(partnerSlug)) continue;
      const existing = aggregated.get(partnerSlug);
      if (existing) {
        if (!existing.sources.includes(slug)) existing.sources.push(slug);
      } else {
        aggregated.set(partnerSlug, {
          sources: [slug],
          reason_de: src.companion_planting.notes_de,
          reason_en: src.companion_planting.notes_en,
          source: src.companion_planting.source ?? '',
        });
      }
    }
  }

  // Deduplizierte Suggestion-Liste bauen.
  const suggestions: Suggestion[] = [];
  for (const [suggested_slug, data] of aggregated.entries()) {
    suggestions.push({
      source_plant_slugs: data.sources,
      source_plant_slug: data.sources[0],
      suggested_slug,
      reason_de: data.reason_de,
      reason_en: data.reason_en,
      source: data.source,
    });
  }

  // Ranking: meiste source_plants gewinnen. Tiebreak: alphabetisch.
  const ranked = suggestions.sort((a, b) => {
    if (b.source_plant_slugs.length !== a.source_plant_slugs.length) {
      return b.source_plant_slugs.length - a.source_plant_slugs.length;
    }
    return a.suggested_slug.localeCompare(b.suggested_slug);
  });

  // Global Cap (verhindert Overflow bei großen Plänen).
  const globalCap = 3 * max;
  return ranked.slice(0, globalCap);
}
