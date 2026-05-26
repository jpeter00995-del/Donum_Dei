import { useEffect, useMemo, useState } from 'react';
import type { Plant, Locale } from '@/lib/types';
import type { RecommendedPlant } from '@/lib/gardenPlan';
import type { PlanOverrides, PlanOverride, UserProfile } from '@/lib/userProfile';
import { detectConflicts } from '@/lib/companionConflicts';
import { generateSpaceSuggestions } from '@/lib/spaceSuggestions';
import { t as t_i18n } from '@/lib/i18n';
import SpaceSuggestionsSection from './SpaceSuggestionsSection';

// === 1. PROPS ===

export interface PlanEditorProps {
  plants: Plant[];
  locale: Locale;
  currentRecs: RecommendedPlant[];
  overrides: PlanOverrides;
  onCancel: () => void;
  onSave: (next: PlanOverrides) => void;
  /**
   * Optional: parent profile to enable the live Space-Suggestions section
   * inside the editor (Welle G — Lebendiger Garten-Designer).
   * If omitted, the editor stays in its classic mode (no live suggestions).
   * (Optionales Profil; nur dann wird die Live-Vorschlags-Sektion gerendert.)
   */
  profile?: UserProfile;
  /**
   * Optional: notify the parent whenever the editor's effective (live) plan
   * changes — including unsaved edits. Lets the parent render a live
   * SpaceIndicator that reacts to the current draft. (Welle G.)
   * (Callback fuer den Live-Plan inkl. unbespeicherter Aenderungen.)
   */
  onEffectivePlanChange?: (plan: RecommendedPlant[]) => void;
}

// === 2. LABELS ===

const L = {
  de: {
    title: 'Plan bearbeiten',
    quantity: 'Menge',
    remove: 'Entfernen',
    restore: 'Wiederherstellen',
    add: 'Pflanze hinzufügen',
    search: 'Pflanze suchen…',
    no_results: 'Keine Treffer',
    save: 'Speichern',
    cancel: 'Abbrechen',
    already_in_plan: 'bereits im Plan',
  },
  en: {
    title: 'Edit Plan',
    quantity: 'Quantity',
    remove: 'Remove',
    restore: 'Restore',
    add: 'Add plant',
    search: 'Search plant…',
    no_results: 'No results',
    save: 'Save',
    cancel: 'Cancel',
    already_in_plan: 'already in plan',
  },
} as const;

// === 3. PURE HELPERS (also exported for tests) ===

/** Set or update an explicit quantity for `slug` in the overrides. */
export function setQuantity(overrides: PlanOverrides, slug: string, quantity: number): PlanOverrides {
  const safeQty = Math.max(0, Math.floor(quantity));
  const edits = { ...overrides.edits };
  edits[slug] = { plant_slug: slug, quantity: safeQty };
  // Wenn die Pflanze vorher entfernt war und jetzt Menge > 0, aus removed entfernen.
  const removed = safeQty > 0 ? overrides.removed.filter(s => s !== slug) : overrides.removed;
  return { edits, removed };
}

/** Mark `slug` as removed from the plan (does not delete an edit entry). */
export function removePlant(overrides: PlanOverrides, slug: string): PlanOverrides {
  const removed = overrides.removed.includes(slug) ? overrides.removed : [...overrides.removed, slug];
  return { edits: overrides.edits, removed };
}

/** Undo a removal — also drops any explicit edit so the auto-quantity wins again. */
export function restorePlant(overrides: PlanOverrides, slug: string): PlanOverrides {
  const removed = overrides.removed.filter(s => s !== slug);
  const edits = { ...overrides.edits };
  delete edits[slug];
  return { edits, removed };
}

/** Add a new plant to the plan with explicit quantity (1-based, min 1). */
export function addPlant(overrides: PlanOverrides, slug: string, quantity: number): PlanOverrides {
  return setQuantity(overrides, slug, Math.max(1, Math.floor(quantity)));
}

// === 4. PATH HELPERS ===

/** URL of the companion-planting matrix page for a locale. */
const COMPANION_PATH: Record<Locale, string> = {
  de: '/de/mischkultur',
  en: '/en/companion-planting',
};

// === 5. COMPONENT ===

