// Tests for beetLayout.computeBeetLayout + helpers.
// (Tests für den Beet-Layout-Algorithmus — Zonen, Cluster, Warnungen.)

import { describe, it, expect } from 'vitest';
import {
  computeBeetLayout,
  deriveBeetSize,
  zoneFor,
  clusterSize,
  type CartEntry,
} from './beetLayout';
import type { Plant, CompanionPlanting, GardenMeta, PermacultureFunction, GardenType } from './types';

// === Fixtures ===

function plant(
  slug: string,
  opts: {
    spacing_cm?: number;
    permaculture_functions?: PermacultureFunction[];
    companion?: CompanionPlanting;
    garden_types?: GardenType[];
  } = {},
): Plant {
  const gm: GardenMeta = {
    climate_zones: ['7a'],
    sowing_window: { outdoor_direct: { start_month: 4, end_month: 6 } },
    harvest_window: { start_month: 7, end_month: 9 },
    days_to_harvest: 90,
    spacing_cm: opts.spacing_cm ?? 30,
    garden_type: opts.garden_types ?? ['raised_bed', 'field'],
    difficulty: 1,
  };
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
    garden_meta: gm,
    permaculture_functions: opts.permaculture_functions,
    companion_planting: opts.companion,
  };
}

function entry(slug: string, qty: number): CartEntry {
  return { slug, quantity: qty };
}

// === Tests ===

describe('beetLayout.zoneFor', () => {
  it('returns north for vertical_high plants (Mais, Tomate)', () => {
    const corn = plant('mais', { permaculture_functions: ['vertical_high'] });
    expect(zoneFor(corn)).toBe('north');
  });

  it('returns south for vertical_low or ground_cover plants', () => {
    const lettuce = plant('salat', { permaculture_functions: ['vertical_low'] });
    const clover = plant('klee', { permaculture_functions: ['ground_cover'] });
    expect(zoneFor(lettuce)).toBe('south');
    expect(zoneFor(clover)).toBe('south');
  });

  it('returns middle as default when no vertical tag is set', () => {
    const basil = plant('basilikum');
    expect(zoneFor(basil)).toBe('middle');
  });
});

describe('beetLayout.clusterSize', () => {
  it('computes ceil(sqrt(qty)) × spacing grid', () => {
    const p = plant('salat', { spacing_cm: 25 });
    // 12 Salat à 25cm spacing = ceil(sqrt(12))=4 cols × ceil(12/4)=3 rows = 1m × 0.75m
    const { w, h } = clusterSize(p, 12);
    expect(w).toBeCloseTo(1.0, 3);
    expect(h).toBeCloseTo(0.75, 3);
  });

  it('falls back to default spacing when garden_meta is missing', () => {
    const p: Plant = { ...plant('x'), garden_meta: undefined };
    const { w, h } = clusterSize(p, 1);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });

  it('handles single plant correctly', () => {
    const p = plant('tomate', { spacing_cm: 60 });
    const { w, h } = clusterSize(p, 1);
    expect(w).toBeCloseTo(0.6, 3);
    expect(h).toBeCloseTo(0.6, 3);
  });
});

describe('beetLayout.deriveBeetSize', () => {
  it('derives a long shape for balcony (aspect ~5:1)', () => {
    const s = deriveBeetSize('balcony', 2);
    // width = sqrt(2 * 5) ≈ 3.16, height ≈ 0.63
    expect(s.width).toBeGreaterThan(s.height * 4);
  });

  it('derives a more rectangular shape for raised_bed (aspect ~2:1)', () => {
    const s = deriveBeetSize('raised_bed', 8);
    // width = sqrt(8 * 2) = 4, height = 2
    expect(s.width).toBeCloseTo(4, 0);
    expect(s.height).toBeCloseTo(2, 0);
  });

  it('respects minimum dimensions for very small areas', () => {
    const s = deriveBeetSize('raised_bed', 0.1);
    expect(s.width).toBeGreaterThanOrEqual(1.0);
    expect(s.height).toBeGreaterThanOrEqual(0.5);
  });
});

