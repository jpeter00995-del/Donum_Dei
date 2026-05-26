// === User Profile — Selbstversorger v1.0 ===
// Storage layer for the user profile collected by the Onboarding-Wizard.
// (Speicher-Schicht für das Nutzer-Profil aus dem Onboarding-Wizard.)
//
// Schema-Version 1. See TODO_v1.0_selbstversorger.md Task 5.
// Backwards-incompatible changes MUST bump `CURRENT_SCHEMA_VERSION` and
// add a branch to `migrateProfile()`.

import type { GardenType } from './types';

// === 1. CONSTANTS ===

/** LocalStorage key for the persisted profile JSON. */
export const PROFILE_STORAGE_KEY = 'donumdei_user_profile_v1';

/** Latest profile schema version. Bump on breaking shape changes. */
export const CURRENT_SCHEMA_VERSION = 1 as const;

// === 2. TYPES ===

/** Self-sufficiency goal — how much of the household food should come from the garden. */
export type SelfSufficiencyGoal = 'supplementary' | 'half' | 'full';

/** Gardener experience level. */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';

/** Per-plant override the user added or edited in the Plan-Editor. */
export type PlanOverride = {
  /** Plant slug as in src/data/plants/*.json. */
  plant_slug: string;
  /** How many plants the user wants (>= 0). 0 means removed from plan. */
  quantity: number;
};

/**
 * Persistierte User-Position für eine Pflanze im Beet-Visualizer (Welle J).
 * (x, y) sind Meter relativ zur top-left Ecke des Beets.
 * Optional und additiv — fehlende Positionen → Auto-Layout.
 */
export type BeetPosition = {
  plant_slug: string;
  x: number;
  y: number;
};

/** Top-level overrides bag persisted alongside the generated plan. */
export type PlanOverrides = {
  /** Added or modified plants — keyed by `plant_slug`. */
  edits: Record<string, PlanOverride>;
  /** Slugs the user explicitly removed from the auto-generated plan. */
  removed: string[];
  /**
   * Optional manuelle Positionen im Beet-Visualizer (Welle J).
   * Backwards-compatible — Legacy-Profile ohne dieses Feld bleiben gültig.
   * (Optionale Drag&Drop-Positionen pro Pflanze.)
   */
  beet_positions?: BeetPosition[];
};

/**
 * Persisted user profile (v1). The shape MUST match
 * TODO_v1.0_selbstversorger.md Task 5 schema.
 * (Persistiertes Nutzerprofil, Version 1.)
 */
export type UserProfile = {
  /** Profile schema version — currently 1. */
  schema_version: typeof CURRENT_SCHEMA_VERSION;
  /** ISO-8601 timestamp of first save. */
  created_at: string;
  /** USDA climate zone label, e.g. "7a". */
  zone: string;
  /** Garden setup. */
  garden: {
    type: GardenType;
    /** Garden area in square metres (>= 0). */
    area_sqm: number;
  };
  /** Household size (>= 1). */
  household_size: number;
  /** Self-sufficiency ambition. */
  self_sufficiency_goal: SelfSufficiencyGoal;
  /** Gardener experience. */
  experience: ExperienceLevel;
  /** Optional manual edits on top of the auto-generated plan. */
  custom_plan?: PlanOverrides;
};

/** Subset captured by the Onboarding-Wizard before timestamp is added. */
export type ProfileDraft = Omit<UserProfile, 'schema_version' | 'created_at' | 'custom_plan'>;

// === 3. STORAGE ABSTRACTION ===

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Resolve a StorageLike instance. Falls back to `null` in non-browser
 * environments (SSR / Node tests without `localStorage`).
 */
function getStorage(custom?: StorageLike | null): StorageLike | null {
  if (custom !== undefined) return custom;
  if (typeof globalThis !== 'undefined' && typeof (globalThis as { localStorage?: StorageLike }).localStorage !== 'undefined') {
    return (globalThis as { localStorage: StorageLike }).localStorage;
  }
  return null;
}

// === 4. PUBLIC API ===

/**
 * Persist a profile draft. Stamps `schema_version` and `created_at`.
 * Preserves the original `created_at` and `custom_plan` if a profile
 * already exists.
 * (Persistiert das Profil; behält created_at + custom_plan bei.)
 *
 * @param draft  Fields captured by the wizard.
 * @param storage Optional storage override (used by tests).
 * @returns The fully-formed profile that was written.
 */
