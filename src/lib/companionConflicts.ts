// === Companion-Planting Conflict Detection — v1.0 Task 16 ===
// Pure, side-effect-free conflict detector.
// (Reine Konflikt-Erkennung ohne Seiteneffekte.)
//
// Input:  RecommendedPlant[] (current plan) + Plant[] (full database)
// Output: PlantConflict[] — every unordered pair of in-plan plants where
//         at least one side lists the other in `companion_planting.bad_partners`.
//
// See TODO_v1.0_selbstversorger.md Task 16.

import type { Plant } from './types';
import type { RecommendedPlant } from './gardenPlan';

// === 1. PUBLIC TYPES ===

/**
 * One detected conflict between two plants in the user's plan.
 * `plant_a` < `plant_b` lexicographically (stable, dedup-friendly).
 * (Ein erkannter Konflikt; Slugs lexikografisch sortiert für stabile Ausgabe.)
 */
export interface PlantConflict {
  /** First plant slug — alphabetically smaller of the two. */
  plant_a: string;
  /** Second plant slug — alphabetically larger of the two. */
  plant_b: string;
  /** Citation taken from the side that declared the conflict (source field). */
  source: string;
}

// === 2. DETECTION ===

/**
 * Find every pair of plants in `plan` that are listed as `bad_partners`
 * by at least one side. Bidirectional — A→B or B→A counts. Each pair is
 * returned exactly once, with `plant_a` lexicographically smaller.
 *
 * Plants missing `companion_planting` are silently skipped (they contribute
 * no conflicts but can still appear as the "other" side of one).
 *
 * (Findet jedes Paar aus dem Plan, das mindestens einseitig als bad_partner
 * markiert ist; gibt jedes Paar genau einmal zurück, alphabetisch sortiert.)
 */
export function detectConflicts(
  plan: readonly RecommendedPlant[],
  plants: readonly Plant[],
): PlantConflict[] {
  // Slug-Set der Pflanzen, die aktuell im Plan sind.
  const inPlan = new Set<string>();
  for (const r of plan) inPlan.add(r.plant_slug);

  // Lookup Plant-Objekte nach Slug — nur Plants im Plan müssen wir kennen.
  const bySlug = new Map<string, Plant>();
  for (const p of plants) {
    if (inPlan.has(p.slug)) bySlug.set(p.slug, p);
  }

  // Set für Pair-Deduplication, Key = `${a}|${b}` mit a < b.
  const seen = new Set<string>();
  const out: PlantConflict[] = [];

  for (const slug of inPlan) {
    const plant = bySlug.get(slug);
    if (!plant?.companion_planting) continue;
    const bad = plant.companion_planting.bad_partners ?? [];
    for (const partnerSlug of bad) {
      if (partnerSlug === slug) continue;
      if (!inPlan.has(partnerSlug)) continue;

      const a = slug < partnerSlug ? slug : partnerSlug;
      const b = slug < partnerSlug ? partnerSlug : slug;
      const key = `${a}|${b}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Quelle bevorzugt von der Seite, die den Konflikt deklariert hat.
      // Bei beidseitiger Deklaration: bevorzugt die Quelle aus `plant`
      // (deterministisch, weil wir den Iterations-Slug nehmen).
      const source = plant.companion_planting.source ?? '';
      out.push({ plant_a: a, plant_b: b, source });
    }
  }

  // Stabile Sortierung für reproducible UI.
  out.sort((x, y) => (x.plant_a + x.plant_b).localeCompare(y.plant_a + y.plant_b));
  return out;
}
