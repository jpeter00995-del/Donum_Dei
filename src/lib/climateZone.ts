// Climate-zone helpers for the v1.0 Selbstversorger garden planner.
// (Klimazonen-Helper für den v1.0 Selbstversorger-Garten-Planer.)
//
// Data file: src/data/climate_zones.json
// Spec: TODO_v1.0_selbstversorger.md Task 3

import climateZonesData from '../data/climate_zones.json';

// === 1. TYPES ===

/** ISO-style 2-letter country code supported by the postal-code heuristic. */
export type SupportedCountry = 'DE' | 'AT' | 'CH' | 'BG';

/** Single climate-zone entry as stored in climate_zones.json. */
export type ClimateZoneEntry = {
  /** USDA hardiness zone label, e.g. "7a" — matches pattern [0-9]{1,2}[ab]?. */
  zone: string;
  /** Average annual minimum temperature range in degrees Celsius. */
  temp_range_celsius: { min: number; max: number };
  /** Short human-readable description, German. */
  description_de: string;
  /** Short human-readable description, English. */
  description_en: string;
};

/** Top-level shape of climate_zones.json (zones + meta). */
export type ClimateZonesFile = {
  _meta: {
    source_notes: string;
    sources: string[];
  };
  zones: ClimateZoneEntry[];
};

const data = climateZonesData as ClimateZonesFile;

// === 2. PUBLIC ACCESSORS ===

/**
 * Return all climate-zone entries from the bundled data file.
 * (Alle Klimazonen-Einträge aus der JSON-Datei zurückgeben.)
 */
export function listClimateZones(): ClimateZoneEntry[] {
  return data.zones;
}

/**
 * Look up a climate-zone entry by its USDA label (e.g. "7a").
 * Returns `null` if the zone is not present in the bundled data.
 * (Klimazone per USDA-Label nachschlagen; null wenn unbekannt.)
 */
export function getClimateZone(zone: string): ClimateZoneEntry | null {
  return data.zones.find(z => z.zone === zone) ?? null;
}

// === 3. POSTAL-CODE → ZONE HEURISTIC ===

/**
 * Estimate the USDA hardiness zone for a postal code in DE / AT / CH / BG.
 *
 * The heuristic is intentionally simplified for the v1.0 MVP — it maps the
 * leading 1-2 digits of the postal code to a representative zone for that
 * broad region. It aims for ~80% accuracy across typical settlement areas
 * and prefers a slightly colder zone when in doubt (safer for plant choice).
 *
 * Returns `null` for unsupported countries or postal codes whose format
 * is obviously invalid (non-digit, wrong length).
 *
 * Sources: USDA zones cross-checked against DWD (DE), ZAMG (AT),
 * MeteoSwiss (CH) and NIMH (BG) regional climate normals.
 * (Heuristische Schätzung der USDA-Klimazone aus der Postleitzahl;
 * vereinfacht, bei Unsicherheit lieber 1 Zone kälter.)
 *
 * @param country - 2-letter country code ('DE' | 'AT' | 'CH' | 'BG').
 * @param postal  - National postal code as string (digits only).
 * @returns USDA zone label (e.g. "7a") or `null` if it cannot be determined.
 */
export function zoneFromPostalCode(
  country: SupportedCountry | string,
  postal: string,
): string | null {
  // === 3.1 Input sanity ===
  if (typeof postal !== 'string') return null;
  const trimmed = postal.trim();
  if (trimmed.length === 0) return null;
  // Akzeptiere nur Ziffern (alle 4 Länder verwenden rein numerische PLZ).
  if (!/^\d+$/.test(trimmed)) return null;

  switch (country) {
    case 'DE':
      return zoneForDE(trimmed);
    case 'AT':
      return zoneForAT(trimmed);
    case 'CH':
      return zoneForCH(trimmed);
    case 'BG':
      return zoneForBG(trimmed);
    default:
      return null;
  }
}

// === 4. PER-COUNTRY HELPERS ===

/**
 * Germany — 5-digit PLZ, leading digit defines broad PLZ-Leitregion.
 * Simplification: collapses each Leitregion to a single representative zone.
 * Where a region spans multiple zones, picks the colder side per the safety rule.
 * (Deutschland: 5-stellige PLZ, führende Ziffer ergibt Leitregion;
 * bei Spannweite konservativ die kältere Zone.)
 */
