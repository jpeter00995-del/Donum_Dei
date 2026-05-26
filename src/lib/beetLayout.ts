// === Beet Layout — Smart Auto-Layout für den Beet-Planer (Welle J) ===
// Pure-Function: Cart-State → Layout-Grid mit smart Anordnung.
// (Reine Funktion ohne UI/React; berechnet Zonen, Companion-Cluster
// und Warnungen für den visuellen Beet-Planer.)
//
// Eingabe:  cartPlants (slug + quantity), profile.garden, allPlants
// Ausgabe:  cells[] mit (x, y, w, h, zone) + warnings[]
//
// Algorithmus-Reihenfolge (Priorität):
//   1. Vertikale Schichten zonen (north / middle / south)
//   2. Companion-Cluster bilden
//   3. Bad-Partners auf Abstand prüfen → Warnung
//   4. Greedy bottom-up Packing
//   5. Overflow erkennen → too_crowded Warnung

import type { Plant, GardenType, PermacultureFunction } from './types';

// === 1. TYPES ===

/** Eine Pflanzen-Zelle im Beet-Layout. */
export interface BeetCell {
  /** Plant-Slug (Referenz auf Plant). */
  slug: string;
  /** Anzahl Pflanzen in diesem Cluster. */
  quantity: number;
  /** X-Position in Beet-Units (Meter), top-left Ecke. */
  x: number;
  /** Y-Position in Beet-Units (Meter), top-left Ecke. */
  y: number;
  /** Breite des Clusters in Beet-Units (Meter). */
  w: number;
  /** Höhe des Clusters in Beet-Units (Meter). */
  h: number;
  /** Vertikale Schicht zur Höhenstaffelung. */
  zone: BeetZone;
  /** Optional: User-Override Position (custom_plan.beet_positions). */
  user_positioned?: boolean;
}

/** Vertikale Beet-Zone. Höhe wächst von süd → mid → nord. */
export type BeetZone = 'north' | 'middle' | 'south';

/** Warnung wenn Layout nicht optimal ist. */
export interface BeetWarning {
  type: 'bad_neighbor' | 'sun_mismatch' | 'too_crowded';
  /** Slug der ersten betroffenen Pflanze. */
  plant_a: string;
  /** Slug der zweiten Pflanze (bei Paar-Warnungen). */
  plant_b?: string;
  /** Erklärung auf Deutsch (1-2 Sätze). */
  message_de: string;
  /** Erklärung auf Englisch (1-2 Sätze). */
  message_en: string;
  /** Schwere — 'warning' (rot), 'info' (gelb). */
  severity: 'warning' | 'info';
}

/** Resultat des Layout-Algorithmus. */
export interface BeetLayout {
  /** Alle platzierten Zellen mit Position. */
  cells: BeetCell[];
  /** Anmerkungen bei suboptimaler Anordnung. */
  warnings: BeetWarning[];
  /** Beet-Größe in Beet-Units (Meter) — width × height. */
  total_size: { width: number; height: number };
  /** Garten-Typ (für Renderer-Wahl). */
  garden_type: GardenType;
}

/** Cart-Eintrag (was der User im Warenkorb hat). */
export interface CartEntry {
  slug: string;
  quantity: number;
}

/** Optionale User-Override-Position für eine Pflanze. */
export interface UserPosition {
  slug: string;
  x: number;
  y: number;
}

/** Optionen für das Layout. */
export interface LayoutOptions {
  /** User-definierte Positionen (überschreiben Auto-Layout). */
  user_positions?: UserPosition[];
}

// === 2. GARTEN-TYP-PROFILE ===

/** Layout-Profil pro Garten-Typ — bestimmt Aspect-Ratio und Default-Maße. */
interface GardenTypeProfile {
  /** Bevorzugtes Verhältnis Breite:Höhe (für Beet-Form). */
  aspect_ratio: number;
  /** Minimum-Breite in m (z.B. Balkon-Brüstung). */
  min_width: number;
  /** Minimum-Höhe (Tiefe) in m. */
  min_height: number;
}

