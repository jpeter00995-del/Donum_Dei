// Calendar engine for the v1.0 Selbstversorger planner.
// (Kalender-Engine für den v1.0 Selbstversorger-Planer.)
//
// Pure function `tasksForWeek` — given a user profile, garden plan, ISO week
// and year, returns the list of sowing/transplant/harvest tasks for the
// current week and the next two weeks. Climate-zone adjusts the windows
// (warmer zones bring tasks forward, colder zones push them back).
//
// Spec: TODO_v1.0_selbstversorger.md Task 10

import type { GardenMeta, MonthRange } from './types';

// === 1. TYPES ===

/** Action a user performs in a given week, per plant. */
export type CalendarAction =
  | 'sow_indoor'
  | 'sow_outdoor'
  | 'transplant'
  | 'harvest';

/** Urgency relative to the reference week. */
export type CalendarUrgency = 'this_week' | 'next_2_weeks';

/** A single task for the calendar view. */
export type CalendarTask = {
  /** Plant slug — references a plant in src/data/plants/. */
  plant_slug: string;
  /** What the user should do this week. */
  action: CalendarAction;
  /** This week vs. an upcoming week (within next 2 weeks). */
  urgency: CalendarUrgency;
};

/**
 * Local subset of the UserProfile used by the calendar engine.
 * Defined here to avoid coupling to userProfile.ts (created by subagent 1).
 * (Lokaler UserProfile-Subset; entkoppelt von userProfile.ts.)
 */
export type CalendarUserProfile = {
  /** USDA hardiness zone, e.g. "7a", "8b". */
  zone: string;
  /** Other profile fields (ignored by the engine, kept for compatibility). */
  garden?: { type?: string; area_sqm?: number };
  household_size?: number;
  self_sufficiency_goal?: 'supplementary' | 'half' | 'full';
  experience?: 'beginner' | 'intermediate' | 'expert';
};

/** A single entry of the garden plan, as produced by gardenPlan.ts. */
export type CalendarPlanEntry = {
  plant_slug: string;
  quantity?: number;
  sowing_method?: string;
  notes_de?: string;
  notes_en?: string;
};

/** Full garden plan, as produced by gardenPlan.ts. */
export type CalendarPlan = CalendarPlanEntry[];

// === 2. ISO-WEEK HELPERS ===

/**
 * Return the Monday (UTC) of the given ISO week.
 * ISO 8601 — week 1 is the week containing the first Thursday of the year.
 * (Liefert den Montag (UTC) der angegebenen ISO-Woche.)
 */
export function isoWeekToMonday(isoWeek: number, year: number): Date {
  // Jan 4th is always in ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Sonntag = 7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const target = new Date(week1Monday);
  target.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);
  return target;
}

/**
 * Return the ISO week number (1-53) for the given UTC date.
 * (Liefert die ISO-Wochennummer (1-53) für das angegebene UTC-Datum.)
 */
export function isoWeekFromDate(date: Date): { week: number; year: number } {
  const tmp = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { week, year: tmp.getUTCFullYear() };
}

// === 3. ZONE-SHIFT HEURISTIC ===

/**
 * Number of weeks to shift sowing/harvest windows for the given USDA zone.
 *
 * Heuristic baseline = zone 6 (e.g. Alpenvorland). Warmer zones shift earlier
 * (negative weeks); colder zones shift later (positive weeks).
 *
 * Rule of thumb: 1 USDA zone = ~1 week earlier in spring, ~1 week later in
 * autumn. Spec simplification: "Zone 8 = 2 weeks earlier than Zone 6"
 * → 1 week per USDA zone difference. Sub-zones (a/b) are ignored for v1.0.
 * (Heuristik: 1 USDA-Zone ≈ 1 Woche; Sub-Zonen a/b in v1.0 ignoriert.)
 */
export function zoneShiftWeeks(zone: string): number {
  const m = /^(\d{1,2})[ab]?$/i.exec(zone.trim());
  if (!m) return 0; // unknown zone → no shift
  const zoneNum = Number(m[1]);
  if (!Number.isFinite(zoneNum)) return 0;
  // Baseline zone = 6 (Spec: "Zone 8 = 2 Wochen früher als Zone 6").
  const BASELINE = 6;
  const shift = -(zoneNum - BASELINE);
  return shift === 0 ? 0 : shift; // Normalize -0 → 0
}

// === 4. MONTH-RANGE HELPERS ===

/**
 * Is the given month (1-12) inside the month range? Handles year-wrap windows
 * (e.g. November–February with start_month=11, end_month=2).
 * (Liegt der Monat im Bereich? Berücksichtigt Jahreswechsel.)
 */
function monthInRange(month: number, range: MonthRange): boolean {
  const { start_month: s, end_month: e } = range;
  if (s <= e) return month >= s && month <= e;
  // Wrap (Nov-Feb): month either >= s OR <= e
  return month >= s || month <= e;
}

