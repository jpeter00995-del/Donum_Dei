// === Donum Dei — i18n / FR aggregator (Light-Sprache) ===
// Nur common (Oberfläche). Fehlende Keys → t() gibt den Key zurück; auf der
// FR-Startseite werden nur vorhandene common-Keys verwendet.

import { common } from './fr/common';

export const fr: Record<string, string> = {
  ...common,
};
