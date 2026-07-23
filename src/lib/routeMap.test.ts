// Tests fuer routeMap.ts — Sprachumschalter + hreflang-Partner.
// Hintergrund: Der alte Umschalter tauschte nur das Sprachkuerzel, was bei
// uebersetzten Slugs (/de/kalender vs /en/calendar) 404-Seiten erzeugte.
import { describe, it, expect } from 'vitest';
import { DE_TO_EN, EN_TO_DE, translatePath, alternatePath } from './routeMap';

describe('routeMap — Tabelle', () => {
  it('bildet jede DE-Seite auf genau eine EN-Seite ab (keine Dubletten)', () => {
    const targets = Object.values(DE_TO_EN);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('ist in beide Richtungen deckungsgleich', () => {
    for (const [de, en] of Object.entries(DE_TO_EN)) {
      expect(EN_TO_DE[en]).toBe(de);
    }
  });
});

describe('translatePath — einfache Seiten', () => {
  it('uebersetzt uebersetzte Slugs DE -> EN', () => {
    expect(translatePath('/de/kalender/', 'de', 'en')).toBe('/en/calendar/');
    expect(translatePath('/de/hilfe-bei/', 'de', 'en')).toBe('/en/help-with/');
    expect(translatePath('/de/karte/', 'de', 'en')).toBe('/en/map/');
    expect(translatePath('/de/zuhause-anbauen/', 'de', 'en')).toBe('/en/grow-at-home/');
  });

  it('uebersetzt zurueck EN -> DE', () => {
    expect(translatePath('/en/calendar/', 'en', 'de')).toBe('/de/kalender/');
    expect(translatePath('/en/image-credits/', 'en', 'de')).toBe('/de/bildnachweis/');
    expect(translatePath('/en/psychoactive/', 'en', 'de')).toBe('/de/rauschpflanzen/');
  });

  it('behaelt gleichnamige Slugs bei', () => {
    expect(translatePath('/de/quiz/', 'de', 'en')).toBe('/en/quiz/');
    expect(translatePath('/de/feedback/', 'de', 'en')).toBe('/en/feedback/');
  });
});

describe('translatePath — Sonderfaelle', () => {
  it('behandelt die Startseite', () => {
    expect(translatePath('/de/', 'de', 'en')).toBe('/en/');
    expect(translatePath('/en/', 'en', 'de')).toBe('/de/');
  });

  it('behaelt Unterpfade bei', () => {
    expect(translatePath('/de/mein-garten/start/', 'de', 'en')).toBe('/en/my-garden/start/');
    expect(translatePath('/en/my-garden/start/', 'en', 'de')).toBe('/de/mein-garten/start/');
  });

  it('behaelt dynamische Pflanzen-Slugs bei', () => {
    expect(translatePath('/de/plant/lavandula-angustifolia/', 'de', 'en'))
      .toBe('/en/plant/lavandula-angustifolia/');
    expect(translatePath('/en/plant/matricaria-chamomilla/', 'en', 'de'))
      .toBe('/de/plant/matricaria-chamomilla/');
  });

  it('kommt ohne abschliessenden Schraegstrich zurecht', () => {
    expect(translatePath('/de/kalender', 'de', 'en')).toBe('/en/calendar');
  });

  it('schickt Light-Sprachen auf die Startseite', () => {
    expect(translatePath('/fr/', 'fr', 'de')).toBe('/de/');
    expect(translatePath('/bg/', 'bg', 'en')).toBe('/en/');
  });

  it('faellt bei unbekannten Pfaden auf die Startseite zurueck statt zu raten', () => {
    expect(translatePath('/de/gibt-es-nicht/', 'de', 'en')).toBe('/en/');
  });

  it('laesst den Pfad unveraendert, wenn Ziel = Quelle', () => {
    expect(translatePath('/de/kalender/', 'de', 'de')).toBe('/de/kalender/');
  });
});

describe('alternatePath — hreflang-Partner', () => {
  it('liefert die Partnerseite fuer echte Seitenpaare', () => {
    expect(alternatePath('/de/kalender/', 'de')).toBe('/en/calendar/');
    expect(alternatePath('/en/calendar/', 'en')).toBe('/de/kalender/');
  });

  it('liefert die Partner-Startseite', () => {
    expect(alternatePath('/de/', 'de')).toBe('/en/');
    expect(alternatePath('/en/', 'en')).toBe('/de/');
  });

  it('liefert nichts fuer Light-Sprachen', () => {
    expect(alternatePath('/fr/', 'fr')).toBeUndefined();
  });

  it('liefert nichts bei unbekannten Pfaden (kein falsches Sprachpaar)', () => {
    expect(alternatePath('/de/gibt-es-nicht/', 'de')).toBeUndefined();
  });
});
