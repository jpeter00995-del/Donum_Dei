// === Tests für quizLogic.ts (v1.10.2) ===
// (Tests für die reinen Quiz-Helper — keine React/DOM-Abhängigkeit.)

import { describe, it, expect } from 'vitest';
import {
  gradeScore,
  pickQuestionsForRound,
  updateStats,
  type QuizStats,
} from './quizLogic';
import type { Plant } from './types';

// === 1. TEST-FIXTURES ===

function makePlant(slug: string): Plant {
  return {
    slug,
    names: { de: slug, en: slug, latin: slug },
    family: { de: '', en: '', latin: '' },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: [],
    season: { active_months: [5], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: `${slug}.jpg`, alt: { de: '', en: '' }, license: 'PD', author: 'x', source_url: 'https://x' },
  };
}

/** 25 unterschiedliche Test-Pflanzen — genug für 20er-Runde ohne Duplikate. */
const TWENTY_FIVE = Array.from({ length: 25 }, (_, i) => makePlant(`plant-${i}`));

// === 2. gradeScore ===

describe('gradeScore — prozentbasierte Bewertungsstufen', () => {
  it('100% richtig → pro', () => {
    expect(gradeScore(10, 10)).toBe('pro');
  });

  it('exakt 90% → pro (Untergrenze pro)', () => {
    expect(gradeScore(9, 10)).toBe('pro');
  });

  it('89% → very_good (knapp unter pro)', () => {
    expect(gradeScore(89, 100)).toBe('very_good');
  });

  it('exakt 70% → very_good (Untergrenze very_good)', () => {
    expect(gradeScore(7, 10)).toBe('very_good');
  });

  it('exakt 50% → solid (Untergrenze solid)', () => {
    expect(gradeScore(5, 10)).toBe('solid');
  });

  it('exakt 30% → practice (Untergrenze practice)', () => {
    expect(gradeScore(3, 10)).toBe('practice');
  });

  it('29% → room (knapp unter practice)', () => {
    expect(gradeScore(29, 100)).toBe('room');
  });

  it('0% → room', () => {
    expect(gradeScore(0, 10)).toBe('room');
  });
});

// === 3. pickQuestionsForRound ===

describe('pickQuestionsForRound — Fragen-Auswahl ohne Duplikate', () => {
  it('liefert exakt N Fragen für Länge 5', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 5);
    expect(qs).toHaveLength(5);
  });

  it('liefert exakt N Fragen für Länge 10', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 10);
    expect(qs).toHaveLength(10);
  });

  it('liefert exakt N Fragen für Länge 20', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 20);
    expect(qs).toHaveLength(20);
  });

  it('keine doppelte korrekte Pflanze innerhalb einer Runde', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 20);
    expect(qs).toHaveLength(20);
    const slugs = qs.map(q => q.plant.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('jede Frage hat 4 unique Optionen (1 richtig + 3 distractors)', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 10);
    expect(qs).toHaveLength(10);
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      const optSlugs = q.options.map(o => o.slug);
      expect(new Set(optSlugs).size).toBe(4);
    }
  });

  it('correctIndex zeigt auf die korrekte Pflanze innerhalb options', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 10);
    expect(qs).toHaveLength(10);
    for (const q of qs) {
      expect(q.options[q.correctIndex].slug).toBe(q.plant.slug);
    }
  });

  it('alle Distraktoren stammen aus dem übergebenen Plant-Pool', () => {
    const qs = pickQuestionsForRound(TWENTY_FIVE, 10);
    expect(qs).toHaveLength(10);
    const allowedSlugs = new Set(TWENTY_FIVE.map(p => p.slug));
    for (const q of qs) {
      for (const opt of q.options) {
        expect(allowedSlugs.has(opt.slug)).toBe(true);
      }
    }
  });
});

// === 4. updateStats ===

describe('updateStats — kumulative Statistik pro Rundenlänge', () => {
  it('seedet leere Stats beim ersten Spiel mit best/rounds/totals', () => {
    const next = updateStats({}, 10, 7);
    expect(next['10']).toEqual({
      best: 7,
      rounds: 1,
      total_correct: 7,
      total_questions: 10,
    });
  });

  it('inkrementiert rounds + totals bei weiteren Runden gleicher Länge', () => {
    const seeded: QuizStats = {
      '10': { best: 7, rounds: 1, total_correct: 7, total_questions: 10 },
    };
    const next = updateStats(seeded, 10, 5);
    expect(next['10']).toEqual({
      best: 7, // nicht erhöht (5 < 7)
      rounds: 2,
      total_correct: 12,
      total_questions: 20,
    });
  });

  it('aktualisiert best NUR wenn scoreInRound höher ist', () => {
    const seeded: QuizStats = {
      '10': { best: 5, rounds: 3, total_correct: 12, total_questions: 30 },
    };
    const next = updateStats(seeded, 10, 8);
    expect(next['10']!.best).toBe(8);
  });

  it('lässt Stats für andere Längen unangetastet', () => {
    const seeded: QuizStats = {
      '5': { best: 4, rounds: 2, total_correct: 7, total_questions: 10 },
      '10': { best: 7, rounds: 1, total_correct: 7, total_questions: 10 },
    };
    const next = updateStats(seeded, 5, 3);
    expect(next['10']).toEqual(seeded['10']);
    expect(next['5']!.rounds).toBe(3);
  });

  it('mutiert input nicht (immutable update)', () => {
    const seeded: QuizStats = {
      '10': { best: 7, rounds: 1, total_correct: 7, total_questions: 10 },
    };
    const before = JSON.parse(JSON.stringify(seeded));
    const next = updateStats(seeded, 10, 9);
    // Eingabe unverändert
    expect(seeded).toEqual(before);
    // Output muss neues Objekt sein (sonst hätten wir nicht-detektierte Mutation)
    expect(next).not.toBe(seeded);
    expect(next['10']).not.toBe(seeded['10']);
  });
});
