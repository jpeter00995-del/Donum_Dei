import { describe, it, expect } from 'vitest';
import {
  generateGardenPlan,
  areaPerPlant,
  estimateAreaSqm,
  totalAreaSqm,
} from './gardenPlan';
import type { Plant, GardenMeta } from './types';
import type { UserProfile } from './userProfile';
import { loadAllPlants } from './loadPlants';
import { categorizePlant } from './plantCategories';

// === Test fixtures ===
// (Pflanzen-Test-Fixtures; bestehende Plant-JSONs werden NICHT verändert.)

function plant(slug: string, gm: GardenMeta | undefined, namesLatin = slug): Plant {
  return {
    slug,
    names: { de: slug, en: slug, latin: namesLatin },
    family: { de: 'fam', en: 'fam', latin: 'Fam' },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: [],
    season: { active_months: [5, 6, 7], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: 'a.jpg', alt: { de: '', en: '' }, license: 'PD', author: 'x', source_url: 'https://x' },
    ...(gm ? { garden_meta: gm } : {}),
  };
}

const TOMATO: GardenMeta = {
  climate_zones: ['7a', '7b', '8a'],
  sowing_window: { indoor: { start_month: 3, end_month: 4 }, transplant: { start_month: 5, end_month: 5 } },
  harvest_window: { start_month: 7, end_month: 9 },
  days_to_harvest: 100,
  spacing_cm: 60,
  garden_type: ['raised_bed', 'greenhouse'],
  difficulty: 2,
};

const RADISH: GardenMeta = {
  climate_zones: ['6a', '6b', '7a', '7b', '8a', '8b'],
  sowing_window: { outdoor_direct: { start_month: 3, end_month: 9 } },
  harvest_window: { start_month: 5, end_month: 10 },
  days_to_harvest: 30,
  spacing_cm: 5,
  garden_type: ['balcony', 'raised_bed', 'field'],
  difficulty: 1,
};

const ARTICHOKE: GardenMeta = {
  climate_zones: ['8a', '8b', '9a'],
  sowing_window: { indoor: { start_month: 2, end_month: 3 }, transplant: { start_month: 5, end_month: 5 } },
  harvest_window: { start_month: 7, end_month: 9 },
  days_to_harvest: 180,
  spacing_cm: 90,
  garden_type: ['field'],
  difficulty: 3,
};

const BASIL: GardenMeta = {
  climate_zones: ['6a', '7a', '7b', '8a'],
  sowing_window: { indoor: { start_month: 3, end_month: 4 } },
  harvest_window: { start_month: 6, end_month: 9 },
  days_to_harvest: 45,
  spacing_cm: 20,
  garden_type: ['balcony', 'raised_bed', 'greenhouse'],
  difficulty: 1,
};

const PLANTS_WITH_META: Plant[] = [
  plant('tomato', TOMATO),
  plant('radish', RADISH),
  plant('artichoke', ARTICHOKE),
  plant('basil', BASIL),
];

const PLANTS_WITHOUT_META: Plant[] = [plant('foxglove', undefined), plant('mint', undefined)];

function profile(over: Partial<UserProfile> = {}): UserProfile {
  return {
    schema_version: 1,
    created_at: '2026-05-17T10:00:00.000Z',
    zone: '7a',
    garden: { type: 'raised_bed', area_sqm: 10 },
    household_size: 2,
    self_sufficiency_goal: 'supplementary',
    experience: 'beginner',
    ...over,
  };
}

describe('generateGardenPlan — happy paths', () => {
  it('beginner on a 10 m² raised bed in zone 7a gets a non-empty plan, no expert-only crops', () => {
    const plan = generateGardenPlan(profile(), PLANTS_WITH_META);
    expect(plan.length).toBeGreaterThan(0);
    const slugs = plan.map(p => p.plant_slug);
    expect(slugs).toContain('radish');
    expect(slugs).toContain('basil');
    expect(slugs).not.toContain('artichoke'); // Profi-only + falscher Garten-Typ
    // Scores sind absteigend sortiert
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i - 1].score).toBeGreaterThanOrEqual(plan[i].score);
    }
  });

  it('expert on a 200 m² field in zone 8a includes artichoke', () => {
    const plan = generateGardenPlan(
      profile({ zone: '8a', experience: 'expert', garden: { type: 'field', area_sqm: 200 }, self_sufficiency_goal: 'full' }),
      PLANTS_WITH_META,
    );
    const slugs = plan.map(p => p.plant_slug);
    expect(slugs).toContain('artichoke');
  });
});

