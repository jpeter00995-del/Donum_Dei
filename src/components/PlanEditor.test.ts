// Tests for the pure helpers exported from PlanEditor.tsx.
// (Tests für die reinen Edit-Helpers; React-Render wird nicht getestet,
// da das Projekt im Node-vitest-Env läuft.)

import { describe, it, expect } from 'vitest';
import { setQuantity, removePlant, restorePlant, addPlant } from './PlanEditor';
import { applyOverrides } from './PlanView';
import type { PlanOverrides } from '@/lib/userProfile';
import type { RecommendedPlant } from '@/lib/gardenPlan';
import type { Plant } from '@/lib/types';

const EMPTY: PlanOverrides = { edits: {}, removed: [] };

function rec(slug: string, qty = 2): RecommendedPlant {
  return {
    plant_slug: slug,
    quantity: qty,
    sowing_method: 'outdoor_direct',
    score: 0.9,
    notes_de: `${qty}×`,
    notes_en: `${qty}×`,
  };
}

function plant(slug: string): Plant {
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
  };
}

describe('PlanEditor — setQuantity / removePlant / restorePlant / addPlant', () => {
  it('setQuantity stores a new explicit quantity, clamps to integers, and lifts a prior removal', () => {
    const after = setQuantity({ edits: {}, removed: ['tomato'] }, 'tomato', 4.7);
    expect(after.edits['tomato'].quantity).toBe(4);
    expect(after.removed).not.toContain('tomato');
  });

  it('removePlant adds the slug to `removed` exactly once and leaves edits untouched', () => {
    const o1 = removePlant(EMPTY, 'basil');
    const o2 = removePlant(o1, 'basil');
    expect(o2.removed).toEqual(['basil']);
    expect(o2.edits).toEqual({});
  });

  it('restorePlant drops both removal and any explicit edit so auto-quantity wins again', () => {
    const seeded: PlanOverrides = {
      edits: { basil: { plant_slug: 'basil', quantity: 6 } },
      removed: ['basil'],
    };
    const restored = restorePlant(seeded, 'basil');
    expect(restored.removed).toEqual([]);
    expect(restored.edits['basil']).toBeUndefined();
  });

  it('addPlant clamps to at least 1 even when called with 0 or negative', () => {
    const o1 = addPlant(EMPTY, 'mint', 0);
    expect(o1.edits['mint'].quantity).toBe(1);
    const o2 = addPlant(EMPTY, 'mint', -3);
    expect(o2.edits['mint'].quantity).toBe(1);
  });
});

describe('PlanView.applyOverrides — pure function used by the plan render path', () => {
  it('removes plants listed in `removed`, edits quantity in `edits`, and appends manually-added plants', () => {
    const base = [rec('tomato', 3), rec('basil', 2)];
    const overrides: PlanOverrides = {
      edits: {
        basil: { plant_slug: 'basil', quantity: 5 },
        radish: { plant_slug: 'radish', quantity: 10 },
      },
      removed: ['tomato'],
    };
    const db: Plant[] = [plant('tomato'), plant('basil'), plant('radish')];
    const out = applyOverrides(base, overrides, db);
    const map = new Map(out.map(r => [r.plant_slug, r]));
    expect(map.has('tomato')).toBe(false);
    expect(map.get('basil')!.quantity).toBe(5);
    expect(map.get('radish')!.quantity).toBe(10);
    expect(out.length).toBe(2);
  });

  it('drops entries whose explicit quantity is <= 0 (treated as a removal)', () => {
    const base = [rec('tomato', 3)];
    const out = applyOverrides(
      base,
      { edits: { tomato: { plant_slug: 'tomato', quantity: 0 } }, removed: [] },
      [plant('tomato')],
    );
    expect(out).toEqual([]);
  });
});
