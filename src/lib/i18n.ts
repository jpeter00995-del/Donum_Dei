// === Donum Dei — i18n Hub ===
// Re-Export-Hub für alle Übersetzungs-Strings.
// Domain-Files leben unter src/lib/i18n/<locale>/<domain>.ts
// und werden in src/lib/i18n/<locale>.ts zu einem Record aggregiert.
//
// Public API: t(locale, key, params?), otherLocale(l)

import type { Locale, UiLocale } from './types';
import { de } from './i18n/de';
import { en } from './i18n/en';
import { fr } from './i18n/fr';
import { es } from './i18n/es';
import { bg } from './i18n/bg';

// Light-Sprachen (fr/es/bg) haben nur common; fehlt ein Key → Fallback EN.
const strings: Partial<Record<UiLocale, Record<string, string>>> = { de, en, fr, es, bg };

export function t(locale: UiLocale, key: string, params?: Record<string, string | number>): string {
  let s = strings[locale]?.[key] ?? strings.en?.[key];
  if (s === undefined) return key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

export function otherLocale(l: Locale): Locale {
  return l === 'de' ? 'en' : 'de';
}
