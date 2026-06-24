// === Giftpflanzen — innere Anwendungen von der normalen Verwendung trennen ===
// Sicherheits-Feature: Bei hochgiftigen Pflanzen (toxicity_level === 'toxic')
// dürfen innere Anwendungen NICHT als normale "Verwendung" erscheinen, sondern
// nur in einem klar getrennten "Nur historische Dokumentation"-Warn-Kasten.
import type { Plant, PlantUse } from './types';

// === 1. HELFER ===

/** Innere Anwendung? 'both' zählt mit, weil es auch innerlich angewendet wird. */
export function isInternalUse(use: PlantUse): boolean {
  return use.internal_external === 'internal' || use.internal_external === 'both';
}

// === 2. SPLIT ===

/**
 * Teilt die Anwendungen einer Pflanze in `normalUses` + `historicalUses`.
 * Nur bei hochgiftigen Pflanzen (toxicity_level === 'toxic') werden innere
 * Anwendungen in `historicalUses` herausgezogen. Sonst bleiben alle normal.
 */
export function splitUsesForToxicity(plant: Plant): {
  normalUses: PlantUse[];
  historicalUses: PlantUse[];
} {
  const isDeadlyToxic = plant.safety?.toxicity_level === 'toxic';
  if (!isDeadlyToxic) {
    return { normalUses: plant.uses, historicalUses: [] };
  }
  return {
    normalUses: plant.uses.filter(u => !isInternalUse(u)),
    historicalUses: plant.uses.filter(isInternalUse),
  };
}
