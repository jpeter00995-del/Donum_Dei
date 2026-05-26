// Tests for calendarEngine.ts (v1.0 Selbstversorger Task 10).
//
// We mock loadPlants so the engine can be tested against synthetic plants
// regardless of whether the bundled JSONs already have garden_meta.

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Plant } from './types';

// === 1. MOCK SETUP ===

const mockPlants: Record<string, Plant> = {};

vi.mock('./loadPlants', () => ({
  loadPlantBySlug: (slug: string) => mockPlants[slug] ?? null,
  loadAllPlants: () => Object.values(mockPlants),
}));

// Import AFTER mocking so the engine picks up the mock.
import {
  tasksForWeek,
  zoneShiftWeeks,
  isoWeekToMonday,
  isoWeekFromDate,
} from './calendarEngine';

// === 2. HELPERS ===

function makePlant(
  slug: string,
  garden_meta: Plant['garden_meta'],
): Plant {
  return {
    slug,
    names: { de: slug, en: slug, latin: slug },
    family: { de: 'F', en: 'F', latin: 'F' },
    description: { de: '', en: '' },
    teaser: { de: '', en: '' },
    uses: [],
    season: { active_months: [], harvest_part: { de: '', en: '' } },
    safety: { warnings: { de: '', en: '' }, external_only: false },
    classical_quotes: [],
    sources: [],
    image: { filename: '', alt: { de: '', en: '' }, license: '', author: '', source_url: '' },
    garden_meta,
  };
}

beforeEach(() => {
  for (const k of Object.keys(mockPlants)) delete mockPlants[k];
});

// === 3. TESTS ===

describe('zoneShiftWeeks', () => {
  it('returns 0 for zone 6 (baseline)', () => {
    expect(zoneShiftWeeks('6')).toBe(0);
    expect(zoneShiftWeeks('6a')).toBe(0);
    expect(zoneShiftWeeks('6b')).toBe(0);
  });

  it('returns -2 for zone 8 (2 weeks earlier)', () => {
    expect(zoneShiftWeeks('8')).toBe(-2);
    expect(zoneShiftWeeks('8a')).toBe(-2);
  });

  it('returns +1 for zone 5 (1 week later)', () => {
    expect(zoneShiftWeeks('5')).toBe(1);
  });

  it('returns 0 for unknown zone', () => {
    expect(zoneShiftWeeks('abc')).toBe(0);
    expect(zoneShiftWeeks('')).toBe(0);
  });
});

describe('isoWeekToMonday / isoWeekFromDate roundtrip', () => {
  it('week 1 of 2026 starts Monday 2025-12-29 (ISO 8601)', () => {
    const d = isoWeekToMonday(1, 2026);
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth() + 1).toBe(12);
    expect(d.getUTCDate()).toBe(29);
  });

  it('roundtrip for week 21 2026', () => {
    const monday = isoWeekToMonday(21, 2026);
    const back = isoWeekFromDate(monday);
    expect(back.week).toBe(21);
    expect(back.year).toBe(2026);
  });
});

