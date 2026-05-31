import type {
  Plant,
  IndoorPurpose,
  IndoorRoom,
  IndoorLight,
  IndoorWaterFrequency,
  IndoorDifficulty,
} from './types';

// === 1. SLIM-DTO ===
// Schlankes Datenobjekt fuer die beiden "Zuhause anbauen"-Islands
// (IndoorQuiz + IndoorFilterBar -> IndoorCards) und den quizMatch-Helper.
// Enthaelt NUR die Felder, die zur Laufzeit gelesen werden — damit Astro
// nicht den vollen Plant (~27 KB) ins statische HTML serialisiert.
export interface IndoorPlant {
  slug: string;
  names: { de: string; en: string; latin: string };
  image: {
    filename: string;
    alt: { de: string; en: string };
    author: string;
    license: string;
  };
  // Im DTO immer gesetzt (loadIndoorPlants liefert nur Pflanzen mit indoor_growing).
  indoor_growing: {
    suitable: boolean;
    purpose: IndoorPurpose[];
    rooms: IndoorRoom[];
    light: IndoorLight;
    water_frequency: IndoorWaterFrequency;
    difficulty: IndoorDifficulty;
    pet_safe: boolean;
  };
}

// === 2. PROJEKTION ===
// Baut zur Build-Zeit aus einem vollen Plant das schlanke IndoorPlant.
export function toIndoorPlant(plant: Plant): IndoorPlant {
  const ig = plant.indoor_growing!;
  return {
    slug: plant.slug,
    names: {
      de: plant.names.de,
      en: plant.names.en,
      latin: plant.names.latin,
    },
    image: {
      filename: plant.image.filename,
      alt: { de: plant.image.alt.de, en: plant.image.alt.en },
      author: plant.image.author,
      license: plant.image.license,
    },
    indoor_growing: {
      suitable: ig.suitable,
      purpose: ig.purpose,
      rooms: ig.rooms,
      light: ig.light,
      water_frequency: ig.water_frequency,
      difficulty: ig.difficulty,
      pet_safe: ig.pet_safe,
    },
  };
}
