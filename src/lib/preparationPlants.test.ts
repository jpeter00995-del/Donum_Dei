// === Tests: Zubereitungsarten ===
// Zwei Dinge muessen stimmen: die Zuordnung selbst, und die Zusage, dass auf
// einer Anleitungsseite keine giftige oder kontrollierte Art steht.

import { describe, it, expect } from 'vitest';
import type { Plant } from './types';
import type { UseForm } from './plantSchema';
import { loadAllPlants } from './loadPlants';
import {
  findPlantsForForm,
  countPlantsPerForm,
  formsOfPlant,
  istFuerAnleitungGeeignet,
} from './preparationPlants';
import {
  ZUBEREITUNG_DE,
  ZUBEREITUNG_EN,
  ZUBEREITUNG_SLUG_DE,
  ZUBEREITUNG_SLUG_EN,
  ZUBEREITUNG_REIHENFOLGE,
} from './preparationText';

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

function anwendung(form: UseForm, over: Record<string, unknown> = {}) {
  return {
    form,
    target: [],
    internal_external: 'internal',
    description: { de: 'x', en: 'x' },
    source_ids: [],
    ...over,
  };
}

// === 2. ZUORDNUNG ===
describe('findPlantsForForm', () => {
  it('findet nur Pflanzen mit der gesuchten Form', () => {
    const a = pflanze({ slug: 'a', names: { de: 'Anna', en: 'Anna', latin: 'A a' }, uses: [anwendung('tea')] });
    const b = pflanze({ slug: 'b', names: { de: 'Berta', en: 'Berta', latin: 'B b' }, uses: [anwendung('salve')] });
    const treffer = findPlantsForForm('tea', [a, b], 'de');
    expect(treffer.map(t => t.plant.slug)).toEqual(['a']);
  });

  it('zaehlt mehrere Anwendungen derselben Form', () => {
    const a = pflanze({ uses: [anwendung('tea'), anwendung('tea'), anwendung('bath')] });
    expect(findPlantsForForm('tea', [a], 'de')[0].anzahl).toBe(2);
  });

  it('bevorzugt die Anwendung mit Zubereitungsangabe als Begruendung', () => {
    const a = pflanze({
      uses: [
        anwendung('tea', { description: { de: 'ohne', en: 'without' } }),
        anwendung('tea', { description: { de: 'mit', en: 'with' }, preparation: { steep_min: 10 } }),
      ],
    });
    expect(findPlantsForForm('tea', [a], 'de')[0].use.description.de).toBe('mit');
  });

  it('sortiert nach dem Namen der jeweiligen Sprache', () => {
    const a = pflanze({ slug: 'a', names: { de: 'Zwiebel', en: 'Anise', latin: 'Z z' }, uses: [anwendung('tea')] });
    const b = pflanze({ slug: 'b', names: { de: 'Anis', en: 'Zucchini', latin: 'A a' }, uses: [anwendung('tea')] });
    expect(findPlantsForForm('tea', [a, b], 'de').map(t => t.plant.slug)).toEqual(['b', 'a']);
    expect(findPlantsForForm('tea', [a, b], 'en').map(t => t.plant.slug)).toEqual(['a', 'b']);
  });

  it('laesst giftige und kontrollierte Arten weg', () => {
    const giftig = pflanze({
      slug: 'giftig',
      safety: { warnings: { de: '', en: '' }, external_only: false, toxicity_level: 'toxic' },
      uses: [anwendung('tea')],
    });
    const kontrolliert = pflanze({
      slug: 'kontrolliert',
      legal_status: { controlled: true },
      uses: [anwendung('tea')],
    });
    expect(findPlantsForForm('tea', [giftig, kontrolliert], 'de')).toEqual([]);
  });
});

describe('countPlantsPerForm', () => {
  it('zaehlt je Pflanze nur einmal pro Form', () => {
    const a = pflanze({ uses: [anwendung('tea'), anwendung('tea')] });
    expect(countPlantsPerForm([a]).tea).toBe(1);
  });
});

describe('formsOfPlant', () => {
  it('liefert jede Form genau einmal', () => {
    const a = pflanze({ uses: [anwendung('tea'), anwendung('tea'), anwendung('bath')] });
    expect(formsOfPlant(a).sort()).toEqual(['bath', 'tea']);
  });
});

// === 3. TEXTE VOLLSTAENDIG ===
describe('Zubereitungstexte', () => {
  it('deckt jede Form in beiden Sprachen ab', () => {
    for (const form of ZUBEREITUNG_REIHENFOLGE) {
      for (const texte of [ZUBEREITUNG_DE, ZUBEREITUNG_EN]) {
        const t = texte[form];
        expect(t, form).toBeDefined();
        expect(t.titel.length, form).toBeGreaterThan(2);
        expect(t.einleitung.length, form).toBeGreaterThan(200);
        expect(t.schritte.length, form).toBeGreaterThanOrEqual(4);
        expect(t.grenzen.length, form).toBeGreaterThan(150);
      }
    }
  });

  it('hat eindeutige Adressen je Sprache', () => {
    const de = Object.values(ZUBEREITUNG_SLUG_DE);
    const en = Object.values(ZUBEREITUNG_SLUG_EN);
    expect(new Set(de).size).toBe(de.length);
    expect(new Set(en).size).toBe(en.length);
  });

  it('kennt genau die Formen, die in der Reihenfolge stehen', () => {
    expect(new Set(ZUBEREITUNG_REIHENFOLGE).size).toBe(ZUBEREITUNG_REIHENFOLGE.length);
    expect(ZUBEREITUNG_REIHENFOLGE.length).toBe(Object.keys(ZUBEREITUNG_SLUG_DE).length);
  });
});

