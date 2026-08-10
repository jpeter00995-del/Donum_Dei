// === Haustier-Sicherheit — eine Wahrheit, mit Beleg ===
// Bis 2026-08-10 gab es zwei unabhaengige Felder: `safety.pet_toxic` und
// `indoor_growing.pet_safe`. Bei 16 Pflanzen widersprachen sie sich — Lavendel
// stand mit "Haustiere: Ja" auf derselben Seite, die ihn als haustiergiftig
// auswies. Deshalb liest die Oberflaeche ab jetzt ausschliesslich
// `safety.pet_toxic`, und dieses Modul beantwortet die zweite Frage:
// Ist die Angabe extern belegt oder nur unsere eigene Einschaetzung?

import type { Plant, PetCheck, ToxNote } from './types';
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

/**
 * Giftgrad aus der Tiermedizin-Datenbank CliniTox, falls die Pflanze dort
 * steht. Das ist ein allgemeiner Pflanzen-Giftgrad, KEIN Urteil ueber Hund
 * und Katze — er ergaenzt die Angabe, er ersetzt sie nicht.
 */
export function getToxNote(plant: Plant): ToxNote | undefined {
  return plant.safety?.tox_note;
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

// === 4. BEGRUENDUNG ===

const HAUSTIER_WORT = {
  de: /\bHunde?n?\b|\bKatzen?\b|\bHaustier/i,
  en: /\bdogs?\b|\bcats?\b|\bpets?\b/i,
};

/**
 * Der Satz aus dem Warntext, der wirklich von Hund und Katze handelt.
 * Auf einer Seite "Giftige Pflanzen für Katzen & Hunde" ist der erste Satz
 * des Warntextes oft der falsche — er handelt vom Menschen. Ohne Treffer
 * bleibt es beim ersten Satz.
 * (Kürzt auf `maxLen` Zeichen.)
 */
export function petReason(plant: Plant, locale: 'de' | 'en', maxLen = 200): string {
  const text = plant.safety?.warnings?.[locale] ?? '';
  const saetze = text.split(/(?<=[.!])\s+/).filter(Boolean);
  const treffer = saetze.find(s => HAUSTIER_WORT[locale].test(s)) ?? saetze[0] ?? '';
  return treffer.length > maxLen ? treffer.slice(0, maxLen - 1).trimEnd() + '…' : treffer;
}

/** Haustiergiftige Pflanzen, sortiert. */
export function petToxicPlants(plants: Plant[], locale: 'de' | 'en'): Plant[] {
  return plants
    .filter(isPetToxic)
    .sort((a, b) => a.names[locale].localeCompare(b.names[locale], locale));
}
