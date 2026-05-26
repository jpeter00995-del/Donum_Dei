// Tests for companionSuggestions.generateSuggestions.
// (Tests für die Mischkultur-Vorschläge im Plan.)

import { describe, it, expect } from 'vitest';
import { generateSuggestions } from './companionSuggestions';
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

describe('companionSuggestions.generateSuggestions', () => {
  it('returns all good_partners deduplicated (up to global cap)', () => {
    const plants: Plant[] = [
      plant('tomato', {
        good_partners: ['basil', 'carrot', 'parsley', 'onion', 'lettuce'],
        bad_partners: [],
        source: 'Franck 1980',
      }),
      plant('basil'),
      plant('carrot'),
      plant('parsley'),
      plant('onion'),
      plant('lettuce'),
    ];
    const plan = [rec('tomato')];
    const suggestions = generateSuggestions(plan, plants);
    // All 5 good_partners (under globalCap=9). Deduplication doesn't apply since
    // only one source plant. Each suggestion has source_plant_slugs=['tomato'].
    expect(suggestions).toHaveLength(5);
    expect(suggestions.every(s => s.source_plant_slug === 'tomato')).toBe(true);
    expect(suggestions.every(s => s.source_plant_slugs.length === 1)).toBe(true);
    expect(suggestions.map(s => s.suggested_slug).sort()).toEqual(['basil', 'carrot', 'lettuce', 'onion', 'parsley']);
  });

  it('deduplicates: same suggested plant from multiple sources appears only once', () => {
    // Bug-Fix: Wenn 3 Plan-Pflanzen alle "Zwiebel" als good_partner haben,
    // soll Zwiebel nur 1× in der Liste sein (mit source_plant_slugs=[3 sources]).
    const plants: Plant[] = [
      plant('tomato', { good_partners: ['onion'], bad_partners: [], source: 's' }),
      plant('basil', { good_partners: ['onion'], bad_partners: [], source: 's' }),
      plant('carrot', { good_partners: ['onion'], bad_partners: [], source: 's' }),
      plant('onion'),
    ];
    const plan = [rec('tomato'), rec('basil'), rec('carrot')];
    const suggestions = generateSuggestions(plan, plants);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested_slug).toBe('onion');
    expect(suggestions[0].source_plant_slugs.sort()).toEqual(['basil', 'carrot', 'tomato']);
  });

  it('excludes plants that are already in the plan', () => {
    const plants: Plant[] = [
      plant('tomato', {
        good_partners: ['basil', 'carrot', 'parsley'],
        bad_partners: [],
        source: 's',
      }),
      plant('basil'),
      plant('carrot'),
      plant('parsley'),
    ];
    const plan = [rec('tomato'), rec('basil'), rec('carrot')];
    const suggestions = generateSuggestions(plan, plants);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested_slug).toBe('parsley');
  });

  it('returns empty when no plant in plan has companion_planting', () => {
    const plants: Plant[] = [plant('a'), plant('b')];
    const plan = [rec('a'), rec('b')];
    expect(generateSuggestions(plan, plants)).toEqual([]);
  });

  it('skips suggested slugs that do not exist in the plant database', () => {
    const plants: Plant[] = [
      plant('tomato', {
        good_partners: ['ghost-plant', 'basil'],
        bad_partners: [],
        source: 's',
      }),
      plant('basil'),
    ];
    const plan = [rec('tomato')];
    const suggestions = generateSuggestions(plan, plants);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggested_slug).toBe('basil');
  });

  it('respects a custom max parameter and the global cap of 3 × max', () => {
    // 4 Quell-Pflanzen, jede schlägt 4 verschiedene Pflanzen vor → 16 candidates.
    // Mit max=2 erwartet: max 6 (3 × 2).
    const plants: Plant[] = [
      plant('s1', { good_partners: ['p1', 'p2', 'p3', 'p4'], bad_partners: [], source: 's' }),
      plant('s2', { good_partners: ['p5', 'p6', 'p7', 'p8'], bad_partners: [], source: 's' }),
      plant('s3', { good_partners: ['p9', 'p10', 'p11', 'p12'], bad_partners: [], source: 's' }),
      plant('s4', { good_partners: ['p13', 'p14', 'p15', 'p16'], bad_partners: [], source: 's' }),
      ...['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14','p15','p16'].map(s => plant(s)),
    ];
    const plan = [rec('s1'), rec('s2'), rec('s3'), rec('s4')];
    const suggestions = generateSuggestions(plan, plants, 2);
    expect(suggestions).toHaveLength(6); // 3 × 2 = 6
  });

  it('on overflow, ranks candidates by number of recommending source plants', () => {
    // 'popular' wird von s1+s2 empfohlen → höher gerankt als single-source-Vorschläge.
    const plants: Plant[] = [
      plant('s1', { good_partners: ['popular', 's1only_a', 's1only_b'], bad_partners: [], source: 's' }),
      plant('s2', { good_partners: ['popular', 's2only_a'], bad_partners: [], source: 's' }),
      plant('s3', { good_partners: ['s3only_a'], bad_partners: [], source: 's' }),
      plant('s4', { good_partners: ['s4only_a'], bad_partners: [], source: 's' }),
      plant('popular'),
      plant('s1only_a'), plant('s1only_b'),
      plant('s2only_a'),
      plant('s3only_a'),
      plant('s4only_a'),
    ];
    const plan = [rec('s1'), rec('s2'), rec('s3'), rec('s4')];
    // max=1 → globalCap=3. Aggregiert: popular(2 sources), 5 weitere single-source.
    // Top-3: popular, dann 2 alphabetisch (s1only_a, s1only_b).
    const suggestions = generateSuggestions(plan, plants, 1);
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].suggested_slug).toBe('popular');
    expect(suggestions[0].source_plant_slugs.sort()).toEqual(['s1', 's2']);
    // popular ist nur 1× drin (dedupliziert), mit source_plant_slugs.length=2.
    const popularCount = suggestions.filter(s => s.suggested_slug === 'popular').length;
    expect(popularCount).toBe(1);
  });
});