const GARDEN_PROFILES: Record<GardenType, GardenTypeProfile> = {
  raised_bed: { aspect_ratio: 2.0, min_width: 1.0, min_height: 0.5 },
  balcony: { aspect_ratio: 5.0, min_width: 1.0, min_height: 0.3 },
  field: { aspect_ratio: 1.5, min_width: 1.5, min_height: 1.0 },
  greenhouse: { aspect_ratio: 2.0, min_width: 1.5, min_height: 1.0 },
};

// === 3. HAUPT-FUNKTION ===

/**
 * Smart Auto-Layout für ein Beet. Pure Funktion.
 * (Berechnet aus Warenkorb + Garten-Profil ein 2D-Layout.)
 *
 * @param cart       Warenkorb-Einträge (slug + quantity).
 * @param gardenType Garten-Typ.
 * @param areaSqm    Gesamt-Garten-Fläche in m².
 * @param plants     Vollständige Plant-Liste für Lookups.
 * @param opts       Optionale User-Positionen.
 */
export function computeBeetLayout(
  cart: readonly CartEntry[],
  gardenType: GardenType,
  areaSqm: number,
  plants: readonly Plant[],
  opts: LayoutOptions = {},
): BeetLayout {
  // === 3.1 Plant-Lookup ===
  const plantBySlug = new Map<string, Plant>();
  for (const p of plants) plantBySlug.set(p.slug, p);

  // === 3.2 Beet-Dimensionen aus Garten-Typ + Fläche ableiten ===
  const total_size = deriveBeetSize(gardenType, areaSqm);

  // === 3.3 Cells initial bauen (Zone + Größe) ===
  const cells: BeetCell[] = [];
  for (const entry of cart) {
    if (entry.quantity <= 0) continue;
    const plant = plantBySlug.get(entry.slug);
    if (!plant) continue;
    cells.push(buildCell(entry, plant));
  }

  // === 3.4 Companion-Cluster bilden (gleicher Zone) ===
  const clusters = groupByCompanionAndZone(cells, plantBySlug);

  // === 3.5 Greedy Packing — Cluster per Zone platzieren ===
  packLayout(clusters, total_size);

  // === 3.6 User-Positionen anwenden (überschreiben Auto) ===
  if (opts.user_positions && opts.user_positions.length > 0) {
    applyUserPositions(cells, opts.user_positions);
  }

  // === 3.7 Conflict-Split (Welle N): bad_partner-Paare auf Beet-Seiten verteilen ===
  // (Wenn das Beet breit genug ist, wandern Bad-Partner automatisch
  // auf gegenüberliegende Seiten — User behält beide im Plan.)
  const splitPairs = applyConflictSplit(cells, plantBySlug, total_size, opts);

  // === 3.8 Warnungen sammeln ===
  const warnings: BeetWarning[] = [];
  warnings.push(...detectBadNeighbors(cells, plantBySlug, splitPairs));
  warnings.push(...detectSunMismatch(cells, plantBySlug));
  warnings.push(...detectOverflow(cells, total_size, plantBySlug));

  return { cells, warnings, total_size, garden_type: gardenType };
}

// === 3a. CONFLICT-SPLIT (Welle N) ===

/** Minimum-Beetbreite damit ein Bipartite-Split sinnvoll ist (in m). */
const MIN_SPLIT_WIDTH_M = 2.0;

/**
 * Verteile bad_partner-Paare auf gegenüberliegende Beet-Seiten.
 * (Pure mutation: setzt cell.x für alle Cells in derselben Zone wie das
 * erste Konflikt-Paar. Gibt die Set der erfolgreich gesplitteten Paare zurück.)
 *
 * Strategie:
 *   - Erstes bad_pair (A, B) in derselben Zone bestimmen.
 *   - Team A links, Team B rechts, Doppel-Partner (good zu A UND B) in Puffer-Mitte.
 *   - User-positionierte Cells werden nicht angefasst.
 *   - Beet < MIN_SPLIT_WIDTH_M: kein Split, klassische Warnung bleibt.
 *   - Weitere Konflikt-Paare nach dem ersten: werden NICHT auch gesplittet
 *     (komplex bei 3+-Wege-Konflikten); Warnung bleibt für die übrigen.
 */
