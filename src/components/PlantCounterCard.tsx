// === PlantCounterCard — Warenkorb-Card (Welle I) ===
// A single plant card with -/+ counter buttons. The counter drives the
// live garden cart (Warenkorb-Erlebnis). The component is purely
// presentational — state lives in the parent (PlanView).
// (Pflanzen-Counter-Card; Zustand liegt im Parent PlanView.)

import type { Plant, Locale } from '@/lib/types';
import type { PlanPlant } from '@/lib/planPlant';
import { areaPerPlant } from '@/lib/gardenPlan';
import { t as t_i18n } from '@/lib/i18n';

// === 1. PROPS ===

export interface PlantCounterCardProps {
  // Schlankes Plan-DTO statt vollem Plant — Card liest nur slug/names/image
  // + (via areaPerPlant) garden_meta.spacing_cm, alle im DTO vorhanden.
  plant: PlanPlant;
  locale: Locale;
  /** Current count in the cart for this plant. 0 = not in cart. */
  count: number;
  /** Free m² remaining in the garden — disables `+` when next plant would overflow. */
  freeAreaSqm: number;
  /** Click handlers for the counter buttons. */
  onIncrement: () => void;
  onDecrement: () => void;
  /** Optional companion hint (comma-separated localised names). */
  companions?: string;
  /** Optional sowing-window hint (`Direktsaat Apr–Jul`). */
  sowingHint?: string;
  /**
   * Overflow tolerance: the `+` button stays enabled while
   * `(count + 1) * area_per_plant <= freeAreaSqm * (1 + tolerance)`.
   * Default 0.10 (10 %) per spec.
   */
  overflowTolerance?: number;
}

// === 2. LABELS ===

const L = {
  de: {
    perPlant: 'Pro Pflanze',
    pieces_one: 'Stück',
    pieces_many: 'Stück',
    increment: 'hinzufügen',
    decrement: 'entfernen',
    addedArea: 'belegt',
    noSpace: 'passt nicht mehr rein',
    companionsLabel: 'Passt zu',
    counterAria: (name: string, n: number) => `${name}: aktuell ${n} ${n === 1 ? 'Stück' : 'Stück'}`,
  },
  en: {
    perPlant: 'Per plant',
    pieces_one: 'pc',
    pieces_many: 'pcs',
    increment: 'add',
    decrement: 'remove',
    addedArea: 'used',
    noSpace: 'no space left',
    companionsLabel: 'Pairs with',
    counterAria: (name: string, n: number) => `${name}: currently ${n} ${n === 1 ? 'plant' : 'plants'}`,
  },
} as const;

// === 3. COMPONENT ===

