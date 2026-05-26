import { describe, it, expect } from 'vitest';
import { matchPlants } from './quizMatch';
import type { Plant } from './types';

// === 1. TEST FIXTURES ===

const baseIndoor = {
  suitable: true,
  purpose: ['edible'] as const,
  pet_safe: true,
};

function fakePlant(slug: string, rooms: any[], light: any, water: any, difficulty: 1|2|3): Plant {
  return {
    slug, names: { de: slug, en: slug, latin: slug }, family: { de: '', en: '', latin: '' },
    description: { de: '', en: '' }, teaser: { de: '', en: '' },
    uses: [{ form: 'tea', target: [], internal_external: 'internal', description: { de:'', en:'' }, source_ids: ['s1'] }],
    season: { active_months: [1], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de:'', en:'' }, external_only: false },
    classical_quotes: [], sources: [{ id: 's1', type: 'wikipedia', title: '', url: '', accessed: '' }],
    image: { filename: '', alt: { de:'', en:'' }, license: '', author: '', source_url: '' },
    indoor_growing: { ...baseIndoor, rooms, light, water_frequency: water, difficulty } as any,
  } as Plant;
}

// === 2. TESTS ===

describe('matchPlants', () => {
  it('scores room match higher than light match', () => {
    const inRoom = fakePlant('a', ['kitchen'], 'low_light', 'sparse', 3);
    const light = fakePlant('b', ['bedroom'], 'bright_indirect', 'sparse', 3);
    const result = matchPlants([inRoom, light], { room: 'kitchen', light: 'hell', water: 'normal' });
    expect(result[0].slug).toBe('a');
  });

  it('prefers easier plants when other scores tie', () => {
    const easy = fakePlant('easy', ['kitchen'], 'bright_indirect', 'weekly', 1);
    const hard = fakePlant('hard', ['kitchen'], 'bright_indirect', 'weekly', 3);
    const result = matchPlants([easy, hard], { room: 'kitchen', light: 'hell', water: 'normal' });
    expect(result[0].slug).toBe('easy');
  });

  it('returns top-5 by score', () => {
    const plants = Array.from({ length: 10 }, (_, i) => fakePlant(`p${i}`, ['kitchen'], 'bright_indirect', 'weekly', 1));
    const result = matchPlants(plants, { room: 'kitchen', light: 'hell', water: 'normal' });
    expect(result.length).toBe(5);
  });

  it('returns at least top-3 when no perfect match', () => {
    const plants = Array.from({ length: 5 }, (_, i) => fakePlant(`p${i}`, ['bedroom'], 'low_light', 'sparse', 2));
    const result = matchPlants(plants, { room: 'kitchen', light: 'sonnig', water: 'pingelig' });
    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});
