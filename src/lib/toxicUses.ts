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

/**
 * Gut belegte / zugelassene Evidenz → die Anwendung ist ein echtes Mittel
 * (z.B. Efeu-Hustensaft, Rosskastanien-Venenmittel sind EMA-zugelassen) und
 * gehört NICHT in den "nicht anwenden"-Warn-Kasten, auch wenn die Rohpflanze giftig ist.
 */
const STRONG_EVIDENCE = 'ema_well_established';

/**
 * Innere Anwendung, die nur historisch überliefert ist (NICHT gut belegt/zugelassen).
 * Genau diese gehören bei giftigen Pflanzen in den Warn-Kasten.
 */
export function isHistoricalToxicUse(use: PlantUse): boolean {
  return isInternalUse(use) && use.evidence_level !== STRONG_EVIDENCE;
}

// === 2. SPLIT ===

/**
 * Teilt die Anwendungen einer Pflanze in `normalUses` + `historicalUses`.
 * Nur bei hochgiftigen Pflanzen (toxicity_level === 'toxic') werden innere,
 * NICHT gut belegte Anwendungen in `historicalUses` herausgezogen. Zugelassene
 * innere Anwendungen (ema_well_established) bleiben normal. Sonst alles normal.
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
    normalUses: plant.uses.filter(u => !isHistoricalToxicUse(u)),
    historicalUses: plant.uses.filter(isHistoricalToxicUse),
  };
}
