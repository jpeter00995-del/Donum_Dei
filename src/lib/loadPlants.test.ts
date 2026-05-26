import { describe, it, expect } from 'vitest';
import { plantsToSeasons, monthsToSeasons } from './loadPlants';

describe('monthsToSeasons', () => {
  it('maps April-June to spring+summer', () => {
    expect(monthsToSeasons([4, 5, 6])).toEqual(expect.arrayContaining(['spring', 'summer']));
  });
  it('maps July only to summer', () => {
    expect(monthsToSeasons([7])).toEqual(['summer']);
  });
  it('maps January to winter', () => {
    expect(monthsToSeasons([1])).toEqual(['winter']);
  });
  it('returns empty for empty input', () => {
    expect(monthsToSeasons([])).toEqual([]);
  });
  it('does not duplicate seasons', () => {
    expect(monthsToSeasons([6, 7, 8])).toEqual(['summer']);
  });
});

describe('plantsToSeasons', () => {
  it('extracts unique seasons from a plant array', () => {
    const plants = [
      { season: { active_months: [4, 5] } },
      { season: { active_months: [7, 8] } },
    ] as any;
    expect(plantsToSeasons(plants)).toEqual(expect.arrayContaining(['spring', 'summer']));
  });
});

describe('indoor filter combinations', () => {
  it('intersects purpose AND pet_safe filters', async () => {
    const { loadIndoorPlants } = await import('./loadPlants');
    const all = loadIndoorPlants();
    const filtered = all.filter(p =>
      p.indoor_growing!.purpose.includes('air_purifying') &&
      p.indoor_growing!.pet_safe
    );
    // Chlorophytum ist die kanonische haustier-sichere Luftreinigungs-Pflanze
    expect(filtered.some(p => p.slug === 'chlorophytum-comosum')).toBe(true);
  });
});

describe('loadIndoorPlants', () => {
  it('returns only plants with indoor_growing.suitable=true', async () => {
    const { loadIndoorPlants } = await import('./loadPlants');
    const plants = loadIndoorPlants();
    expect(plants.length).toBeGreaterThan(0);
    for (const p of plants) {
      expect(p.indoor_growing?.suitable).toBe(true);
    }
  });

  it('sorts by difficulty ascending', async () => {
    const { loadIndoorPlants } = await import('./loadPlants');
    const plants = loadIndoorPlants();
    for (let i = 1; i < plants.length; i++) {
      expect(plants[i].indoor_growing!.difficulty).toBeGreaterThanOrEqual(plants[i - 1].indoor_growing!.difficulty);
    }
  });
});
