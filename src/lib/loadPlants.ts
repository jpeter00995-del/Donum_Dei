import type { Plant, Season } from './types';
import { validatePlant } from './validatePlant';

const SEASON_MONTHS: Record<Season, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

export function monthsToSeasons(months: number[]): Season[] {
  const result = new Set<Season>();
  for (const m of months) {
    for (const [season, seasonMonths] of Object.entries(SEASON_MONTHS) as [Season, number[]][]) {
      if (seasonMonths.includes(m)) {
        result.add(season);
      }
    }
  }
  return Array.from(result);
}

export function plantsToSeasons(plants: Plant[]): Season[] {
  const result = new Set<Season>();
  for (const p of plants) {
    for (const s of monthsToSeasons(p.season.active_months)) {
      result.add(s);
    }
  }
  return Array.from(result);
}

// Build-time loader: uses Vite's import.meta.glob to load all plant JSONs eagerly.
// Validates each one; throws at build time on invalid data.
const modules = import.meta.glob<{ default: unknown }>('../data/plants/*.json', { eager: true });

let cached: Plant[] | null = null;

export function loadAllPlants(): Plant[] {
  if (cached) return cached;
  const result: Plant[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    try {
      validatePlant(mod.default);
      result.push(mod.default as Plant);
    } catch (e) {
      throw new Error(`Invalid plant file ${path}: ${(e as Error).message}`);
    }
  }
  // Codex P21: consistent Intl.Collator instead of default localeCompare.
  const latinCollator = new Intl.Collator('en', { sensitivity: 'base' });
  result.sort((a, b) => latinCollator.compare(a.names.latin, b.names.latin));
  cached = result;
  return result;
}

export function loadPlantBySlug(slug: string): Plant | null {
  return loadAllPlants().find(p => p.slug === slug) ?? null;
}

export function loadIndoorPlants(): Plant[] {
  return loadAllPlants()
    .filter(p => p.indoor_growing?.suitable === true)
    .sort((a, b) => a.indoor_growing!.difficulty - b.indoor_growing!.difficulty);
}

// Returns a fresh array of all plants sorted alphabetically by the localized name.
// Use this on user-facing pages where the visual order should match the active UI language.
export function getPlantsSortedByLocale(locale: 'de' | 'en'): Plant[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const key: 'de' | 'en' = locale;
  return [...loadAllPlants()].sort((a, b) =>
    collator.compare(a.names[key] ?? a.names.latin, b.names[key] ?? b.names.latin)
  );
}
