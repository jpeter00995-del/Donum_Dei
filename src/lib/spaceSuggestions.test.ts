// Tests for spaceSuggestions.generateSpaceSuggestions.
// (Tests für den lebendigen Garten-Designer.)

import { describe, it, expect } from 'vitest';
import { generateSpaceSuggestions } from './spaceSuggestions';
import type { Plant, GardenMeta, PermacultureFunction, CompanionPlanting } from './types';
import type { RecommendedPlant } from './gardenPlan';
import type { UserProfile } from './userProfile';

// === Fixtures ===

const DEFAULT_ZONE = '7b';
const DEFAULT_TYPE = 'raised_bed';

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    schema_version: 1,
    created_at: '2026-05-18T00:00:00Z',
    zone: DEFAULT_ZONE,
    garden: { type: DEFAULT_TYPE, area_sqm: 8 },
    household_size: 3,
    self_sufficiency_goal: 'half',
    experience: 'beginner',
    ...overrides,
  };
}

function gm(overrides: Partial<GardenMeta> = {}): GardenMeta {
  return {
    climate_zones: [DEFAULT_ZONE],
    sowing_window: { outdoor_direct: { start_month: 4, end_month: 6 } },
    harvest_window: { start_month: 7, end_month: 9 },
    days_to_harvest: 90,
    spacing_cm: 30,
    garden_type: [DEFAULT_TYPE],
    difficulty: 1,
    ...overrides,
  };
}

function plant(
  slug: string,
  options: {
    gardenMeta?: Partial<GardenMeta> | null;
    companion?: CompanionPlanting;
    permaculture?: PermacultureFunction[];
    familyLatin?: string;
    nameDe?: string;
    nameEn?: string;
  } = {},
): Plant {
  return {
    slug,
    names: {
      de: options.nameDe ?? slug,
      en: options.nameEn ?? slug,
      latin: slug,
    },
    family: {
      de: '',
      en: '',
      latin: options.familyLatin ?? '',
    },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: [],
    season: { active_months: [5], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: 'x.jpg', alt: { de: '', en: '' }, license: 'PD', author: 'x', source_url: 'https://x' },
    garden_meta: options.gardenMeta === null ? undefined : gm(options.gardenMeta ?? {}),
    companion_planting: options.companion,
    permaculture_functions: options.permaculture,
  };
}

function rec(slug: string, quantity: number): RecommendedPlant {
  return {
    plant_slug: slug,
    quantity,
    sowing_method: 'outdoor_direct',
    score: 0.5,
    notes_de: '',
    notes_en: '',
  };
}

// === Tests ===