describe('generateGardenPlan — graceful edge cases', () => {
  it('returns [] for an empty plant list', () => {
    const plan = generateGardenPlan(profile(), []);
    expect(plan).toEqual([]);
  });

  it('returns [] when no plant has garden_meta', () => {
    const plan = generateGardenPlan(profile(), PLANTS_WITHOUT_META);
    expect(plan).toEqual([]);
  });

  it('returns [] for an unknown / unsupported zone instead of crashing', () => {
    const plan = generateGardenPlan(profile({ zone: '13z' }), PLANTS_WITH_META);
    expect(plan).toEqual([]);
  });

  it('respects the garden_type filter — balcony skips field-only plants', () => {
    const plan = generateGardenPlan(
      profile({ garden: { type: 'balcony', area_sqm: 4 } }),
      PLANTS_WITH_META,
    );
    const slugs = plan.map(p => p.plant_slug);
    expect(slugs).not.toContain('artichoke');
    expect(slugs).not.toContain('tomato'); // tomato hat keinen balcony slot
    expect(slugs).toContain('basil');
  });
});

describe('generateGardenPlan — quantity scaling', () => {
  it('scales quantity with household size and goal', () => {
    const small = generateGardenPlan(profile({ household_size: 1, self_sufficiency_goal: 'supplementary' }), [plant('basil', BASIL)])[0];
    const large = generateGardenPlan(profile({ household_size: 5, self_sufficiency_goal: 'full' }), [plant('basil', BASIL)])[0];
    expect(large.quantity).toBeGreaterThan(small.quantity);
  });

  it('picks outdoor_direct as preferred sowing method when available', () => {
    const plan = generateGardenPlan(profile(), [plant('radish', RADISH)]);
    expect(plan[0].sowing_method).toBe('outdoor_direct');
  });
});

describe('generateGardenPlan — performance', () => {
  it('handles 154 plants in well under 50 ms', () => {
    // Generiere 154 Plant-Klone — Mix mit und ohne garden_meta.
    const big: Plant[] = [];
    for (let i = 0; i < 154; i++) {
      big.push(plant(`p${i}`, i % 2 === 0 ? TOMATO : undefined));
    }
    const start = performance.now();
    const result = generateGardenPlan(profile({ zone: '7a' }), big);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(result.length).toBeGreaterThan(0);
  });
});

// === Welle D.1 — Variety + space constraints ===

