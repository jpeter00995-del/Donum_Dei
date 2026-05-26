// iCalendar (.ics) export for the v1.0 Selbstversorger garden planner.
// (iCalendar-Export für die Garten-Aufgaben des v1.0 Planers.)
//
// Generates an RFC 5545-compliant .ics file with all-day VEVENTs for every
// sowing / transplant / harvest task in the user's plan, with a VALARM
// reminder 1 day before each event.
//
// No external dependency — we construct the ICS body by hand, which keeps
// the bundle small and avoids RFC 5545 surprises from third-party libs.
//
// Spec: TODO_v1.0_selbstversorger.md Task 13

import type { Plant, Locale } from './types';
import type {
  CalendarAction,
  CalendarPlan,
  CalendarUserProfile,
} from './calendarEngine';
import { tasksForWeek, isoWeekToMonday, zoneShiftWeeks } from './calendarEngine';

// === 1. CONSTANTS ===

const PRODID = '-//Donum Dei//Selbstversorger Planner v1.0//EN';
const CRLF = '\r\n';

// === 2. TEXTS ===

const ACTION_VERB: Record<Locale, Record<CalendarAction, string>> = {
  de: {
    sow_indoor: 'Vorziehen (drinnen)',
    sow_outdoor: 'Säen (Freiland)',
    transplant: 'Auspflanzen',
    harvest: 'Ernten',
  },
  en: {
    sow_indoor: 'Start indoors',
    sow_outdoor: 'Sow outdoors',
    transplant: 'Transplant',
    harvest: 'Harvest',
  },
};

// === 3. ESCAPING ===

/**
 * Escape a text value per RFC 5545 § 3.3.11 (TEXT type):
 *   `\`, `;`, `,` must be escaped; newlines become literal `\n`.
 * (RFC-5545-konformes Escaping für SUMMARY/DESCRIPTION/LOCATION.)
 */
export function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Fold a content line at column 75 (RFC 5545 § 3.1) by inserting CRLF + space.
 * Operates on UTF-16 code units which is good enough for ASCII-dominant text.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = i === 0 ? line.slice(0, 75) : line.slice(i, i + 74);
    parts.push(i === 0 ? chunk : ' ' + chunk);
    i += i === 0 ? 75 : 74;
  }
  return parts.join(CRLF);
}

// === 4. DATE HELPERS ===

/**
 * Format a Date as YYYYMMDD (RFC 5545 DATE form for all-day events).
 * Uses UTC components — events are tagged as all-day "floating" via VALUE=DATE.
 */
function toIcsDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Format a Date as YYYYMMDDTHHMMSSZ (RFC 5545 DATE-TIME form, UTC).
 * Used for DTSTAMP. The actual VEVENT body uses DATE-only fields.
 */
function toIcsDateTime(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

// === 5. EVENT BUILDER ===

/**
 * Parameters for a single calendar event.
 */
export interface IcsEvent {
  /** Stable UID — should be unique per event across runs. */
  uid: string;
  /** Start date (all-day). Will be formatted as DATE. */
  startDate: Date;
  /** Title shown in the calendar app. */
  summary: string;
  /** Free-text body (will be RFC-escaped). */
  description: string;
  /** Optional URL (e.g. plant detail page). */
  url?: string;
  /** Optional reminder offset in minutes before start. */
  reminderMinutesBefore?: number;
}

/**
 * Build a single VEVENT block (without the wrapping VCALENDAR).
 */
export function buildIcsEvent(ev: IcsEvent, now: Date = new Date()): string {
  const dtStamp = toIcsDateTime(now);
  const dtStart = toIcsDate(ev.startDate);
  // DTEND for all-day events is exclusive — start + 1 day.
  const endDate = new Date(ev.startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const dtEnd = toIcsDate(endDate);

  const lines: string[] = [
    'BEGIN:VEVENT',
    foldLine(`UID:${ev.uid}`),
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    foldLine(`SUMMARY:${escapeIcsText(ev.summary)}`),
    foldLine(`DESCRIPTION:${escapeIcsText(ev.description)}`),
  ];
  if (ev.url) {
    lines.push(foldLine(`URL:${ev.url}`));
  }
  if (ev.reminderMinutesBefore !== undefined && ev.reminderMinutesBefore > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      foldLine(`DESCRIPTION:${escapeIcsText(ev.summary)}`),
      `TRIGGER:-PT${ev.reminderMinutesBefore}M`,
      'END:VALARM',
    );
  }
  lines.push('END:VEVENT');
  return lines.join(CRLF);
}

/**
 * Wrap one or more VEVENT bodies in a complete VCALENDAR document.
 */
export function buildIcsCalendar(eventBodies: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...eventBodies,
    'END:VCALENDAR',
    '',
  ].join(CRLF);
}

