import { describe, it, expect } from 'vitest';
import { validatePlant } from './validatePlant';

const validPlant = {
  slug: 'equisetum-arvense',
  names: { de: 'Acker-Schachtelhalm', en: 'Field Horsetail', latin: 'Equisetum arvense' },
  family: { de: 'Schachtelhalmgewächse', en: 'Horsetail family', latin: 'Equisetaceae' },
  description: { de: 'Eine Pflanze.', en: 'A plant.' },
  teaser: { de: 'Kurz.', en: 'Short.' },
  uses: [{
    form: 'tea',
    target: ['urinary'],
    internal_external: 'internal',
    description: { de: 'Tee.', en: 'Tea.' },
    source_ids: ['src_1']
  }],
  season: { active_months: [4, 5, 6], harvest_part: { de: 'Triebe', en: 'shoots' } },
  safety: { warnings: { de: 'Keine.', en: 'None.' }, external_only: false },
  classical_quotes: [],
  sources: [{
    id: 'src_1',
    type: 'wikipedia',
    title: 'Article',
    url: 'https://example.com',
    accessed: '2026-05-16'
  }],
  image: {
    filename: 'equisetum-arvense.jpg',
    alt: { de: 'Foto', en: 'Photo' },
    license: 'CC BY-SA 4.0',
    author: 'Someone',
    source_url: 'https://commons.wikimedia.org/...'
  }
};

describe('validatePlant', () => {
  it('accepts a valid plant', () => {
    expect(() => validatePlant(validPlant)).not.toThrow();
  });

  it('rejects missing slug', () => {
    const { slug, ...rest } = validPlant;
    expect(() => validatePlant(rest)).toThrow(/slug/);
  });

  it('rejects unknown use form', () => {
    const bad = { ...validPlant, uses: [{ ...validPlant.uses[0], form: 'magic' }] };
    expect(() => validatePlant(bad)).toThrow(/form/);
  });

  it('rejects out-of-range month', () => {
    const bad = { ...validPlant, season: { ...validPlant.season, active_months: [13] } };
    expect(() => validatePlant(bad)).toThrow(/month/);
  });

  it('rejects empty uses array', () => {
    const bad = { ...validPlant, uses: [] };
    expect(() => validatePlant(bad)).toThrow(/uses/);
  });

  it('rejects empty sources array', () => {
    const bad = { ...validPlant, sources: [] };
    expect(() => validatePlant(bad)).toThrow(/sources/);
  });

  it('rejects use referencing non-existent source_id', () => {
    const bad = { ...validPlant, uses: [{ ...validPlant.uses[0], source_ids: ['ghost'] }] };
    expect(() => validatePlant(bad)).toThrow(/source/);
  });
});

describe('kingdom + legal_status (Themen-Erweiterung)', () => {
  it('accepts a plant without kingdom/legal_status (backward compat)', () => {
    expect(() => validatePlant(validPlant)).not.toThrow();
  });

  it('accepts kingdom="fungus"', () => {
    expect(() => validatePlant({ ...validPlant, kingdom: 'fungus' })).not.toThrow();
  });

  it('rejects an unknown kingdom', () => {
    expect(() => validatePlant({ ...validPlant, kingdom: 'animal' })).toThrow(/kingdom/);
  });

  it('accepts a valid legal_status with declared source_ids', () => {
    const ok = {
      ...validPlant,
      legal_status: {
        controlled: true,
        summary: { de: 'Kontrolliert.', en: 'Controlled.' },
        note: { de: 'Je nach Land.', en: 'Varies by country.' },
        source_ids: ['src_1'],
      },
    };
    expect(() => validatePlant(ok)).not.toThrow();
  });

  it('rejects legal_status referencing a non-existent source_id', () => {
    const bad = {
      ...validPlant,
      legal_status: {
        controlled: true,
        summary: { de: 'Kontrolliert.', en: 'Controlled.' },
        source_ids: ['ghost'],
      },
    };
    expect(() => validatePlant(bad)).toThrow(/source/);
  });

  it('rejects legal_status without summary', () => {
    const bad = { ...validPlant, legal_status: { controlled: true } };
    expect(() => validatePlant(bad)).toThrow();
  });
});

