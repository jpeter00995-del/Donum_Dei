import { describe, it, expect } from 'vitest';
import { isInternalUse, splitUsesForToxicity } from './toxicUses';
import type { Plant, PlantUse } from './types';

// Minimaler Use-Stub (nur die Felder, die der Split liest).
const mkUse = (ie: 'internal' | 'external' | 'both', evidence?: string): PlantUse =>
  ({ internal_external: ie, evidence_level: evidence, form: 'tea', target: [], description: { de: '', en: '' }, source_ids: [] } as unknown as PlantUse);

const mkPlant = (level: 'none' | 'caution' | 'toxic' | undefined, uses: PlantUse[]): Plant =>
  ({ uses, safety: { toxicity_level: level } } as unknown as Plant);

describe('isInternalUse', () => {
  it('internal + both gelten als innerlich, external nicht', () => {
    expect(isInternalUse(mkUse('internal'))).toBe(true);
    expect(isInternalUse(mkUse('both'))).toBe(true);
    expect(isInternalUse(mkUse('external'))).toBe(false);
  });
});

describe('splitUsesForToxicity', () => {
  it('NICHT-giftige Pflanze: alle Anwendungen bleiben normal', () => {
    const uses = [mkUse('internal'), mkUse('external')];
    const r = splitUsesForToxicity(mkPlant('caution', uses));
    expect(r.normalUses).toHaveLength(2);
    expect(r.historicalUses).toHaveLength(0);
  });

  it('hochgiftige Pflanze: innere Anwendungen wandern in den Warn-Kasten', () => {
    const internal = mkUse('internal');
    const both = mkUse('both');
    const external = mkUse('external');
    const r = splitUsesForToxicity(mkPlant('toxic', [internal, both, external]));
    expect(r.normalUses).toEqual([external]);
    expect(r.historicalUses).toEqual([internal, both]);
  });

  it('hochgiftige Pflanze: zugelassene (ema_well_established) innere Anwendung bleibt normal', () => {
    // z.B. Efeu-Hustensaft, Rosskastanien-Venenmittel — zugelassen, kein Warn-Kasten.
    const approved = mkUse('internal', 'ema_well_established');
    const traditional = mkUse('internal'); // keine starke Evidenz → historisch
    const r = splitUsesForToxicity(mkPlant('toxic', [approved, traditional]));
    expect(r.normalUses).toEqual([approved]);
    expect(r.historicalUses).toEqual([traditional]);
  });

  it('hochgiftige Pflanze nur mit äußerer Anwendung: kein Warn-Kasten', () => {
    const r = splitUsesForToxicity(mkPlant('toxic', [mkUse('external')]));
    expect(r.normalUses).toHaveLength(1);
    expect(r.historicalUses).toHaveLength(0);
  });

  it('fehlendes toxicity_level wird wie nicht-giftig behandelt', () => {
    const uses = [mkUse('internal')];
    const r = splitUsesForToxicity(mkPlant(undefined, uses));
    expect(r.historicalUses).toHaveLength(0);
    expect(r.normalUses).toHaveLength(1);
  });
});
