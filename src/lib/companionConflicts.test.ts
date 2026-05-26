// Tests for companionConflicts.detectConflicts.
// (Tests für die Konflikt-Erkennung im Garten-Plan.)

import { describe, it, expect } from 'vitest';
import { detectConflicts } from './companionConflicts';
import type { Plant, CompanionPlanting } from './types';
import type { RecommendedPlant } from './gardenPlan';

// === Test fixtures ===

function rec(slug: string): RecommendedPlant {
  return {
    plant_slug: slug,
    quantity: 1,
    sowing_method: 'outdoor_direct',
    score: 0.5,
    notes_de: '',
    notes_en: '',
  };
}

function plant(slug: string, cp?: CompanionPlanting): Plant {
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
    image: { filename: 'a.jpg', alt: { de: '', en: '' }, license: 'PD', author: 'x', source_url: 'https://x' },
    companion_planting: cp,
  };
}

describe('companionConflicts.detectConflicts', () => {
  it('returns empty array for a compatible plan (no bad_partners overlap)', () => {
    const plants: Plant[] = [
      plant('a', { good_partners: ['b'], bad_partners: [], source: 'src' }),
      plant('b', { good_partners: ['a'], bad_partners: [], source: 'src' }),
    ];
    const plan = [rec('a'), rec('b')];
    expect(detectConflicts(plan, plants)).toEqual([]);
  });

  it('finds the dill–fennel conflict bidirectionally and reports each pair only once', () => {
    const plants: Plant[] = [
      plant('anethum-graveolens', {
        good_partners: [],
        bad_partners: ['foeniculum-vulgare'],
        source: 'Franck 1980',
      }),
      plant('foeniculum-vulgare', {
        good_partners: [],
        bad_partners: ['anethum-graveolens'],
        source: 'Franck 1980',
      }),
    ];
    const plan = [rec('anethum-graveolens'), rec('foeniculum-vulgare')];
    const conflicts = detectConflicts(plan, plants);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].plant_a).toBe('anethum-graveolens');
    expect(conflicts[0].plant_b).toBe('foeniculum-vulgare');
    expect(conflicts[0].source).toContain('Franck');
  });

  it('still detects a conflict when only one side declares it (unidirectional bad_partners)', () => {
    const plants: Plant[] = [
      plant('foeniculum-vulgare', {
        good_partners: [],
        bad_partners: ['tropaeolum-majus'],
        source: 'Franck 1980',
      }),
      plant('tropaeolum-majus', undefined), // missing companion_planting entirely
    ];
    const plan = [rec('foeniculum-vulgare'), rec('tropaeolum-majus')];
    const conflicts = detectConflicts(plan, plants);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].plant_a).toBe('foeniculum-vulgare');
    expect(conflicts[0].plant_b).toBe('tropaeolum-majus');
  });

  it('handles plants without companion_planting gracefully — no errors, no false positives', () => {
    const plants: Plant[] = [plant('a'), plant('b')];
    const plan = [rec('a'), rec('b')];
    expect(detectConflicts(plan, plants)).toEqual([]);
  });

  it('ignores bad_partners that are not in the current plan', () => {
    const plants: Plant[] = [
      plant('a', { good_partners: [], bad_partners: ['c'], source: 's' }),
      plant('b'),
    ];
    const plan = [rec('a'), rec('b')];
    expect(detectConflicts(plan, plants)).toEqual([]);
  });

  it('matches the realistic 3-plant scenario with multiple conflicts', () => {
    const plants: Plant[] = [
      plant('anethum-graveolens', {
        good_partners: [],
        bad_partners: ['foeniculum-vulgare', 'coriandrum-sativum'],
        source: 'Franck 1980',
      }),
      plant('foeniculum-vulgare', {
        good_partners: [],
        bad_partners: ['anethum-graveolens'],
        source: 'Franck 1980',
      }),
      plant('coriandrum-sativum', {
        good_partners: [],
        bad_partners: [],
        source: 'x',
      }),
    ];
    const plan = [rec('anethum-graveolens'), rec('foeniculum-vulgare'), rec('coriandrum-sativum')];
    const conflicts = detectConflicts(plan, plants);
    expect(conflicts).toHaveLength(2);
    // Sortierung: anethum-graveolens|coriandrum-sativum, anethum-graveolens|foeniculum-vulgare.
    expect(conflicts[0]).toMatchObject({ plant_a: 'anethum-graveolens', plant_b: 'coriandrum-sativum' });
    expect(conflicts[1]).toMatchObject({ plant_a: 'anethum-graveolens', plant_b: 'foeniculum-vulgare' });
  });
});
