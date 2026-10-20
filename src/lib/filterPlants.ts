import type { Plant, FilterState, Season } from './types';
import { monthsToSeasons } from './loadPlants';
import { zubereitungsFormen } from './gardenUse';

export function filterPlants(plants: Plant[], filter: FilterState): Plant[] {
  return plants.filter(plant => {
    if (filter.forms.length > 0) {
      // Gartenanwendungen (z. B. pest_control) sind keine Zubereitungsform.
      const plantForms = new Set(zubereitungsFormen(plant.uses));
      const matchesForm = filter.forms.some(f => plantForms.has(f));
      if (!matchesForm) return false;
    }
    if (filter.seasons.length > 0) {
      const plantSeasons = new Set<Season>(monthsToSeasons(plant.season.active_months));
      const matchesSeason = filter.seasons.some(s => plantSeasons.has(s));
      if (!matchesSeason) return false;
    }
    return true;
  });
}
