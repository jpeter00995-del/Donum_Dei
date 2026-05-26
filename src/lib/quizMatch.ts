import type { Plant, IndoorRoom, IndoorLight, IndoorWaterFrequency } from './types';

// === 1. TYPES ===

export type QuizAnswers = {
  room: IndoorRoom;
  light: 'sonnig' | 'hell' | 'dunkel';
  water: 'vergesslich' | 'normal' | 'pingelig';
};

// === 2. COMPATIBILITY MAPS ===

// Zuordnung: Nutzer-Lichtauswahl → passende IndoorLight-Werte
const LIGHT_COMPAT: Record<QuizAnswers['light'], IndoorLight[]> = {
  sonnig: ['direct_sun', 'bright_indirect'],
  hell:   ['bright_indirect', 'partial_shade'],
  dunkel: ['partial_shade', 'low_light'],
};

// Zuordnung: Nutzer-Wasserauswahl → passende IndoorWaterFrequency-Werte
const WATER_COMPAT: Record<QuizAnswers['water'], IndoorWaterFrequency[]> = {
  vergesslich: ['sparse', 'weekly'],
  normal:      ['weekly', 'every_few_days'],
  pingelig:    ['daily', 'every_few_days', 'weekly', 'sparse'],
};

// === 3. SCORING ===

/**
 * Berechnet einen Score für eine Pflanze anhand der Quiz-Antworten.
 * Punkteverteilung:
 *   - Zimmer-Match: 3 Punkte
 *   - Licht-Kompatibilität: 2 Punkte
 *   - Wasser-Kompatibilität: 2 Punkte
 *   - Schwierigkeits-Bonus: 3 (easy) / 2 (medium) / 1 (hard)
 */
export function scorePlant(plant: Plant, answers: QuizAnswers): number {
  const ig = plant.indoor_growing;
  if (!ig?.suitable) return 0;

  let score = 0;

  // Zimmer-Match (höchste Gewichtung)
  if (ig.rooms.includes(answers.room)) score += 3;

  // Licht-Kompatibilität
  if (LIGHT_COMPAT[answers.light].includes(ig.light)) score += 2;

  // Wasser-Kompatibilität
  if (WATER_COMPAT[answers.water].includes(ig.water_frequency)) score += 2;

  // Schwierigkeits-Bonus: leichtere Pflanzen bevorzugen bei Gleichstand
  score += (4 - ig.difficulty); // difficulty=1 → +3, difficulty=2 → +2, difficulty=3 → +1

  return score;
}

// === 4. MATCHING ===

/**
 * Gibt die Top-5 passenden Pflanzen zurück, sortiert nach Score (absteigend).
 * Pflanzen ohne indoor_growing.suitable=true werden herausgefiltert.
 */
export function matchPlants(plants: Plant[], answers: QuizAnswers): Plant[] {
  const scored = plants
    .filter(p => p.indoor_growing?.suitable)
    .map(p => ({ p, score: scorePlant(p, answers) }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(s => s.p);
}
