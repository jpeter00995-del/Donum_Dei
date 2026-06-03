import type { Plant } from './types';

// === Reich-/Status-Prädikate für die Themen-Seiten-Trennung ===
// (Kingdom/legal-status predicates that route an entry to the right themed page.)
//
// Drei sich ergänzende Sichten auf dieselbe Datenbasis:
//   - Haupt-Grid (/de, /en)            → isEverydayPlant  (Pflanzen ohne Rechtskontrolle)
//   - Pilz-Seite (/de/pilze, …)        → isFungus
//   - Rauschpflanzen-Seite (/de/…)     → isControlled
// Pilze und Rauschpflanzen sind aus dem Haupt-Grid ausgeschlossen; ein
// kontrollierter Pilz erscheint bewusst auf zwei Themen-Seiten (Cross-Listing).

/** kingdom === 'fungus' (Abwesenheit von kingdom impliziert Pflanze). */
export function isFungus(p: Plant): boolean {
  return p.kingdom === 'fungus';
}

/** legal_status.controlled === true — rechtlich kontrollierte/psychoaktive Art. */
export function isControlled(p: Plant): boolean {
  return p.legal_status?.controlled === true;
}

/** „Alltags"-Pflanze fürs Haupt-Grid: weder Pilz noch rechtlich kontrolliert. */
export function isEverydayPlant(p: Plant): boolean {
  return !isFungus(p) && !isControlled(p);
}
