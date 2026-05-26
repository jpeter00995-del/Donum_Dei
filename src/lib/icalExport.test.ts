// Tests for icalExport.ts (v1.0 Selbstversorger Task 13).

import { describe, expect, it, vi } from 'vitest';
import type { Plant } from './types';

vi.mock('./loadPlants', () => ({
  loadPlantBySlug: (slug: string) => mockPlants[slug] ?? null,
  loadAllPlants: () => Object.values(mockPlants),
}));

const mockPlants: Record<string, Plant> = {};

import {
  escapeIcsText,
  buildIcsEvent,
  buildIcsCalendar,
  buildIcs,
} from './icalExport';

function makePlant(slug: string, gardenMeta: Plant['garden_meta']): Plant {
  return {
    slug,
    names: { de: slug + '-de', en: slug + '-en', latin: 'Foo bar' },
    family: { de: 'F', en: 'F', latin: 'F' },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: [],
    season: { active_months: [], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: '', alt: { de: '', en: '' }, license: '', author: '', source_url: '' },
    garden_meta: gardenMeta,
  };
}

describe('escapeIcsText (RFC 5545 § 3.3.11)', () => {
  it('escapes backslash, semicolon, comma, and newlines', () => {
    expect(escapeIcsText('a;b,c\\d')).toBe('a\\;b\\,c\\\\d');
    expect(escapeIcsText('line1\nline2')).toBe('line1\\nline2');
    expect(escapeIcsText('line1\r\nline2')).toBe('line1\\nline2');
  });

  it('leaves plain text untouched', () => {
    expect(escapeIcsText('Hello World')).toBe('Hello World');
  });
});

describe('buildIcsEvent', () => {
  it('produces a minimal valid VEVENT with all-day date', () => {
    const ev = buildIcsEvent(
      {
        uid: 'test-1@donumdei',
        startDate: new Date(Date.UTC(2026, 4, 18)), // 18. Mai 2026
        summary: 'Säen: Tomate',
        description: 'Vorziehen im Garten.',
      },
      new Date(Date.UTC(2026, 4, 17, 12, 0, 0)),
    );
    expect(ev).toContain('BEGIN:VEVENT');
    expect(ev).toContain('END:VEVENT');
    expect(ev).toContain('UID:test-1@donumdei');
    expect(ev).toContain('DTSTART;VALUE=DATE:20260518');
    expect(ev).toContain('DTEND;VALUE=DATE:20260519');
    expect(ev).toContain('SUMMARY:Säen: Tomate');
    expect(ev).toContain('DTSTAMP:20260517T120000Z');
  });

  it('includes a VALARM block when reminderMinutesBefore is set', () => {
    const ev = buildIcsEvent({
      uid: 'r@dd',
      startDate: new Date(Date.UTC(2026, 5, 1)),
      summary: 'Ernten',
      description: 'd',
      reminderMinutesBefore: 24 * 60,
    });
    expect(ev).toContain('BEGIN:VALARM');
    expect(ev).toContain('TRIGGER:-PT1440M');
    expect(ev).toContain('END:VALARM');
  });
});

describe('buildIcsCalendar', () => {
  it('wraps events with VCALENDAR + PRODID + VERSION', () => {
    const cal = buildIcsCalendar(['BEGIN:VEVENT\r\nUID:x\r\nEND:VEVENT']);
    expect(cal).toContain('BEGIN:VCALENDAR');
    expect(cal).toContain('VERSION:2.0');
    expect(cal).toContain('PRODID:-//Donum Dei//Selbstversorger Planner v1.0//EN');
    expect(cal).toContain('END:VCALENDAR');
    expect(cal.endsWith('\r\n')).toBe(true);
  });
});

describe('buildIcs (high-level)', () => {
  it('produces a calendar with at least one VEVENT for a plan that matches', () => {
    mockPlants['tomato'] = makePlant('tomato', {
      climate_zones: ['7a'],
      sowing_window: {
        outdoor_direct: { start_month: 5, end_month: 6 },
      },
      harvest_window: { start_month: 7, end_month: 9 },
      days_to_harvest: 70,
      spacing_cm: 60,
      garden_type: ['raised_bed'],
      difficulty: 2,
    });
    const ics = buildIcs(
      { zone: '7a' },
      [{ plant_slug: 'tomato' }],
      18, // start KW 18 / 2026 (Anfang Mai)
      2026,
      mockPlants,
      'de',
      { weeksAhead: 8, now: new Date(Date.UTC(2026, 4, 1)) },
    );
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toMatch(/BEGIN:VEVENT[\s\S]+END:VEVENT/);
    expect(ics).toContain('Säen');
  });
});