function applyConflictSplit(
  cells: BeetCell[],
  plantBySlug: Map<string, Plant>,
  size: { width: number; height: number },
  opts: LayoutOptions,
): Set<string> {
  const successfulPairs = new Set<string>();
  if (size.width < MIN_SPLIT_WIDTH_M) return successfulPairs;

  const userPos = new Set(opts.user_positions?.map(p => p.slug) ?? []);

  // === 1. Erstes bad_pair (in gleicher Zone, nicht beide user-positioniert) finden ===
  let aSlug: string | null = null;
  let bSlug: string | null = null;
  let zone: BeetZone | null = null;

  outer: for (let i = 0; i < cells.length; i++) {
    const ci = cells[i];
    const pi = plantBySlug.get(ci.slug);
    if (!pi) continue;
    const badI = new Set(pi.companion_planting?.bad_partners ?? []);
    if (badI.size === 0) continue;
    for (let j = i + 1; j < cells.length; j++) {
      const cj = cells[j];
      if (cj.zone !== ci.zone) continue;
      const pj = plantBySlug.get(cj.slug);
      const badJ = new Set(pj?.companion_planting?.bad_partners ?? []);
      if (!badI.has(cj.slug) && !badJ.has(ci.slug)) continue;
      if (userPos.has(ci.slug) && userPos.has(cj.slug)) continue;
      // Anchor: user-positionierte Seite wird zu A (bleibt), sonst ci zu A.
      if (userPos.has(cj.slug)) {
        aSlug = cj.slug;
        bSlug = ci.slug;
      } else {
        aSlug = ci.slug;
        bSlug = cj.slug;
      }
      zone = ci.zone;
      successfulPairs.add([ci.slug, cj.slug].sort().join('|'));
      break outer;
    }
  }

  if (!aSlug || !bSlug || !zone) return successfulPairs;

  // === 2. Team-Klassifizierung in der Konflikt-Zone ===
  const pa = plantBySlug.get(aSlug);
  const pb = plantBySlug.get(bSlug);
  const goodA = new Set(pa?.companion_planting?.good_partners ?? []);
  const goodB = new Set(pb?.companion_planting?.good_partners ?? []);

  type Team = 'a' | 'b' | 'buffer';
  const classifyCell = (slug: string): Team | null => {
    if (slug === aSlug) return 'a';
    if (slug === bSlug) return 'b';
    const p = plantBySlug.get(slug);
    const goodOfP = new Set(p?.companion_planting?.good_partners ?? []);
    const withA = goodA.has(slug) || goodOfP.has(aSlug!);
    const withB = goodB.has(slug) || goodOfP.has(bSlug!);
    if (withA && withB) return 'buffer';
    if (withB) return 'b';
    if (withA) return 'a';
    return null; // neutral — wo Platz ist
  };

  const teamCells: Record<Team, BeetCell[]> = { a: [], b: [], buffer: [] };
  for (const cell of cells) {
    if (cell.zone !== zone) continue;
    if (userPos.has(cell.slug)) continue;
    const t = classifyCell(cell.slug);
    if (t) teamCells[t].push(cell);
  }

  // === 3. Bin-Packing pro Team innerhalb der Zone ===
  // Team A: links nach rechts ab x=0.
  let xLeft = 0;
  for (const cell of teamCells.a) {
    cell.x = xLeft;
    xLeft += cell.w;
  }
  // Team B: rechts nach links ab x=width.
  let xRight = size.width;
  for (const cell of teamCells.b) {
    cell.x = Math.max(0, xRight - cell.w);
    xRight -= cell.w;
  }
  // Buffer: zentriert um width/2.
  const bufferTotal = teamCells.buffer.reduce((s, c) => s + c.w, 0);
  let xBuf = Math.max(xLeft, (size.width - bufferTotal) / 2);
  for (const cell of teamCells.buffer) {
    cell.x = xBuf;
    xBuf += cell.w;
  }

  return successfulPairs;
}

// === 4. CELL-AUFBAU ===

