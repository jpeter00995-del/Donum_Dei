import { describe, it, expect } from 'vitest';
import { getRelatedByFamily } from './relatedPlants';
import type { Plant } from './types';

const mk = (slug: string, latin: string, family: string) =>
  ({
    slug,
    names: { de: slug, en: slug, latin },
    family: { de: family, en: family, latin: family },
  } as unknown as Plant);

const lavender = mk('lavender', 'Lavandula angustifolia', 'Lamiaceae');
const mint = mk('mint', 'Mentha piperita', 'Lamiaceae');
const sage = mk('sage', 'Salvia officinalis', 'Lamiaceae');
const chamomile = mk('chamomile', 'Matricaria chamomilla', 'Asteraceae');

const all = [lavender, mint, sage, chamomile];

describe('getRelatedByFamily', () => {
  it('returns other plants from the same family', () => {
    const result = getRelatedByFamily(lavender, all);
    expect(result.map(p => p.slug)).toEqual(['mint', 'sage']);
  });

  it('excludes the plant itself', () => {
    const result = getRelatedByFamily(lavender, all);
    expect(result.map(p => p.slug)).not.toContain('lavender');
  });

  it('excludes plants from other families', () => {
    const result = getRelatedByFamily(lavender, all);
    expect(result.map(p => p.slug)).not.toContain('chamomile');
  });

  it('sorts alphabetically by latin name', () => {
    const result = getRelatedByFamily(mint, all);
    expect(result.map(p => p.names.latin)).toEqual([
      'Lavandula angustifolia',
      'Salvia officinalis',
    ]);
  });

  it('respects the limit', () => {
    const result = getRelatedByFamily(lavender, all, 1);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no relatives exist', () => {
    expect(getRelatedByFamily(chamomile, all)).toEqual([]);
  });
});