describe('generateGardenPlan — variety v1.0.1', () => {
  it('returns at least 8 varieties for a 8 m² raised_bed in zone 7b (Maikels Profil)', () => {
    // Aufbau: ein breites realistisches Set von Pflanzen mit zone 7b + raised_bed.
    const big: Plant[] = [];
    const zones = ['6a','6b','7a','7b','8a','8b'];
    // 20 kleine Sorten (spacing 5..25)
    for (let i = 0; i < 20; i++) {
      big.push(
        plant(`small${i}`, {
          climate_zones: zones,
          sowing_window: { outdoor_direct: { start_month: 3, end_month: 8 } },
          harvest_window: { start_month: 5, end_month: 9 },
          days_to_harvest: 45,
          spacing_cm: 10 + (i % 3) * 5, // 10,15,20
          garden_type: ['balcony', 'raised_bed', 'field'],
          difficulty: 1,
        }),
      );
    }
    // 10 mittlere Sorten (spacing 30..45)
    for (let i = 0; i < 10; i++) {
      big.push(
        plant(`med${i}`, {
          climate_zones: zones,
          sowing_window: { transplant: { start_month: 4, end_month: 6 } },
          harvest_window: { start_month: 6, end_month: 9 },
          days_to_harvest: 70,
          spacing_cm: 30 + (i % 3) * 5,
          garden_type: ['raised_bed', 'field'],
          difficulty: 1,
        }),
      );
    }
    // 5 große Sorten (spacing 60+)
    for (let i = 0; i < 5; i++) {
      big.push(
        plant(`big${i}`, {
          climate_zones: zones,
          sowing_window: { transplant: { start_month: 5, end_month: 5 } },
          harvest_window: { start_month: 7, end_month: 9 },
          days_to_harvest: 100,
          spacing_cm: 60,
          garden_type: ['raised_bed'],
          difficulty: 2,
        }),
      );
    }

    const plan = generateGardenPlan(
      profile({
        zone: '7b',
        garden: { type: 'raised_bed', area_sqm: 8 },
        household_size: 3,
        self_sufficiency_goal: 'half',
        experience: 'beginner',
      }),
      big,
    );
    expect(plan.length).toBeGreaterThanOrEqual(8);
    // Mehr als die alten 4 Sorten — explizit als Regression-Guard.
    expect(plan.length).toBeGreaterThan(4);
  });

  it('keeps total estimated space within 110 % of garden area', () => {
    // Großer Plant-Pool mit zwingend großem Verbrauch wenn nicht beschränkt.
    const big: Plant[] = [];
    for (let i = 0; i < 30; i++) {
      big.push(
        plant(`p${i}`, {
          climate_zones: ['7b'],
          sowing_window: { outdoor_direct: { start_month: 3, end_month: 8 } },
          harvest_window: { start_month: 5, end_month: 9 },
          days_to_harvest: 60,
          spacing_cm: 40,
          garden_type: ['raised_bed'],
          difficulty: 1,
        }),
      );
    }
    const prof = profile({
      zone: '7b',
      garden: { type: 'raised_bed', area_sqm: 6 },
      household_size: 4,
      self_sufficiency_goal: 'full',
      experience: 'intermediate',
    });
    const plan = generateGardenPlan(prof, big);
    const totalArea = totalAreaSqm(plan, big);
    expect(totalArea).toBeLessThanOrEqual(prof.garden.area_sqm * 1.1 + 0.001);
  });

  it('large-spacing crops get smaller quantities than small-spacing crops', () => {
    // Two single-plant runs to compare per-variety heuristic.
    const small = generateGardenPlan(profile({ household_size: 3, self_sufficiency_goal: 'half' }), [plant('radish', RADISH)])[0];
    const large = generateGardenPlan(profile({ household_size: 3, self_sufficiency_goal: 'half', garden: { type: 'raised_bed', area_sqm: 50 } }), [plant('tomato', TOMATO)])[0];
    expect(small.quantity).toBeGreaterThan(large.quantity);
  });
});

describe('estimateAreaSqm / totalAreaSqm', () => {
  it('areaPerPlant: 30 cm spacing → 0.09 m²', () => {
    const p = plant('x', { ...RADISH, spacing_cm: 30 });
    expect(areaPerPlant(p)).toBeCloseTo(0.09, 3);
  });

  it('estimateAreaSqm: 12 × 30 cm = 1.08 m²', () => {
    const p = plant('x', { ...RADISH, spacing_cm: 30 });
    const rec = { plant_slug: 'x', quantity: 12, sowing_method: 'outdoor_direct' as const, score: 1, notes_de: '', notes_en: '' };
    expect(estimateAreaSqm(rec, p)).toBeCloseTo(1.08, 3);
  });

  it('totalAreaSqm sums across recommendations', () => {
    const pA = plant('a', { ...RADISH, spacing_cm: 20 }); // 0.04 m²
    const pB = plant('b', { ...TOMATO, spacing_cm: 50 }); // 0.25 m²
    const recs = [
      { plant_slug: 'a', quantity: 10, sowing_method: 'outdoor_direct' as const, score: 1, notes_de: '', notes_en: '' },
      { plant_slug: 'b', quantity: 4,  sowing_method: 'transplant' as const, score: 1, notes_de: '', notes_en: '' },
    ];
    // 10*0.04 + 4*0.25 = 0.4 + 1.0 = 1.4
    expect(totalAreaSqm(recs, [pA, pB])).toBeCloseTo(1.4, 3);
  });

  it('ignores recommendations whose plant cannot be found', () => {
    const recs = [
      { plant_slug: 'ghost', quantity: 10, sowing_method: 'outdoor_direct' as const, score: 1, notes_de: '', notes_en: '' },
    ];
    expect(totalAreaSqm(recs, [])).toBe(0);
  });
});

// === Welle K — Diversity-aware auto-plan ===