export default function PlanEditor(props: PlanEditorProps) {
  const { plants, locale, currentRecs, overrides, onCancel, onSave, profile, onEffectivePlanChange } = props;
  const t = L[locale];
  const [draft, setDraft] = useState<PlanOverrides>(overrides);
  const [search, setSearch] = useState('');

  const inPlanSlugs = useMemo(() => {
    const s = new Set<string>();
    for (const r of currentRecs) s.add(r.plant_slug);
    for (const e of Object.values(draft.edits)) s.add(e.plant_slug);
    return s;
  }, [currentRecs, draft]);

  /**
   * Effective in-plan list for live conflict detection: base recs plus
   * manually added plants, minus removed slugs, minus quantity-zero edits.
   * (Effektiver Plan inkl. Drafts für Live-Konflikt-Check.)
   */
  const effectivePlan = useMemo<RecommendedPlant[]>(() => {
    const removed = new Set(draft.removed);
    const out: RecommendedPlant[] = [];
    const baseSlugs = new Set<string>();
    for (const r of currentRecs) {
      baseSlugs.add(r.plant_slug);
      if (removed.has(r.plant_slug)) continue;
      const e = draft.edits[r.plant_slug];
      if (e && e.quantity <= 0) continue;
      out.push(r);
    }
    for (const slug of Object.keys(draft.edits)) {
      if (baseSlugs.has(slug) || removed.has(slug)) continue;
      const e = draft.edits[slug];
      if (e.quantity <= 0) continue;
      out.push({
        plant_slug: slug,
        quantity: e.quantity,
        sowing_method: 'outdoor_direct',
        score: 0,
        notes_de: '',
        notes_en: '',
      });
    }
    return out;
  }, [currentRecs, draft]);

  const conflicts = useMemo(
    () => detectConflicts(effectivePlan, plants),
    [effectivePlan, plants],
  );

  // === Welle G: live space suggestions inside the editor ===
  const spaceSuggestions = useMemo(() => {
    if (!profile) return [];
    return generateSpaceSuggestions({
      plan: effectivePlan,
      plants,
      profile,
      maxSuggestions: 5,
    });
  }, [profile, effectivePlan, plants]);

  // Bubble the live (effective) plan up to the parent — used for the
  // live Space-Indicator outside the editor. (Welle G.)
  useEffect(() => {
    if (onEffectivePlanChange) onEffectivePlanChange(effectivePlan);
  }, [effectivePlan, onEffectivePlanChange]);

  /** Add a space-suggestion candidate directly to the editor draft. */
  function handleAddSuggestion(slug: string) {
    const match = spaceSuggestions.find(s => s.plant_slug === slug);
    const qty = match?.suggested_quantity ?? 1;
    setDraft(d => addPlant(d, slug, qty));
  }

  const plantBySlug = useMemo(() => {
    const m = new Map<string, Plant>();
    for (const p of plants) m.set(p.slug, p);
    return m;
  }, [plants]);

  function plantName(slug: string): string {
    const p = plantBySlug.get(slug);
    return p ? p.names[locale] : slug;
  }

  const filteredPlants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return plants
      .filter(p =>
        p.names.de.toLowerCase().includes(q) ||
        p.names.en.toLowerCase().includes(q) ||
        p.names.latin.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [plants, search]);

  function qtyFor(slug: string, fallback: number): number {
    const e = draft.edits[slug];
    return e ? e.quantity : fallback;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6">
      <h2 className="text-xl font-serif font-semibold text-slate-900 mb-4">{t.title}</h2>

      {/* Conflict warning (Task 16) */}
      {conflicts.length > 0 && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm"
          data-testid="companion-conflicts"
        >
          <h3 className="font-semibold text-rose-800 mb-2">
            <span aria-hidden="true">⚠️ </span>
            {t_i18n(locale, 'companion.conflict.heading')}
          </h3>
          <p className="text-rose-900 mb-2">{t_i18n(locale, 'companion.conflict.intro')}</p>
          <ul className="list-disc list-inside space-y-1 text-rose-900">
            {conflicts.map(c => (
              <li key={`${c.plant_a}|${c.plant_b}`}>
                {t_i18n(locale, 'companion.conflict.pair', {
                  a: plantName(c.plant_a),
                  b: plantName(c.plant_b),
                })}
                {c.source && (
                  <span className="text-xs italic text-rose-700">
                    {' '}
                    ({t_i18n(locale, 'companion.conflict.source')}: {c.source})
                  </span>
                )}
              </li>
            ))}
          </ul>
          <a
            href={COMPANION_PATH[locale]}
            className="mt-2 inline-block text-rose-800 underline hover:no-underline"
          >
            {t_i18n(locale, 'companion.conflict.explain_link')}
          </a>
        </div>
      )}

      {/* Current plan rows */}
      <ul className="divide-y divide-slate-100">
        {currentRecs.map(r => {
          const p = plants.find(pp => pp.slug === r.plant_slug);
          if (!p) return null;
          const removed = draft.removed.includes(r.plant_slug);
          return (
            <li key={r.plant_slug} className="py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${removed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {p.names[locale]} <span className="text-xs italic text-slate-500">({p.names.latin})</span>
                </div>
              </div>
              <label className="text-sm text-slate-600 flex items-center gap-2">
                {t.quantity}
                <input
                  type="number"
                  min={1}
                  max={9999}
                  step={1}
                  value={qtyFor(r.plant_slug, r.quantity)}
                  disabled={removed}
                  onChange={e => setDraft(d => setQuantity(d, r.plant_slug, parseInt(e.target.value || '0', 10)))}
                  className="w-20 border border-slate-300 rounded px-2 py-1 text-base"
                />
              </label>
              {removed ? (
                <button
                  type="button"
                  onClick={() => setDraft(d => restorePlant(d, r.plant_slug))}
                  className="min-h-[44px] px-3 py-2 text-sm rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {t.restore}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDraft(d => removePlant(d, r.plant_slug))}
                  className="min-h-[44px] px-3 py-2 text-sm rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  {t.remove}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Welle G: Live space-aware suggestions */}
      {profile && spaceSuggestions.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <SpaceSuggestionsSection
            suggestions={spaceSuggestions}
            plants={plants}
            profile={profile}
            effectivePlan={effectivePlan}
            locale={locale}
            onAdd={handleAddSuggestion}
          />
        </div>
      )}

      {/* Add picker */}
      <div className="mt-6 border-t border-slate-200 pt-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">{t.add}</label>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full border border-slate-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500"
        />
        {search.trim() && (
          <ul className="mt-2 max-h-64 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {filteredPlants.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{t.no_results}</li>
            ) : (
              filteredPlants.map(p => {
                const already = inPlanSlugs.has(p.slug);
                return (
                  <li key={p.slug} className="px-3 py-2 flex items-center gap-3">
                    <span className="flex-1 text-sm">
                      {p.names[locale]} <span className="italic text-slate-500">({p.names.latin})</span>
                    </span>
                    {already ? (
                      <span className="text-xs text-slate-400">{t.already_in_plan}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(d => addPlant(d, p.slug, 1));
                          setSearch('');
                        }}
                        className="min-h-[44px] px-3 py-2 text-sm rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        +1
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-[44px] px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="min-h-[44px] px-6 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}