// === 5. CORE — tasksForWeek ===

/**
 * Return the list of garden tasks for the given ISO week (urgency = this_week)
 * and the following two weeks (urgency = next_2_weeks). Tasks are derived from
 * each plant's `garden_meta.sowing_window` / `harvest_window`, adjusted by the
 * user's USDA climate zone.
 *
 * Pure function — does not read or write LocalStorage, network, etc.
 * (Reine Funktion — keine Side-Effects.)
 *
 * @param profile  User profile (only `zone` is read).
 * @param plan     Garden plan as produced by `gardenPlan.ts`.
 * @param isoWeek  ISO week number (1-53).
 * @param year     ISO week-year.
 * @param resolveGardenMeta  Liefert die `garden_meta` zu einem Slug. Wird vom
 *   Caller injiziert (z.B. aus der bereits geladenen GardenPlant-Map), damit
 *   diese Engine NICHT `loadPlants` statisch importieren muss — sonst zoge der
 *   eager-Glob aller Plant-JSONs in jeden Client-Chunk (WeekView/Kalender).
 * @returns        Deduplicated list of CalendarTask items.
 */
export function tasksForWeek(
  profile: CalendarUserProfile,
  plan: CalendarPlan,
  isoWeek: number,
  year: number,
  resolveGardenMeta: (slug: string) => GardenMeta | null | undefined,
): CalendarTask[] {
  if (!Array.isArray(plan) || plan.length === 0) return [];
  const shiftWeeks = zoneShiftWeeks(profile.zone);

  // === 5.1 Build the 3 weeks-of-interest as { week, year, urgency, month } ===
  const targets: Array<{ urgency: CalendarUrgency; month: number }> = [];
  for (let offset = 0; offset < 3; offset++) {
    // Shifted reference Monday: apply zone shift + week offset.
    const monday = isoWeekToMonday(isoWeek, year);
    monday.setUTCDate(monday.getUTCDate() + offset * 7 - shiftWeeks * 7);
    const month = monday.getUTCMonth() + 1; // 1-12
    targets.push({
      urgency: offset === 0 ? 'this_week' : 'next_2_weeks',
      month,
    });
  }

  // === 5.2 Walk the plan, emit tasks ===
  const tasks: CalendarTask[] = [];
  const seen = new Set<string>(); // dedupe key = slug|action|urgency

  for (const entry of plan) {
    if (!entry || typeof entry.plant_slug !== 'string') continue;
    const meta = resolveGardenMeta(entry.plant_slug);
    if (!meta) continue;

    for (const target of targets) {
      // sow_indoor
      if (meta.sowing_window.indoor &&
          monthInRange(target.month, meta.sowing_window.indoor)) {
        pushTask(tasks, seen, entry.plant_slug, 'sow_indoor', target.urgency);
      }
      // sow_outdoor
      if (meta.sowing_window.outdoor_direct &&
          monthInRange(target.month, meta.sowing_window.outdoor_direct)) {
        pushTask(tasks, seen, entry.plant_slug, 'sow_outdoor', target.urgency);
      }
      // transplant
      if (meta.sowing_window.transplant &&
          monthInRange(target.month, meta.sowing_window.transplant)) {
        pushTask(tasks, seen, entry.plant_slug, 'transplant', target.urgency);
      }
      // harvest
      if (monthInRange(target.month, meta.harvest_window)) {
        pushTask(tasks, seen, entry.plant_slug, 'harvest', target.urgency);
      }
    }
  }

  return tasks;
}

function pushTask(
  out: CalendarTask[],
  seen: Set<string>,
  slug: string,
  action: CalendarAction,
  urgency: CalendarUrgency,
): void {
  // Prefer 'this_week' over 'next_2_weeks' if both apply.
  const keyAny = `${slug}|${action}`;
  // Already a this_week record for this slug+action? skip
  if (seen.has(`${keyAny}|this_week`)) return;
  // If urgency=this_week, also remove any previously-emitted next_2_weeks duplicate
  if (urgency === 'this_week') {
    if (seen.has(`${keyAny}|next_2_weeks`)) {
      // Replace existing entry's urgency in-place
      const idx = out.findIndex(
        t => t.plant_slug === slug && t.action === action && t.urgency === 'next_2_weeks',
      );
      if (idx >= 0) out[idx] = { plant_slug: slug, action, urgency: 'this_week' };
      seen.delete(`${keyAny}|next_2_weeks`);
      seen.add(`${keyAny}|this_week`);
      return;
    }
  } else {
    // urgency = next_2_weeks; if a dup of same already exists, skip
    if (seen.has(`${keyAny}|next_2_weeks`)) return;
  }
  out.push({ plant_slug: slug, action, urgency });
  seen.add(`${keyAny}|${urgency}`);
}
