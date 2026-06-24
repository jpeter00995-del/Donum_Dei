// === PlanView — Mein-Garten Warenkorb-Modus (Welle I) ===
// Refactor von "auto-generierter Plan" zu "leerer Warenkorb, den der
// User Schritt für Schritt füllt". Counter-Cards + Live-Platz-Balken.
// (Cart-basierte UX statt Auto-Plan; Counter steuern den Live-Balken.)
//
// Behält für Tests/Kalender weiter den Export `applyOverrides` und
// `categorise` bei (PlanEditor.test.ts, WeekView).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Plant, Locale } from '@/lib/types';
import type { PlanPlant } from '@/lib/planPlant';
import {
  loadProfile,
  resetProfile,
  saveCustomPlan,
  type UserProfile,
  type PlanOverrides,
} from '@/lib/userProfile';
import {
  generateGardenPlan,
  type RecommendedPlant,
  estimateAreaSqm,
  areaPerPlant,
  totalAreaSqm,
} from '@/lib/gardenPlan';
import { detectConflicts } from '@/lib/companionConflicts';
import { generateSuggestions, type Suggestion } from '@/lib/companionSuggestions';
import {
  categorizePlant,
  PLANT_CATEGORIES,
  CATEGORY_EMOJI,
  type PlantCategory,
} from '@/lib/plantCategories';
import PlantCounterCard from './PlantCounterCard';
import BeetVisualization from './BeetVisualization';
import type { CartEntry, UserPosition } from '@/lib/beetLayout';
import { t as t_i18n } from '@/lib/i18n';

// === 1. PROPS ===

interface Props {
  // Schlankes Plan-DTO statt voller Plant-Objekte → kleine client:load-Props.
  // Engines (gardenPlan, companion*, beetLayout) werden an ihren Grenzen
  // per `as unknown as Plant[]` gecastet — laufzeitsicher, weil sie nur
  // Garten-Felder lesen, die im PlanPlant-DTO enthalten sind (vgl. WeekView).
  plants: PlanPlant[];
  locale: Locale;
}

// === 2. CONSTANTS ===

const ONBOARDING_PATH: Record<Locale, string> = {
  de: '/de/mein-garten/start',
  en: '/en/my-garden/start',
};

const PACKAGES_PATH: Record<Locale, string> = {
  de: '/de/pakete',
  en: '/en/packages',
};

/** Slugs der Beispiel-Pakete (Mini-Cards) — referenziert permaculture_sets.json. */
const FEATURED_PACKAGE_SLUGS = ['three-sisters', 'mediterrane-sonne', 'wurzel-schutz'] as const;

/** Sortier-Optionen für die Empfehlungs-Liste. */
type SortKey = 'recommendation' | 'alpha' | 'size' | 'family';

/** View-Tab im Warenkorb-Bereich (Welle J). */
type ViewTab = 'list' | 'beet';

/** Threshold ab dem der Beet-Plan-Tab als Default gewählt wird. */
const BEET_DEFAULT_THRESHOLD = 3;

/** Debounce delay for persistence (ms). */
const SAVE_DEBOUNCE_MS = 350;

// === 3. CATEGORIES (kept exported for backwards compatibility) ===

type Category = 'vegetables' | 'herbs' | 'medicinal' | 'fruit' | 'other';

/**
 * Best-effort categorisation from a Plant's `uses` and family.
 * Kept exported for legacy consumers / tests.
 * (Heuristische Kategorisierung; weiterhin exportiert für Altcode.)
 */
export function categorise(plant: Plant): Category {
  const forms = plant.uses.map(u => u.form);
  if (forms.includes('spice')) return 'herbs';
  const medicinalForms = forms.filter(f => f === 'tea' || f === 'tincture' || f === 'salve' || f === 'bath').length;
  const edibleForms = forms.filter(f => f === 'raw').length;
  if (medicinalForms > edibleForms) return 'medicinal';
  const fam = plant.family.latin?.toLowerCase() ?? '';
  if (fam.includes('rosaceae') || fam.includes('ericaceae')) return 'fruit';
  if (edibleForms > 0) return 'vegetables';
  return 'other';
}

// === 4. COMPONENT ===