export function saveProfile(draft: ProfileDraft, storage?: StorageLike | null): UserProfile {
  const s = getStorage(storage);
  const existing = s ? safeLoad(s) : null;
  const profile: UserProfile = {
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: existing?.created_at ?? new Date().toISOString(),
    zone: draft.zone,
    garden: { type: draft.garden.type, area_sqm: draft.garden.area_sqm },
    household_size: draft.household_size,
    self_sufficiency_goal: draft.self_sufficiency_goal,
    experience: draft.experience,
    custom_plan: existing?.custom_plan,
  };
  if (s) s.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * Load the persisted profile. Returns `null` when nothing is stored,
 * the data is corrupt, or migration fails irrecoverably.
 * (Lädt das Profil; gibt null zurück bei leer/kaputt.)
 */
export function loadProfile(storage?: StorageLike | null): UserProfile | null {
  const s = getStorage(storage);
  if (!s) return null;
  return safeLoad(s);
}

/**
 * Remove the persisted profile entirely.
 * (Profil komplett löschen.)
 */
export function resetProfile(storage?: StorageLike | null): void {
  const s = getStorage(storage);
  if (!s) return;
  s.removeItem(PROFILE_STORAGE_KEY);
}

/**
 * Persist a `custom_plan` overrides bag without changing the rest
 * of the profile. No-op when no profile exists.
 * (Speichert die Plan-Overrides ohne den Rest zu berühren.)
 */
export function saveCustomPlan(overrides: PlanOverrides, storage?: StorageLike | null): UserProfile | null {
  const s = getStorage(storage);
  if (!s) return null;
  const existing = safeLoad(s);
  if (!existing) return null;
  const next: UserProfile = { ...existing, custom_plan: overrides };
  s.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

/**
 * Migrate a parsed-but-untyped object to the current profile shape.
 * Returns the migrated profile or `null` if migration is impossible.
 * Currently only handles v0 (no schema_version) and v1 (current).
 * (Migriert ein altes Profil; null wenn nicht migrierbar.)
 */
export function migrateProfile(input: unknown): UserProfile | null {
  if (!isPlainObject(input)) return null;
  const version = typeof input['schema_version'] === 'number' ? input['schema_version'] : 0;

  if (version === CURRENT_SCHEMA_VERSION) {
    return validateShape(input);
  }
  if (version === 0) {
    // v0 → v1: legacy shape lacked `schema_version` and used flat fields.
    const upgraded: Record<string, unknown> = {
      schema_version: CURRENT_SCHEMA_VERSION,
      created_at: typeof input['created_at'] === 'string' ? input['created_at'] : new Date().toISOString(),
      zone: input['zone'],
      garden: input['garden'],
      household_size: input['household_size'],
      self_sufficiency_goal: input['self_sufficiency_goal'],
      experience: input['experience'],
      custom_plan: input['custom_plan'],
    };
    return validateShape(upgraded);
  }
  // Unknown future versions: refuse to load (caller can resetProfile()).
  return null;
}

// === 5. INTERNAL HELPERS ===

function safeLoad(s: StorageLike): UserProfile | null {
  let raw: string | null;
  try {
    raw = s.getItem(PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null || raw === '') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return migrateProfile(parsed);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateShape(o: Record<string, unknown>): UserProfile | null {
  const garden = o['garden'];
  if (
    typeof o['zone'] !== 'string' ||
    !isPlainObject(garden) ||
    typeof garden['type'] !== 'string' ||
    typeof garden['area_sqm'] !== 'number' ||
    typeof o['household_size'] !== 'number' ||
    typeof o['self_sufficiency_goal'] !== 'string' ||
    typeof o['experience'] !== 'string'
  ) {
    return null;
  }
  const allowedTypes: GardenType[] = ['balcony', 'raised_bed', 'field', 'greenhouse'];
  if (!allowedTypes.includes(garden['type'] as GardenType)) return null;
  const allowedGoals: SelfSufficiencyGoal[] = ['supplementary', 'half', 'full'];
  if (!allowedGoals.includes(o['self_sufficiency_goal'] as SelfSufficiencyGoal)) return null;
  const allowedExp: ExperienceLevel[] = ['beginner', 'intermediate', 'expert'];
  if (!allowedExp.includes(o['experience'] as ExperienceLevel)) return null;

  const custom = o['custom_plan'];
  const customPlan = isPlainObject(custom) && isValidOverrides(custom) ? (custom as unknown as PlanOverrides) : undefined;

  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: typeof o['created_at'] === 'string' ? (o['created_at'] as string) : new Date().toISOString(),
    zone: o['zone'] as string,
    garden: {
      type: garden['type'] as GardenType,
      area_sqm: garden['area_sqm'] as number,
    },
    household_size: o['household_size'] as number,
    self_sufficiency_goal: o['self_sufficiency_goal'] as SelfSufficiencyGoal,
    experience: o['experience'] as ExperienceLevel,
    custom_plan: customPlan,
  };
}

function isValidOverrides(o: Record<string, unknown>): boolean {
  const edits = o['edits'];
  const removed = o['removed'];
  if (!isPlainObject(edits)) return false;
  if (!Array.isArray(removed)) return false;
  for (const v of Object.values(edits)) {
    if (!isPlainObject(v)) return false;
    if (typeof v['plant_slug'] !== 'string') return false;
    if (typeof v['quantity'] !== 'number') return false;
  }
  for (const slug of removed) {
    if (typeof slug !== 'string') return false;
  }
  // beet_positions ist optional — wenn vorhanden, muss es ein Array
  // von { plant_slug, x, y } sein. (Welle J — Backwards-compatible.)
  const positions = o['beet_positions'];
  if (positions !== undefined) {
    if (!Array.isArray(positions)) return false;
    for (const p of positions) {
      if (!isPlainObject(p)) return false;
      if (typeof p['plant_slug'] !== 'string') return false;
      if (typeof p['x'] !== 'number') return false;
      if (typeof p['y'] !== 'number') return false;
    }
  }
  return true;
}
