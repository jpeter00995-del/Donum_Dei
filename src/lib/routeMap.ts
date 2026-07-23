import type { Locale, UiLocale } from './types';
import { contentLocale } from './types';

// === 1. ZWECK ===
// Die deutschen und englischen Seiten haben UEBERSETZTE Adressen
// (/de/kalender <-> /en/calendar). Ein reiner Praefix-Tausch (/de/ -> /en/)
// landet deshalb auf Seiten, die es nicht gibt (404).
//
// Diese Tabelle ordnet das ERSTE Pfad-Segment nach dem Sprachkuerzel zu.
// Alles danach bleibt unveraendert — dadurch funktionieren auch
// Unterseiten (mein-garten/start) und dynamische Seiten (plant/<slug>)
// ohne eigenen Eintrag.

// === 2. ZUORDNUNG DE -> EN ===
// Genau ein Eintrag je Seitenordner unter src/pages/de/.
export const DE_TO_EN: Readonly<Record<string, string>> = {
  'bildnachweis': 'image-credits',
  'datenschutz': 'privacy',
  'feedback': 'feedback',
  'hilfe-bei': 'help-with',
  'impressum': 'imprint',
  'kalender': 'calendar',
  'karte': 'map',
  'mein-garten': 'my-garden',
  'mischkultur': 'companion-planting',
  'pakete': 'packages',
  'permakultur': 'permaculture',
  'pilze': 'mushrooms',
  'plant': 'plant',
  'quiz': 'quiz',
  'rauschpflanzen': 'psychoactive',
  'suche': 'search',
  'ueber': 'about',
  'zuhause-anbauen': 'grow-at-home',
};

// === 3. UMKEHRUNG EN -> DE ===
// Aus DE_TO_EN abgeleitet, damit beide Richtungen nicht auseinanderlaufen koennen.
export const EN_TO_DE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(DE_TO_EN).map(([de, en]) => [en, de]),
);

// === 4. PFAD-UEBERSETZUNG ===
/**
 * Uebersetzt einen Seitenpfad in die andere Inhalts-Sprache.
 *
 * Beispiele:
 *   '/de/kalender/'            -> '/en/calendar/'
 *   '/en/my-garden/start/'     -> '/de/mein-garten/start/'
 *   '/de/plant/lavandula/'     -> '/en/plant/lavandula/'
 *   '/de/'                     -> '/en/'
 *
 * Unbekannte Segmente liefern die Startseite der Zielsprache — nie eine
 * geratene Adresse, die dann ins Leere fuehrt.
 */
export function translatePath(path: string, from: UiLocale, to: Locale): string {
  const fromContent = contentLocale(from);
  // Light-Sprachen (fr/es/bg) haben nur eine Startseite — von dort aus gibt es
  // keinen Seitenpfad zu uebersetzen.
  if (fromContent !== from) return `/${to}/`;
  if (fromContent === to) return path;

  // Fuehrendes Sprachkuerzel abtrennen: '/de/kalender/' -> ['kalender', '']
  const stripped = path.replace(new RegExp(`^/${from}(?=/|$)`), '');
  const hadTrailingSlash = stripped.endsWith('/');
  const segments = stripped.split('/').filter(Boolean);

  // Startseite
  if (segments.length === 0) return `/${to}/`;

  const table = fromContent === 'de' ? DE_TO_EN : EN_TO_DE;
  const translatedFirst = table[segments[0]];
  if (!translatedFirst) return `/${to}/`;

  const rest = segments.slice(1);
  const joined = [translatedFirst, ...rest].join('/');
  return `/${to}/${joined}${hadTrailingSlash ? '/' : ''}`;
}

// === 5. HREFLANG-PARTNER ===
/**
 * Liefert den Pfad der anderssprachigen Fassung dieser Seite — fuer die
 * hreflang-Angaben im <head>. Gibt undefined zurueck, wenn es keine
 * echte Entsprechung gibt (Light-Sprachen, unbekannte Pfade).
 */
export function alternatePath(path: string, locale: UiLocale): string | undefined {
  const content = contentLocale(locale);
  if (content !== locale) return undefined;
  const other: Locale = content === 'de' ? 'en' : 'de';
  const translated = translatePath(path, locale, other);
  // Nur zurueckgeben, wenn wirklich uebersetzt wurde. Der Rueckfall auf die
  // Startseite waere ein falsches Sprachpaar-Signal an Google.
  const isFallbackHome = translated === `/${other}/`;
  const isRealHome = path === `/${locale}/` || path === `/${locale}`;
  if (isFallbackHome && !isRealHome) return undefined;
  return translated;
}
