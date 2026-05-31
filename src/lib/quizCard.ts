// === quizCard — Slim-DTO fürs PlantQuiz-Island (Prop-Shrink) ===
// (Projiziert jede volle Plant auf nur die Felder, die das Quiz-Island
//  zur Laufzeit liest — Render von PlantQuiz.tsx + Helper quizLogic.ts.
//  Verhindert, dass die komplette Plant[] (~27 KB/Pflanze) ins statische
//  HTML serialisiert wird.)

import type { Plant } from './types';

// === 1. INTERFACE ===

/**
 * Slim-Variante einer Plant für das Quiz.
 * Enthält NUR die Laufzeit-gelesenen Felder:
 * - slug      → React-Key + Distraktor-Dedup in pickQuestionsForRound (quizLogic.ts)
 * - names     → Antwort-Labels (de/en) + lateinischer Name in den Optionen
 * - image     → Quiz-Foto (filename) + Filter "nur Pflanzen mit Foto"
 */
export interface QuizPlant {
  slug: string;
  names: { de: string; en: string; latin: string };
  image: { filename: string };
}

// === 2. PROJEKTION ===

/** Baut zur Build-Zeit aus einer vollen Plant das Slim-DTO. */
export function toQuizPlant(plant: Plant): QuizPlant {
  return {
    slug: plant.slug,
    names: { de: plant.names.de, en: plant.names.en, latin: plant.names.latin },
    image: { filename: plant.image.filename },
  };
}
