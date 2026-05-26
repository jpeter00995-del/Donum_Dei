import { useEffect, useState } from 'react';
import type { Locale, PermacultureSet } from '@/lib/types';
import {
  loadProfile,
  saveCustomPlan,
  type PlanOverrides,
} from '@/lib/userProfile';
import { t as t_i18n } from '@/lib/i18n';

// === 1. PROPS ===

interface Props {
  set: PermacultureSet;
  locale: Locale;
}

// === 2. PATHS ===

const ONBOARDING_PATH: Record<Locale, string> = {
  de: '/de/mein-garten/start',
  en: '/en/my-garden/start',
};

const PLAN_PATH: Record<Locale, string> = {
  de: '/de/mein-garten/',
  en: '/en/my-garden/',
};

// === 3. PURE HELPER (exported for tests) ===

/**
 * Add a permaculture-set's plants into a `PlanOverrides` bag.
 * For each plant in the set: if already present, take the higher quantity;
 * if explicitly removed, restore (drop from `removed`) and write the set's
 * quantity; otherwise insert the set's quantity as a new edit.
 * (Fügt die Pflanzen eines Sets in PlanOverrides ein; nimmt die höhere
 * Menge bei Konflikten, hebt eine vorherige Entfernung auf.)
 */
export function addSetToOverrides(
  overrides: PlanOverrides,
  set: PermacultureSet,
): PlanOverrides {
  const edits = { ...overrides.edits };
  const removed = overrides.removed.filter(slug =>
    !set.plants.some(p => p.slug === slug),
  );
  for (const sp of set.plants) {
    const existing = edits[sp.slug];
    const nextQty = existing ? Math.max(existing.quantity, sp.quantity) : sp.quantity;
    edits[sp.slug] = { plant_slug: sp.slug, quantity: nextQty };
  }
  return { edits, removed };
}

// === 4. COMPONENT ===

type Status = 'idle' | 'no_profile' | 'added';

export default function PermacultureSetApply({ set, locale }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function onClick() {
    const profile = loadProfile();
    if (!profile) {
      setStatus('no_profile');
      return;
    }
    const current: PlanOverrides = profile.custom_plan ?? { edits: {}, removed: [] };
    const next = addSetToOverrides(current, set);
    saveCustomPlan(next);
    setStatus('added');
  }

  const setName = locale === 'de' ? set.name_de : set.name_en;
  const addedToast = t_i18n(locale, 'packages.added_toast', { name: setName });

  // Pre-hydration: render the button neutral so SSR matches.
  const disabled = !hydrated;

  return (
    <div className="mt-auto pt-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="min-h-[44px] w-full px-4 py-2 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
        aria-label={t_i18n(locale, 'packages.add_to_plan')}
      >
        {t_i18n(locale, 'packages.add_to_plan')}
      </button>

      {status === 'added' && (
        <div
          role="status"
          className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-center justify-between gap-2"
        >
          <span>{addedToast}</span>
          <a
            href={PLAN_PATH[locale]}
            className="font-semibold text-emerald-700 hover:underline whitespace-nowrap"
          >
            {t_i18n(locale, 'packages.added_link')}
          </a>
        </div>
      )}

      {status === 'no_profile' && (
        <div
          role="status"
          className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-center justify-between gap-2"
        >
          <span>{t_i18n(locale, 'packages.no_profile_toast')}</span>
          <a
            href={ONBOARDING_PATH[locale]}
            className="font-semibold text-amber-800 hover:underline whitespace-nowrap"
          >
            {t_i18n(locale, 'packages.no_profile_cta')}
          </a>
        </div>
      )}
    </div>
  );
}
