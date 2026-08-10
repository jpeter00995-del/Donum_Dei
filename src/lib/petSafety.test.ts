// === Tests: Haustier-Sicherheit ===
// Der Kern dieser Tests ist der Datenlauf ganz unten: die beiden
// Haustier-Felder duerfen sich nie wieder widersprechen.

import { describe, it, expect } from 'vitest';
import type { Plant } from './types';
import { loadAllPlants } from './loadPlants';
import {
  getPetCheck,
  isPetChecked,
  getPetStatus,
  isPetSafe,
  splitPetSafe,
  petToxicPlants,
} from './petSafety';

// === 1. TESTDATEN ===
function pflanze(over: Record<string, unknown> = {}): Plant {
  return {
    slug: 'test',
    names: { de: 'Test', en: 'Test', latin: 'Testus testus' },
    family: { de: 'Testgewächse', en: 'Test family', latin: 'Testaceae' },
    description: { de: 'x', en: 'x' },
    teaser: { de: 'x', en: 'x' },
    uses: [],
    season: { active_months: [1], harvest_part: { de: 'Blatt', en: 'leaf' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: 'x.webp', alt: { de: 'x', en: 'x' }, license: 'CC0', author: 'x', source_url: 'x' },
    ...over,
  } as unknown as Plant;
}

const beleg = {
  source: 'aspca' as const,
  accessed: '2026-08-10',
  match: 'species' as const,
  entry: 'basil',
  entry_name: 'Basil',
  listing: ['non_toxic_dogs' as const, 'non_toxic_cats' as const],
};

// === 2. BELEG ===
describe('isPetChecked', () => {
  it('ist wahr nur mit ASPCA-Beleg', () => {
    expect(isPetChecked(pflanze({ safety: { pet_toxic: false, pet_check: beleg } }))).toBe(true);
    expect(isPetChecked(pflanze({ safety: { pet_toxic: false } }))).toBe(false);
  });

  it('gibt den Beleg zurueck', () => {
    expect(getPetCheck(pflanze({ safety: { pet_check: beleg } }))?.entry).toBe('basil');
    expect(getPetCheck(pflanze())).toBeUndefined();
  });
});

// === 3. EINSTUFUNG ===
describe('getPetStatus', () => {
  it('ohne Angabe: unbekannt', () => {
    expect(getPetStatus(pflanze({ safety: {} }))).toBe('unknown');
  });

  it('pet_toxic true: giftig', () => {
    expect(getPetStatus(pflanze({ safety: { pet_toxic: true } }))).toBe('toxic');
  });

  it('pet_toxic false: sicher', () => {
    expect(getPetStatus(pflanze({ safety: { pet_toxic: false } }))).toBe('safe');
  });

  it('generell giftige Pflanze gilt nie als haustiersicher', () => {
    const p = pflanze({ safety: { pet_toxic: false, toxicity_level: 'toxic' } });
    expect(getPetStatus(p)).toBe('toxic');
    expect(isPetSafe(p)).toBe(false);
  });
});

// === 4. LISTEN ===
describe('splitPetSafe', () => {
  it('trennt belegt von unbelegt und sortiert alphabetisch', () => {
    const plants = [
      pflanze({ slug: 'b', names: { de: 'Basilikum', en: 'Basil', latin: 'B' }, safety: { pet_toxic: false, pet_check: beleg } }),
      pflanze({ slug: 'a', names: { de: 'Ackerminze', en: 'Mint', latin: 'A' }, safety: { pet_toxic: false } }),
      pflanze({ slug: 'g', names: { de: 'Giftig', en: 'Toxic', latin: 'G' }, safety: { pet_toxic: true } }),
    ];
    const { checked, unchecked } = splitPetSafe(plants, 'de');
    expect(checked.map(p => p.slug)).toEqual(['b']);
    expect(unchecked.map(p => p.slug)).toEqual(['a']);
    expect(petToxicPlants(plants, 'de').map(p => p.slug)).toEqual(['g']);
  });
});

// === 5. DATENLAUF ueber alle echten Pflanzen ===
describe('Pflanzendaten', () => {
  const alle = loadAllPlants();

  it('indoor_growing.pet_safe widerspricht nie safety.pet_toxic', () => {
    const widerspruch = alle
      .filter(p => p.indoor_growing && p.indoor_growing.pet_safe !== undefined)
      .filter(p => p.safety?.pet_toxic !== undefined)
      .filter(p => p.indoor_growing!.pet_safe !== (p.safety!.pet_toxic === false))
      .map(p => p.slug);
    expect(widerspruch).toEqual([]);
  });

  it('jeder Beleg nennt Quelle, Datum und mindestens eine Liste', () => {
    for (const p of alle) {
      const check = getPetCheck(p);
      if (!check) continue;
      expect(check.source).toBe('aspca');
      expect(check.accessed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(check.listing.length).toBeGreaterThan(0);
    }
  });

  it('ein Beleg passt immer zur Einstufung', () => {
    for (const p of alle) {
      const check = getPetCheck(p);
      if (!check) continue;
      const giftigLaut = check.listing.some(l => l.startsWith('toxic_'));
      expect(p.safety?.pet_toxic).toBe(giftigLaut);
    }
  });

  it('es gibt belegte und unbelegte Angaben — beide Gruppen sind nicht leer', () => {
    const { checked, unchecked } = splitPetSafe(alle, 'de');
    expect(checked.length).toBeGreaterThan(0);
    expect(unchecked.length).toBeGreaterThan(0);
  });
});