/** Bestimme Zone aus permaculture_functions. */
export function zoneFor(plant: Plant): BeetZone {
  const fns: PermacultureFunction[] = plant.permaculture_functions ?? [];
  if (fns.includes('vertical_high')) return 'north';
  if (fns.includes('vertical_low') || fns.includes('ground_cover')) return 'south';
  return 'middle';
}

/** Cluster-Größe ableiten: ceil(sqrt(qty)) × spacing. */
export function clusterSize(plant: Plant, quantity: number): { w: number; h: number } {
  const spacingCm = plant.garden_meta?.spacing_cm ?? 30;
  const spacingM = spacingCm / 100;
  // Greedy Grid: ceil(sqrt(qty)) × ceil(qty / cols)
  const cols = Math.max(1, Math.ceil(Math.sqrt(quantity)));
  const rows = Math.max(1, Math.ceil(quantity / cols));
  return { w: cols * spacingM, h: rows * spacingM };
}

function buildCell(entry: CartEntry, plant: Plant): BeetCell {
  const { w, h } = clusterSize(plant, entry.quantity);
  return {
    slug: entry.slug,
    quantity: entry.quantity,
    x: 0,
    y: 0,
    w,
    h,
    zone: zoneFor(plant),
  };
}

// === 5. BEET-DIMENSIONEN ===

/**
 * Leite aus Garten-Typ + Fläche die Beet-Box (Breite × Höhe) in m ab.
 * (Aus Aspect-Ratio des Typs berechnet, mit Mindest-Maßen.)
 */
export function deriveBeetSize(
  gardenType: GardenType,
  areaSqm: number,
): { width: number; height: number } {
  const profile = GARDEN_PROFILES[gardenType];
  const safeArea = Math.max(0.5, areaSqm);
  // width × height = area, width/height = aspect → width = sqrt(area * aspect)
  const width = Math.max(profile.min_width, Math.sqrt(safeArea * profile.aspect_ratio));
  const height = Math.max(profile.min_height, safeArea / width);
  // Rundung auf 0.1 m
  return {
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
  };
}

// === 6. CLUSTERING ===

/** Cluster: Gruppe von Cells die zusammen platziert werden sollen. */
interface Cluster {
  zone: BeetZone;
  cells: BeetCell[];
}

/**
 * Gruppiere Cells nach Companion-Beziehung UND Zone.
 * Zwei Cells landen im selben Cluster wenn:
 *   - sie die gleiche Zone haben UND
 *   - mindestens einer der beiden den anderen als good_partner listet
 * (Union-Find über die Cell-Indizes.)
 */
function groupByCompanionAndZone(
  cells: BeetCell[],
  plantBySlug: Map<string, Plant>,
): Cluster[] {
  const n = cells.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < n; i++) {
    const ci = cells[i];
    const pi = plantBySlug.get(ci.slug);
    if (!pi) continue;
    const goodI = new Set(pi.companion_planting?.good_partners ?? []);
    for (let j = i + 1; j < n; j++) {
      const cj = cells[j];
      if (cj.zone !== ci.zone) continue;
      const pj = plantBySlug.get(cj.slug);
      if (!pj) continue;
      const goodJ = new Set(pj.companion_planting?.good_partners ?? []);
      if (goodI.has(cj.slug) || goodJ.has(ci.slug)) {
        union(i, j);
      }
    }
  }

  const byRoot = new Map<number, BeetCell[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!byRoot.has(r)) byRoot.set(r, []);
    byRoot.get(r)!.push(cells[i]);
  }

  const out: Cluster[] = [];
  for (const group of byRoot.values()) {
    out.push({ zone: group[0].zone, cells: group });
  }
  return out;
}

// === 7. PACKING ===

/**
 * Greedy Packing: Cluster pro Zone in Reihen anordnen.
 * Norden = oben (y klein), Süden = unten (y groß).
 * Innerhalb einer Zone: größte Cluster zuerst, left-to-right.
 */