describe('generateSpaceSuggestions', () => {
  it('returns suggestions for an empty plan with plenty of free space', () => {
    const plants: Plant[] = [
      plant('tomate', { nameDe: 'Tomate', nameEn: 'Tomato', familyLatin: 'Solanaceae' }),
      plant('basilikum', { nameDe: 'Basilikum', nameEn: 'Basil', familyLatin: 'Lamiaceae' }),
      plant('salat', { nameDe: 'Salat', nameEn: 'Lettuce', familyLatin: 'Asteraceae', gardenMeta: { spacing_cm: 20 } }),
    ];
    const out = generateSpaceSuggestions({ plan: [], plants, profile: profile() });
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(5);
    // Alle Kandidaten haben suggested_quantity ≥ 1 und passen in den Garten.
    for (const s of out) {
      expect(s.suggested_quantity).toBeGreaterThanOrEqual(1);
      expect(s.estimated_area_sqm).toBeGreaterThan(0);
    }
  });

  it('returns an empty array when the plan already fills 95%+ of the area', () => {
    // 8 m² Garten, 1 m² pro Pflanze (100 cm² spacing) → 7 Pflanzen ≈ 7 m² ≈ 87% → kein "voll".
    // Wir wollen ≥ 7.7 m² belegt → 9 Pflanzen × 1 m² macht 9 m² → free = −1 → MIN_FREE_AREA_SQM nicht erreicht.
    const tomato = plant('tomate', { gardenMeta: { spacing_cm: 100 } }); // 1 m² pro Pflanze
    const other = plant('basilikum');
    const plants: Plant[] = [tomato, other];
    // 8 Tomaten × 1 m² = 8 m² → free = 0
    const planFull: RecommendedPlant[] = [rec('tomate', 8)];
    expect(generateSpaceSuggestions({ plan: planFull, plants, profile: profile() })).toEqual([]);
  });

  it('returns an empty array when the plan overflows the garden area', () => {
    const big = plant('tomate', { gardenMeta: { spacing_cm: 100 } });
    const plants: Plant[] = [big, plant('basilikum')];
    // 12 Tomaten × 1 m² = 12 m² → overflow (8 m² Garten).
    const planOverflow: RecommendedPlant[] = [rec('tomate', 12)];
    expect(generateSpaceSuggestions({ plan: planOverflow, plants, profile: profile() })).toEqual([]);
  });

  it('excludes a candidate that is bad_partner of any plant in the plan', () => {
    const plants: Plant[] = [
      plant('tomate', {
        companion: { good_partners: [], bad_partners: ['fenchel'], source: 's' },
      }),
      plant('fenchel', { nameDe: 'Fenchel', nameEn: 'Fennel' }),
      plant('basilikum', { nameDe: 'Basilikum', nameEn: 'Basil' }),
    ];
    const plan: RecommendedPlant[] = [rec('tomate', 1)];
    const out = generateSpaceSuggestions({ plan, plants, profile: profile() });
    const slugs = out.map(s => s.plant_slug);
    expect(slugs).not.toContain('fenchel');
    expect(slugs).toContain('basilikum');
  });

  it('boosts the score of candidates that are good_partner of a plan plant', () => {
    const plants: Plant[] = [
      plant('tomate', {
        nameDe: 'Tomate',
        nameEn: 'Tomato',
        companion: { good_partners: ['basilikum'], bad_partners: [], source: 's' },
      }),
      plant('basilikum', { nameDe: 'Basilikum', nameEn: 'Basil', familyLatin: 'Lamiaceae' }),
      // Karotte ist Vergleichskandidat ohne Companion-Beziehung.
      plant('karotte', { nameDe: 'Karotte', nameEn: 'Carrot', familyLatin: 'Apiaceae', gardenMeta: { spacing_cm: 10 } }),
    ];
    const plan: RecommendedPlant[] = [rec('tomate', 1)];
    const out = generateSpaceSuggestions({ plan, plants, profile: profile() });
    const basil = out.find(s => s.plant_slug === 'basilikum');
    const carrot = out.find(s => s.plant_slug === 'karotte');
    expect(basil).toBeDefined();
    expect(carrot).toBeDefined();
    expect(basil!.companion_boost).toBe(true);
    expect(basil!.score).toBeGreaterThan(carrot!.score);
    // Reasons sollten den Partner-Namen enthalten.
    expect(basil!.reasons_de.some(r => r.includes('Tomate'))).toBe(true);
    expect(basil!.reasons_en.some(r => r.includes('Tomato'))).toBe(true);
  });

  it('skips a plant when even one specimen would not fit the remaining space', () => {
    // 8 m² Garten. 7.8 m² werden von Tomaten belegt → free = 0.2 → < MIN_FREE_AREA_SQM (0.3)
    // → komplette Suggestion-Liste leer.
    const tomato = plant('tomate', { gardenMeta: { spacing_cm: 100 } });
    const huge = plant('mais', { gardenMeta: { spacing_cm: 120 } }); // 1.44 m² pro Pflanze
    const plants: Plant[] = [tomato, huge];
    const plan: RecommendedPlant[] = [rec('tomate', 8)];
    expect(generateSpaceSuggestions({ plan, plants, profile: profile() })).toEqual([]);

    // Anderer Case: leichter Restplatz, aber Riesen-Pflanze passt nicht.
    // 8 m² Garten, 7 Tomaten × 1 m² = 7 m² belegt, free = 1 m². "mais" braucht 1.44 m² → skip.
    // "salat" mit 20 cm spacing braucht 0.04 m² → passt rein.
    const small = plant('salat', { gardenMeta: { spacing_cm: 20 } });
    const plants2: Plant[] = [tomato, huge, small];
    const plan2: RecommendedPlant[] = [rec('tomate', 7)];
    const out = generateSpaceSuggestions({ plan: plan2, plants: plants2, profile: profile() });
    const slugs = out.map(s => s.plant_slug);
    expect(slugs).not.toContain('mais');
    expect(slugs).toContain('salat');
  });

  it('sorts suggestions by score descending (companion boost wins over plain candidate)', () => {
    const plants: Plant[] = [
      plant('tomate', {
        companion: { good_partners: ['basilikum'], bad_partners: [], source: 's' },
      }),
      plant('basilikum', { nameDe: 'Basilikum', nameEn: 'Basil', familyLatin: 'Lamiaceae' }),
      plant('salat', { nameDe: 'Salat', nameEn: 'Lettuce', familyLatin: 'Asteraceae', gardenMeta: { spacing_cm: 20 } }),
      plant('karotte', { nameDe: 'Karotte', nameEn: 'Carrot', familyLatin: 'Apiaceae', gardenMeta: { spacing_cm: 10 } }),
    ];
    const plan: RecommendedPlant[] = [rec('tomate', 1)];
    const out = generateSpaceSuggestions({ plan, plants, profile: profile() });
    // Erster Treffer = Basilikum (companion boost).
    expect(out[0].plant_slug).toBe('basilikum');
    // Scores monoton fallend.
    for (let i = 1; i < out.length; i++) {
      expect(out[i].score).toBeLessThanOrEqual(out[i - 1].score);
    }
  });

  it('respects maxSuggestions and hard-caps at 8', () => {
    const list: Plant[] = [];
    for (let i = 0; i < 15; i++) {
      list.push(plant(`plant_${String.fromCharCode(97 + i)}`, { gardenMeta: { spacing_cm: 15 } }));
    }
    const allDefault = generateSpaceSuggestions({ plan: [], plants: list, profile: profile() });
    expect(allDefault.length).toBeLessThanOrEqual(5);

    const three = generateSpaceSuggestions({ plan: [], plants: list, profile: profile(), maxSuggestions: 3 });
    expect(three).toHaveLength(3);

    const hardCap = generateSpaceSuggestions({ plan: [], plants: list, profile: profile(), maxSuggestions: 50 });
    expect(hardCap.length).toBeLessThanOrEqual(8);
  });

  it('filters by climate zone unless profile zone is empty', () => {
    const plants: Plant[] = [
      plant('zoneonly_7b', { gardenMeta: { climate_zones: ['7b'] } }),
      plant('zoneonly_5a', { gardenMeta: { climate_zones: ['5a'] } }),
    ];
    const out7b = generateSpaceSuggestions({ plan: [], plants, profile: profile({ zone: '7b' }) });
    const slugs = out7b.map(s => s.plant_slug);
    expect(slugs).toContain('zoneonly_7b');
    expect(slugs).not.toContain('zoneonly_5a');

    // Custom-Profil ohne Zone → kein Zone-Filter.
    const outNoZone = generateSpaceSuggestions({ plan: [], plants, profile: profile({ zone: '' }) });
    const slugsNoZone = outNoZone.map(s => s.plant_slug);
    expect(slugsNoZone).toContain('zoneonly_7b');
    expect(slugsNoZone).toContain('zoneonly_5a');
  });

  it('completes in well under 30ms for 188 plants × 15-item plan', () => {
    // 188 Pflanzen synthetisch erzeugen, davon zufällig 15 im Plan.
    const list: Plant[] = [];
    for (let i = 0; i < 188; i++) {
      const slug = `p${i.toString().padStart(3, '0')}`;
      list.push(
        plant(slug, {
          gardenMeta: { spacing_cm: 15 + (i % 60) },
          permaculture: i % 3 === 0 ? ['pollinator_attractor'] : undefined,
        }),
      );
    }
    const plan: RecommendedPlant[] = [];
    for (let i = 0; i < 15; i++) plan.push(rec(`p${i.toString().padStart(3, '0')}`, 2));
    const t0 = performance.now();
    const out = generateSpaceSuggestions({
      plan,
      plants: list,
      profile: profile({ garden: { type: DEFAULT_TYPE, area_sqm: 30 } }),
    });
    const dt = performance.now() - t0;
    expect(out).toBeDefined();
    // 30 ms ist Spec-Schwelle; lokal sollte das deutlich darunter liegen.
    expect(dt).toBeLessThan(30);
  });
});
