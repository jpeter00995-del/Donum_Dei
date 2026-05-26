// === Donum Dei — i18n / EN aggregator ===
// Collects all English translation strings from the domain files.

import { common } from './en/common';
import { plant } from './en/plant';
import { indoor } from './en/indoor';
import { plan } from './en/plan';
import { permaculture } from './en/permaculture';
import { symptoms } from './en/symptoms';
import { feedback } from './en/feedback';

export const en: Record<string, string> = {
  ...common,
  ...plant,
  ...indoor,
  ...plan,
  ...permaculture,
  ...symptoms,
  ...feedback,
};
