import { describe, it, expect } from 'vitest';
import { istZierpflanzeOhneErnte, ernteMonate, pflanzenImMonat } from './harvestMonth';
import type { Plant } from './types';

// === 1. TESTDATEN ===
function pflanze(over: Record<string, unknown>): Plant {
  return {
    slug: 'test',
    names: { de: 'Test', en: 'Test', latin: 'Testus testus' },
    family: { de: 'Testgewächse', en: 'Test family', latin: 'Testaceae' },
    description: { de: 'x', en: 'x' },
    teaser: { de: 'x', en: 'x' },
    uses: [],
    season: { active_months: [1, 2, 3], harvest_part: { de: 'Blatt', en: 'leaf' } },
    safety: {},
    classical_quotes: [],
    sources: [],
    image: { filename: 'x.webp', alt: { de: 'x', en: 'x' }, license: 'CC0', author: 'x', source_url: 'x' },
    ...over,
  } as unknown as Plant;
}

// === 2. ZIERPFLANZEN ERKENNEN ===
describe('istZierpflanzeOhneErnte', () => {
  it('erkennt den Hinweis "dekorativ"', () => {
    const p = pflanze({ season: { active_months: [1], harvest_part: { de: 'ganze Pflanze (dekorativ)', en: 'whole plant (decorative)' } } });
    expect(istZierpflanzeOhneErnte(p)).toBe(true);
  });

  it('erkennt "Keine Ernte"', () => {
    const p = pflanze({ season: { active_months: [5], harvest_part: { de: 'Keine Ernte – tödlich giftig', en: 'no harvest' } } });
    expect(istZierpflanzeOhneErnte(p)).toBe(true);
  });

  it('laesst eine normale Heilpflanze durch', () => {
    expect(istZierpflanzeOhneErnte(pflanze({}))).toBe(false);
  });
});

// === 3. ERNTEMONATE ===
describe('ernteMonate', () => {
  it('nimmt harvest[], wenn vorhanden — nicht active_months', () => {
    const p = pflanze({
      season: { active_months: [1, 2, 3], harvest_part: { de: 'Blatt', en: 'leaf' } },
      harvest: [{ plant_part: 'leaf', best_months: [6, 7] }],
    });
    expect(ernteMonate(p)).toEqual([6, 7]);
  });

  it('fasst mehrere harvest-Eintraege zusammen und sortiert', () => {
    const p = pflanze({
      harvest: [
        { plant_part: 'leaf', best_months: [9, 5] },
        { plant_part: 'root', best_months: [5, 10] },
      ],
    });
    expect(ernteMonate(p)).toEqual([5, 9, 10]);
  });

  it('faellt auf active_months zurueck, wenn harvest[] fehlt', () => {
    expect(ernteMonate(pflanze({}))).toEqual([1, 2, 3]);
  });

  it('faellt auch bei leerem harvest[] zurueck', () => {
    expect(ernteMonate(pflanze({ harvest: [] }))).toEqual([1, 2, 3]);
  });
});

// === 4. FILTER FUER DIE MONATSSEITE ===
describe('pflanzenImMonat', () => {
  const heilpflanze = pflanze({ slug: 'heil', harvest: [{ plant_part: 'leaf', best_months: [1] }] });
  const zierpflanze = pflanze({
    slug: 'zier',
    season: { active_months: [1], harvest_part: { de: 'ganze Pflanze (dekorativ)', en: 'whole plant (decorative)' } },
  });
  const sommerpflanze = pflanze({ slug: 'sommer', harvest: [{ plant_part: 'leaf', best_months: [7] }] });
  const pilz = pflanze({ slug: 'pilz', season: { active_months: [1, 9], harvest_part: { de: 'Fruchtkörper', en: 'fruiting body' } } });

  it('nimmt Heilpflanzen mit passendem Erntemonat', () => {
    expect(pflanzenImMonat([heilpflanze, sommerpflanze], 1).map(p => p.slug)).toEqual(['heil']);
  });

  it('wirft Zierpflanzen raus, auch wenn der Monat passt', () => {
    expect(pflanzenImMonat([zierpflanze], 1)).toEqual([]);
  });

  it('behaelt Pilze ohne harvest[] ueber active_months', () => {
    expect(pflanzenImMonat([pilz], 9).map(p => p.slug)).toEqual(['pilz']);
  });

  it('liefert eine leere Liste, wenn nichts passt', () => {
    expect(pflanzenImMonat([heilpflanze, zierpflanze], 3)).toEqual([]);
  });
});
