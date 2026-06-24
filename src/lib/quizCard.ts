// === quizCard — Slim-DTO fürs PlantQuiz-Island (Prop-Shrink) ===
// (Projiziert jede volle Plant auf nur die Felder, die das Quiz-Island
//  zur Laufzeit liest — Render von PlantQuiz.tsx + Helper quizLogic.ts.
//  Verhindert, dass die komplette Plant[] (~27 KB/Pflanze) ins statische
//  HTML serialisiert wird.)

import type { Plant } from './types';
import type { SymptomQ } from './quizLogic';
import { getAllSymptoms, findPlantsForSymptom } from './symptomSearch';

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

// === 3. SYMPTOM-QUIZ-DATEN (Build-Zeit) ===
// Baut je Symptom die Liste passender Pflanzen über die kuratierte
// symptoms.json + findPlantsForSymptom. Nur echte Daten — keine erfundenen
// Zuordnungen. Symptome ohne Treffer werden weggelassen.
export function buildSymptomQuizData(plants: Plant[]): SymptomQ[] {
  const out: SymptomQ[] = [];
  for (const s of getAllSymptoms()) {
    const matches = findPlantsForSymptom(s.id, plants, 200);
    if (matches.length === 0) continue;
    out.push({
      id: s.id,
      emoji: s.emoji,
      name_de: s.name_de,
      name_en: s.name_en,
      correctSlugs: matches.slice(0, 12).map(m => m.plant.slug),
      matchSlugs: matches.map(m => m.plant.slug),
    });
  }
  return out;
}
