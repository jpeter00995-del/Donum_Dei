import type { Plant, UseForm, PermacultureFunction } from './types';

// === 1. PLAN-DTO ===
// Schlankes DTO für die Mein-Garten-Domäne (PlanView + Warenkorb + Beet-Planer).
// Enthält NUR Felder, die die Garten-Engines (gardenPlan, companionConflicts,
// companionSuggestions, plantCategories, beetLayout) UND die Render-Inseln
// (PlanView, PlantCounterCard, BeetVisualization, BeetCell) tatsächlich lesen:
//   slug, names, family.latin, image, uses[].form, permaculture_functions,
//   garden_meta (voll), companion_planting (voll).
// Weggelassen: teaser, safety, sources, constituents, harvest, classical_quotes,
// uses-Details (description/target/...) etc. → serialisierte client:load-Props
// schrumpfen von ø 27 KB auf wenige hundert Byte pro Pflanze.
//
// Engines sind nominell auf `Plant` typisiert; PlanView castet das DTO an den
// Engine-Grenzen (`as unknown as Plant[]`). Laufzeitsicher, weil die Engines
// ausschließlich die oben gelisteten Garten-Felder lesen (vgl. WeekView-Muster).
export interface PlanPlant {
  slug: string;
  names: { de: string; en: string; latin: string };
  family: { latin: string };
  image: { filename: string; alt: { de: string; en: string } };
  /** Nur die Anwendungsform — von categorizePlant (Heuristik) gelesen. */
  uses: { form: UseForm }[];
  /** Für Kategorisierung (categorizePlant) + Beet-Zonen (zoneFor) + Tooltip. */
  permaculture_functions?: PermacultureFunction[];
  /** Voll — Eligibility/Scoring/Quantity/Flächen-Engines + Aussaat-Hinweise. */
  garden_meta?: Plant['garden_meta'];
  /** Voll — Konflikt-/Vorschlags-Engines + Beet-Cluster + Card-Companions. */
  companion_planting?: Plant['companion_planting'];
}

// === 2. PROJEKTION ===
// Build-time-Projektion vom vollen Plant auf das Plan-DTO. Wird in
// .astro-Frontmatter aufgerufen (server-/buildseitig, nicht im Client).
export function toPlanPlant(plant: Plant): PlanPlant {
  return {
    slug: plant.slug,
    names: { de: plant.names.de, en: plant.names.en, latin: plant.names.latin },
    family: { latin: plant.family.latin },
    image: {
      filename: plant.image.filename,
      alt: { de: plant.image.alt.de, en: plant.image.alt.en },
    },
    uses: plant.uses.map(u => ({ form: u.form })),
    permaculture_functions: plant.permaculture_functions,
    garden_meta: plant.garden_meta,
    companion_planting: plant.companion_planting,
  };
}
