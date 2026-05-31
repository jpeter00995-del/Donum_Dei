import type { Plant, Season, UseForm } from './types';
import { monthsToSeasons } from './loadPlants';

// === 1. TYP ===
// Schlankes Karten-DTO für Grid/List-Inseln (FilterBar etc.).
// Enthält NUR Felder, die zum Filtern + Rendern einer Pflanzen-Kachel nötig
// sind. Ziel: serialisierte client:load-Props klein halten (volles Plant-Objekt
// ø 27 KB → Card ~0,7 KB), damit das SSG-HTML nicht jede Pflanze komplett inlinet.
export interface PlantCard {
  slug: string;
  names: { de: string; en: string; latin: string };
  teaser: { de: string; en: string };
  image: { filename: string; alt: { de: string; en: string }; author: string; license: string };
  /** Eindeutige Anwendungsformen (für Form-Filter + Chips). */
  forms: UseForm[];
  /** Vorab aus season.active_months abgeleitete Jahreszeiten (für Saison-Filter). */
  seasons: Season[];
  /** safety.external_only — für das "nur äußerlich"-Badge. */
  externalOnly: boolean;
}

// === 2. PROJEKTION ===
// Build-time-Projektion vom vollen Plant auf das Karten-DTO.
// Wird in .astro-Frontmatter aufgerufen — läuft also server-/buildseitig,
// nicht im Client.
export function toPlantCard(plant: Plant): PlantCard {
  return {
    slug: plant.slug,
    names: { de: plant.names.de, en: plant.names.en, latin: plant.names.latin },
    teaser: { de: plant.teaser.de, en: plant.teaser.en },
    image: {
      filename: plant.image.filename,
      alt: { de: plant.image.alt.de, en: plant.image.alt.en },
      author: plant.image.author,
      license: plant.image.license,
    },
    forms: Array.from(new Set(plant.uses.map(u => u.form))),
    seasons: monthsToSeasons(plant.season.active_months),
    externalOnly: plant.safety.external_only,
  };
}

// === 3. GARTEN-DTO ===
// Schlankes DTO für die Garten-Domäne (Kalender: WeekView + MonthHeatmap,
// später Mein-Garten: PlanView). Enthält nur Felder, welche die Garten-Engines
// (gardenPlan, calendarEngine, icalExport, spaceSuggestions) + die Render-Inseln
// tatsächlich lesen: slug, names, family.latin, image, garden_meta,
// companion_planting. Beschreibungen, sources, classical_quotes, uses-Details,
// constituents etc. werden weggelassen → serialisierte Props schrumpfen massiv.
export interface GardenPlant {
  slug: string;
  names: { de: string; en: string; latin: string };
  family: { latin: string };
  image: { filename: string; alt: { de: string; en: string } };
  garden_meta?: Plant['garden_meta'];
  companion_planting?: Plant['companion_planting'];
}

// Build-time-Projektion vom vollen Plant auf das Garten-DTO.
export function toGardenPlant(plant: Plant): GardenPlant {
  return {
    slug: plant.slug,
    names: { de: plant.names.de, en: plant.names.en, latin: plant.names.latin },
    family: { latin: plant.family.latin },
    image: {
      filename: plant.image.filename,
      alt: { de: plant.image.alt.de, en: plant.image.alt.en },
    },
    garden_meta: plant.garden_meta,
    companion_planting: plant.companion_planting,
  };
}