function packLayout(
  clusters: Cluster[],
  size: { width: number; height: number },
): void {
  // Zonen-Bänder (jeweils 1/3 der Höhe).
  const bandHeight = size.height / 3;
  const bands: Record<BeetZone, { yStart: number; yEnd: number }> = {
    north: { yStart: 0, yEnd: bandHeight },
    middle: { yStart: bandHeight, yEnd: bandHeight * 2 },
    south: { yStart: bandHeight * 2, yEnd: size.height },
  };

  // Sortiere Cluster: größte (max Cell-Fläche im Cluster) zuerst.
  const sortedClusters = [...clusters].sort((a, b) => {
    const aMax = Math.max(...a.cells.map(c => c.w * c.h));
    const bMax = Math.max(...b.cells.map(c => c.w * c.h));
    return bMax - aMax;
  });

  // Pro Zone: aktuelles (x, y) für Greedy left-to-right + neue Reihe bei Overflow.
  const cursor: Record<BeetZone, { x: number; y: number; rowMaxH: number }> = {
    north: { x: 0, y: bands.north.yStart, rowMaxH: 0 },
    middle: { x: 0, y: bands.middle.yStart, rowMaxH: 0 },
    south: { x: 0, y: bands.south.yStart, rowMaxH: 0 },
  };

  for (const cluster of sortedClusters) {
    // Cells im Cluster nebeneinander platzieren (alle in einer Reihe falls möglich).
    // Sortiere Cells innerhalb nach Größe absteigend.
    const sortedCells = [...cluster.cells].sort((a, b) => b.w * b.h - a.w * a.h);
    for (const cell of sortedCells) {
      const cur = cursor[cell.zone];
      // Passt in aktuelle Reihe?
      if (cur.x + cell.w > size.width && cur.x > 0) {
        // Neue Reihe in dieser Zone.
        cur.x = 0;
        cur.y += cur.rowMaxH;
        cur.rowMaxH = 0;
      }
      cell.x = cur.x;
      cell.y = cur.y;
      cur.x += cell.w;
      if (cell.h > cur.rowMaxH) cur.rowMaxH = cell.h;
    }
  }
}

// === 8. USER-POSITIONEN ===

function applyUserPositions(cells: BeetCell[], positions: readonly UserPosition[]): void {
  const posMap = new Map<string, UserPosition>();
  for (const p of positions) posMap.set(p.slug, p);
  for (const cell of cells) {
    const pos = posMap.get(cell.slug);
    if (pos) {
      cell.x = pos.x;
      cell.y = pos.y;
      cell.user_positioned = true;
    }
  }
}

// === 9. WARN-DETEKTOREN ===

const MIN_BAD_DISTANCE_M = 1.0; // Minimum-Distanz zwischen bad_partners in Metern

/** Erkenne Bad-Partner-Paare die zu nah beieinander stehen.
 * (Wenn ein Paar bereits per applyConflictSplit getrennt wurde, wird die
 * Warnung als 'info' mit angepasstem Text emittiert statt als 'warning'.) */
