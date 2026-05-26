import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProfile,
  loadProfile,
  resetProfile,
  migrateProfile,
  saveCustomPlan,
  CURRENT_SCHEMA_VERSION,
  PROFILE_STORAGE_KEY,
  type ProfileDraft,
  type UserProfile,
} from './userProfile';

// === Test-only in-memory storage ===
// (Eigene Storage-Implementierung, damit Tests in Node ohne jsdom laufen.)
function makeMemStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    raw: map,
  };
}

const DRAFT: ProfileDraft = {
  zone: '7a',
  garden: { type: 'raised_bed', area_sqm: 12 },
  household_size: 3,
  self_sufficiency_goal: 'half',
  experience: 'intermediate',
};

describe('userProfile — save/load roundtrip', () => {
  let store: ReturnType<typeof makeMemStorage>;
  beforeEach(() => {
    store = makeMemStorage();
  });

  it('saves a draft and loads it back with schema_version + created_at stamped', () => {
    const saved = saveProfile(DRAFT, store);
    expect(saved.schema_version).toBe(CURRENT_SCHEMA_VERSION);
    expect(saved.zone).toBe('7a');
    expect(saved.garden.area_sqm).toBe(12);
    expect(typeof saved.created_at).toBe('string');
    expect(new Date(saved.created_at).toString()).not.toBe('Invalid Date');

    const loaded = loadProfile(store);
    expect(loaded).toEqual(saved);
  });

  it('preserves created_at across re-saves', () => {
    const first = saveProfile(DRAFT, store);
    const second = saveProfile({ ...DRAFT, household_size: 5 }, store);
    expect(second.created_at).toBe(first.created_at);
    expect(second.household_size).toBe(5);
  });
});

describe('userProfile — load on empty / corrupt storage', () => {
  it('returns null when nothing is stored', () => {
    const store = makeMemStorage();
    expect(loadProfile(store)).toBeNull();
  });

  it('returns null on corrupt JSON instead of throwing', () => {
    const store = makeMemStorage();
    store.raw.set(PROFILE_STORAGE_KEY, '{not valid json');
    expect(loadProfile(store)).toBeNull();
  });

  it('returns null on JSON that is well-formed but the wrong shape', () => {
    const store = makeMemStorage();
    store.raw.set(PROFILE_STORAGE_KEY, JSON.stringify({ schema_version: 1, garbage: true }));
    expect(loadProfile(store)).toBeNull();
  });

  it('returns null on a future, unknown schema_version', () => {
    const store = makeMemStorage();
    store.raw.set(PROFILE_STORAGE_KEY, JSON.stringify({ schema_version: 99, zone: '7a' }));
    expect(loadProfile(store)).toBeNull();
  });
});

describe('userProfile — migration v0 → v1', () => {
  it('migrates a legacy v0 object (no schema_version) into the current shape', () => {
    const legacy = {
      // schema_version absent → treated as v0
      created_at: '2026-01-01T00:00:00.000Z',
      zone: '7b',
      garden: { type: 'balcony', area_sqm: 4 },
      household_size: 2,
      self_sufficiency_goal: 'supplementary',
      experience: 'beginner',
    };
    const migrated = migrateProfile(legacy);
    expect(migrated).not.toBeNull();
    expect(migrated!.schema_version).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated!.zone).toBe('7b');
    expect(migrated!.created_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns null when migration cannot produce a valid profile (missing fields)', () => {
    const broken = { created_at: '2026-01-01T00:00:00.000Z', zone: '7a' };
    expect(migrateProfile(broken)).toBeNull();
  });

  it('passes through current-version profiles unchanged', () => {
    const current: UserProfile = {
      schema_version: CURRENT_SCHEMA_VERSION,
      created_at: '2026-05-17T10:00:00.000Z',
      zone: '8a',
      garden: { type: 'field', area_sqm: 200 },
      household_size: 4,
      self_sufficiency_goal: 'full',
      experience: 'expert',
    };
    const migrated = migrateProfile(current);
    expect(migrated).toEqual(current);
  });
});

describe('userProfile — reset + custom plan', () => {
  it('removes the persisted profile on reset', () => {
    const store = makeMemStorage();
    saveProfile(DRAFT, store);
    expect(loadProfile(store)).not.toBeNull();
    resetProfile(store);
    expect(loadProfile(store)).toBeNull();
  });

  it('persists a custom_plan without losing the rest of the profile', () => {
    const store = makeMemStorage();
    saveProfile(DRAFT, store);
    const updated = saveCustomPlan(
      { edits: { 'achillea-millefolium': { plant_slug: 'achillea-millefolium', quantity: 6 } }, removed: [] },
      store,
    );
    expect(updated).not.toBeNull();
    expect(updated!.custom_plan?.edits['achillea-millefolium'].quantity).toBe(6);
    expect(updated!.zone).toBe('7a');

    const reload = loadProfile(store);
    expect(reload?.custom_plan?.edits['achillea-millefolium'].quantity).toBe(6);
  });

  it('saveCustomPlan is a no-op when no profile exists', () => {
    const store = makeMemStorage();
    const res = saveCustomPlan({ edits: {}, removed: [] }, store);
    expect(res).toBeNull();
  });
});
