import { describe, it, expect } from 'vitest';
import { isFungus, isControlled, isEverydayPlant } from './speciesFilters';
import { loadAllPlants } from './loadPlants';
import type { Plant } from './types';

// === 1. FIXTURES ===
// Minimal-Stubs — nur die Felder, welche die Prädikate lesen.
const everydayPlant = { kingdom: 'plant' } as Plant;
const plainPlant = {} as Plant; // kingdom fehlt → impliziert Pflanze
const mushroom = { kingdom: 'fungus' } as Plant;
const controlledPlant = { kingdom: 'plant', legal_status: { controlled: true } } as Plant;
const controlledFungus = { kingdom: 'fungus', legal_status: { controlled: true } } as Plant;
const nonControlled = { legal_status: { controlled: false } } as Plant;

// === 2. PRÄDIKATE ===
describe('isFungus', () => {
  it('true nur für kingdom === fungus', () => {
    expect(isFungus(mushroom)).toBe(true);
    expect(isFungus(everydayPlant)).toBe(false);
    expect(isFungus(plainPlant)).toBe(false);
  });
});

describe('isControlled', () => {
  it('true nur bei legal_status.controlled === true', () => {
    expect(isControlled(controlledPlant)).toBe(true);
    expect(isControlled(controlledFungus)).toBe(true);
    expect(isControlled(nonControlled)).toBe(false);
    expect(isControlled(plainPlant)).toBe(false);
  });
});

describe('isEverydayPlant', () => {
  it('false für Pilze UND für kontrollierte Arten', () => {
    expect(isEverydayPlant(everydayPlant)).toBe(true);
    expect(isEverydayPlant(plainPlant)).toBe(true);
    expect(isEverydayPlant(mushroom)).toBe(false);
    expect(isEverydayPlant(controlledPlant)).toBe(false);
    expect(isEverydayPlant(controlledFungus)).toBe(false);
  });
});

// === 3. PARTITIONS-INVARIANTE (echte Daten) ===
// Haupt-Grid (everyday) + Pilz-Seite (fungus) + Rauschpflanzen-Seite (controlled)
// müssen zusammen JEDEN Eintrag genau einmal erfassen — kein Eintrag fällt durch,
// und ein kontrollierter Pilz darf bewusst auf zwei Seiten erscheinen (Cross-Listing).
describe('Themen-Seiten-Partition (Live-Daten)', () => {
  const all = loadAllPlants();

  it('jeder Eintrag ist everyday XOR (fungus ODER controlled)', () => {
    for (const p of all) {
      const onTheme = isFungus(p) || isControlled(p);
      expect(isEverydayPlant(p)).toBe(!onTheme);
    }
  });

  it('kontrollierte Pilze erscheinen auf Pilz- UND Rauschpflanzen-Seite (Cross-Listing)', () => {
    const crossListed = all.filter(p => isFungus(p) && isControlled(p));
    expect(crossListed.length).toBeGreaterThan(0);
  });

  it('Haupt-Grid enthält keine kontrollierten Arten und keine Pilze', () => {
    const grid = all.filter(isEverydayPlant);
    expect(grid.some(isControlled)).toBe(false);
    expect(grid.some(isFungus)).toBe(false);
  });
});
