// === 1. IMPORTS ===
import { describe, it, expect } from 'vitest';
import {
  findPlantsForSymptom,
  suggestSymptoms,
  getAllSymptoms,
  getSymptomById,
  getSymptomDisclaimer,
} from './symptomSearch';
import { loadAllPlants } from './loadPlants';
import type { Plant } from './types';

// === 2. FIXTURES (synthetic mini-plants for focused unit tests) ===

function makePlant(overrides: Partial<Plant> & { slug: string; latin: string }): Plant {
  const base: Plant = {
    slug: overrides.slug,
    names: { de: overrides.slug, en: overrides.slug, latin: overrides.latin },
    family: { de: 'X', en: 'X', latin: 'X' },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: [],
    season: { active_months: [1], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: 'x.jpg', alt: { de: 'x', en: 'x' }, license: 'CC0', author: 'x', source_url: '' },
  };
  return { ...base, ...overrides };
}

const plantRespiratory = makePlant({
  slug: 'plant-resp',
  latin: 'Aaa respiratoria',
  uses: [
    {
      form: 'tea',
      target: ['respiratory', 'fever'],
      internal_external: 'internal',
      description: { de: 'Hilft bei Erkältung und Husten', en: 'Used for colds' },
      source_ids: ['src_1'],
    },
  ],
  teaser: { de: 'Klassische Erkältungs-Pflanze.', en: 'Classic cold remedy.' },
});

const plantSleep = makePlant({
  slug: 'plant-sleep',
  latin: 'Bbb sopora',
  uses: [
    {
      form: 'tea',
      target: ['sleep', 'nerves'],
      internal_external: 'internal',
      description: { de: 'Beruhigt und fördert Schlaf', en: 'Promotes sleep' },
      source_ids: ['src_1'],
    },
  ],
  teaser: { de: 'Sanfter Schlummertee.', en: 'Gentle sleep tea.' },
});

const plantSkin = makePlant({
  slug: 'plant-skin',
  latin: 'Ccc cutanea',
  uses: [
    {
      form: 'salve',
      target: ['skin', 'wound'],
      internal_external: 'external',
      description: { de: 'Bei kleinen Wunden und Hautausschlag', en: 'For minor wounds and rashes' },
      source_ids: ['src_1'],
    },
  ],
  teaser: { de: 'Wundsalbe.', en: 'Wound salve.' },
});

const plantUnrelated = makePlant({
  slug: 'plant-other',
  latin: 'Ddd irrelevans',
  uses: [
    {
      form: 'raw',
      target: ['nutrition'],
      internal_external: 'internal',
      description: { de: 'Nahrhaft', en: 'Nutritious' },
      source_ids: ['src_1'],
    },
  ],
});

const fixturePlants: Plant[] = [plantRespiratory, plantSleep, plantSkin, plantUnrelated];

// === 3. TESTS — getAllSymptoms / getSymptomById / getSymptomDisclaimer ===

describe('symptom catalogue', () => {
  it('getAllSymptoms returns the full list (20 entries)', () => {
    const all = getAllSymptoms();
    expect(all.length).toBe(20);
    expect(all[0]).toHaveProperty('id');
    expect(all[0]).toHaveProperty('emoji');
    expect(all[0]).toHaveProperty('name_de');
    expect(all[0]).toHaveProperty('name_en');
  });

  it('getSymptomById returns the right entry and null for unknown', () => {
    expect(getSymptomById('erkaeltung')?.name_de).toBe('Erkältung');
    expect(getSymptomById('does-not-exist')).toBeNull();
  });

  it('getSymptomDisclaimer returns localised disclaimer text', () => {
    expect(getSymptomDisclaimer('de')).toMatch(/medizinische Beratung/i);
    expect(getSymptomDisclaimer('en')).toMatch(/medical advice/i);
  });
});

// === 4. TESTS — findPlantsForSymptom (synthetic fixtures) ===

describe('findPlantsForSymptom — synthetic fixtures', () => {
  it('returns plants with respiratory target for "erkaeltung"', () => {
    const results = findPlantsForSymptom('erkaeltung', fixturePlants);
    const slugs = results.map((r) => r.plant.slug);
    expect(slugs).toContain('plant-resp');
    expect(slugs).not.toContain('plant-other');
    expect(results[0].score).toBeGreaterThanOrEqual(30);
  });

  it('prefers sleep/nerve plants for "schlaf"', () => {
    const results = findPlantsForSymptom('schlaf', fixturePlants);
    expect(results[0].plant.slug).toBe('plant-sleep');
  });

  it('returns empty for unknown symptom id', () => {
    const results = findPlantsForSymptom('unknown_symptom', fixturePlants);
    expect(results).toEqual([]);
  });

  it('returns empty when no plant matches', () => {
    const results = findPlantsForSymptom('erkaeltung', [plantUnrelated]);
    expect(results).toEqual([]);
  });

  it('respects the maxResults cap', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      makePlant({
        slug: `r-${i}`,
        latin: `Resp ${String(i).padStart(2, '0')}`,
        uses: [
          {
            form: 'tea',
            target: ['respiratory'],
            internal_external: 'internal',
            description: { de: '', en: '' },
            source_ids: ['src_1'],
          },
        ],
      })
    );
    const results = findPlantsForSymptom('erkaeltung', many, 3);
    expect(results.length).toBe(3);
  });

  it('matches wound-related plants for "wunden"', () => {
    const results = findPlantsForSymptom('wunden', fixturePlants);
    const slugs = results.map((r) => r.plant.slug);
    expect(slugs).toContain('plant-skin');
  });

  it('caps score at 100', () => {
    const results = findPlantsForSymptom('erkaeltung', [plantRespiratory]);
    expect(results[0].score).toBeLessThanOrEqual(100);
  });
});

// === 5. TESTS — findPlantsForSymptom against real plant DB ===

describe('findPlantsForSymptom — real plant database', () => {
  const allPlants = loadAllPlants();

  it('returns at least 5 plants for "erkaeltung"', () => {
    const results = findPlantsForSymptom('erkaeltung', allPlants);
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it('returns at least 5 plants for "verdauung"', () => {
    const results = findPlantsForSymptom('verdauung', allPlants);
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it('returns at least 3 plants for "schlaf"', () => {
    const results = findPlantsForSymptom('schlaf', allPlants);
    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});

// === 6. TESTS — suggestSymptoms ===

describe('suggestSymptoms', () => {
  it('returns Kopfschmerzen as top match for "kopfschmerzen"', () => {
    const results = suggestSymptoms('kopfschmerzen');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symptom.id).toBe('kopfschmerzen');
  });

  it('returns Husten as top match for "husten"', () => {
    const results = suggestSymptoms('husten');
    expect(results[0].symptom.id).toBe('husten');
  });

  it('returns empty array for nonsense query', () => {
    expect(suggestSymptoms('xyzqwer')).toEqual([]);
  });

  it('returns empty for empty / whitespace input', () => {
    expect(suggestSymptoms('')).toEqual([]);
    expect(suggestSymptoms('   ')).toEqual([]);
  });

  it('matches English keywords too', () => {
    const results = suggestSymptoms('cough');
    expect(results[0].symptom.id).toBe('husten');
  });

  it('returns at most 3 suggestions', () => {
    const results = suggestSymptoms('e'); // very broad query
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('matches partial input like "kopf"', () => {
    const results = suggestSymptoms('kopf');
    expect(results[0].symptom.id).toBe('kopfschmerzen');
  });
});