// === 6. HIGH-LEVEL: buildIcs ===

/**
 * Build an .ics document for ALL tasks across a 1-year horizon from the
 * given reference ISO week. This generates events for each ISO week
 * by re-running `tasksForWeek` so the calendar reflects the full year.
 *
 * @param profile      User profile (for climate-zone shift).
 * @param plan         Garden plan.
 * @param startIsoWeek Reference ISO week (events start here, run 52 weeks ahead).
 * @param startYear    Reference ISO year.
 * @param plantsBySlug Plant lookup (for titles + URLs).
 * @param locale       'de' | 'en' — determines language of titles.
 */
export function buildIcs(
  profile: CalendarUserProfile,
  plan: CalendarPlan,
  startIsoWeek: number,
  startYear: number,
  plantsBySlug: Record<string, Plant>,
  locale: Locale = 'de',
  options?: { weeksAhead?: number; now?: Date; origin?: string },
): string {
  const weeksAhead = options?.weeksAhead ?? 52;
  const now = options?.now ?? new Date();
  const origin = options?.origin ?? '';
  const verbs = ACTION_VERB[locale];

  // We sample one ISO week per offset; tasksForWeek returns this_week tasks
  // plus next_2_weeks — to avoid duplicates, only honor 'this_week' from each
  // call (next_2_weeks tasks will surface naturally when we hit those weeks).
  const seenUids = new Set<string>();
  const eventBodies: string[] = [];
  const zoneShift = zoneShiftWeeks(profile.zone);

  // Convert (startIsoWeek, startYear) → Monday, then walk weekly.
  for (let offset = 0; offset < weeksAhead; offset++) {
    // Compute the iso week-year at offset by walking from the reference Monday.
    const monday = isoWeekToMonday(startIsoWeek, startYear);
    monday.setUTCDate(monday.getUTCDate() + offset * 7);
    // Re-derive iso week from this monday (use UTC noon to avoid edge cases).
    const probe = new Date(monday);
    probe.setUTCHours(12, 0, 0, 0);
    const { week, year } = isoWeekFromDateInternal(probe);
    const tasks = tasksForWeek(profile, plan, week, year).filter(
      t => t.urgency === 'this_week',
    );
    for (const task of tasks) {
      // Event start = Monday of this week, shifted back into "user-facing time"
      // (we already applied zoneShift inside tasksForWeek to month-selection;
      // for the calendar event date we use the actual Monday of `week/year`).
      const eventDate = isoWeekToMonday(week, year);
      // Add zoneShift back so the calendar date matches the user's perception.
      eventDate.setUTCDate(eventDate.getUTCDate() + zoneShift * 7);
      const plant = plantsBySlug[task.plant_slug];
      const plantLabel = plant ? plant.names[locale] : task.plant_slug;
      const verb = verbs[task.action];
      const summary = `${verb}: ${plantLabel}`;
      const desc = plant
        ? (locale === 'de'
            ? `${verb} im Garten — ${plant.names.de} (${plant.names.latin}).`
            : `${verb} in the garden — ${plant.names.en} (${plant.names.latin}).`)
        : summary;
      const url = plant && origin
        ? `${origin}/${locale}/plant/${plant.slug}/`
        : undefined;
      const uid = `${task.plant_slug}-${task.action}-${week}-${year}@donumdei`;
      if (seenUids.has(uid)) continue;
      seenUids.add(uid);
      eventBodies.push(
        buildIcsEvent(
          {
            uid,
            startDate: eventDate,
            summary,
            description: desc,
            url,
            reminderMinutesBefore: 24 * 60, // 1 day before
          },
          now,
        ),
      );
    }
  }

  return buildIcsCalendar(eventBodies);
}

// Local copy of isoWeekFromDate to avoid an additional import surface.
function isoWeekFromDateInternal(date: Date): { week: number; year: number } {
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

// === 7. BROWSER DOWNLOAD HELPER ===

/**
 * Trigger a browser download of the given .ics string.
 * No-op in non-browser environments (e.g. SSR / Node tests).
 * (Datei-Download im Browser auslösen; in Node ein No-op.)
 */
export function downloadIcs(icsContent: string, filename = 'donumdei.ics'): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
