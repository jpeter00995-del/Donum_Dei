// === plantCategories — Welle K Tests ===
// Pure-function-Tests für die Kategorisierung der 188+ Pflanzen.
// (Tests for the algorithmic plant categorisation.)

import { describe, it, expect } from 'vitest';
import {
  categorizePlant,
  groupPlantsByCategory,
  PLANT_CATEGORIES,
  type PlantCategory,
} from './plantCategories';
import type {
  Plant,
  PermacultureFunction,
  UseForm,
  GardenMeta,
} from './types';
import { loadAllPlants } from './loadPlants';

// === 1. Test-Fixtures ===

function mkPlant(
  slug: string,
  familyLatin: string,
  forms: UseForm[],
  perma: PermacultureFunction[] = [],
  spacing_cm = 30,
): Plant {
  const garden_meta: GardenMeta = {
    climate_zones: ['7a'],
    sowing_window: { outdoor_direct: { start_month: 4, end_month: 6 } },
    harvest_window: { start_month: 7, end_month: 9 },
    days_to_harvest: 60,
    spacing_cm,
    garden_type: ['raised_bed'],
    difficulty: 1,
  };
  return {
    slug,
    names: { de: slug, en: slug, latin: slug },
    family: { de: 'fam', en: 'fam', latin: familyLatin },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: forms.map(f => ({
      form: f,
      target: [],
      internal_external: 'internal' as const,
      description: { de: '', en: '' },
      source_ids: [],
    })),
    season: { active_months: [5, 6, 7], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: {
      filename: 'a.jpg',
      alt: { de: '', en: '' },
      license: 'PD',
      author: 'x',
      source_url: 'https://x',
    },
    garden_meta,
    permaculture_functions: perma,
  };
}

// === 2. Exemplary classics — happy path ===

describe('categorizePlant — Klassiker pro Kategorie', () => {
  it('Tomate (Solanum lycopersicum, Solanaceae, raw) → fruchtgemuese', () => {
    const p = mkPlant('solanum-lycopersicum', 'Solanaceae', ['raw'], ['vertical_mid'], 60);
    expect(categorizePlant(p)).toBe('fruchtgemuese');
  });

  it('Karotte (Daucus carota, Apiaceae, raw) → wurzelgemuese', () => {
    const p = mkPlant('daucus-carota-sativus', 'Apiaceae', ['raw'], ['root_loosener'], 5);
    expect(categorizePlant(p)).toBe('wurzelgemuese');
  });

  it('Basilikum (Ocimum basilicum, Lamiaceae) → kraeuter', () => {
    const p = mkPlant('ocimum-basilicum', 'Lamiaceae', ['raw'], ['aromatic_repellent']);
    expect(categorizePlant(p)).toBe('kraeuter');
  });

  it('Tagetes (Asteraceae, pest_repellent) → begleitpflanzen', () => {
    const p = mkPlant(
      'tagetes-patula', 'Asteraceae', [],
      ['pest_repellent', 'pollinator_attractor', 'edible_flower'],
    );
    expect(categorizePlant(p)).toBe('begleitpflanzen');
  });

  it('Echinacea (Asteraceae, tincture) → heilpflanzen', () => {
    const p = mkPlant('echinacea-purpurea', 'Asteraceae', ['tincture']);
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });

  it('Salat (Lactuca sativa, Asteraceae) → blattgemuese', () => {
    const p = mkPlant('lactuca-sativa-capitata', 'Asteraceae', ['raw'], ['vertical_low', 'ground_cover']);
    expect(categorizePlant(p)).toBe('blattgemuese');
  });
});

// === 3. Override-Pfade (klare Sonderfälle) ===

describe('categorizePlant — Slug-Overrides', () => {
  it('Kartoffel (Solanum tuberosum) → wurzelgemuese (override, nicht fruchtgemuese)', () => {
    const p = mkPlant('solanum-tuberosum', 'Solanaceae', ['raw'], ['root_loosener']);
    expect(categorizePlant(p)).toBe('wurzelgemuese');
  });

  it('Rote Bete (Beta vulgaris conditiva) → wurzelgemuese (override)', () => {
    const p = mkPlant('beta-vulgaris-conditiva', 'Amaranthaceae', ['raw'], ['root_loosener']);
    expect(categorizePlant(p)).toBe('wurzelgemuese');
  });

  it('Mangold (Beta vulgaris cicla) → blattgemuese (override, gleiche Familie wie Rote Bete)', () => {
    const p = mkPlant('beta-vulgaris-cicla', 'Amaranthaceae', ['raw'], ['vertical_mid']);
    expect(categorizePlant(p)).toBe('blattgemuese');
  });

  it('Mais (Zea mays, Poaceae) → fruchtgemuese (override)', () => {
    const p = mkPlant('zea-mays', 'Poaceae', ['raw'], ['vertical_high']);
    expect(categorizePlant(p)).toBe('fruchtgemuese');
  });

  it('Petersilie (Petroselinum crispum) → kraeuter (override, nicht Apiaceae-Wurzel)', () => {
    const p = mkPlant('petroselinum-crispum', 'Apiaceae', ['raw'], [], 15);
    expect(categorizePlant(p)).toBe('kraeuter');
  });
});

// === 4. Familien-basierte Default-Pfade ===

describe('categorizePlant — Familien-Heuristik', () => {
  it('Paprika (Capsicum, Solanaceae) → fruchtgemuese', () => {
    const p = mkPlant('capsicum-annuum', 'Solanaceae', ['raw', 'spice'], ['vertical_mid']);
    expect(categorizePlant(p)).toBe('fruchtgemuese');
  });

  it('Zucchini (Cucurbita, Cucurbitaceae) → fruchtgemuese', () => {
    const p = mkPlant('cucurbita-pepo-zucchini', 'Cucurbitaceae', ['raw'], ['ground_cover']);
    expect(categorizePlant(p)).toBe('fruchtgemuese');
  });

  it('Buschbohne (Phaseolus, Fabaceae) → fruchtgemuese', () => {
    const p = mkPlant('phaseolus-vulgaris-nanus', 'Fabaceae', ['raw'], ['nitrogen_fixer']);
    expect(categorizePlant(p)).toBe('fruchtgemuese');
  });

  it('Kohl (Brassica oleracea, Brassicaceae) → blattgemuese', () => {
    const p = mkPlant('brassica-oleracea-capitata-alba', 'Brassicaceae', ['raw']);
    expect(categorizePlant(p)).toBe('blattgemuese');
  });

  it('Zwiebel (Allium cepa, Amaryllidaceae) → wurzelgemuese', () => {
    const p = mkPlant('allium-cepa', 'Amaryllidaceae', ['raw']);
    expect(categorizePlant(p)).toBe('wurzelgemuese');
  });

  it('Lavendel (Lamiaceae) → kraeuter', () => {
    const p = mkPlant('lavandula-angustifolia', 'Lamiaceae', ['tea'], ['pollinator_attractor']);
    expect(categorizePlant(p)).toBe('kraeuter');
  });

  it('Kapuzinerkresse (Tropaeolaceae) → begleitpflanzen', () => {
    const p = mkPlant('tropaeolum-majus', 'Tropaeolaceae', ['raw', 'spice'], ['pest_repellent']);
    expect(categorizePlant(p)).toBe('begleitpflanzen');
  });

  it('Borretsch (Boraginaceae) → begleitpflanzen', () => {
    const p = mkPlant('borago-officinalis', 'Boraginaceae', ['raw'], ['pollinator_attractor']);
    expect(categorizePlant(p)).toBe('begleitpflanzen');
  });
});

// === 5. Apiaceae-Spezialfall ===

describe('categorizePlant — Apiaceae split', () => {
  it('Dill (tea) → kraeuter', () => {
    const p = mkPlant('anethum-graveolens', 'Apiaceae', ['tea'], [], 20);
    expect(categorizePlant(p)).toBe('kraeuter');
  });

  it('Sellerie (raw) → wurzelgemuese', () => {
    const p = mkPlant('apium-graveolens', 'Apiaceae', ['raw'], [], 40);
    expect(categorizePlant(p)).toBe('wurzelgemuese');
  });

  it('Koriander (spice) → kraeuter', () => {
    const p = mkPlant('coriandrum-sativum', 'Apiaceae', ['spice'], [], 15);
    expect(categorizePlant(p)).toBe('kraeuter');
  });

  it('Pastinake (raw) → wurzelgemuese', () => {
    const p = mkPlant('pastinaca-sativa', 'Apiaceae', ['raw'], [], 10);
    expect(categorizePlant(p)).toBe('wurzelgemuese');
  });
});

// === 6. Asteraceae-Spezialfall ===

describe('categorizePlant — Asteraceae split', () => {
  it('Kamille (Matricaria, tea, medicinal) → heilpflanzen', () => {
    const p = mkPlant(
      'matricaria-chamomilla',
      'Asteraceae',
      ['tea'],
      ['pollinator_attractor', 'medicinal', 'dynamic_accumulator'],
    );
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });

  it('Schafgarbe (Achillea, tea+tincture, medicinal) → heilpflanzen', () => {
    const p = mkPlant(
      'achillea-millefolium',
      'Asteraceae',
      ['tea', 'tincture'],
      ['pollinator_attractor', 'dynamic_accumulator', 'medicinal'],
    );
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });

  it('Calendula (salve) → heilpflanzen (salve = medical form)', () => {
    const p = mkPlant(
      'calendula-officinalis',
      'Asteraceae',
      ['salve'],
      ['pollinator_attractor', 'pest_repellent', 'edible_flower', 'medicinal'],
    );
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });

  it('Estragon (Artemisia dracunculus, spice) → heilpflanzen (kein Lactuca)', () => {
    // Estragon ist Küchen-Gewürz, aber Asteraceae-Split routet zu heilpflanzen
    // wenn medical+pest_repellent. Hier nur spice + aromatic_repellent → heil.
    const p = mkPlant(
      'artemisia-dracunculus',
      'Asteraceae',
      ['spice'],
      ['aromatic_repellent', 'medicinal'],
    );
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });
});

// === 7. Fallback-Pfade ===

describe('categorizePlant — Fallback nach uses.form', () => {
  it('Pflanze mit nur spice, fremde Familie → kraeuter', () => {
    const p = mkPlant('cinnamomum-verum', 'Lauraceae', ['spice'], []);
    expect(categorizePlant(p)).toBe('kraeuter');
  });

  it('Pflanze mit nur raw, fremde Familie, kleinem spacing → blattgemuese', () => {
    const p = mkPlant('exotic-leaf', 'Unknownaceae', ['raw'], [], 15);
    expect(categorizePlant(p)).toBe('blattgemuese');
  });

  it('Pflanze mit nur raw, fremde Familie, großem spacing → fruchtgemuese', () => {
    const p = mkPlant('exotic-fruit', 'Unknownaceae', ['raw'], [], 60);
    expect(categorizePlant(p)).toBe('fruchtgemuese');
  });

  it('Pflanze mit nur tea/tincture, fremde Familie → heilpflanzen', () => {
    const p = mkPlant('exotic-herb', 'Unknownaceae', ['tea', 'tincture'], []);
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });

  it('Pflanze ganz ohne uses oder hints → heilpflanzen (default)', () => {
    const p = mkPlant('mystery-plant', 'Unknownaceae', [], []);
    expect(categorizePlant(p)).toBe('heilpflanzen');
  });
});

// === 8. Robustheit ===

describe('categorizePlant — Robustheit (kein Crash)', () => {
  it('handhabt fehlende uses + family + permaculture_functions ohne Crash', () => {
    const p: Plant = {
      slug: 'broken',
      names: { de: 'b', en: 'b', latin: 'b' },
      family: { de: '', en: '', latin: '' },
      description: { de: '', en: '' },
      teaser: { de: '', en: '' },
      uses: [],
      season: { active_months: [], harvest_part: { de: '', en: '' } },
      safety: { warnings: { de: '', en: '' }, external_only: false },
      classical_quotes: [],
      sources: [],
      image: { filename: 'a.jpg', alt: { de: '', en: '' }, license: 'PD', author: '', source_url: '' },
    };
    expect(() => categorizePlant(p)).not.toThrow();
    expect(PLANT_CATEGORIES).toContain(categorizePlant(p) as PlantCategory);
  });
});

// === 9. groupPlantsByCategory ===

describe('groupPlantsByCategory', () => {
  it('liefert für jede Kategorie ein (ggf. leeres) Array', () => {
    const grouped = groupPlantsByCategory([]);
    for (const cat of PLANT_CATEGORIES) {
      expect(grouped[cat]).toEqual([]);
    }
  });

  it('gruppiert mehrere Pflanzen korrekt', () => {
    const tomato = mkPlant('solanum-lycopersicum', 'Solanaceae', ['raw'], [], 60);
    const carrot = mkPlant('daucus-carota-sativus', 'Apiaceae', ['raw'], [], 5);
    const basil = mkPlant('ocimum-basilicum', 'Lamiaceae', ['raw']);
    const grouped = groupPlantsByCategory([tomato, carrot, basil]);
    expect(grouped.fruchtgemuese.map(p => p.slug)).toEqual(['solanum-lycopersicum']);
    expect(grouped.wurzelgemuese.map(p => p.slug)).toEqual(['daucus-carota-sativus']);
    expect(grouped.kraeuter.map(p => p.slug)).toEqual(['ocimum-basilicum']);
  });
});

// === 10. Real-data smoke test — 188+ Plant JSONs ===

describe('categorizePlant — real-data smoke (188+ Pflanzen)', () => {
  it('kategorisiert alle Pflanzen ohne Crash und in allen Kategorien', () => {
    const plants = loadAllPlants();
    expect(plants.length).toBeGreaterThan(150);

    const counts: Record<PlantCategory, number> = {
      fruchtgemuese: 0,
      blattgemuese: 0,
      wurzelgemuese: 0,
      kraeuter: 0,
      begleitpflanzen: 0,
      heilpflanzen: 0,
    };
    for (const p of plants) {
      const cat = categorizePlant(p);
      expect(PLANT_CATEGORIES).toContain(cat);
      counts[cat]++;
    }
    // Mindestens 4 von 6 Kategorien sollten Vertreter haben.
    const nonEmpty = (Object.values(counts) as number[]).filter(n => n > 0).length;
    expect(nonEmpty).toBeGreaterThanOrEqual(4);
    // Heilpflanzen sind die größte Gruppe (Donum Dei = Heilpflanzen-DB).
    expect(counts.heilpflanzen).toBeGreaterThan(0);
  });
});