export default function PlantCounterCard(props: PlantCounterCardProps) {
  const {
    plant,
    locale,
    count,
    freeAreaSqm,
    onIncrement,
    onDecrement,
    companions,
    sowingHint,
    overflowTolerance = 0.1,
  } = props;
  const t = L[locale];

  // Cast: areaPerPlant liest nur garden_meta.spacing_cm (im DTO vorhanden).
  const perPlantSqm = areaPerPlant(plant as unknown as Plant);
  const currentSqm = Math.round(perPlantSqm * count * 100) / 100;
  const inCart = count > 0;

  // freeAreaSqm = remaining capacity in the whole garden AFTER subtracting
  // every plant currently in the cart (including this one). Adding one more
  // plant costs perPlantSqm. Allowed overflow = perPlantSqm * overflowTolerance.
  // (Toleranz pro Add: 10 % vom Platzbedarf einer einzelnen Pflanze.)
  const incDisabled =
    perPlantSqm > 0 && perPlantSqm > freeAreaSqm + perPlantSqm * overflowTolerance;

  const decDisabled = count <= 0;

  // "Über Budget" = der Garten ist insgesamt im Minus (freeAreaSqm < 0)
  // und diese Card trägt dazu bei (count > 0). Toleranz: 10 % einer
  // einzelnen Pflanzen-Fläche darf negativ sein, ohne als Warnung zu zählen.
  const cardOverBudget =
    inCart && freeAreaSqm < -perPlantSqm * overflowTolerance;

  const fmt = (n: number) => n.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');

  const containerClasses = [
    'plant-counter-card group flex gap-3 rounded-lg border p-3 transition duration-200 hover:shadow-md hover:-translate-y-0.5',
    inCart
      ? cardOverBudget
        ? 'border-rose-400 bg-rose-50'
        : 'border-emerald-300 bg-emerald-50'
      : 'border-slate-200 bg-white hover:border-emerald-300',
  ].join(' ');

  return (
    <article className={containerClasses} data-testid="plant-counter-card" data-slug={plant.slug}>
      {/* === 3.1 Image (klein, 80x80) === */}
      <a
        href={`/${locale}/plant/${plant.slug}/`}
        className="block flex-shrink-0 w-20 h-20 rounded overflow-hidden bg-slate-100"
        aria-label={plant.names[locale]}
      >
        <img
          src={`/images/plants/${plant.image.filename}`}
          alt={plant.image.alt[locale]}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </a>

      {/* === 3.2 Body === */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <header>
          <h3 className="text-base font-serif font-semibold text-slate-900 leading-tight truncate">
            {plant.names[locale]}
          </h3>
          <p className="text-xs italic text-slate-500 truncate">{plant.names.latin}</p>
        </header>

        <p className="text-xs text-slate-600">
          <span className="font-medium">{t.perPlant}:</span>{' '}
          {perPlantSqm > 0 ? `${fmt(Math.round(perPlantSqm * 100) / 100)} m²` : '—'}
        </p>

        {companions && (
          <p className="text-xs text-slate-600 truncate">
            <span className="font-medium">{t.companionsLabel}:</span> {companions}
          </p>
        )}

        {/* === 3.3 Counter row === */}
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrement}
            disabled={decDisabled}
            aria-label={`${plant.names[locale]} ${t.decrement}`}
            className={[
              'min-h-[36px] min-w-[36px] rounded border text-lg font-bold leading-none flex items-center justify-center',
              decDisabled
                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                : 'border-rose-300 text-rose-700 hover:bg-rose-100',
            ].join(' ')}
          >
            −
          </button>
          <span
            className={[
              'min-w-[3.5rem] text-center font-semibold tabular-nums',
              inCart ? 'text-emerald-800 text-lg' : 'text-slate-500 text-base',
            ].join(' ')}
            aria-live="polite"
            aria-label={t.counterAria(plant.names[locale], count)}
          >
            {count} {count === 1 ? t.pieces_one : t.pieces_many}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={incDisabled}
            aria-label={`${plant.names[locale]} ${t.increment}`}
            title={incDisabled ? t.noSpace : undefined}
            className={[
              'min-h-[36px] min-w-[36px] rounded border text-lg font-bold leading-none flex items-center justify-center',
              incDisabled
                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                : inCart
                  ? 'border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100',
            ].join(' ')}
          >
            +
          </button>
        </div>

        {/* === 3.4 Sub-line (current area + sowing hint) === */}
        {(inCart || sowingHint) && (
          <p className={`text-xs ${cardOverBudget ? 'text-rose-700' : 'text-slate-600'} mt-1`}>
            {inCart && (
              <span className="font-medium">
                {fmt(currentSqm)} m² {t.addedArea}
              </span>
            )}
            {inCart && sowingHint && <span aria-hidden="true"> · </span>}
            {sowingHint && <span>{sowingHint}</span>}
          </p>
        )}

        {cardOverBudget && (
          <p className="text-xs text-rose-700 font-medium" role="alert">
            {t_i18n(locale, 'plan.cart.overflow_warn')}
          </p>
        )}
      </div>
    </article>
  );
}
