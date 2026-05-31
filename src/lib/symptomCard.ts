// === Symptom-Card DTO — Prop-Slimming für SymptomFinder ===
// Astro serialisiert client:load-Props in das statische HTML. Die volle
// Plant[]-Liste (~27 KB/Pflanze × 223) blaeht jede Seite auf mehrere MB auf.
// Diese schlanke DTO enthaelt NUR die Felder, die der SymptomFinder-Island
// und die client-seitig importierte Such-Engine (symptomSearch.ts) zur
// Laufzeit wirklich lesen — ~90% kleinere Props.
// (Schlanke Prop-Projektion; nur tatsaechlich gelesene Felder.)

import type { Plant, UseForm, InternalExternal, ToxicityLevel } from './types';

// === 1. SLIM TYPES ===

/**
 * Getrimmte `uses[]`-Position: nur die Felder, die symptomSearch.ts liest
 * (target fuer Treffer-Scoring, description.de/en als Keyword-Haystack).
 * (Nur target + description; alle anderen use-Felder weggelassen.)
 */
export interface SymptomUse {
  /** Original-Schema-Felder, damit ein Cast auf PlantUse strukturell passt. */
  form: UseForm;
  internal_external: InternalExternal;
  target: string[];
  description: { de: string; en: string };
}

/**
 * Getrimmter `safety`-Block: nur die Felder, die ToxicityBadge (Variante
 * "badge") via toxicity.ts liest (toxicity_level, pet_toxic). Der
 * warnings-Text wird nur in der "box"-Variante gerendert — hier nicht.
 * (Nur toxicity_level + pet_toxic; warnings nicht noetig.)
 */
export interface SymptomSafety {
  toxicity_level?: ToxicityLevel;
  pet_toxic?: boolean;
}

/**
 * Schlanke Pflanzen-DTO fuer den SymptomFinder.
 * (Slim DTO; nur Felder, die Island + Such-Engine zur Laufzeit lesen.)
 */
export interface SymptomPlant {
  slug: string;
  names: { de: string; en: string; latin: string };
  teaser: { de: string; en: string };
  description: { de: string; en: string };
  image: { filename: string; alt: { de: string; en: string }; author: string; license: string };
  uses: SymptomUse[];
  safety: SymptomSafety;
}

// === 2. BUILD-TIME PROJECTION ===

/**
 * Projiziert eine volle Plant auf die schlanke SymptomPlant-DTO.
 * Laeuft zur Build-Zeit im Astro-Frontmatter, NICHT im Client.
 * (Build-Zeit-Projektion; nur gelesene Felder uebernehmen.)
 */
export function toSymptomPlant(plant: Plant): SymptomPlant {
  return {
    slug: plant.slug,
    names: { de: plant.names.de, en: plant.names.en, latin: plant.names.latin },
    teaser: { de: plant.teaser.de, en: plant.teaser.en },
    description: { de: plant.description.de, en: plant.description.en },
    image: {
      filename: plant.image.filename,
      alt: { de: plant.image.alt.de, en: plant.image.alt.en },
      author: plant.image.author,
      license: plant.image.license,
    },
    uses: plant.uses.map((u) => ({
      form: u.form,
      internal_external: u.internal_external,
      target: u.target,
      description: { de: u.description.de, en: u.description.en },
    })),
    safety: {
      toxicity_level: plant.safety.toxicity_level,
      pet_toxic: plant.safety.pet_toxic,
    },
  };
}
