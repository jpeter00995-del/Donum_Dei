// === 1. IMPORTS ===
import { useMemo } from 'react';
import type { Locale, MonthRange } from '@/lib/types';
import type { GardenPlant } from '@/lib/plantCard';

// === 2. TYPES & PROPS ===
type CellState = 'none' | 'sow' | 'grow' | 'harvest';

interface Props {
  /**
   * Plants to show in the heatmap. Caller decides — typically the plants
   * referenced by the user's plan (so the matrix stays small and relevant).
   */
  plants: GardenPlant[];
  locale: Locale;
}

const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TEXTS = {
  de: {
    title: 'Monats-Übersicht',
    legend_sow: 'Säen',
    legend_grow: 'Wachsen',
    legend_harvest: 'Ernten',
    empty: 'Keine Pflanzen mit Garten-Daten in deinem Plan.',
  },
  en: {
    title: 'Year overview',
    legend_sow: 'Sow',
    legend_grow: 'Grow',
    legend_harvest: 'Harvest',
    empty: 'No plants with garden metadata in your plan.',
  },
} as const;

// === 3. HEATMAP CELL HELPERS ===

function monthInRange(month: number, range: MonthRange): boolean {
  const { start_month: s, end_month: e } = range;
  if (s <= e) return month >= s && month <= e;
  return month >= s || month <= e;
}

/**
 * Compute the activity for a given plant in a given month.
 * Priority: sow > harvest > grow > none. (Wenn beides säen+ernten — säen gewinnt
 * visuell, weil zeitkritischer.)
 */
function cellStateFor(plant: GardenPlant, month: number): CellState {
  const meta = plant.garden_meta;
  if (!meta) return 'none';
  const sw = meta.sowing_window;
  const isSow =
    (sw.indoor && monthInRange(month, sw.indoor)) ||
    (sw.outdoor_direct && monthInRange(month, sw.outdoor_direct)) ||
    (sw.transplant && monthInRange(month, sw.transplant));
  if (isSow) return 'sow';
  if (monthInRange(month, meta.harvest_window)) return 'harvest';
  // "Grow" = zwischen erstem Säen und Ernte.
  if (isPlantGrowingInMonth(plant, month)) return 'grow';
  return 'none';
}

function isPlantGrowingInMonth(plant: GardenPlant, month: number): boolean {
  const meta = plant.garden_meta;
  if (!meta) return false;
  // Approximation: zwischen frühestem Säe-Monat und letztem Ernte-Monat.
  const sowStarts: number[] = [];
  if (meta.sowing_window.indoor) sowStarts.push(meta.sowing_window.indoor.start_month);
  if (meta.sowing_window.outdoor_direct) sowStarts.push(meta.sowing_window.outdoor_direct.start_month);
  if (meta.sowing_window.transplant) sowStarts.push(meta.sowing_window.transplant.start_month);
  if (sowStarts.length === 0) return false;
  const earliest = Math.min(...sowStarts);
  const latestHarvest = meta.harvest_window.end_month;
  // Wenn earliest <= latestHarvest, simpler Bereich:
  if (earliest <= latestHarvest) return month >= earliest && month <= latestHarvest;
  // Wrap (z.B. Säen im November, Ernte im Februar): month >= earliest OR <= latestHarvest
  return month >= earliest || month <= latestHarvest;
}

const STATE_CLASS: Record<CellState, string> = {
  none: 'bg-slate-50',
  sow: 'bg-yellow-300',
  grow: 'bg-green-200',
  harvest: 'bg-orange-300',
};

// === 4. KOMPONENTE ===
export default function MonthHeatmap({ plants, locale }: Props) {
  const tx = TEXTS[locale];
  const monthLabels = locale === 'de' ? MONTHS_DE : MONTHS_EN;

  // Codex P21: consistent Intl.Collator for stable cross-environment sorting.
  const filtered = useMemo(
    () => {
      const collator = new Intl.Collator(locale, { sensitivity: 'base' });
      return plants.filter(p => p.garden_meta).sort((a, b) =>
        collator.compare(a.names[locale], b.names[locale]),
      );
    },
    [plants, locale],
  );

  if (filtered.length === 0) {
    return <p className="italic text-slate-500 py-6">{tx.empty}</p>;
  }

  return (
    <div className="space-y-4">
      {/* === Legende === */}
      <div className="flex flex-wrap gap-3 text-xs">
        <LegendSwatch color={STATE_CLASS.sow} label={tx.legend_sow} />
        <LegendSwatch color={STATE_CLASS.grow} label={tx.legend_grow} />
        <LegendSwatch color={STATE_CLASS.harvest} label={tx.legend_harvest} />
      </div>

      {/* === Scrollbarer Grid-Container (mobile horizontal scroll) === */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white border-b border-r border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                {locale === 'de' ? 'Pflanze' : 'Plant'}
              </th>
              {monthLabels.map(m => (
                <th
                  key={m}
                  className="border-b border-slate-200 px-2 py-2 text-slate-600 font-medium min-w-[2.5rem]"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(plant => (
              <tr key={plant.slug} className="odd:bg-slate-50/50">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white border-r border-slate-200 px-2 py-1 text-left font-normal text-slate-800 whitespace-nowrap"
                >
                  <a
                    href={`/${locale}/plant/${plant.slug}/`}
                    className="hover:underline text-emerald-700"
                  >
                    {plant.names[locale]}
                  </a>
                </th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                  const state = cellStateFor(plant, month);
                  return (
                    <td
                      key={month}
                      className={`${STATE_CLASS[state]} h-7 border border-white text-center`}
                      title={tooltipFor(plant, month, state, locale)}
                    >
                      {state !== 'none' && (
                        <span className="sr-only">{labelFor(state, locale)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === 5. SUB ===
function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-3 h-3 rounded ${color} border border-slate-300`} />
      <span>{label}</span>
    </span>
  );
}

function labelFor(state: CellState, locale: Locale): string {
  const tx = TEXTS[locale];
  switch (state) {
    case 'sow': return tx.legend_sow;
    case 'grow': return tx.legend_grow;
    case 'harvest': return tx.legend_harvest;
    default: return '';
  }
}

function tooltipFor(plant: GardenPlant, month: number, state: CellState, locale: Locale): string {
  const monthName = (locale === 'de' ? MONTHS_DE : MONTHS_EN)[month - 1];
  const action = labelFor(state, locale);
  if (!action) return `${plant.names[locale]} — ${monthName}`;
  return `${plant.names[locale]} — ${monthName}: ${action}`;
}