function detectBadNeighbors(
  cells: BeetCell[],
  plantBySlug: Map<string, Plant>,
  splitPairs: Set<string>,
): BeetWarning[] {
  const out: BeetWarning[] = [];
  const seenPairs = new Set<string>();
  for (let i = 0; i < cells.length; i++) {
    const ci = cells[i];
    const pi = plantBySlug.get(ci.slug);
    if (!pi) continue;
    const badI = new Set(pi.companion_planting?.bad_partners ?? []);
    if (badI.size === 0) continue;
    for (let j = i + 1; j < cells.length; j++) {
      const cj = cells[j];
      if (!badI.has(cj.slug)) {
        // Auch andere Richtung prüfen.
        const pj = plantBySlug.get(cj.slug);
        const badJ = new Set(pj?.companion_planting?.bad_partners ?? []);
        if (!badJ.has(ci.slug)) continue;
      }
      const pairKey = [ci.slug, cj.slug].sort().join('|');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      // Distanz zwischen Cluster-Zentren.
      const dx = (ci.x + ci.w / 2) - (cj.x + cj.w / 2);
      const dy = (ci.y + ci.h / 2) - (cj.y + cj.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pj = plantBySlug.get(cj.slug);
      const nameA_de = pi.names.de;
      const nameB_de = pj?.names.de ?? cj.slug;
      const nameA_en = pi.names.en;
      const nameB_en = pj?.names.en ?? cj.slug;
      const wasSplit = splitPairs.has(pairKey);
      if (wasSplit && dist >= MIN_BAD_DISTANCE_M) {
        // Erfolgreich getrennt — Info statt Warnung.
        out.push({
          type: 'bad_neighbor',
          plant_a: ci.slug,
          plant_b: cj.slug,
          message_de:
            `${nameA_de} und ${nameB_de} wurden automatisch auf gegenüberliegende Seiten gestellt — ` +
            `sie hemmen sich, aber jetzt mit Mindestabstand. Du kannst sie per Drag verschieben falls nötig.`,
          message_en:
            `${nameA_en} and ${nameB_en} were automatically moved to opposite sides — ` +
            `they inhibit each other but now have minimum distance. Drag to adjust if needed.`,
          severity: 'info',
        });
      } else if (dist < MIN_BAD_DISTANCE_M) {
        out.push({
          type: 'bad_neighbor',
          plant_a: ci.slug,
          plant_b: cj.slug,
          message_de:
            `${nameA_de} und ${nameB_de} stehen zu nah beieinander — sie hemmen sich gegenseitig. ` +
            `Versuche mindestens 1 m Abstand.`,
          message_en:
            `${nameA_en} and ${nameB_en} are too close — they inhibit each other. ` +
            `Try at least 1 m of distance.`,
          severity: 'warning',
        });
      }
    }
  }
  return out;
}

/** Erkenne wenn hohe Pflanzen südlich von Sonnenliebhabern stehen. */
function detectSunMismatch(
  cells: BeetCell[],
  plantBySlug: Map<string, Plant>,
): BeetWarning[] {
  const out: BeetWarning[] = [];
  const seenPairs = new Set<string>();
  // Hohe Pflanzen (north zone) sollten NICHT südlich (= y größer) von
  // mittel/niedrig stehen — sonst werfen sie Schatten nach Norden.
  for (const high of cells) {
    if (high.zone !== 'north') continue;
    const highPlant = plantBySlug.get(high.slug);
    if (!highPlant) continue;
    for (const other of cells) {
      if (other === high) continue;
      if (other.zone === 'north') continue;
      // Schatten-Konflikt: hohe Pflanze liegt SÜDLICH (y > other.y) und
      // x-Überlapp existiert → wirft Schatten auf "other".
      if (high.y <= other.y) continue; // korrekt: high nördlich oder gleich
      // Überlapp in X?
      const overlap = Math.max(0,
        Math.min(high.x + high.w, other.x + other.w) - Math.max(high.x, other.x));
      if (overlap <= 0) continue;
      const pairKey = [high.slug, other.slug].sort().join('|');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      const otherPlant = plantBySlug.get(other.slug);
      out.push({
        type: 'sun_mismatch',
        plant_a: high.slug,
        plant_b: other.slug,
        message_de:
          `${highPlant.names.de} wirft Schatten nach Norden — ` +
          `${otherPlant?.names.de ?? other.slug} sollte weiter südlich stehen.`,
        message_en:
          `${highPlant.names.en} casts shade northward — ` +
          `${otherPlant?.names.en ?? other.slug} should be placed further south.`,
        severity: 'info',
      });
    }
  }
  return out;
}

/** Erkenne wenn Cells aus dem Beet rausragen. */
function detectOverflow(
  cells: BeetCell[],
  size: { width: number; height: number },
  plantBySlug: Map<string, Plant>,
): BeetWarning[] {
  const out: BeetWarning[] = [];
  const TOLERANCE = 0.05;
  for (const cell of cells) {
    if (cell.x + cell.w > size.width + TOLERANCE
      || cell.y + cell.h > size.height + TOLERANCE) {
      const plant = plantBySlug.get(cell.slug);
      out.push({
        type: 'too_crowded',
        plant_a: cell.slug,
        message_de:
          `Das Beet ist zu eng für ${plant?.names.de ?? cell.slug} — ` +
          `reduziere die Stückzahl oder entferne eine andere Pflanze.`,
        message_en:
          `The bed is too crowded for ${plant?.names.en ?? cell.slug} — ` +
          `reduce the count or remove another plant.`,
        severity: 'warning',
      });
    }
  }
  return out;
}
