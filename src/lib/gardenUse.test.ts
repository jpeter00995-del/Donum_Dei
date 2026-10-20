// === Tests: Gartenanwendungen ===
// Gartenanwendungen (z. B. Tagetes gegen Nematoden) sind keine Zubereitung fuer
// den Menschen. Sie duerfen weder auf Zubereitungsseiten noch im Form-Filter
// landen — auf der Pflanzenseite bleiben sie aber stehen.

import { describe, it, expect } from 'vitest';
import type { Plant, PlantUse } from './types';
import { istGartenanwendung, GARTEN_TARGETS } from './gardenUse';
import { findPlantsForForm, countPlantsPerForm, formsOfPlant } from './preparationPlants';
import { filterPlants } from './filterPlants';
import { toPlantCard } from './plantCard';
import { loadAllPlants } from './loadPlants';

// === 1. TESTDATEN ===
function use(target: string[], form = 'raw'): PlantUse {
  return { form, target, description: { de: 'x', en: 'x' } } as unknown as PlantUse;
}

function pflanze(uses: PlantUse[]): Plant {
  return {
    slug: 'garten',
    names: { de: 'Garten', en: 'Garden', latin: 'Hortus testus' },
    family: { de: 'x', en: 'x', latin: 'x' },
    description: { de: 'x', en: 'x' },
    teaser: { de: 'x', en: 'x' },
    uses,
    season: { active_months: [6], harvest_part: { de: 'Blatt', en: 'leaf' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: 'x.webp', alt: { de: 'x', en: 'x' }, license: 'CC0', author: 'x', source_url: 'x' },
  } as unknown as Plant;
}

// === 2. ERKENNUNG ===
describe('istGartenanwendung', () => {
  it('erkennt pest_control als Gartenanwendung', () => {
    expect(istGartenanwendung(use(['pest_control']))).toBe(true);
  });
  it('erkennt gemischte Targets, sobald ein Garten-Target dabei ist', () => {
    expect(istGartenanwendung(use(['ethnobotany', 'pest_control']))).toBe(true);
    expect(istGartenanwendung(use(['ethnobotany', 'soil_indicator']))).toBe(true);
  });
  it('laesst normale Anwendungen in Ruhe', () => {
    expect(istGartenanwendung(use(['nutrition']))).toBe(false);
    expect(istGartenanwendung(use(['skin', 'insect_repellent']))).toBe(false);
  });
  it('kommt mit fehlendem target zurecht', () => {
    expect(istGartenanwendung({ form: 'raw' } as unknown as PlantUse)).toBe(false);
  });
  it('enthaelt pest_control', () => {
    expect(GARTEN_TARGETS).toContain('pest_control');
  });
});

// === 3. ZUBEREITUNGSLISTEN + FILTER ===
describe('Gartenanwendungen ausserhalb der Zubereitung', () => {
  const nurGarten = pflanze([use(['pest_control'])]);
  const gemischt = pflanze([use(['pest_control']), use(['nutrition'], 'tea')]);

  it('findPlantsForForm listet reine Gartenpflanzen nicht unter "raw"', () => {
    expect(findPlantsForForm('raw', [nurGarten], 'de')).toHaveLength(0);
  });
  it('countPlantsPerForm zaehlt Gartenanwendungen nicht', () => {
    expect(countPlantsPerForm([nurGarten]).raw).toBeUndefined();
    expect(countPlantsPerForm([gemischt])).toEqual({ tea: 1 });
  });
  it('formsOfPlant nennt die Gartenanwendung nicht als Zubereitungsform', () => {
    expect(formsOfPlant(gemischt)).toEqual(['tea']);
  });
  it('filterPlants: Form-Filter "raw" trifft keine reine Gartenanwendung', () => {
    expect(filterPlants([nurGarten], { forms: ['raw'], seasons: [] })).toHaveLength(0);
  });
  it('toPlantCard: Form-Chips ohne Gartenanwendung', () => {
    expect(toPlantCard(gemischt, 'de').forms).toEqual(['tea']);
  });
});

// === 4. ECHTE DATEN: TAGETES ===
describe('Tagetes patula (echte Daten)', () => {
  const tagetes = loadAllPlants().find(p => p.slug === 'tagetes-patula');

  it('hat die Gartenanwendungen weiterhin in den Daten (Pflanzenseite zeigt sie)', () => {
    expect(tagetes).toBeDefined();
    expect(tagetes!.uses.filter(istGartenanwendung).length).toBeGreaterThanOrEqual(2);
  });
  it('steht wegen der Gartenanwendungen nicht unter "raw"', () => {
    const rawRest = tagetes!.uses.filter(u => u.form === 'raw' && !istGartenanwendung(u));
    const treffer = findPlantsForForm('raw', [tagetes!], 'de');
    expect(treffer.length > 0).toBe(rawRest.length > 0);
  });
});