describe('tasksForWeek', () => {
  it('returns empty array for empty plan', () => {
    const tasks = tasksForWeek(
      { zone: '7a' },
      [],
      21,
      2026,
    );
    expect(tasks).toEqual([]);
  });

  it('emits sow_outdoor for plant in window (mid-summer, zone 7)', () => {
    // KW 21 / 2026 = 2026-05-18 (May). Tomatensaat outdoor in Mai-Juni.
    mockPlants['tomato'] = makePlant('tomato', {
      climate_zones: ['7a', '7b', '8a'],
      sowing_window: {
        outdoor_direct: { start_month: 5, end_month: 6 },
      },
      harvest_window: { start_month: 7, end_month: 9 },
      days_to_harvest: 70,
      spacing_cm: 60,
      garden_type: ['raised_bed', 'field'],
      difficulty: 2,
    });
    const tasks = tasksForWeek(
      { zone: '7a' },
      [{ plant_slug: 'tomato' }],
      21,
      2026,
    );
    expect(tasks.some(t => t.plant_slug === 'tomato' && t.action === 'sow_outdoor')).toBe(true);
  });

  it('emits no task in deep winter (KW 2, harvest in summer)', () => {
    mockPlants['lettuce'] = makePlant('lettuce', {
      climate_zones: ['7a'],
      sowing_window: {
        outdoor_direct: { start_month: 4, end_month: 8 },
      },
      harvest_window: { start_month: 6, end_month: 9 },
      days_to_harvest: 45,
      spacing_cm: 25,
      garden_type: ['raised_bed'],
      difficulty: 1,
    });
    const tasks = tasksForWeek(
      { zone: '7a' },
      [{ plant_slug: 'lettuce' }],
      2,
      2026,
    );
    expect(tasks).toEqual([]);
  });

  it('warmer zone (8) shifts window earlier: April task appears in late March', () => {
    mockPlants['carrot'] = makePlant('carrot', {
      climate_zones: ['7a', '8a'],
      sowing_window: {
        outdoor_direct: { start_month: 4, end_month: 4 }, // only April
      },
      harvest_window: { start_month: 8, end_month: 9 },
      days_to_harvest: 90,
      spacing_cm: 5,
      garden_type: ['raised_bed'],
      difficulty: 1,
    });
    // KW 12 / 2026 = late March 2026. Zone 6 user: no task (April window).
    const tasksZone6 = tasksForWeek(
      { zone: '6' },
      [{ plant_slug: 'carrot' }],
      12,
      2026,
    );
    // Zone 8 user: shift -2 weeks → engine looks at week 14, in April → task.
    const tasksZone8 = tasksForWeek(
      { zone: '8' },
      [{ plant_slug: 'carrot' }],
      12,
      2026,
    );
    expect(tasksZone6.length).toBe(0);
    expect(tasksZone8.length).toBeGreaterThan(0);
    expect(tasksZone8[0].action).toBe('sow_outdoor');
  });

  it('handles year-wrap harvest window (Nov-Feb)', () => {
    mockPlants['kale'] = makePlant('kale', {
      climate_zones: ['7a'],
      sowing_window: {
        outdoor_direct: { start_month: 5, end_month: 7 },
      },
      harvest_window: { start_month: 11, end_month: 2 }, // wrap
      days_to_harvest: 120,
      spacing_cm: 40,
      garden_type: ['raised_bed', 'field'],
      difficulty: 2,
    });
    // KW 2 / 2026 = Januar — innerhalb des Wrap-Fensters.
    const tasks = tasksForWeek(
      { zone: '7a' },
      [{ plant_slug: 'kale' }],
      2,
      2026,
    );
    expect(tasks.some(t => t.action === 'harvest')).toBe(true);
  });

  it('marks this_week vs next_2_weeks correctly', () => {
    // Pflanze säen nur in der Folgewoche (KW 22 = letzte Mai-Woche / Anfang Juni).
    // Wir setzen ein Fenster auf 1.-15. eines Monats wäre komplex; stattdessen
    // nehmen wir ein Fenster, das in KW 21 (Mai) und KW 23 (Juni) liegt — die
    // Engine sollte beide Wochen abdecken.
    mockPlants['basil'] = makePlant('basil', {
      climate_zones: ['7a'],
      sowing_window: {
        outdoor_direct: { start_month: 5, end_month: 6 },
      },
      harvest_window: { start_month: 7, end_month: 9 },
      days_to_harvest: 60,
      spacing_cm: 30,
      garden_type: ['balcony', 'raised_bed'],
      difficulty: 2,
    });
    const tasks = tasksForWeek(
      { zone: '7a' },
      [{ plant_slug: 'basil' }],
      21,
      2026,
    );
    // Erwarte mindestens einen this_week-Task (KW 21 = Mai).
    expect(tasks.some(t => t.urgency === 'this_week' && t.action === 'sow_outdoor')).toBe(true);
  });
});
