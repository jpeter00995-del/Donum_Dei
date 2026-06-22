import type { Plant } from './types';

// === Verwandte Pflanzen über die botanische Familie ===
// Liefert bis zu `limit` ANDERE Pflanzen aus derselben Familie (family.latin),
// alphabetisch nach lateinischem Namen, ohne die Pflanze selbst.
// Dient der internen Verlinkung (SEO + Nutzerwert).
const latinCollator = new Intl.Collator('en', { sensitivity: 'base' });

export function getRelatedByFamily(plant: Plant, all: Plant[], limit = 6): Plant[] {
  const family = plant.family.latin;
  return all
    .filter(p => p.slug !== plant.slug && p.family.latin === family)
    .sort((a, b) => latinCollator.compare(a.names.latin, b.names.latin))
    .slice(0, limit);
}
