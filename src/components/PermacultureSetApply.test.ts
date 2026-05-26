import { describe, it, expect } from 'vitest';
import { addSetToOverrides } from './PermacultureSetApply';
import type { PermacultureSet } from '@/lib/types';
import type { PlanOverrides } from '@/lib/userProfile';

// === 1. FIXTURE ===
const sampleSet: PermacultureSet = {
  id: 'sample',
  emoji: '🌿',
  name_de: 'Sample',
  name_en: 'Sample',
  description_de: '…',
  description_en: '…',
  plants: [
    { slug: 'solanum-lycopersicum', quantity: 3 },
    { slug: 'ocimum-basilicum', quantity: 4 },
  ],
  total_area_sqm: 2,
  difficulty: 1,
  function_tags: ['pest_repellent'],
  source: 'test',
};

const empty: PlanOverrides = { edits: {}, removed: [] };

// === 2. TESTS ===
describe('addSetToOverrides', () => {
  it('inserts all set plants into an empty overrides bag', () => {
    const next = addSetToOverrides(empty, sampleSet);
    expect(next.edits['solanum-lycopersicum']).toEqual({
      plant_slug: 'solanum-lycopersicum',
      quantity: 3,
    });
    expect(next.edits['ocimum-basilicum']).toEqual({
      plant_slug: 'ocimum-basilicum',
      quantity: 4,
    });
    expect(next.removed).toEqual([]);
  });

  it('keeps the higher quantity when a plant already exists', () => {
    const start: PlanOverrides = {
      edits: { 'solanum-lycopersicum': { plant_slug: 'solanum-lycopersicum', quantity: 10 } },
      removed: [],
    };
    const next = addSetToOverrides(start, sampleSet);
    expect(next.edits['solanum-lycopersicum'].quantity).toBe(10);
    expect(next.edits['ocimum-basilicum'].quantity).toBe(4);
  });

  it('restores a plant previously marked as removed', () => {
    const start: PlanOverrides = {
      edits: {},
      removed: ['ocimum-basilicum', 'other-plant'],
    };
    const next = addSetToOverrides(start, sampleSet);
    expect(next.edits['ocimum-basilicum'].quantity).toBe(4);
    expect(next.removed).toEqual(['other-plant']);
  });

  it('does not mutate the input overrides', () => {
    const start: PlanOverrides = {
      edits: { 'solanum-lycopersicum': { plant_slug: 'solanum-lycopersicum', quantity: 1 } },
      removed: ['ocimum-basilicum'],
    };
    const snapshot = JSON.parse(JSON.stringify(start));
    addSetToOverrides(start, sampleSet);
    expect(start).toEqual(snapshot);
  });
});
