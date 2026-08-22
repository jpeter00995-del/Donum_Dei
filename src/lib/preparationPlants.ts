import type { Plant, PlantUse, Locale } from './types';
import type { UseForm } from './plantSchema';
import { istFuerEmpfehlungGeeignet } from './symptomSearch';

// === 1. ZWECK ===
// Ordnet die Pflanzen der Datenbank ihren Zubereitungsarten zu.
//
// Die Zubereitungsseiten (/de/zubereitung/tee/ usw.) zeigen nicht nur, WIE
// eine Methode geht, sondern auch, WELCHE Pflanzen aus dieser Datenbank so
// verwendet werden. Das ist der eigentliche Nutzen: Wer wissen will, was man
// als Tee ansetzen kann, bekommt hier die Liste statt einer Suchmaske.
//
// Ausschluss wie auf den Symptomseiten: giftige und rechtlich kontrollierte
// Arten stehen nicht auf einer Seite, die zum Nachmachen anleitet
// (istFuerEmpfehlungGeeignet in symptomSearch.ts). Sie bleiben ueber Suche
// und Register erreichbar.
//
// Zweite Huerde, gefunden bei der Sichtpruefung in Sitzung 36: Der
// Abendlaendische Lebensbaum stand an erster Stelle der Teeseite. Er traegt
// `toxicity_level: caution` und rutschte deshalb durch — sein eigener Warntext
// beginnt aber mit "GIFTIG (Thujon-Gehalt)", und die Tee-Anwendung ist ein
// historischer Bericht ueber Jacques Cartier von 1535. Auf einer Seite, die
// erklaert, wie man Tee ansetzt, hat so etwas nichts verloren.
// Siehe istFuerAnleitungGeeignet.

// === 2. TYPEN ===
export type Zubereitungstreffer = {
  plant: Plant;
  /** Die Anwendung, die den Treffer ausgeloest hat — liefert die Begruendung. */
  use: PlantUse;
  /** Anzahl der Anwendungen dieser Pflanze in dieser Form. */
  anzahl: number;
};

// === 3. EIGNUNG EINER EINZELNEN ANWENDUNG ===
/** Innerliche Anwendung? 'both' zaehlt mit, weil auch innerlich angewendet wird. */
function istInnerlich(use: PlantUse): boolean {
  return use.internal_external === 'internal' || use.internal_external === 'both';
}

/**
 * Darf diese eine Anwendung auf einer Anleitungsseite stehen?
 *
 * Zwei Ausschluesse, beide bewusst eng gehalten, damit die Listen nicht
 * ausduennen:
 *
 *  1. `safety.external_only` — die Pflanze ist ausdruecklich nur zur aeusseren
 *     Anwendung freigegeben. Eine innerliche Form (Tee, Tinktur, Gurgeln,
 *     Gewuerz, roh) darf dann nicht in der Liste auftauchen.
 *
 *  2. `toxicity_level: 'caution'` + innerlich + `evidence_level: 'folk'` —
 *     bei einer Pflanze, die bereits einen Vorsichtshinweis traegt, reicht
 *     blosse Ueberlieferung nicht aus, um sie zum Nachmachen zu empfehlen.
 *     Aeusserliche Anwendungen sind davon nicht betroffen, ebensowenig
 *     Anwendungen mit belastbarerer Einstufung (traditional, Kommission E,
 *     EMA, klinische Studie).
 *
 * Pure function.
 */
export function istFuerAnleitungGeeignet(plant: Plant, use: PlantUse): boolean {
  const s = plant.safety;
  if (s?.external_only && istInnerlich(use)) return false;
  if (s?.toxicity_level === 'caution' && istInnerlich(use) && use.evidence_level === 'folk') {
    return false;
  }
  return true;
}

// === 4. ZUORDNUNG ===
/**
 * Liefert alle empfehlungsfaehigen Pflanzen, die mindestens eine Anwendung
 * in der gegebenen Zubereitungsform haben.
 *
 * Sortierung: nach dem Namen in der jeweiligen Sprache, damit die Reihenfolge
 * stabil und nachvollziehbar ist (kein Ranking — es gibt hier nichts zu ranken).
 *
 * Pure function, kein I/O.
 */
export function findPlantsForForm(
  form: UseForm,
  plants: Plant[],
  locale: Locale,
): Zubereitungstreffer[] {
  const treffer: Zubereitungstreffer[] = [];

  for (const plant of plants) {
    if (!istFuerEmpfehlungGeeignet(plant)) continue;
    const passende = (plant.uses ?? []).filter(
      u => u.form === form && istFuerAnleitungGeeignet(plant, u),
    );
    if (passende.length === 0) continue;
    // Bevorzugt die Anwendung mit eigener Zubereitungsangabe — sie ist die
    // aussagekraeftigere Begruendung auf der Karte.
    const beste = passende.find(u => u.preparation) ?? passende[0];
    treffer.push({ plant, use: beste, anzahl: passende.length });
  }

  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  treffer.sort((a, b) => collator.compare(a.plant.names[locale], b.plant.names[locale]));
  return treffer;
}

/**
 * Zaehlt je Zubereitungsform, wie viele empfehlungsfaehige Pflanzen es gibt.
 * Fuer die Uebersichtsseite, damit dort echte Zahlen und keine Schaetzungen
 * stehen.
 */
export function countPlantsPerForm(plants: Plant[]): Record<string, number> {
  const zaehler: Record<string, number> = {};
  for (const plant of plants) {
    if (!istFuerEmpfehlungGeeignet(plant)) continue;
    const formen = new Set<string>();
    for (const use of plant.uses ?? []) {
      if (use.form && istFuerAnleitungGeeignet(plant, use)) formen.add(use.form);
    }
    for (const f of formen) zaehler[f] = (zaehler[f] ?? 0) + 1;
  }
  return zaehler;
}

/**
 * Alle Zubereitungsformen einer Pflanze — fuer den Hinweiskasten auf der
 * Pflanzenseite ("Diese Pflanze wird als Tee, Tinktur und Umschlag verwendet").
 */
export function formsOfPlant(plant: Plant): UseForm[] {
  const formen = new Set<UseForm>();
  for (const use of plant.uses ?? []) {
    if (use.form) formen.add(use.form);
  }
  return Array.from(formen);
}