export default function PlanView({ plants, locale }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /** Counters map: plant slug → quantity. Missing keys = 0 (not in cart). */
  const [counters, setCounters] = useState<Record<string, number>>({});

  /** Current sort option for the recommendation list. */
  const [sort, setSort] = useState<SortKey>('recommendation');

  /** Filter toggles (V1: nur "Nur was passt"). */
  const [filterFits, setFilterFits] = useState(false);

  /** Welle N+1: Live-Suche über die Empfehlungs-Liste (DE/EN/Latin Namen). */
  const [recSearch, setRecSearch] = useState('');

  /** View-Tab im Warenkorb-Bereich: Liste vs. Beet-Plan (Welle J). */
  const [viewTab, setViewTab] = useState<ViewTab>('list');
  /** Track ob der User manuell den Tab gewechselt hat — verhindert auto-switching. */
  const tabWasUserChosen = useRef(false);

  /** Persistente Beet-Positionen (Welle J Drag&Drop). */
  const [beetPositions, setBeetPositions] = useState<UserPosition[]>([]);

  /**
   * Welle K: Aufgeklappt/eingeklappt-Status pro Empfehlungs-Kategorie.
   * Default: erste 3 Kategorien (Frucht/Blatt/Wurzel) offen, Rest zu.
   * (Per-category expand/collapse state for grouped recommendations.)
   */
  const [openCategories, setOpenCategories] = useState<Record<PlantCategory, boolean>>({
    fruchtgemuese: true,
    blattgemuese: true,
    wurzelgemuese: true,
    kraeuter: false,
    begleitpflanzen: false,
    heilpflanzen: false,
  });

  // === 4.1 Hydration ===
  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    if (loaded?.custom_plan?.edits) {
      const seed: Record<string, number> = {};
      for (const edit of Object.values(loaded.custom_plan.edits)) {
        if (edit.quantity > 0) seed[edit.plant_slug] = edit.quantity;
      }
      setCounters(seed);
    }
    // Welle J: persistente Beet-Positionen aus dem Profil laden.
    if (loaded?.custom_plan?.beet_positions) {
      setBeetPositions(loaded.custom_plan.beet_positions.map(p => ({
        slug: p.plant_slug, x: p.x, y: p.y,
      })));
    }
    setHydrated(true);
  }, []);

  // === 4.2 Redirect to onboarding if no profile ===
  useEffect(() => {
    if (hydrated && profile === null && typeof window !== 'undefined') {
      const id = window.setTimeout(() => {
        window.location.href = ONBOARDING_PATH[locale];
      }, 1500);
      return () => window.clearTimeout(id);
    }
  }, [hydrated, profile, locale]);

  // === 4.3 Plant lookup ===
  const plantBySlug = useMemo(() => {
    const m = new Map<string, PlanPlant>();
    for (const p of plants) m.set(p.slug, p);
    return m;
  }, [plants]);

  // === 4.4 Cart math ===
  /** Synthetic RecommendedPlant[] derived from the current counters — used for
   * totalAreaSqm + companion-suggestion / conflict generators which all
   * expect this shape. (Synthetischer Plan aus dem Warenkorb-State.) */
  const cartRecs = useMemo<RecommendedPlant[]>(() => {
    const out: RecommendedPlant[] = [];
    for (const [slug, qty] of Object.entries(counters)) {
      if (qty <= 0) continue;
      if (!plantBySlug.has(slug)) continue;
      out.push({
        plant_slug: slug,
        quantity: qty,
        sowing_method: 'outdoor_direct',
        score: 0,
        notes_de: '',
        notes_en: '',
      });
    }
    return out;
  }, [counters, plantBySlug]);

  const usedAreaSqm = useMemo(
    // Cast: totalAreaSqm liest nur garden_meta.spacing_cm (im DTO vorhanden).
    () => totalAreaSqm(cartRecs, plantBySlug as unknown as Map<string, Plant>),
    [cartRecs, plantBySlug],
  );
  const totalAreaTotal = profile?.garden.area_sqm ?? 0;
  const freeAreaSqm = Math.max(0, totalAreaTotal - usedAreaSqm);
  /** Signed free area (can be negative) — used by overflow logic in cards. */
  const freeAreaSigned = totalAreaTotal - usedAreaSqm;

  // === 4.5 Persistence (debounced) ===
  const saveTimer = useRef<number | null>(null);
  const isFirstSave = useRef(true);

  useEffect(() => {
    if (!hydrated || !profile) return;
    // Skip persist for the very first effect run (counters were just seeded).
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const edits: PlanOverrides['edits'] = {};
      for (const [slug, qty] of Object.entries(counters)) {
        if (qty > 0) edits[slug] = { plant_slug: slug, quantity: qty };
      }
      // Welle J: beet_positions persistieren — nur Positionen für Pflanzen
      // die noch im Cart sind (verwaiste droppen).
      const beet_positions = beetPositions
        .filter(p => (counters[p.slug] ?? 0) > 0)
        .map(p => ({ plant_slug: p.slug, x: p.x, y: p.y }));
      saveCustomPlan({
        edits,
        removed: [],
        ...(beet_positions.length > 0 ? { beet_positions } : {}),
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [counters, beetPositions, hydrated, profile]);

  // === 4.5b Auto-default tab based on cart size (Welle J) ===
  // Wenn der Warenkorb >= BEET_DEFAULT_THRESHOLD Sorten hat und der User
  // noch nicht aktiv gewechselt hat → Beet-Plan als Default zeigen.
  useEffect(() => {
    if (!hydrated || tabWasUserChosen.current) return;
    const count = Object.values(counters).filter(q => q > 0).length;
    setViewTab(count >= BEET_DEFAULT_THRESHOLD ? 'beet' : 'list');
  }, [hydrated, counters]);

  // === 4.6 Eligible plants for this profile ===
  /** Eligible plants for the current profile, computed once. */
  const eligiblePlan = useMemo<RecommendedPlant[]>(() => {
    if (!profile) return [];
    // generateGardenPlan does the heavy lifting: eligibility + scoring +
    // quantity heuristics. We only need the score + suggested-quantity
    // metadata it produces for ordering and the "Schnellstart" button.
    // Use a generous cap so most eligible plants show up; we don't
    // intentionally cap the catalogue here.
    // Cast: generateGardenPlan liest nur Garten-Felder (garden_meta, family,
    // uses[].form, permaculture_functions) — alle im PlanPlant-DTO vorhanden.
    return generateGardenPlan(profile, plants as unknown as Plant[], { maxRecommendations: 200 });
  }, [profile, plants]);

  /** Score lookup by slug — used for the recommendation sort. */
  const scoreBySlug = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of eligiblePlan) m.set(r.plant_slug, r.score);
    return m;
  }, [eligiblePlan]);

  // === 4.7 Cart entries for BeetVisualization (Welle J) ===
  const cartEntries = useMemo<CartEntry[]>(() => {
    const out: CartEntry[] = [];
    for (const [slug, qty] of Object.entries(counters)) {
      if (qty > 0 && plantBySlug.has(slug)) out.push({ slug, quantity: qty });
    }
    return out;
  }, [counters, plantBySlug]);

  // === 4.7 Split cart vs recommendations ===
  const cartPlants = useMemo<PlanPlant[]>(() => {
    const out: PlanPlant[] = [];
    // Iterate counters in stable order: deterministic — alphabetical by slug.
    const slugs = Object.keys(counters)
      .filter(s => (counters[s] ?? 0) > 0 && plantBySlug.has(s))
      .sort((a, b) => a.localeCompare(b));
    for (const slug of slugs) out.push(plantBySlug.get(slug)!);
    return out;
  }, [counters, plantBySlug]);

  const recommendedPlants = useMemo<PlanPlant[]>(() => {
    const result: PlanPlant[] = [];
    for (const r of eligiblePlan) {
      const p = plantBySlug.get(r.plant_slug);
      if (!p) continue;
      if ((counters[r.plant_slug] ?? 0) > 0) continue; // already in cart
      if (filterFits) {
        // Cast: areaPerPlant liest nur garden_meta.spacing_cm (im DTO vorhanden).
        const perPlant = areaPerPlant(p as unknown as Plant);
        if (perPlant > freeAreaSqm + perPlant * 0.1) continue; // honour same tolerance
      }
      result.push(p);
    }
    // Apply sort
    return sortPlants(result, sort, scoreBySlug, locale);
  }, [eligiblePlan, plantBySlug, counters, filterFits, freeAreaSqm, sort, scoreBySlug, locale]);

  /**
   * Welle N+1: Empfehlungen nach Suchbegriff filtern (DE/EN/Latin).
   * Leere Suche → alle Empfehlungen.
   */
  const filteredRecommendedPlants = useMemo<PlanPlant[]>(() => {
    const q = recSearch.trim().toLowerCase();
    if (!q) return recommendedPlants;
    return recommendedPlants.filter(p =>
      p.names.de.toLowerCase().includes(q) ||
      p.names.en.toLowerCase().includes(q) ||
      p.names.latin.toLowerCase().includes(q),
    );
  }, [recommendedPlants, recSearch]);

  /**
   * Welle K: Empfehlungen gruppiert nach Kategorie.
   * Reihenfolge innerhalb der Kategorie bleibt durch `recommendedPlants` Sort
   * gesteuert (z.B. nach Score).
   */
  const recommendedByCategory = useMemo<Record<PlantCategory, PlanPlant[]>>(() => {
    const grouped: Record<PlantCategory, PlanPlant[]> = {
      fruchtgemuese: [],
      blattgemuese: [],
      wurzelgemuese: [],
      kraeuter: [],
      begleitpflanzen: [],
      heilpflanzen: [],
    };
    for (const p of filteredRecommendedPlants) {
      // Cast: categorizePlant liest slug/family.latin/uses[].form/
      // permaculture_functions/garden_meta.spacing_cm — alle im DTO vorhanden.
      grouped[categorizePlant(p as unknown as Plant)].push(p);
    }
    return grouped;
  }, [filteredRecommendedPlants]);

  /** Welle N+1: bei aktiver Suche alle Kategorien aufklappen (Treffer-Anzeige). */
  const searchActive = recSearch.trim().length > 0;

  // === 4.8 Companion conflicts + suggestions (Welle B legacies) ===
  // Casts: detectConflicts/generateSuggestions lesen nur slug +
  // companion_planting (bad_/good_partners, source, notes_*) — alle im DTO.
  const conflicts = useMemo(
    () => detectConflicts(cartRecs, plants as unknown as Plant[]),
    [cartRecs, plants],
  );

  const companionSuggestions = useMemo<Suggestion[]>(() => {
    if (cartRecs.length === 0) return [];
    return generateSuggestions(cartRecs, plants as unknown as Plant[]);
  }, [cartRecs, plants]);

  // === 4.9 Actions ===
  function increment(slug: string) {
    setCounters(prev => ({ ...prev, [slug]: (prev[slug] ?? 0) + 1 }));
  }
  function decrement(slug: string) {
    setCounters(prev => {
      const next = { ...prev };
      const cur = next[slug] ?? 0;
      if (cur <= 1) {
        delete next[slug];
      } else {
        next[slug] = cur - 1;
      }
      return next;
    });
  }

  function loadAutoPlan() {
    if (!profile) return;
    // Re-use the planner output we already have (`eligiblePlan` may be capped
    // by 200, but planner internally respects garden-size + variety limits
    // before that). Build counters from the suggested quantities.
    const seed: Record<string, number> = {};
    // Use generateGardenPlan with default cap to honour planner's space-aware
    // selection rather than dumping all 200 candidates into the cart.
    // Cast wie oben — Engine liest nur DTO-vorhandene Garten-Felder.
    const planned = generateGardenPlan(profile, plants as unknown as Plant[]);
    for (const r of planned) {
      if (r.quantity > 0) seed[r.plant_slug] = r.quantity;
    }
    setCounters(seed);
  }

  function clearCart() {
    const msg = locale === 'de'
      ? 'Wirklich alle Pflanzen aus dem Warenkorb entfernen?'
      : 'Really remove all plants from the cart?';
    if (typeof window !== 'undefined' && !window.confirm(msg)) return;
    setCounters({});
  }

  function onResetProfile() {
    resetProfile();
    if (typeof window !== 'undefined') {
      window.location.href = ONBOARDING_PATH[locale];
    }
  }

  // === 4.10 Render ===
  if (!hydrated) {
    return <div className="text-sm text-slate-500">…</div>;
  }
  if (!profile) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded p-6 text-center">
        <p className="text-slate-800 mb-4">{t_i18n(locale, 'plan.cart.no_profile')}</p>
        <a
          href={ONBOARDING_PATH[locale]}
          className="inline-block px-6 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700"
        >
          {t_i18n(locale, 'plan.cart.to_onboarding')}
        </a>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');
  const usedRounded = Math.round(usedAreaSqm * 10) / 10;
  const totalRounded = Math.round(totalAreaTotal * 10) / 10;
  const pct = totalAreaTotal > 0 ? Math.min(110, (usedAreaSqm / totalAreaTotal) * 100) : 0;
  const overBudget = usedAreaSqm > totalAreaTotal;

  return (
    <div>
      {/* === 5.1 Hero === */}
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
          <span aria-hidden="true">🌱 </span>
          {t_i18n(locale, 'plan.cart.title')}
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          {t_i18n(locale, `plan.gardentype.${profile.garden.type}`)} · {fmt(totalRounded)} m² ·{' '}
          {t_i18n(locale, 'plan.cart.zone_label')} {profile.zone} ·{' '}
          {t_i18n(locale, 'plan.cart.household_label')} {profile.household_size}
        </p>
      </header>

      {/* === 5.2 Explain box === */}
      <aside
        className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        data-testid="plan-cart-explain"
      >
        <h2 className="font-semibold text-emerald-800 mb-1">
          <span aria-hidden="true">💡 </span>
          {t_i18n(locale, 'plan.cart.explain.heading')}
        </h2>
        <p className="leading-snug">{t_i18n(locale, 'plan.cart.explain.body')}</p>
      </aside>

      {/* === 5.3 Space indicator (live) === */}
      <section
        className={`mb-4 rounded-lg border px-4 py-3 ${
          overBudget
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-slate-200 bg-slate-50 text-slate-800'
        }`}
        aria-live="polite"
        data-testid="plan-cart-space"
      >
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-sm font-medium">
            {overBudget && <span aria-hidden="true">⚠️ </span>}
            <span aria-hidden="true">📐 </span>
            {t_i18n(locale, 'plan.cart.space_label')}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {overBudget
              ? t_i18n(locale, 'plan.cart.space_warn', { used: fmt(usedRounded), total: fmt(totalRounded) })
              : t_i18n(locale, 'plan.cart.space_ok', { used: fmt(usedRounded), total: fmt(totalRounded) })}
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-slate-200 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          <div
            className={`h-full ${overBudget ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {/* === 5.4 Quick actions === */}
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <button
          type="button"
          onClick={loadAutoPlan}
          className="min-h-[44px] px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          <span aria-hidden="true">🚀 </span>
          {t_i18n(locale, 'plan.cart.quickstart')}
        </button>
        <button
          type="button"
          onClick={clearCart}
          disabled={cartPlants.length === 0}
          className="min-h-[44px] px-4 py-2 rounded border border-rose-300 text-rose-700 text-sm hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true">🗑 </span>
          {t_i18n(locale, 'plan.cart.clear')}
        </button>
        <button
          type="button"
          onClick={() => typeof window !== 'undefined' && window.print()}
          className="min-h-[44px] px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50 sm:ml-auto"
        >
          <span aria-hidden="true">🖨 </span>
          {t_i18n(locale, 'plan.cart.print')}
        </button>
      </div>

      {/* === 5.5 Sort + filter === */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm no-print">
        <label className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{t_i18n(locale, 'plan.cart.sort_label')}:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="min-h-[36px] border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="recommendation">{t_i18n(locale, 'plan.cart.sort_recommendation')}</option>
            <option value="alpha">{t_i18n(locale, 'plan.cart.sort_alpha')}</option>
            <option value="size">{t_i18n(locale, 'plan.cart.sort_size')}</option>
            <option value="family">{t_i18n(locale, 'plan.cart.sort_family')}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={filterFits}
            onChange={e => setFilterFits(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-700">{t_i18n(locale, 'plan.cart.filter_fits')}</span>
        </label>
      </div>

      {/* === 5.6 Companion conflict warning (Welle B Task 16 — keeps alive) === */}
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
            {conflicts.map(c => {
              const a = plantBySlug.get(c.plant_a)?.names[locale] ?? c.plant_a;
              const b = plantBySlug.get(c.plant_b)?.names[locale] ?? c.plant_b;
              return (
                <li key={`${c.plant_a}|${c.plant_b}`}>
                  {t_i18n(locale, 'companion.conflict.pair', { a, b })}
                  {c.source && (
                    <span className="text-xs italic text-rose-700">
                      {' '}({t_i18n(locale, 'companion.conflict.source')}: {c.source})
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* === 5.7 Cart section (Liste vs. Beet-Plan Tab — Welle J) === */}
      <section className="mb-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 border-b border-slate-200 pb-2">
          <h2 className="text-xl font-serif font-semibold text-slate-900">
            <span aria-hidden="true">🛒 </span>
            {t_i18n(locale, 'plan.cart.cart_heading', {
              n: cartPlants.length,
              area: fmt(usedRounded),
            })}
          </h2>
          {/* Tab-Switch — nur sichtbar wenn überhaupt Pflanzen im Warenkorb */}
          {cartPlants.length > 0 && (
            <div
              className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm"
              role="tablist"
              aria-label={t_i18n(locale, 'plan.cart.cart_heading', { n: cartPlants.length, area: fmt(usedRounded) })}
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === 'list'}
                onClick={() => { setViewTab('list'); tabWasUserChosen.current = true; }}
                className={[
                  'px-3 py-1.5 rounded font-medium transition',
                  viewTab === 'list'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
                data-testid="tab-list"
              >
                {t_i18n(locale, 'plan.beet.tab_list')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === 'beet'}
                onClick={() => { setViewTab('beet'); tabWasUserChosen.current = true; }}
                className={[
                  'px-3 py-1.5 rounded font-medium transition',
                  viewTab === 'beet'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
                data-testid="tab-beet"
              >
                {t_i18n(locale, 'plan.beet.tab_beet')}
              </button>
            </div>
          )}
        </div>

        {cartPlants.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {t_i18n(locale, 'plan.cart.empty')}
          </div>
        ) : viewTab === 'beet' ? (
          /* === Beet-Plan Tab — visueller Planer === */
          <BeetVisualization
            cart={cartEntries}
            plants={plants}
            gardenType={profile.garden.type}
            areaSqm={profile.garden.area_sqm}
            locale={locale}
            userPositions={beetPositions}
            onPositionsChange={setBeetPositions}
          />
        ) : (
          /* === Liste Tab — Counter-Cards (Welle I) === */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cartPlants.map(p => (
              <PlantCounterCard
                key={p.slug}
                plant={p}
                locale={locale}
                count={counters[p.slug] ?? 0}
                freeAreaSqm={freeAreaSigned}
                onIncrement={() => increment(p.slug)}
                onDecrement={() => decrement(p.slug)}
                companions={companionsHintFor(p, plantBySlug, locale)}
                sowingHint={sowingHintFor(p, locale)}
              />
            ))}
          </div>
        )}
      </section>

      {/* === 5.8 Companion suggestions (Welle B Task 17) === */}
      {companionSuggestions.length > 0 && (
        <section className="mb-8 no-print" data-testid="companion-suggestions">
          <h2 className="text-xl font-serif font-semibold text-slate-900 mb-1 border-b border-slate-200 pb-1">
            <span aria-hidden="true">💡 </span>
            {t_i18n(locale, 'companion.suggest.heading')}
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            {t_i18n(locale, 'companion.suggest.intro')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {companionSuggestions.slice(0, 6).map(s => {
              const partner = plantBySlug.get(s.suggested_slug);
              if (!partner) return null;
              return (
                <PlantCounterCard
                  key={`comp-${s.suggested_slug}`}
                  plant={partner}
                  locale={locale}
                  count={counters[partner.slug] ?? 0}
                  freeAreaSqm={freeAreaSigned}
                  onIncrement={() => increment(partner.slug)}
                  onDecrement={() => decrement(partner.slug)}
                  companions={companionsHintFor(partner, plantBySlug, locale)}
                  sowingHint={sowingHintFor(partner, locale)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* === 5.9 Recommendations — Welle K: gruppiert nach Kategorie === */}
      <section className="mb-8" data-testid="recommendations-grouped">
        <h2 className="text-xl font-serif font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-1">
          <span aria-hidden="true">🌿 </span>
          {t_i18n(locale, 'plan.cart.recommendations_heading', {
            type: t_i18n(locale, `plan.gardentype.${profile.garden.type}`),
          })}
        </h2>

        {/* Welle N+1: Live-Suche über die Empfehlungs-Liste */}
        {recommendedPlants.length > 0 && (
          <div className="relative mb-3">
            <input
              type="search"
              value={recSearch}
              onChange={e => setRecSearch(e.target.value)}
              placeholder={locale === 'de'
                ? 'Gemüse / Kraut suchen — z.B. Tomate, Basilikum…'
                : 'Search vegetable / herb — e.g. tomato, basil…'}
              aria-label={locale === 'de' ? 'Empfehlungen nach Namen suchen' : 'Search recommendations by name'}
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              data-testid="rec-search-input"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true">🔍</span>
            {recSearch && (
              <button
                type="button"
                onClick={() => setRecSearch('')}
                aria-label={locale === 'de' ? 'Suche löschen' : 'Clear search'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 px-2 py-1 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {recommendedPlants.length === 0 ? (
          <p className="text-sm text-slate-600">{t_i18n(locale, 'plan.cart.recommendations_empty')}</p>
        ) : searchActive && filteredRecommendedPlants.length === 0 ? (
          <p className="text-sm text-slate-600" data-testid="rec-search-empty">
            {locale === 'de'
              ? `Keine Treffer für „${recSearch.trim()}" in den Empfehlungen.`
              : `No matches for "${recSearch.trim()}" in the recommendations.`}
          </p>
        ) : (
          <div className="space-y-3">
            {PLANT_CATEGORIES.map(cat => {
              const plantsInCat = recommendedByCategory[cat];
              if (plantsInCat.length === 0) return null;
              // Welle N+1: bei aktiver Suche alle Kategorien aufklappen
              const isOpen = searchActive ? true : openCategories[cat];
              const toggleCat = () => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
              const sectionId = `cat-section-${cat}`;
              return (
                <div
                  key={cat}
                  className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                  data-testid={`category-section-${cat}`}
                >
                  <button
                    type="button"
                    onClick={toggleCat}
                    aria-expanded={isOpen}
                    aria-controls={sectionId}
                    className={[
                      'w-full flex items-center justify-between gap-3 px-4 py-3 text-left',
                      'min-h-[48px] transition-colors',
                      isOpen ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-slate-50 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-2 font-serif font-semibold text-slate-900">
                      <span aria-hidden="true" className="text-xl">{CATEGORY_EMOJI[cat]}</span>
                      <span>{t_i18n(locale, `plan.category.${cat}`)}</span>
                      <span className="text-sm font-normal text-slate-500 tabular-nums">
                        {t_i18n(locale, 'plan.category.count', { n: plantsInCat.length })}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-slate-500 text-sm">
                      {isOpen ? '▼' : '▶'}
                    </span>
                    <span className="sr-only">
                      {isOpen
                        ? t_i18n(locale, 'plan.category.collapse')
                        : t_i18n(locale, 'plan.category.expand')}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={sectionId}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3"
                    >
                      {plantsInCat.map(p => (
                        <PlantCounterCard
                          key={p.slug}
                          plant={p}
                          locale={locale}
                          count={counters[p.slug] ?? 0}
                          freeAreaSqm={freeAreaSigned}
                          onIncrement={() => increment(p.slug)}
                          onDecrement={() => decrement(p.slug)}
                          companions={companionsHintFor(p, plantBySlug, locale)}
                          sowingHint={sowingHintFor(p, locale)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === 5.10 Packages teaser === */}
      <section className="mb-8 no-print">
        <h2 className="text-xl font-serif font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-1">
          <span aria-hidden="true">📦 </span>
          {t_i18n(locale, 'plan.cart.packages_heading')}
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          {t_i18n(locale, 'plan.cart.packages_intro')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FEATURED_PACKAGE_SLUGS.map(slug => (
            <a
              key={slug}
              href={`${PACKAGES_PATH[locale]}#${slug}`}
              className="block rounded-lg border border-emerald-200 bg-emerald-50 p-4 hover:border-emerald-400 hover:bg-emerald-100 transition"
            >
              <h3 className="text-base font-serif font-semibold text-emerald-900">
                {t_i18n(locale, `plan.cart.package.${slug}.name`)}
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                {t_i18n(locale, `plan.cart.package.${slug}.tag`)}
              </p>
            </a>
          ))}
        </div>
        <a
          href={PACKAGES_PATH[locale]}
          className="inline-block mt-3 text-sm text-emerald-700 font-medium hover:underline"
        >
          {t_i18n(locale, 'plan.cart.packages_more')} →
        </a>
      </section>

      {/* === 5.11 Footer === */}
      <footer className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-3 no-print">
        <button
          type="button"
          onClick={onResetProfile}
          className="min-h-[44px] px-4 py-2 rounded border border-slate-300 hover:bg-slate-50 ml-auto"
        >
          {t_i18n(locale, 'plan.cart.reset_profile')}
        </button>
      </footer>
    </div>
  );
}

// === 6. SORT HELPER ===

function sortPlants(
  list: PlanPlant[],
  key: SortKey,
  scoreBySlug: Map<string, number>,
  locale: Locale,
): PlanPlant[] {
  const collator = new Intl.Collator(locale === 'de' ? 'de-DE' : 'en-US', { sensitivity: 'base' });
  // Cast: areaPerPlant liest nur garden_meta.spacing_cm (im DTO vorhanden).
  const area = (p: PlanPlant) => areaPerPlant(p as unknown as Plant);
  const arr = [...list];
  switch (key) {
    case 'alpha':
      arr.sort((a, b) => collator.compare(a.names[locale], b.names[locale]));
      break;
    case 'size':
      arr.sort((a, b) => area(a) - area(b) || collator.compare(a.names[locale], b.names[locale]));
      break;
    case 'family':
      arr.sort((a, b) => collator.compare(a.family.latin ?? '', b.family.latin ?? '')
        || collator.compare(a.names[locale], b.names[locale]));
      break;
    case 'recommendation':
    default:
      arr.sort((a, b) => {
        const sa = scoreBySlug.get(a.slug) ?? 0;
        const sb = scoreBySlug.get(b.slug) ?? 0;
        return (sb - sa) || collator.compare(a.names[locale], b.names[locale]);
      });
  }
  return arr;
}

// === 7. CARD HINTS ===

/** Comma-separated localised names of `good_partners` (max 3). */
function companionsHintFor(
  plant: PlanPlant,
  plantBySlug: Map<string, PlanPlant>,
  locale: Locale,
): string | undefined {
  const partners = plant.companion_planting?.good_partners ?? [];
  if (partners.length === 0) return undefined;
  const names = partners
    .slice(0, 3)
    .map(slug => plantBySlug.get(slug)?.names[locale])
    .filter((s): s is string => Boolean(s));
  return names.length > 0 ? names.join(', ') : undefined;
}

/** Localised sowing hint string like `Direktsaat Apr–Jul`. */
function sowingHintFor(plant: PlanPlant, locale: Locale): string | undefined {
  const gm = plant.garden_meta;
  if (!gm) return undefined;
  const monthLabel = (m: number) =>
    (locale === 'de'
      ? ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])[m - 1];

  const sw = gm.sowing_window;
  let method: 'outdoor_direct' | 'transplant' | 'indoor' | null = null;
  let window: { start_month: number; end_month: number } | null = null;
  if (sw.outdoor_direct) {
    method = 'outdoor_direct';
    window = sw.outdoor_direct;
  } else if (sw.transplant) {
    method = 'transplant';
    window = sw.transplant;
  } else if (sw.indoor) {
    method = 'indoor';
    window = sw.indoor;
  }
  if (!method || !window) return undefined;
  const range = `${monthLabel(window.start_month)}–${monthLabel(window.end_month)}`;
  return t_i18n(locale, `plan.card.method.${method}`, { range });
}

// === 8. OVERRIDES (kept for backwards compatibility — used by tests + WeekView) ===

/**
 * Apply user overrides (manual edits + removals) on top of an auto-generated
 * plan. Pure function. Plants that were removed are dropped; plants in
 * `edits` have their quantity updated and are added if they are not already
 * present.
 * (Legacy-Helper aus dem Auto-Plan-Modell — bleibt erhalten für Tests +
 * WeekView, die weiterhin den alten Override-Pfad nutzen.)
 */
export function applyOverrides(
  base: RecommendedPlant[],
  overrides: PlanOverrides | undefined,
  plants: readonly Plant[],
): RecommendedPlant[] {
  if (!overrides) return base;
  const removed = new Set(overrides.removed);
  const out: RecommendedPlant[] = [];

  for (const r of base) {
    if (removed.has(r.plant_slug)) continue;
    const edit = overrides.edits[r.plant_slug];
    if (edit) {
      if (edit.quantity <= 0) continue;
      out.push({ ...r, quantity: edit.quantity });
    } else {
      out.push(r);
    }
  }

  const baseSlugs = new Set(base.map(r => r.plant_slug));
  for (const slug of Object.keys(overrides.edits)) {
    if (baseSlugs.has(slug) || removed.has(slug)) continue;
    const edit = overrides.edits[slug];
    if (edit.quantity <= 0) continue;
    const p = plants.find(pp => pp.slug === slug);
    if (!p) continue;
    out.push({
      plant_slug: slug,
      quantity: edit.quantity,
      sowing_method: 'outdoor_direct',
      score: 0,
      notes_de: `${edit.quantity} Stück (manuell hinzugefügt).`,
      notes_en: `${edit.quantity} plants (manually added).`,
    });
  }

  return out;
}

// Re-export so test imports of `estimateAreaSqm` from this file (if any)
// still resolve. The helper is owned by gardenPlan.ts.
export { estimateAreaSqm };
