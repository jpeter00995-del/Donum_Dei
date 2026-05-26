import { describe, it, expect } from 'vitest';
import { filterPlants } from './filterPlants';
import type { Plant } from './types';

const teaSummerPlant = {
  slug: 'a', names: { de:'A',en:'A',latin:'A' },
  uses: [{ form: 'tea' }],
  season: { active_months: [7] },
} as unknown as Plant;

const tinctureWinterPlant = {
  slug: 'b', names: { de:'B',en:'B',latin:'B' },
  uses: [{ form: 'tincture' }],
  season: { active_months: [1] },
} as unknown as Plant;

const teaSalveSpringPlant = {
  slug: 'c', names: { de:'C',en:'C',latin:'C' },
  uses: [{ form: 'tea' }, { form: 'salve' }],
  season: { active_months: [4] },
} as unknown as Plant;

const all = [teaSummerPlant, tinctureWinterPlant, teaSalveSpringPlant];

describe('filterPlants', () => {
  it('returns all when no filters active', () => {
    expect(filterPlants(all, { forms: [], seasons: [] })).toEqual(all);
  });
  it('filters by single form (OR within group)', () => {
    const result = filterPlants(all, { forms: ['tea'], seasons: [] });
    expect(result).toEqual([teaSummerPlant, teaSalveSpringPlant]);
  });
  it('filters by multi forms (OR within group)', () => {
    const result = filterPlants(all, { forms: ['tincture', 'salve'], seasons: [] });
    expect(result).toEqual([tinctureWinterPlant, teaSalveSpringPlant]);
  });
  it('filters by single season', () => {
    const result = filterPlants(all, { forms: [], seasons: ['summer'] });
    expect(result).toEqual([teaSummerPlant]);
  });
  it('combines form AND season (AND across groups)', () => {
    const result = filterPlants(all, { forms: ['tea'], seasons: ['spring'] });
    expect(result).toEqual([teaSalveSpringPlant]);
  });
  it('returns empty when no match', () => {
    const result = filterPlants(all, { forms: ['bath'], seasons: [] });
    expect(result).toEqual([]);
  });
});
