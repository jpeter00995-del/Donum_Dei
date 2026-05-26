import { describe, it, expect } from 'vitest';
import {
  zoneFromPostalCode,
  listClimateZones,
  getClimateZone,
} from './climateZone';

// Pattern aus validatePlant.ts — Zone-Strings müssen [0-9]{1,2}[ab]? matchen,
// damit sie in Plant.garden_meta.climate_zones gültig sind (Task 2 Kompatibilität).
const CLIMATE_ZONE_RE = /^[0-9]{1,2}[ab]?$/;

describe('climate_zones.json data', () => {
  it('contains the 10 DACH+SEE relevant USDA zones', () => {
    const zones = listClimateZones().map(z => z.zone);
    expect(zones).toEqual([
      '5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b', '9a', '9b',
    ]);
  });

  it('every zone label matches the validator pattern from Task 2', () => {
    for (const entry of listClimateZones()) {
      expect(entry.zone).toMatch(CLIMATE_ZONE_RE);
    }
  });
});

describe('getClimateZone', () => {
  it('returns the matching entry with bilingual descriptions', () => {
    const z = getClimateZone('7a');
    expect(z).not.toBeNull();
    expect(z?.zone).toBe('7a');
    expect(typeof z?.description_de).toBe('string');
    expect(typeof z?.description_en).toBe('string');
    expect(z?.temp_range_celsius.min).toBeLessThan(z!.temp_range_celsius.max);
  });

  it('returns null for unknown zones', () => {
    expect(getClimateZone('13a')).toBeNull();
  });
});

describe('zoneFromPostalCode — DE', () => {
  it('maps Berlin (PLZ 10115) to 7a', () => {
    expect(zoneFromPostalCode('DE', '10115')).toBe('7a');
  });

  it('maps Köln (PLZ 50667) to 8a', () => {
    expect(zoneFromPostalCode('DE', '50667')).toBe('8a');
  });

  it('rejects German PLZ of wrong length', () => {
    expect(zoneFromPostalCode('DE', '1234')).toBeNull();
  });
});

describe('zoneFromPostalCode — AT', () => {
  it('maps Wien (PLZ 1010) to 7a', () => {
    expect(zoneFromPostalCode('AT', '1010')).toBe('7a');
  });

  it('maps Innsbruck (PLZ 6020) to 5b (Alpen konservativ)', () => {
    expect(zoneFromPostalCode('AT', '6020')).toBe('5b');
  });
});

describe('zoneFromPostalCode — CH', () => {
  it('maps Zürich (PLZ 8001) to 7a', () => {
    expect(zoneFromPostalCode('CH', '8001')).toBe('7a');
  });

  it('maps Genf (PLZ 1200) to 8a', () => {
    expect(zoneFromPostalCode('CH', '1200')).toBe('8a');
  });
});

describe('zoneFromPostalCode — BG', () => {
  it('maps Sofia (PLZ 1000) to 6b', () => {
    expect(zoneFromPostalCode('BG', '1000')).toBe('6b');
  });

  it('maps Varna (PLZ 9000) to 7b', () => {
    expect(zoneFromPostalCode('BG', '9000')).toBe('7b');
  });

  it('maps Burgas coast (PLZ 8000) to 8a', () => {
    expect(zoneFromPostalCode('BG', '8000')).toBe('8a');
  });
});

describe('zoneFromPostalCode — fallbacks and invalid inputs', () => {
  it('returns null for unsupported country', () => {
    expect(zoneFromPostalCode('FR', '75001')).toBeNull();
  });

  it('returns null for non-digit postal code', () => {
    expect(zoneFromPostalCode('DE', 'ABCDE')).toBeNull();
  });

  it('returns null for empty postal code', () => {
    expect(zoneFromPostalCode('DE', '')).toBeNull();
  });

  it('returned zone strings always match the validator pattern', () => {
    const samples: Array<['DE' | 'AT' | 'CH' | 'BG', string]> = [
      ['DE', '10115'], ['DE', '80331'], ['DE', '20095'],
      ['AT', '1010'], ['AT', '5020'], ['AT', '9020'],
      ['CH', '8001'], ['CH', '3000'], ['CH', '6900'],
      ['BG', '1000'], ['BG', '4000'], ['BG', '8000'],
    ];
    for (const [country, postal] of samples) {
      const z = zoneFromPostalCode(country, postal);
      expect(z).not.toBeNull();
      expect(z!).toMatch(CLIMATE_ZONE_RE);
    }
  });
});