describe('indoor_growing field', () => {
  const validIndoor = {
    suitable: true,
    purpose: ['medicinal'],
    rooms: ['kitchen'],
    light: 'bright_indirect',
    water_frequency: 'weekly',
    difficulty: 1,
    pet_safe: true,
  };

  it('accepts plant without indoor_growing (backwards compat)', () => {
    expect(() => validatePlant(validPlant)).not.toThrow();
  });

  it('accepts plant with minimal valid indoor_growing', () => {
    const p = { ...validPlant, indoor_growing: validIndoor };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('accepts plant with full indoor_growing including tips and soil', () => {
    const p = {
      ...validPlant,
      indoor_growing: {
        ...validIndoor,
        soil: { de: 'Erde', en: 'Soil' },
        pot_size_cm: 15,
        tips: { de: ['Tipp 1', 'Tipp 2'], en: ['Tip 1', 'Tip 2'] },
      },
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('rejects unknown purpose', () => {
    const p = { ...validPlant, indoor_growing: { ...validIndoor, purpose: ['weird'] } };
    expect(() => validatePlant(p)).toThrow(/indoor_growing.purpose/);
  });

  it('rejects unknown light', () => {
    const p = { ...validPlant, indoor_growing: { ...validIndoor, light: 'sunny' } };
    expect(() => validatePlant(p)).toThrow(/indoor_growing.light/);
  });

  it('rejects empty rooms array', () => {
    const p = { ...validPlant, indoor_growing: { ...validIndoor, rooms: [] } };
    expect(() => validatePlant(p)).toThrow(/indoor_growing.rooms/);
  });

  it('rejects empty purpose array', () => {
    const p = { ...validPlant, indoor_growing: { ...validIndoor, purpose: [] } };
    expect(() => validatePlant(p)).toThrow(/indoor_growing.purpose/);
  });

  it('rejects difficulty out of range', () => {
    const p = { ...validPlant, indoor_growing: { ...validIndoor, difficulty: 5 } };
    expect(() => validatePlant(p)).toThrow(/indoor_growing.difficulty/);
  });

  it('rejects non-boolean pet_safe', () => {
    const p = { ...validPlant, indoor_growing: { ...validIndoor, pet_safe: 'yes' } };
    expect(() => validatePlant(p)).toThrow(/indoor_growing.pet_safe/);
  });
});

describe('garden_meta field', () => {
  // Minimal valid garden_meta — only required fields populated
  // (Minimales gültiges garden_meta; sowing_window leer ist erlaubt, harvest_window Pflicht)
  const validMinimalGardenMeta = {
    climate_zones: ['7a'],
    sowing_window: {},
    harvest_window: { start_month: 6, end_month: 9 },
    days_to_harvest: 90,
    spacing_cm: 30,
    garden_type: ['raised_bed'],
    difficulty: 1,
  };

  // Full garden_meta — every optional sub-field populated
  // (Voll bestücktes garden_meta inkl. aller sowing_window-Methoden)
  const validFullGardenMeta = {
    climate_zones: ['7a', '7b', '8a', '11'],
    sowing_window: {
      indoor: { start_month: 2, end_month: 4 },
      outdoor_direct: { start_month: 4, end_month: 6 },
      transplant: { start_month: 5, end_month: 6 },
    },
    harvest_window: { start_month: 7, end_month: 10 },
    days_to_harvest: 75,
    spacing_cm: 45,
    garden_type: ['raised_bed', 'field', 'greenhouse'],
    difficulty: 2,
  };

  it('valid full garden_meta passes', () => {
    const p = { ...validPlant, garden_meta: validFullGardenMeta };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('valid minimal garden_meta passes (only required fields)', () => {
    const p = { ...validPlant, garden_meta: validMinimalGardenMeta };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('invalid month rejected', () => {
    const p = {
      ...validPlant,
      garden_meta: {
        ...validMinimalGardenMeta,
        harvest_window: { start_month: 13, end_month: 9 },
      },
    };
    expect(() => validatePlant(p)).toThrow(/garden_meta.harvest_window/);
  });

  it('invalid climate_zone format rejected', () => {
    const p = {
      ...validPlant,
      garden_meta: { ...validMinimalGardenMeta, climate_zones: ['zone-7'] },
    };
    expect(() => validatePlant(p)).toThrow(/garden_meta.climate_zones/);
  });

  it('month-wrap accepted (start_month > end_month)', () => {
    // Year-wrap: Nov–Feb (Mediterranean herbs / winter vegetables)
    // (Jahres-Wrap: Mittelmeer-Kräuter / Wintergemüse)
    const p = {
      ...validPlant,
      garden_meta: {
        ...validMinimalGardenMeta,
        harvest_window: { start_month: 11, end_month: 2 },
      },
    };
    expect(() => validatePlant(p)).not.toThrow();
  });
});

// === Companion-planting tests — see TODO_v1.0_selbstversorger.md Task 14 ===
// (Mischkultur-Tests; pro-Pflanze-Validator; bidirektionale Konsistenz weiter unten)
describe('companion_planting field', () => {
  const validCompanion = {
    good_partners: ['ocimum-basilicum', 'calendula-officinalis'],
    bad_partners: ['foeniculum-vulgare'],
    neutral: ['mentha-piperita'],
    notes_de: 'Tomate + Basilikum = klassische Mischkultur.',
    notes_en: 'Tomato + basil = classic companion pairing.',
    source: 'Klassische Mischkultur-Tradition (Three Sisters, Bauernregel)',
  };

  it('valid companion_planting passes', () => {
    const p = { ...validPlant, companion_planting: validCompanion };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('minimal companion_planting (empty arrays + source) passes', () => {
    const p = {
      ...validPlant,
      companion_planting: {
        good_partners: [],
        bad_partners: [],
        source: 'Eigene Kuration',
      },
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('invalid: missing source rejected', () => {
    const { source, ...rest } = validCompanion;
    const p = { ...validPlant, companion_planting: rest };
    expect(() => validatePlant(p)).toThrow(/source/);
  });

  it('invalid: empty source rejected', () => {
    const p = {
      ...validPlant,
      companion_planting: { ...validCompanion, source: '' },
    };
    expect(() => validatePlant(p)).toThrow(/source/);
  });

  it('invalid: bad_partners not array rejected', () => {
    const p = {
      ...validPlant,
      companion_planting: { ...validCompanion, bad_partners: 'not-an-array' },
    };
    expect(() => validatePlant(p)).toThrow(/bad_partners/);
  });

  it('invalid: good_partners contains non-string rejected', () => {
    const p = {
      ...validPlant,
      companion_planting: { ...validCompanion, good_partners: [123] },
    };
    expect(() => validatePlant(p)).toThrow(/good_partners/);
  });

  it('invalid: neutral when present must be array', () => {
    const p = {
      ...validPlant,
      companion_planting: { ...validCompanion, neutral: 'mentha-piperita' },
    };
    expect(() => validatePlant(p)).toThrow(/neutral/);
  });

  // === Welle E.1: reasons sub-field (optional, backwards-compatible) ===
  // (Welle E.1: optionales reasons-Feld; Beziehungs-Begründungen pro Partner)
  it('valid: companion_planting with reasons passes', () => {
    const p = {
      ...validPlant,
      companion_planting: {
        ...validCompanion,
        reasons: {
          'ocimum-basilicum': { de: 'Klassiker.', en: 'Classic.' },
          'foeniculum-vulgare': {
            de: 'Fenchel hemmt Tomate stark.',
            en: 'Fennel inhibits tomato.',
          },
        },
      },
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('invalid: reasons entry missing en rejected', () => {
    const p = {
      ...validPlant,
      companion_planting: {
        ...validCompanion,
        reasons: { 'ocimum-basilicum': { de: 'Nur deutsch.' } },
      },
    };
    expect(() => validatePlant(p)).toThrow(/reasons/);
  });

  it('invalid: reasons entry with empty string rejected', () => {
    const p = {
      ...validPlant,
      companion_planting: {
        ...validCompanion,
        reasons: { 'ocimum-basilicum': { de: '', en: 'Classic.' } },
      },
    };
    expect(() => validatePlant(p)).toThrow(/reasons/);
  });

  it('invalid: reasons as array (not object map) rejected', () => {
    const p = {
      ...validPlant,
      companion_planting: { ...validCompanion, reasons: [] },
    };
    expect(() => validatePlant(p)).toThrow(/reasons/);
  });
});

// === Welle E.1: permaculture_functions field ===
// (Welle E.1: Permakultur-Funktionen — optionales Enum-Array auf Plant-Ebene)
describe('permaculture_functions field', () => {
  it('plant without permaculture_functions stays valid (backwards compat)', () => {
    expect(() => validatePlant(validPlant)).not.toThrow();
  });

  it('valid permaculture_functions array passes', () => {
    const p = {
      ...validPlant,
      permaculture_functions: ['nitrogen_fixer', 'pollinator_attractor', 'medicinal'],
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('all known permaculture functions accepted', () => {
    const allFunctions = [
      'nitrogen_fixer',
      'pest_repellent',
      'ground_cover',
      'pollinator_attractor',
      'root_loosener',
      'dynamic_accumulator',
      'vertical_high',
      'vertical_mid',
      'vertical_low',
      'shade_provider',
      'aromatic_repellent',
      'edible_flower',
      'medicinal',
      'microclimate',
    ];
    const p = { ...validPlant, permaculture_functions: allFunctions };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('empty permaculture_functions array rejected', () => {
    const p = { ...validPlant, permaculture_functions: [] };
    expect(() => validatePlant(p)).toThrow(/permaculture_functions/);
  });

  it('unknown permaculture function rejected', () => {
    const p = { ...validPlant, permaculture_functions: ['nitrogen_fixer', 'mythical_function'] };
    expect(() => validatePlant(p)).toThrow(/permaculture_functions/);
  });

  it('duplicate permaculture function rejected', () => {
    const p = {
      ...validPlant,
      permaculture_functions: ['nitrogen_fixer', 'nitrogen_fixer'],
    };
    expect(() => validatePlant(p)).toThrow(/permaculture_functions/);
  });
});

// === Companion-planting cross-file consistency =================================
// Bidirectional invariant: if A.good_partners includes B, then B.good_partners
// must include A. Same for bad_partners. This loops over all real plant JSONs.
// (Bidirektionale Invariante: A↔B muss in beiden Pflanzen-JSONs gepflegt sein.)
describe('companion_planting bidirectional consistency (cross-file)', () => {
  // Eager glob — works in Vitest because vitest.config.ts wires Vite resolution.
  const modules = import.meta.glob<{ default: { slug: string; companion_planting?: any } }>(
    '../data/plants/*.json',
    { eager: true }
  );

  // Build a slug → companion_planting map for every plant that has the field.
  const cpBySlug = new Map<string, { good: Set<string>; bad: Set<string> }>();
  for (const mod of Object.values(modules)) {
    const p = mod.default;
    if (p.companion_planting) {
      cpBySlug.set(p.slug, {
        good: new Set<string>(p.companion_planting.good_partners ?? []),
        bad: new Set<string>(p.companion_planting.bad_partners ?? []),
      });
    }
  }

  it('every good_partners edge is reciprocated', () => {
    const broken: string[] = [];
    for (const [slug, { good }] of cpBySlug.entries()) {
      for (const partner of good) {
        const other = cpBySlug.get(partner);
        if (!other) {
          broken.push(`${slug}.good_partners → ${partner} (partner has no companion_planting field)`);
          continue;
        }
        if (!other.good.has(slug)) {
          broken.push(`${slug}.good_partners → ${partner}, but ${partner}.good_partners does not include ${slug}`);
        }
      }
    }
    expect(broken, broken.join('\n')).toEqual([]);
  });

  it('every bad_partners edge is reciprocated', () => {
    const broken: string[] = [];
    for (const [slug, { bad }] of cpBySlug.entries()) {
      for (const partner of bad) {
        const other = cpBySlug.get(partner);
        if (!other) {
          broken.push(`${slug}.bad_partners → ${partner} (partner has no companion_planting field)`);
          continue;
        }
        if (!other.bad.has(slug)) {
          broken.push(`${slug}.bad_partners → ${partner}, but ${partner}.bad_partners does not include ${slug}`);
        }
      }
    }
    expect(broken, broken.join('\n')).toEqual([]);
  });
});

// === Welle O.1 — Heilpflanzen-Tiefe (neue optionale Felder) ===
describe('Welle O.1 — extended medicinal fields', () => {
  it('O.1 #1: accepts plant with uses[].plant_part + evidence_level + preparation', () => {
    const p = {
      ...validPlant,
      uses: [{
        ...validPlant.uses[0],
        plant_part: 'leaf',
        evidence_level: 'ema_well_established',
        preparation: {
          amount_dry_g: { min: 1, max: 2 },
          water_ml: 150,
          steep_min: 10,
          doses_per_day: 3,
          max_duration_weeks: 2,
        },
      }],
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('O.1 #2: rejects bad plant_part enum value', () => {
    const p = {
      ...validPlant,
      uses: [{ ...validPlant.uses[0], plant_part: 'magic' }],
    };
    expect(() => validatePlant(p)).toThrow(/plant_part/);
  });

  it('O.1 #3: rejects bad evidence_level enum value', () => {
    const p = {
      ...validPlant,
      uses: [{ ...validPlant.uses[0], evidence_level: 'gut_feeling' }],
    };
    expect(() => validatePlant(p)).toThrow(/evidence_level/);
  });

  it('O.1 #4: rejects preparation.amount_dry_g with non-number min', () => {
    const p = {
      ...validPlant,
      uses: [{
        ...validPlant.uses[0],
        preparation: { amount_dry_g: { min: 'one', max: 2 } },
      }],
    };
    expect(() => validatePlant(p)).toThrow(/amount_dry_g/);
  });

  it('O.1 #5: accepts safety.pregnancy + lactation + children structured', () => {
    const p = {
      ...validPlant,
      safety: {
        ...validPlant.safety,
        pregnancy: { status: 'contraindicated', note: { de: 'meiden', en: 'avoid' } },
        lactation: { status: 'caution' },
        children: { status: 'safe' },
      },
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('O.1 #6: rejects safety.pregnancy with unknown status', () => {
    const p = {
      ...validPlant,
      safety: { ...validPlant.safety, pregnancy: { status: 'maybe_ok' } },
    };
    expect(() => validatePlant(p)).toThrow(/pregnancy/);
  });

  it('O.1 #7: accepts safety.drug_interactions[]', () => {
    const p = {
      ...validPlant,
      safety: {
        ...validPlant.safety,
        drug_interactions: [{
          drug_class: 'MAO-Hemmer',
          mechanism: { de: 'Hypertensive Krise möglich', en: 'Hypertensive crisis possible' },
          severity: 'avoid',
          source_id: 'src_1',
        }],
      },
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('O.1 #8: rejects drug_interaction with unknown severity', () => {
    const p = {
      ...validPlant,
      safety: {
        ...validPlant.safety,
        drug_interactions: [{
          drug_class: 'X',
          mechanism: { de: 'a', en: 'b' },
          severity: 'panic',
        }],
      },
    };
    expect(() => validatePlant(p)).toThrow(/severity/);
  });

  it('O.1 #9: accepts top-level constituents[]', () => {
    const p = {
      ...validPlant,
      constituents: [
        { name: 'Hypericin', category: 'phenolic_acid', percent_range: '0.05-0.3%', plant_part: 'aerial_parts' },
        { name: 'Menthol', category: 'essential_oil' },
      ],
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('O.1 #10: rejects constituent with unknown category', () => {
    const p = {
      ...validPlant,
      constituents: [{ name: 'X', category: 'magic_dust' }],
    };
    expect(() => validatePlant(p)).toThrow(/category/);
  });

  it('O.1 #11: accepts top-level harvest[]', () => {
    const p = {
      ...validPlant,
      harvest: [
        { plant_part: 'leaf', best_months: [5, 6, 7], storage_months: 12 },
        { plant_part: 'root', best_months: [9, 10] },
      ],
    };
    expect(() => validatePlant(p)).not.toThrow();
  });

  it('O.1 #12: rejects harvest entry with out-of-range month', () => {
    const p = {
      ...validPlant,
      harvest: [{ plant_part: 'leaf', best_months: [13] }],
    };
    expect(() => validatePlant(p)).toThrow(/month/);
  });

  it('O.1 #13: existing plant (no new fields) still validates — backwards-compat', () => {
    expect(() => validatePlant(validPlant)).not.toThrow();
  });

  it('O.1 #14: accepts uses[].age_restriction', () => {
    const p = {
      ...validPlant,
      uses: [{ ...validPlant.uses[0], age_restriction: { min_age: 12, note: { de: 'ab 12', en: 'age 12+' } } }],
    };
    expect(() => validatePlant(p)).not.toThrow();
  });
});
