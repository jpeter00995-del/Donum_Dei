// === Toxicity helper tests — Welle M.3 ===

import { describe, it, expect } from 'vitest';
import type { Plant } from './types';
import {
  getToxicityLevel,
  isPetToxic,
  shouldShowSafetyBadge,
  toxicityRank,
} from './toxicity';

// === 1. TEST-FIXTURES ===

function makePlant(safety: Partial<Plant['safety']> = {}): Plant {
  return {
    slug: 'test',
    names: { de: 'Test', en: 'Test', latin: 'Testus testus' },
    family: { de: 'F', en: 'F', latin: 'F' },
    description: { de: 'd', en: 'd' },
    teaser: { de: 't', en: 't' },
    uses: [],
    season: { active_months: [1], harvest_part: { de: 'L', en: 'L' } },
    safety: {
      warnings: { de: '', en: '' },
      external_only: false,
      ...safety,
    },
    classical_quotes: [],
    sources: [],
    image: { filename: 'x.jpg', alt: { de: 'a', en: 'a' }, license: 'CC', author: 'A', source_url: '' },
  };
}

// === 2. getToxicityLevel ===

describe('getToxicityLevel', () => {
  it('returns the explicit level when present', () => {
    expect(getToxicityLevel(makePlant({ toxicity_level: 'toxic' }))).toBe('toxic');
    expect(getToxicityLevel(makePlant({ toxicity_level: 'caution' }))).toBe('caution');
    expect(getToxicityLevel(makePlant({ toxicity_level: 'none' }))).toBe('none');
  });

  it('defaults to "none" when the field is missing (back-compat)', () => {
    expect(getToxicityLevel(makePlant({}))).toBe('none');
  });
});

// === 3. isPetToxic ===

describe('isPetToxic', () => {
  it('returns true only when pet_toxic === true', () => {
    expect(isPetToxic(makePlant({ pet_toxic: true }))).toBe(true);
    expect(isPetToxic(makePlant({ pet_toxic: false }))).toBe(false);
    expect(isPetToxic(makePlant({}))).toBe(false);
  });
});

// === 4. shouldShowSafetyBadge ===

describe('shouldShowSafetyBadge', () => {
  it('is false for harmless plants', () => {
    expect(shouldShowSafetyBadge(makePlant({ toxicity_level: 'none', pet_toxic: false }))).toBe(false);
    expect(shouldShowSafetyBadge(makePlant({}))).toBe(false);
  });

  it('is true when toxicity_level is caution or toxic', () => {
    expect(shouldShowSafetyBadge(makePlant({ toxicity_level: 'caution' }))).toBe(true);
    expect(shouldShowSafetyBadge(makePlant({ toxicity_level: 'toxic' }))).toBe(true);
  });

  it('is true when pet_toxic even if level is none (e.g. pet-only risk)', () => {
    expect(shouldShowSafetyBadge(makePlant({ toxicity_level: 'none', pet_toxic: true }))).toBe(true);
  });
});

// === 5. toxicityRank ===

describe('toxicityRank', () => {
  it('orders toxic > caution > none', () => {
    expect(toxicityRank('toxic')).toBeGreaterThan(toxicityRank('caution'));
    expect(toxicityRank('caution')).toBeGreaterThan(toxicityRank('none'));
  });
});