function zoneForDE(postal: string): string | null {
  if (postal.length !== 5) return null;
  const first = postal[0];
  switch (first) {
    case '0': return '7a'; // Sachsen / Berlin-Ost
    case '1': return '7a'; // Berlin / Brandenburg
    case '2': return '7b'; // Norddeutsche Tiefebene (Hamburg, Bremen)
    case '3': return '7a'; // Niedersachsen / Nord-Hessen
    case '4': return '7b'; // Ruhrgebiet / Westfalen — kältere Seite der 7b/8a-Spannweite
    case '5': return '8a'; // Köln/Bonn/Rheinland
    case '6': return '7b'; // Rhein-Main / Saarland — kältere Seite der 7b/8a-Spannweite
    case '7': return '7a'; // Baden-Württemberg — kältere Seite der 7a/7b-Spannweite
    case '8': return '6b'; // Bayern Süd / Alpenvorland — kältere Seite der 6b/7a-Spannweite
    case '9': return '7a'; // Franken / Oberpfalz
    default:  return null;
  }
}

/**
 * Austria — 4-digit PLZ, leading digit corresponds to Bundesland group.
 * Simplification: single zone per Leitzahl; Alpenregionen tendieren kälter.
 * (Österreich: 4-stellige PLZ; eine Zone je Leitziffer; Alpen eher kälter.)
 */
function zoneForAT(postal: string): string | null {
  if (postal.length !== 4) return null;
  const first = postal[0];
  switch (first) {
    case '1': return '7a'; // Wien
    case '2': return '7a'; // Niederösterreich (Wiener Umland)
    case '3': return '7a'; // Niederösterreich / nördliches Burgenland
    case '4': return '6b'; // Oberösterreich
    case '5': return '6a'; // Salzburg (Stadt + Alpen)
    case '6': return '5b'; // Tirol / Vorarlberg — kalt-konservativ wegen Alpen
    case '7': return '7b'; // Burgenland (pannonisches Klima)
    case '8': return '6b'; // Steiermark
    case '9': return '6b'; // Kärnten
    default:  return null;
  }
}

/**
 * Switzerland — 4-digit PLZ, leading digit roughly groups Sprachregionen / Kantone.
 * Simplification: leading digit "7" mixes warm Tessin and cold Graubünden —
 * collapsed to 6b (colder side) per the safety rule.
 * (Schweiz: 4-stellige PLZ; Leitziffer 7 vereint warmes Tessin und
 * kaltes Graubünden — auf 6b zusammengefasst, kältere Seite.)
 */
function zoneForCH(postal: string): string | null {
  if (postal.length !== 4) return null;
  const first = postal[0];
  switch (first) {
    case '1': return '8a'; // Genf / Waadt / westliches Mittelland
    case '2': return '7a'; // Neuenburg / Jura / Nordwest
    case '3': return '6b'; // Bern / Berner Oberland
    case '4': return '7b'; // Basel
    case '5': return '7a'; // Aargau
    case '6': return '6b'; // Zentralschweiz / Luzern
    case '7': return '6b'; // Graubünden / Tessin — Vereinfachung, kältere Seite
    case '8': return '7a'; // Zürich
    case '9': return '6b'; // St. Gallen / Appenzell / Thurgau
    default:  return null;
  }
}

/**
 * Bulgaria — 4-digit PLZ, leading digit corresponds to Oblast group.
 * Simplification: maps leading digit to representative regional zone.
 * Fallback for unrecognised first digit: "7a" (inland-Bulgaria baseline).
 * (Bulgarien: 4-stellige PLZ; Leitziffer ergibt Oblast-Gruppe;
 * Fallback 7a für unbekannte Leitziffern.)
 */
function zoneForBG(postal: string): string | null {
  if (postal.length !== 4) return null;
  const first = postal[0];
  switch (first) {
    case '1': return '6b'; // Sofia (Hauptstadt + Sofia-Becken)
    case '2': return '7a'; // Pernik / Kjustendil / Sofia-Umland
    case '3': return '7a'; // Vraza / Montana / Nordwesten
    case '4': return '7b'; // Plovdiv / Thrakische Tiefebene
    case '5': return '7a'; // Veliko Tarnovo / Zentralnordbulgarien
    case '6': return '7b'; // Stara Sagora / Haskovo (warmer Süden)
    case '7': return '7a'; // Russe / Donau-Region
    case '8': return '8a'; // Burgas / südliche Schwarzmeerküste
    case '9': return '7b'; // Varna / nördliche Schwarzmeerküste
    default:  return '7a'; // Fallback Binnenland-Baseline
  }
}
