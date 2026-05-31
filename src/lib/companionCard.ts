import type { Plant } from './types';

// === 1. TYP ===
// Schlankes DTO für die Mischkultur-Insel (CompanionExplorer).
// Enthält NUR Felder, die der CompanionExplorer zur Laufzeit im Client liest:
// slug, names (de/en/latin), image (filename, alt, author, license) und das
// vollständige companion_planting (good/bad/neutral-Partner, source, notes).
// Ziel: serialisierte client:load-Props klein halten (volles Plant-Objekt
// ø 27 KB → Card schlank), damit das SSG-HTML nicht jede Pflanze komplett inlinet.
//
// Hinweis: Das bestehende GardenPlant-DTO (plantCard.ts) passt NICHT, weil es
// image.author / image.license nicht enthält — der CompanionExplorer nutzt
// beide für das "© Autor · Lizenz"-title-Attribut der Header-Karte.
export interface CompanionPlant {
  slug: string;
  names: { de: string; en: string; latin: string };
  image: { filename: string; alt: { de: string; en: string }; author: string; license: string };
  /** Vollständige Mischkultur-Beziehungen (Pflicht: per Page-Filter garantiert vorhanden). */
  companion_planting?: Plant['companion_planting'];
}

// === 2. PROJEKTION ===
// Build-time-Projektion vom vollen Plant auf das Companion-DTO.
// Wird im .astro-Frontmatter aufgerufen — läuft also server-/buildseitig,
// nicht im Client.
export function toCompanionPlant(plant: Plant): CompanionPlant {
  return {
    slug: plant.slug,
    names: { de: plant.names.de, en: plant.names.en, latin: plant.names.latin },
    image: {
      filename: plant.image.filename,
      alt: { de: plant.image.alt.de, en: plant.image.alt.en },
      author: plant.image.author,
      license: plant.image.license,
    },
    companion_planting: plant.companion_planting,
  };
}
