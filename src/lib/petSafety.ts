// === Haustier-Sicherheit — eine Wahrheit, mit Beleg ===
// Bis 2026-08-10 gab es zwei unabhaengige Felder: `safety.pet_toxic` und
// `indoor_growing.pet_safe`. Bei 16 Pflanzen widersprachen sie sich — Lavendel
// stand mit "Haustiere: Ja" auf derselben Seite, die ihn als haustiergiftig
// auswies. Deshalb liest die Oberflaeche ab jetzt ausschliesslich
// `safety.pet_toxic`, und dieses Modul beantwortet die zweite Frage:
// Ist die Angabe extern belegt oder nur unsere eigene Einschaetzung?

import type { Plant, PetCheck } from './types';
import { isPetToxic } from './toxicity';

// === 1. BELEG ===

/** Beleg fuer die Haustier-Angabe, falls vorhanden. */
export function getPetCheck(plant: Plant): PetCheck | undefined {
  return plant.safety?.pet_check;
}

/** True, wenn die Angabe gegen eine externe Liste geprueft wurde. */
export function isPetChecked(plant: Plant): boolean {
  return getPetCheck(plant)?.source === 'aspca';
}

// === 2. EINSTUFUNG ===

/**
 * `toxic`    — als haustiergiftig gefuehrt
 * `safe`     — ausdruecklich als ungiftig gefuehrt und nicht generell giftig
 * `unknown`  — keine Angabe
 */
export type PetStatus = 'toxic' | 'safe' | 'unknown';

export function getPetStatus(plant: Plant): PetStatus {
  const flag = plant.safety?.pet_toxic;
  if (flag === undefined) return 'unknown';
  if (flag === true) return 'toxic';
  return plant.safety?.toxicity_level === 'toxic' ? 'toxic' : 'safe';
}

/** Fuer Haustiere unbedenklich — unabhaengig davon, ob belegt oder nicht. */
export function isPetSafe(plant: Plant): boolean {
  return getPetStatus(plant) === 'safe';
}

// === 3. LISTEN ===

/** Belegte und unbelegte "ungiftig"-Angaben getrennt, jeweils sortiert. */
export function splitPetSafe(
  plants: Plant[],
  locale: 'de' | 'en',
): { checked: Plant[]; unchecked: Plant[] } {
  const safe = plants
    .filter(isPetSafe)
    .sort((a, b) => a.names[locale].localeCompare(b.names[locale], locale));
  return {
    checked: safe.filter(isPetChecked),
    unchecked: safe.filter(p => !isPetChecked(p)),
  };
}

/** Haustiergiftige Pflanzen, sortiert. */
export function petToxicPlants(plants: Plant[], locale: 'de' | 'en'): Plant[] {
  return plants
    .filter(isPetToxic)
    .sort((a, b) => a.names[locale].localeCompare(b.names[locale], locale));
}
