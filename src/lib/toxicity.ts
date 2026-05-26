// === Toxicity helpers — Welle M.3 ===
// Centralized read-side logic for the v1.5 toxicity warning system.
// (Zentrale Lese-Logik für den Giftpflanzen-Warner.)

import type { Plant, ToxicityLevel } from './types';

// === 1. PUBLIC API ===

/**
 * Returns the explicit toxicity_level from a plant's safety block, or
 * `'none'` when the field is missing (back-compat with pre-M.3 JSONs).
 *
 * (Liefert das `toxicity_level`-Feld; falls fehlend wird `'none'` zurückgegeben.)
 */
export function getToxicityLevel(plant: Plant): ToxicityLevel {
  return plant.safety?.toxicity_level ?? 'none';
}

/**
 * True when the plant is explicitly flagged as pet-toxic (cats/dogs).
 * (Pflanze ist explizit für Haustiere giftig.)
 */
export function isPetToxic(plant: Plant): boolean {
  return plant.safety?.pet_toxic === true;
}

/**
 * Single-glance decision: should the UI show ANY safety badge for this plant?
 * True when toxicity_level is `caution` or `toxic`, OR pet_toxic is true.
 *
 * (UI-Hilfs-Funktion: muss überhaupt ein Badge gezeigt werden?)
 */
export function shouldShowSafetyBadge(plant: Plant): boolean {
  return getToxicityLevel(plant) !== 'none' || isPetToxic(plant);
}

/**
 * Effective "severity" rank for sorting / filtering.
 *   toxic   = 2
 *   caution = 1
 *   none    = 0
 * Pet-toxic on its own does not change the rank — it is shown separately.
 * (Numerischer Rang für Sortier-/Filterzwecke.)
 */
export function toxicityRank(level: ToxicityLevel): number {
  if (level === 'toxic') return 2;
  if (level === 'caution') return 1;
  return 0;
}