describe('beetLayout.computeBeetLayout', () => {
  it('places vertical_high plants in the NORTH zone (top, y small)', () => {
    const corn = plant('mais', { permaculture_functions: ['vertical_high'] });
    const salat = plant('salat', { permaculture_functions: ['vertical_low'] });
    const layout = computeBeetLayout(
      [entry('mais', 4), entry('salat', 8)],
      'raised_bed', 8,
      [corn, salat],
    );
    const maisCell = layout.cells.find(c => c.slug === 'mais')!;
    const salatCell = layout.cells.find(c => c.slug === 'salat')!;
    expect(maisCell.zone).toBe('north');
    expect(salatCell.zone).toBe('south');
    expect(maisCell.y).toBeLessThan(salatCell.y);
  });

  it('clusters companion plants in the same zone next to each other', () => {
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['basilikum'], bad_partners: [], source: 'test' },
    });
    const basilikum = plant('basilikum', {
      // intentionally also vertical_high so they share a zone
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['tomate'], bad_partners: [], source: 'test' },
    });
    const fenchel = plant('fenchel', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['tomate'], source: 'test' },
    });
    const layout = computeBeetLayout(
      [entry('tomate', 2), entry('basilikum', 4), entry('fenchel', 2)],
      'field', 12,
      [tomate, basilikum, fenchel],
    );
    const t = layout.cells.find(c => c.slug === 'tomate')!;
    const b = layout.cells.find(c => c.slug === 'basilikum')!;
    // Tomate + Basilikum sollten direkt nebeneinander platziert sein
    // (kleinere x-Distanz als zwischen unverwandten Cells).
    const dxTB = Math.abs((t.x + t.w / 2) - (b.x + b.w / 2));
    expect(dxTB).toBeLessThan(t.w + b.w); // unmittelbar benachbart
  });

  it('emits a bad_neighbor warning (severity=warning) when bed is too narrow for auto-split', () => {
    // Welle N: auf schmalen Beeten (Balkon, sehr kleine Hochbeete) ist der
    // Bipartite-Split physisch unmöglich → klassische Warnung bleibt.
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['fenchel'], source: 'test' },
      spacing_cm: 40,
    });
    const fenchel = plant('fenchel', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['tomate'], source: 'test' },
      spacing_cm: 40,
    });
    // Balcony 0.4m² → width ≈ 1.4m < MIN_SPLIT_WIDTH_M (2m) → kein Split
    const layout = computeBeetLayout(
      [entry('tomate', 1), entry('fenchel', 1)],
      'balcony', 0.4,
      [tomate, fenchel],
    );
    const warn = layout.warnings.find(w => w.type === 'bad_neighbor');
    expect(warn).toBeDefined();
    expect(warn!.severity).toBe('warning');
    expect(warn!.plant_a).toMatch(/tomate|fenchel/);
    expect(warn!.plant_b).toMatch(/tomate|fenchel/);
    expect(warn!.message_de).toContain('Abstand');
    expect(warn!.message_en).toContain('distance');
  });

  it('emits a sun_mismatch warning when a tall plant ends up south of a low one with x-overlap', () => {
    const mais = plant('mais', { permaculture_functions: ['vertical_high'], spacing_cm: 30 });
    const paprika = plant('paprika', { permaculture_functions: ['vertical_low'], spacing_cm: 30 });
    const layout = computeBeetLayout(
      [entry('mais', 1), entry('paprika', 1)],
      'field', 4,
      [mais, paprika],
    );
    // Manuelle Verschiebung: mais nach Süden, paprika nach Norden (überlappend in x)
    const maisCell = layout.cells.find(c => c.slug === 'mais')!;
    const paprikaCell = layout.cells.find(c => c.slug === 'paprika')!;
    maisCell.x = 0;
    maisCell.y = 1.5;
    paprikaCell.x = 0;
    paprikaCell.y = 0;
    // Re-run detection only would need an internal helper; rebuild via re-call:
    // Verifiziere stattdessen über User-Positionen API.
    const layout2 = computeBeetLayout(
      [entry('mais', 1), entry('paprika', 1)],
      'field', 4,
      [mais, paprika],
      {
        user_positions: [
          { slug: 'mais', x: 0, y: 1.5 },
          { slug: 'paprika', x: 0, y: 0 },
        ],
      },
    );
    const warn = layout2.warnings.find(w => w.type === 'sun_mismatch');
    expect(warn).toBeDefined();
    expect(warn!.message_de).toContain('Schatten');
    expect(warn!.message_en).toContain('shade');
  });

  it('emits a too_crowded warning when plants overflow the bed', () => {
    const huge = plant('riese', { spacing_cm: 200 }); // 2m × 2m pro Pflanze
    const layout = computeBeetLayout(
      [entry('riese', 4)],
      'raised_bed', 1, // nur 1 m² Beet
      [huge],
    );
    const warn = layout.warnings.find(w => w.type === 'too_crowded');
    expect(warn).toBeDefined();
    expect(warn!.message_de).toContain('zu eng');
    expect(warn!.message_en).toContain('crowded');
  });

  it('respects user_positions overrides over auto-layout', () => {
    const salat = plant('salat', { permaculture_functions: ['vertical_low'], spacing_cm: 25 });
    const layout = computeBeetLayout(
      [entry('salat', 4)],
      'raised_bed', 4,
      [salat],
      { user_positions: [{ slug: 'salat', x: 1.5, y: 0.5 }] },
    );
    const cell = layout.cells.find(c => c.slug === 'salat')!;
    expect(cell.x).toBeCloseTo(1.5, 3);
    expect(cell.y).toBeCloseTo(0.5, 3);
    expect(cell.user_positioned).toBe(true);
  });

  it('returns empty layout for empty cart', () => {
    const layout = computeBeetLayout([], 'raised_bed', 4, []);
    expect(layout.cells).toHaveLength(0);
    expect(layout.warnings).toHaveLength(0);
    expect(layout.garden_type).toBe('raised_bed');
    expect(layout.total_size.width).toBeGreaterThan(0);
  });

  it('skips cart entries with unknown slug or zero quantity', () => {
    const tomate = plant('tomate');
    const layout = computeBeetLayout(
      [entry('tomate', 0), entry('does-not-exist', 5), entry('tomate', 2)],
      'raised_bed', 4,
      [tomate],
    );
    expect(layout.cells).toHaveLength(1);
    expect(layout.cells[0].slug).toBe('tomate');
    expect(layout.cells[0].quantity).toBe(2);
  });

  // === Welle N: Conflict-Aware Bipartite Split ===
  // (Wenn bad_partners im selben Zonen-Band landen, soll der Layouter sie
  // automatisch auf gegenüberliegende Seiten des Beets verschieben und gute
  // Partner mitnehmen — statt nur eine "zu nah"-Warnung anzuzeigen.)

  it('Welle N #3: team-B good_partner (Bohnen with Gurke) follows Gurke to the right side', () => {
    // Bohnen ist guter Partner von Gurke (und Tomate ist bad mit Gurke).
    // → Bohnen soll mit Gurke nach rechts wandern, nicht bei Tomate links bleiben.
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['gurke'], source: 'test' },
      spacing_cm: 40,
    });
    const gurke = plant('gurke', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['bohne'], bad_partners: ['tomate'], source: 'test' },
      spacing_cm: 40,
    });
    const bohne = plant('bohne', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['gurke'], bad_partners: [], source: 'test' },
      spacing_cm: 30,
    });
    const layout = computeBeetLayout(
      [entry('tomate', 1), entry('gurke', 1), entry('bohne', 2)],
      'field', 12,
      [tomate, gurke, bohne],
    );
    const t = layout.cells.find(c => c.slug === 'tomate')!;
    const g = layout.cells.find(c => c.slug === 'gurke')!;
    const b = layout.cells.find(c => c.slug === 'bohne')!;
    // Bohne soll näher an Gurke (rechts) als an Tomate (links) sein.
    const distBohneGurke = Math.abs((b.x + b.w / 2) - (g.x + g.w / 2));
    const distBohneTomate = Math.abs((b.x + b.w / 2) - (t.x + t.w / 2));
    expect(distBohneGurke).toBeLessThan(distBohneTomate);
  });

  it('Welle N #2: double-partner (good with both conflict sides) lands in buffer middle', () => {
    // Calendula ist guter Partner von Tomate UND Gurke — soll zwischen
    // beiden Teams in der Pufferzone stehen (Trennwand-Funktion).
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['calendula'], bad_partners: ['gurke'], source: 'test' },
      spacing_cm: 40,
    });
    const gurke = plant('gurke', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['calendula'], bad_partners: ['tomate'], source: 'test' },
      spacing_cm: 40,
    });
    const calendula = plant('calendula', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: ['tomate', 'gurke'], bad_partners: [], source: 'test' },
      spacing_cm: 30,
    });
    const layout = computeBeetLayout(
      [entry('tomate', 1), entry('gurke', 1), entry('calendula', 2)],
      'field', 12, // ~4.24m breit
      [tomate, gurke, calendula],
    );
    const t = layout.cells.find(c => c.slug === 'tomate')!;
    const g = layout.cells.find(c => c.slug === 'gurke')!;
    const c = layout.cells.find(c => c.slug === 'calendula')!;
    const beetWidth = layout.total_size.width;
    const cCenter = c.x + c.w / 2;
    const middle = beetWidth / 2;
    // Calendula soll näher an der Mitte sein als jede Seite
    expect(Math.abs(cCenter - middle)).toBeLessThan(beetWidth / 4);
    // Calendula soll zwischen Tomate und Gurke liegen (x-mäßig)
    const tCenter = t.x + t.w / 2;
    const gCenter = g.x + g.w / 2;
    const minSide = Math.min(tCenter, gCenter);
    const maxSide = Math.max(tCenter, gCenter);
    expect(cCenter).toBeGreaterThan(minSide);
    expect(cCenter).toBeLessThan(maxSide);
  });

  it('Welle N #6: 3-way conflict — first pair splits, additional conflicts keep severity=warning', () => {
    // Tomate, Gurke, Fenchel — alle gegenseitig bad. Algorithmus splittet
    // erstes Paar (z.B. Tomate↔Gurke), für Fenchel bleibt mind. 1 weitere
    // Warnung mit severity=warning.
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['gurke', 'fenchel'], source: 'test' },
      spacing_cm: 40,
    });
    const gurke = plant('gurke', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['tomate', 'fenchel'], source: 'test' },
      spacing_cm: 40,
    });
    const fenchel = plant('fenchel', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['tomate', 'gurke'], source: 'test' },
      spacing_cm: 40,
    });
    const layout = computeBeetLayout(
      [entry('tomate', 1), entry('gurke', 1), entry('fenchel', 1)],
      'field', 12,
      [tomate, gurke, fenchel],
    );
    const bad = layout.warnings.filter(w => w.type === 'bad_neighbor');
    // Mindestens eine Warnung als info (gelöstes Paar), mindestens eine als warning (offen).
    expect(bad.some(w => w.severity === 'info')).toBe(true);
    expect(bad.some(w => w.severity === 'warning')).toBe(true);
  });

  it('Welle N #5: user-positioned plant becomes anchor — the other side moves around it', () => {
    // Tomate ist per Drag manuell platziert bei x=2.0 → respektieren.
    // Gurke (neu im Cart) muss wandern, nicht Tomate.
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['gurke'], source: 'test' },
      spacing_cm: 40,
    });
    const gurke = plant('gurke', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['tomate'], source: 'test' },
      spacing_cm: 40,
    });
    const layout = computeBeetLayout(
      [entry('tomate', 1), entry('gurke', 1)],
      'field', 12,
      [tomate, gurke],
      { user_positions: [{ slug: 'tomate', x: 2.0, y: 0.2 }] },
    );
    const t = layout.cells.find(c => c.slug === 'tomate')!;
    const g = layout.cells.find(c => c.slug === 'gurke')!;
    // Tomate bleibt exakt bei (2.0, 0.2) — user_positioned wird respektiert
    expect(t.x).toBeCloseTo(2.0, 3);
    expect(t.y).toBeCloseTo(0.2, 3);
    expect(t.user_positioned).toBe(true);
    // Gurke ist gewandert (steht nicht direkt bei Tomate)
    const dx = Math.abs((t.x + t.w / 2) - (g.x + g.w / 2));
    expect(dx).toBeGreaterThanOrEqual(1.0);
  });

  it('Welle N #1: auto-separates Tomate+Gurke to opposite sides when bed is wide enough', () => {
    const tomate = plant('tomate', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['gurke'], source: 'test' },
      spacing_cm: 40,
    });
    const gurke = plant('gurke', {
      permaculture_functions: ['vertical_high'],
      companion: { good_partners: [], bad_partners: ['tomate'], source: 'test' },
      spacing_cm: 40,
    });
    // Field 12 m² → width ≈ sqrt(12 * 1.5) ≈ 4.24m, plenty for split
    const layout = computeBeetLayout(
      [entry('tomate', 1), entry('gurke', 1)],
      'field', 12,
      [tomate, gurke],
    );
    const t = layout.cells.find(c => c.slug === 'tomate')!;
    const g = layout.cells.find(c => c.slug === 'gurke')!;
    const dx = Math.abs((t.x + t.w / 2) - (g.x + g.w / 2));
    const dy = Math.abs((t.y + t.h / 2) - (g.y + g.h / 2));
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThanOrEqual(1.0);
    // Warnung soll als info (nicht warning) erscheinen — Konflikt ist erkannt + gelöst
    const warn = layout.warnings.find(w => w.type === 'bad_neighbor');
    expect(warn).toBeDefined();
    expect(warn!.severity).toBe('info');
    expect(warn!.message_de).toMatch(/gegen[üu]berliegend|getrennt|Seiten gestellt/i);
  });

  it('computes layout within 50ms for 30 plants (performance budget)', () => {
    const plants: Plant[] = [];
    const cart: CartEntry[] = [];
    for (let i = 0; i < 30; i++) {
      const slug = `p${i}`;
      plants.push(plant(slug, {
        spacing_cm: 30 + (i % 5) * 10,
        permaculture_functions: i % 3 === 0 ? ['vertical_high'] : i % 3 === 1 ? ['vertical_low'] : undefined,
      }));
      cart.push(entry(slug, 1 + (i % 4)));
    }
    const t0 = performance.now();
    const layout = computeBeetLayout(cart, 'field', 20, plants);
    const elapsed = performance.now() - t0;
    expect(layout.cells.length).toBe(30);
    expect(elapsed).toBeLessThan(50);
  });
});
