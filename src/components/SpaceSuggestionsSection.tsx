// === Space-aware Suggestions UI — v1.1 Welle G ===
// Reactive cards that show plants which would fit the user's free area.
// Used in two places:
//   1) PlanEditor — picks update the editor's draft (live).
//   2) PlanView (view mode) — picks call onAdd which saves + reloads.
// (UI fuer den lebendigen Garten-Designer.)

import type { Plant, Locale } from '@/lib/types';
import type { UserProfile } from '@/lib/userProfile';
import type { RecommendedPlant } from '@/lib/gardenPlan';
import type { SpaceSuggestion } from '@/lib/spaceSuggestions';
import { totalAreaSqm } from '@/lib/gardenPlan';
import { t as t_i18n } from '@/lib/i18n';

// === 1. PROPS ===

interface Props {
  suggestions: SpaceSuggestion[];
  plants: Plant[];
  profile: UserProfile;
  /** Live plan used to compute the free area shown in the intro. */
  effectivePlan: RecommendedPlant[];
  locale: Locale;
  onAdd: (slug: string) => void;
}

// === 2. COMPONENT ===

export default function SpaceSuggestionsSection({
  suggestions,
  plants,
  profile,
  effectivePlan,
  locale,
  onAdd,
}: Props) {
  if (suggestions.length === 0) return null;

  const total = profile.garden.area_sqm;
  const used = totalAreaSqm(effectivePlan, plants);
  const free = Math.max(0, total - used);
  const freeRounded = Math.round(free * 10) / 10;
  const fmt = (n: number) => n.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');

  const intro =
    effectivePlan.length === 0
      ? t_i18n(locale, 'plan.space_suggestions.intro_empty')
      : t_i18n(locale, 'plan.space_suggestions.intro', { free: fmt(freeRounded) });

  const plantBySlug = new Map<string, Plant>();
  for (const p of plants) plantBySlug.set(p.slug, p);

  return (
    <section
      className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 no-print"
      data-testid="space-suggestions"
      aria-live="polite"
    >
      <h3 className="text-lg font-serif font-semibold text-emerald-900 mb-1">
        {t_i18n(locale, 'plan.space_suggestions.heading')}
      </h3>
      <p className="text-sm text-emerald-900/80 mb-3">{intro}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map(s => {
          const p = plantBySlug.get(s.plant_slug);
          if (!p) return null;
          return (
            <SuggestionCard
              key={s.plant_slug}
              plant={p}
              suggestion={s}
              locale={locale}
              onAdd={() => onAdd(s.plant_slug)}
            />
          );
        })}
      </div>
    </section>
  );
}

// === 3. CARD ===

function SuggestionCard({
  plant,
  suggestion,
  locale,
  onAdd,
}: {
  plant: Plant;
  suggestion: SpaceSuggestion;
  locale: Locale;
  onAdd: () => void;
}) {
  const fmt = (n: number) => n.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');
  const areaStr = fmt(suggestion.estimated_area_sqm);
  const qtyLabel =
    suggestion.suggested_quantity === 1
      ? t_i18n(locale, 'plan.space_suggestions.qty_one', { area: areaStr })
      : t_i18n(locale, 'plan.space_suggestions.qty_many', {
          n: suggestion.suggested_quantity,
          area: areaStr,
        });
  const reasons = locale === 'de' ? suggestion.reasons_de : suggestion.reasons_en;
  const sep = t_i18n(locale, 'plan.space_suggestions.reasons_separator');

  return (
    <article
      className="bg-white border border-emerald-200 rounded-md overflow-hidden flex flex-col hover:border-emerald-400 hover:shadow-sm transition"
      data-testid={`space-suggestion-card-${plant.slug}`}
    >
      <a
        href={`/${locale}/plant/${plant.slug}/`}
        className="block aspect-[4/3] bg-slate-100 overflow-hidden"
        aria-label={plant.names[locale]}
      >
        <img
          src={`/images/plants/${plant.image.filename}`}
          alt={plant.image.alt[locale]}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </a>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <header>
          <h4 className="text-base font-serif font-semibold text-slate-900 leading-tight">
            {plant.names[locale]}
          </h4>
          <p className="text-xs italic text-slate-500">{plant.names.latin}</p>
        </header>
        <p className="text-sm font-medium text-emerald-800">{qtyLabel}</p>
        {reasons.length > 0 && (
          <p className="text-xs text-slate-700">{reasons.join(sep)}</p>
        )}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={onAdd}
            className="min-h-[44px] w-full px-3 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            {t_i18n(locale, 'plan.space_suggestions.add')}
          </button>
        </div>
      </div>
    </article>
  );
}
