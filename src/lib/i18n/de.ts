// === Donum Dei — i18n / DE aggregator ===
// Sammelt alle deutschen Übersetzungs-Strings aus den Domain-Files.

import { common } from './de/common';
import { plant } from './de/plant';
import { indoor } from './de/indoor';
import { plan } from './de/plan';
import { permaculture } from './de/permaculture';
import { symptoms } from './de/symptoms';
import { feedback } from './de/feedback';

export const de: Record<string, string> = {
  ...common,
  ...plant,
  ...indoor,
  ...plan,
  ...permaculture,
  ...symptoms,
  ...feedback,
};
