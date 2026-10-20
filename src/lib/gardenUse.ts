// === Gartenanwendungen ===
// Manche Eintraege in `uses` beschreiben keine Zubereitung fuer den Menschen,
// sondern eine Wirkung im Garten (z. B. Tagetes gegen Nematoden oder Weisse
// Fliege). Sie stehen weiter auf der Pflanzenseite, gehoeren aber nicht auf die
// Zubereitungsseiten, nicht in den Form-Filter und bekommen keinen Link zur
// Anleitung ("Frisch verwenden" beschreibt Ernten, Waschen, Hautauflagen).

import type { PlantUse } from './types';

// === 1. KONSTANTEN ===
/**
 * Targets, die eine reine Garten- bzw. Oekologie-Anwendung kennzeichnen.
 * Inventur 2026-10-20 ueber alle Pflanzen-JSONs: pest_control (Tagetes x2,
 * Plectranthus), soil_indicator (Mercurialis), soil_improvement + reforestation
 * (Robinie). Bewusst NICHT dabei: insect_repellent (Geranium wird auf die Haut
 * gerieben = echte Anwendung am Menschen) und agriculture/soil bei der Erbse
 * (Eintrag enthaelt auch nutrition).
 */
export const GARTEN_TARGETS: readonly string[] = [
  'pest_control',
  'soil_indicator',
  'soil_improvement',
  'reforestation',
];

// === 2. ERKENNUNG ===
/** true, sobald ein Target der Anwendung ein Garten-Target ist. */
export function istGartenanwendung(use: PlantUse): boolean {
  return (use.target ?? []).some(t => GARTEN_TARGETS.includes(t));
}

/** Eindeutige Zubereitungsformen einer Anwendungsliste, ohne Gartenanwendungen. */
export function zubereitungsFormen<T extends PlantUse>(uses: T[] | undefined): T['form'][] {
  const formen = new Set<T['form']>();
  for (const use of uses ?? []) {
    if (use.form && !istGartenanwendung(use)) formen.add(use.form);
  }
  return Array.from(formen);
}