// === 4. DATENLAUF ===
// Kein Konstrukt, sondern die echte Datenbasis: jede Form, die in den Daten
// vorkommt, muss auch einen Ratgebertext haben — sonst zeigt die Pflanzenseite
// einen Verweis ins Leere.
describe('Datenlauf', () => {
  const plants = loadAllPlants();

  it('jede in den Daten benutzte Form hat einen Text', () => {
    const benutzt = new Set<string>();
    for (const p of plants) for (const u of p.uses ?? []) if (u.form) benutzt.add(u.form);
    for (const f of benutzt) {
      expect(ZUBEREITUNG_DE[f as UseForm], f).toBeDefined();
      expect(ZUBEREITUNG_SLUG_DE[f as UseForm], f).toBeDefined();
    }
  });

  it('jede Form hat mindestens eine empfehlungsfaehige Pflanze', () => {
    const zaehler = countPlantsPerForm(plants);
    for (const form of ZUBEREITUNG_REIHENFOLGE) {
      expect(zaehler[form] ?? 0, form).toBeGreaterThan(0);
    }
  });

  it('auf keiner Zubereitungsseite steht eine giftige oder kontrollierte Art', () => {
    for (const form of ZUBEREITUNG_REIHENFOLGE) {
      for (const t of findPlantsForForm(form, plants, 'de')) {
        expect(t.plant.safety?.toxicity_level, `${form}/${t.plant.slug}`).not.toBe('toxic');
        expect(t.plant.legal_status?.controlled, `${form}/${t.plant.slug}`).not.toBe(true);
      }
    }
  });
});

// === 5. ANLEITUNGS-EIGNUNG ===
// Gefunden bei der Sichtpruefung in Sitzung 36: Der Abendlaendische Lebensbaum
// stand an erster Stelle der Teeseite. Er ist als "caution" eingestuft, sein
// Warntext beginnt mit "GIFTIG (Thujon-Gehalt)", und die Tee-Anwendung ist ein
// historischer Bericht von 1535.
describe('istFuerAnleitungGeeignet', () => {
  it('wirft blosse Ueberlieferung bei Vorsichts-Pflanzen raus, wenn innerlich', () => {
    const p = pflanze({ safety: { warnings: { de: '', en: '' }, external_only: false, toxicity_level: 'caution' } });
    const u = anwendung('tea', { internal_external: 'internal', evidence_level: 'folk' });
    expect(istFuerAnleitungGeeignet(p, u as never)).toBe(false);
  });

  it('laesst aeusserliche Anwendungen derselben Pflanze stehen', () => {
    const p = pflanze({ safety: { warnings: { de: '', en: '' }, external_only: false, toxicity_level: 'caution' } });
    const u = anwendung('compress', { internal_external: 'external', evidence_level: 'folk' });
    expect(istFuerAnleitungGeeignet(p, u as never)).toBe(true);
  });

  it('laesst belastbarere Einstufungen stehen', () => {
    const p = pflanze({ safety: { warnings: { de: '', en: '' }, external_only: false, toxicity_level: 'caution' } });
    for (const stufe of ['traditional', 'commission_e', 'ema_well_established', 'clinical_trial']) {
      const u = anwendung('tea', { internal_external: 'internal', evidence_level: stufe });
      expect(istFuerAnleitungGeeignet(p, u as never), stufe).toBe(true);
    }
  });

  it('haelt nur-aeusserliche Pflanzen aus innerlichen Formen heraus', () => {
    const p = pflanze({ safety: { warnings: { de: '', en: '' }, external_only: true } });
    const innen = anwendung('tea', { internal_external: 'internal', evidence_level: 'traditional' });
    const aussen = anwendung('salve', { internal_external: 'external', evidence_level: 'traditional' });
    expect(istFuerAnleitungGeeignet(p, innen as never)).toBe(false);
    expect(istFuerAnleitungGeeignet(p, aussen as never)).toBe(true);
  });
});

// === 6. DER KONKRETE FALL ===
describe('Datenlauf — Thuja', () => {
  const plants = loadAllPlants();

  it('Thuja steht nicht auf der Teeseite', () => {
    const slugs = findPlantsForForm('tea', plants, 'de').map(t => t.plant.slug);
    expect(slugs).not.toContain('thuja-occidentalis');
  });

  it('Thuja steht weiterhin bei den aeusserlichen Formen', () => {
    const slugs = findPlantsForForm('salve', plants, 'de').map(t => t.plant.slug);
    expect(slugs).toContain('thuja-occidentalis');
  });

  // Nur-aeusserliche Pflanzen duerfen sehr wohl auf der Tinkturseite stehen —
  // die Arnika-Tinktur ist ein Klassiker, sie wird nur nicht getrunken.
  // Verboten ist die Kombination "external_only" + innerliche Anwendung.
  it('von nur-aeusserlichen Pflanzen wird keine innerliche Anwendung gezeigt', () => {
    for (const form of ZUBEREITUNG_REIHENFOLGE) {
      for (const t of findPlantsForForm(form, plants, 'de')) {
        if (!t.plant.safety?.external_only) continue;
        expect(t.use.internal_external, `${form}/${t.plant.slug}`).toBe('external');
      }
    }
  });
});
