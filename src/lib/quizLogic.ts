// === quizLogic — reine Helpers für PlantQuiz (v1.10.2) ===
// (Reine Logik-Helper für das Pflanzen-Quiz — testbar in Vitest ohne DOM.)

import type { Plant } from './types';

// === 1. TYPEN ===

/** Erlaubte Rundenlängen — fix definiert, kein freier int. */
export type RoundLength = 5 | 10 | 20;

/** Bewertungsstufe je nach % richtig. */
export type QuizGrade = 'pro' | 'very_good' | 'solid' | 'practice' | 'room';

/** Eine einzelne Quiz-Frage: korrekte Pflanze + 4 Optionen + Index der Richtigen. */
export interface QuizQuestion {
  plant: Plant;
  options: Plant[];
  correctIndex: number;
}

/** Statistik pro Rundenlänge. */
export interface LengthStats {
  best: number;
  rounds: number;
  total_correct: number;
  total_questions: number;
}

/** Persistent gespeicherte Stats — String-Keys für JSON-Kompatibilität. */
export type QuizStats = Partial<Record<'5' | '10' | '20', LengthStats>>;

// === 2. INTERNAL HELPER ===

/** Fisher-Yates Shuffle. Liefert neues Array, mutiert Input nicht. */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// === 3. gradeScore ===

/**
 * Wandelt einen Quiz-Score in eine Bewertungsstufe um.
 * Grenzen: 90 / 70 / 50 / 30 % → pro / very_good / solid / practice / room.
 * Bei total <= 0 → 'room' (defensive default).
 */
export function gradeScore(correct: number, total: number): QuizGrade {
  if (total <= 0) return 'room';
  const pct = (correct / total) * 100;
  if (pct >= 90) return 'pro';
  if (pct >= 70) return 'very_good';
  if (pct >= 50) return 'solid';
  if (pct >= 30) return 'practice';
  return 'room';
}

// === 4. pickQuestionsForRound ===

/**
 * Stellt eine Quiz-Runde zusammen: N Fragen, jede mit 1 korrekter Pflanze
 * + 3 Distraktoren, alle aus dem übergebenen Plant-Pool.
 *
 * Garantien:
 * - Keine doppelte korrekte Pflanze in der Runde (shuffle + slice).
 * - Jede Frage hat exakt 4 unique Optionen.
 * - correctIndex zeigt nach Position-Shuffle korrekt auf die Lösung.
 *
 * Voraussetzung: plants.length >= length + 3 (sonst nicht genug Distraktoren).
 */
export function pickQuestionsForRound(
  plants: readonly Plant[],
  length: RoundLength,
): QuizQuestion[] {
  // Shuffle einmal, nimm die ersten N als korrekte Pflanzen → keine Duplikate.
  const correctPlants = shuffle(plants).slice(0, length);

  return correctPlants.map(correct => {
    // Distraktoren: alle ausser der korrekten, davon 3 zufällige.
    const distractors = shuffle(plants.filter(p => p.slug !== correct.slug)).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    const correctIndex = options.findIndex(o => o.slug === correct.slug);
    return { plant: correct, options, correctIndex };
  });
}

// === 4b. Symptom-Quiz „Welche Pflanze hilft bei X?" ===

/** Build-time aufbereitete Symptom-Daten (aus quizCard.buildSymptomQuizData). */
export interface SymptomQ {
  id: string;
  emoji: string;
  name_de: string;
  name_en: string;
  /** Top-Pflanzen, die laut Daten zum Symptom passen (mögliche richtige Antwort). */
  correctSlugs: string[];
  /** ALLE Pflanzen mit Treffer > 0 — als Distraktoren ausgeschlossen. */
  matchSlugs: string[];
}

/** Eine Symptom-Frage: Symptom + 4 Pflanzen-Optionen (als Slugs) + Index der Richtigen. */
export interface SymptomQuestion {
  symptomId: string;
  emoji: string;
  name_de: string;
  name_en: string;
  optionSlugs: string[];
  correctIndex: number;
}

/**
 * Stellt eine Symptom-Quiz-Runde zusammen: bis zu `length` Fragen, jede mit
 * einem Symptom, einer korrekten passenden Pflanze und 3 Distraktoren, die
 * NICHT zu diesem Symptom passen (kein ambivalentes „auch richtig").
 *
 * - Keine doppelten Symptome pro Runde (shuffle + slice).
 * - Distraktoren werden aus Pflanzen ohne Treffer (slug ∉ matchSlugs) gezogen.
 * - Liefert ggf. weniger als `length` Fragen, wenn zu wenige Symptome da sind.
 */
export function pickSymptomQuestionsForRound(
  data: readonly SymptomQ[],
  allSlugs: readonly string[],
  length: RoundLength,
): SymptomQuestion[] {
  const chosen = shuffle(data).slice(0, length);

  return chosen.map(s => {
    const matchSet = new Set(s.matchSlugs);
    const correct = shuffle(s.correctSlugs)[0];
    const distractors = shuffle(allSlugs.filter(sl => !matchSet.has(sl))).slice(0, 3);
    const optionSlugs = shuffle([correct, ...distractors]);
    const correctIndex = optionSlugs.findIndex(o => o === correct);
    return {
      symptomId: s.id,
      emoji: s.emoji,
      name_de: s.name_de,
      name_en: s.name_en,
      optionSlugs,
      correctIndex,
    };
  });
}

// === 5. updateStats ===

/**
 * Aktualisiert die Quiz-Statistik nach einer abgeschlossenen Runde.
 * - rounds + 1
 * - total_correct + scoreInRound
 * - total_questions + length
 * - best = max(best, scoreInRound)
 * Liefert ein NEUES Objekt (Input bleibt unverändert).
 */
export function updateStats(
  stats: QuizStats,
  length: RoundLength,
  scoreInRound: number,
): QuizStats {
  const key = String(length) as '5' | '10' | '20';
  const current = stats[key] ?? { best: 0, rounds: 0, total_correct: 0, total_questions: 0 };
  const updated: LengthStats = {
    best: Math.max(current.best, scoreInRound),
    rounds: current.rounds + 1,
    total_correct: current.total_correct + scoreInRound,
    total_questions: current.total_questions + length,
  };
  return { ...stats, [key]: updated };
}