describe('generateGardenPlan — Welle K diversity (real plant data)', () => {
  it("Maikels Profil (Zone 7b, raised_bed 8 m², beginner, half) enthält Tomate", () => {
    const plants = loadAllPlants();
    const maikel: UserProfile = {
      schema_version: 1,
      created_at: '2026-05-18T00:00:00.000Z',
      zone: '7b',
      garden: { type: 'raised_bed', area_sqm: 8 },
      household_size: 3,
      self_sufficiency_goal: 'half',
      experience: 'beginner',
    };
    const plan = generateGardenPlan(maikel, plants);
    const slugs = plan.map(r => r.plant_slug);
    expect(slugs).toContain('solanum-lycopersicum');
  });

  it("Maikels Profil deckt mindestens 4 verschiedene Kategorien ab", () => {
    const plants = loadAllPlants();
    const maikel: UserProfile = {
      schema_version: 1,
      created_at: '2026-05-18T00:00:00.000Z',
      zone: '7b',
      garden: { type: 'raised_bed', area_sqm: 8 },
      household_size: 3,
      self_sufficiency_goal: 'half',
      experience: 'beginner',
    };
    const plan = generateGardenPlan(maikel, plants);
    const plantBySlug = new Map(plants.map(p => [p.slug, p]));
    const cats = new Set<string>();
    for (const rec of plan) {
      const p = plantBySlug.get(rec.plant_slug);
      if (p) cats.add(categorizePlant(p));
    }
    expect(cats.size).toBeGreaterThanOrEqual(4);
  });

  it("Diversity-Pass: synthetisches Set mit allen 6 Kategorien liefert mind. 5 Kategorien im Plan", () => {
    // Pflanzen aus allen 6 Kategorien mit gleichen Garten-Bedingungen erzeugen,
    // damit der diversity-pick alle reinholen kann.
    const baseGM: GardenMeta = {
      climate_zones: ['7a', '7b'],
      sowing_window: { outdoor_direct: { start_month: 4, end_month: 6 } },
      harvest_window: { start_month: 7, end_month: 9 },
      days_to_harvest: 60,
      spacing_cm: 25,
      garden_type: ['raised_bed'],
      difficulty: 1,
    };
    const mk = (slug: string, family: string, perma: string[] = []): Plant => ({
      slug,
      names: { de: slug, en: slug, latin: slug },
      family: { de: 'f', en: 'f', latin: family },
      description: { de: '', en: '' },
      teaser: { de: '', en: '' },
      uses: [{ form: 'raw', target: [], internal_external: 'internal', description: { de: '', en: '' }, source_ids: [] }],
      season: { active_months: [5, 6], harvest_part: { de: '', en: '' } },
      safety: { warnings: { de: '', en: '' }, external_only: false },
      classical_quotes: [],
      sources: [],
      image: { filename: 'a.jpg', alt: { de: '', en: '' }, license: 'PD', author: '', source_url: '' },
      garden_meta: { ...baseGM, spacing_cm: 30 },
      permaculture_functions: perma as never,
    });
    const set: Plant[] = [
      // fruchtgemuese
      mk('tomato', 'Solanaceae'),
      mk('pepper', 'Solanaceae'),
      // blattgemuese
      mk('cabbage', 'Brassicaceae'),
      mk('lettuce', 'Brassicaceae'),
      // wurzelgemuese
      mk('onion', 'Amaryllidaceae'),
      mk('garlic', 'Amaryllidaceae'),
      // kraeuter
      mk('basil', 'Lamiaceae'),
      mk('sage', 'Lamiaceae'),
      // begleitpflanzen
      mk('nasturtium', 'Tropaeolaceae'),
      mk('borage', 'Boraginaceae'),
      // heilpflanzen — kein raw, sondern tea
      {
        ...mk('chamomile', 'Asteraceae'),
        uses: [{ form: 'tea', target: [], internal_external: 'internal', description: { de: '', en: '' }, source_ids: [] }],
      },
    ];
    const plan = generateGardenPlan(profile({
      zone: '7b',
      garden: { type: 'raised_bed', area_sqm: 12 },
      experience: 'beginner',
      self_sufficiency_goal: 'half',
    }), set);
    const bySlug = new Map(set.map(p => [p.slug, p]));
    const cats = new Set<string>();
    for (const rec of plan) {
      const p = bySlug.get(rec.plant_slug);
      if (p) cats.add(categorizePlant(p));
    }
    expect(cats.size).toBeGreaterThanOrEqual(5);
  });
});
