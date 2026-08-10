// === 1. ZWECK ===
// Welche Pflanzen gehoeren auf die Ernte-Monatsseite?
//
// Bisher wurde nur `season.active_months` gefiltert. Das bedeutet bei
// Zimmerpflanzen aber nur "lebt das ganze Jahr" — dadurch standen Monstera
// und Efeutute unter "Heilpflanzen im Januar ernten", mit dem Erntehinweis
// "ganze Pflanze (dekorativ)".
//
// Neue Regel:
//   1. Zierpflanzen ohne echte Ernte werden ausgeschlossen.
//   2. Wenn echte Erntedaten (`harvest[]`) vorliegen, gelten diese.
//   3. Nur wenn keine vorliegen (Pilze, exotische Arten), gilt ersatzweise
//      `season.active_months`.

import type { Plant } from './types';

// === 2. AUSSCHLUSS-MUSTER ===
// Freitext aus `season.harvest_part`. Trifft eines zu, wird nicht geerntet.
const KEINE_ERNTE = /dekorativ|decorative|keine ernte|no harvest|nicht zur selbstverwendung/i;

export function istZierpflanzeOhneErnte(plant: Plant): boolean {
  const teil = plant.season?.harvest_part;
  if (!teil) return false;
  return KEINE_ERNTE.test(`${teil.de ?? ''} ${teil.en ?? ''}`);
}

// === 3. ERNTEMONATE EINER PFLANZE ===
export function ernteMonate(plant: Plant): number[] {
  const ausHarvest = new Set<number>();
  for (const eintrag of plant.harvest ?? []) {
    for (const m of eintrag.best_months ?? []) ausHarvest.add(m);
  }
  if (ausHarvest.size > 0) return [...ausHarvest].sort((a, b) => a - b);
  // Ersatz fuer Arten ohne eigene Erntedaten (z. B. Pilze, tropische Arten).
  return [...(plant.season?.active_months ?? [])].sort((a, b) => a - b);
}

// === 4. FILTER FUER EINE MONATSSEITE ===
export function pflanzenImMonat(plants: Plant[], monat: number): Plant[] {
  return plants.filter(p => !istZierpflanzeOhneErnte(p) && ernteMonate(p).includes(monat));
}
