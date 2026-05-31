// === 1. IMPORTS ===
import { useMemo, useState, useEffect } from 'react';
import type { Locale, CompanionPlanting } from '@/lib/types';
import type { CompanionPlant } from '@/lib/companionCard';

// === 2. PROPS ===
interface Props {
  plants: CompanionPlant[]; // pre-filtered: only plants with companion_planting
  locale: Locale;
}

// === 3. INLINE-STRINGS (bewusst inline, kein i18n.ts-Edit) ===
const L = {
  de: {
    search_placeholder: 'Pflanze suchen — Tomate, Knoblauch, Basilikum…',
    search_label: 'Pflanze auswählen',
    no_matches: 'Keine Pflanze gefunden.',
    intro_h1: 'Mischkultur — wer wächst mit wem?',
    intro_lead: 'Wähle eine Pflanze, um ihre guten und schlechten Nachbarn zu sehen. Bidirektional gepflegt — jede Beziehung erscheint in beiden Pflanzen-Datensätzen.',
    column_good: 'Gute Nachbarn',
    column_bad: 'Schlechte Nachbarn',
    column_neutral: 'Neutral',
    empty_good: 'Keine guten Nachbarn dokumentiert.',
    empty_bad: 'Keine schlechten Nachbarn dokumentiert.',
    empty_neutral: 'Keine neutralen Beziehungen dokumentiert.',
    no_data_for_partner: '— Partner nicht in Datenbank',
    plants_count: 'Pflanzen mit Mischkultur-Daten',
    source_label: 'Quelle',
    notes_label: 'Hinweise',
    pick_plant: 'Bitte oben eine Pflanze wählen.',
  },
  en: {
    search_placeholder: 'Search plant — tomato, garlic, basil…',
    search_label: 'Select plant',
    no_matches: 'No plant found.',
    intro_h1: 'Companion planting — who grows with whom?',
    intro_lead: 'Pick a plant to see its good and bad neighbours. Bidirectionally maintained — every relationship is mirrored in both plant records.',
    column_good: 'Good neighbours',
    column_bad: 'Bad neighbours',
    column_neutral: 'Neutral',
    empty_good: 'No good neighbours documented.',
    empty_bad: 'No bad neighbours documented.',
    empty_neutral: 'No neutral relationships documented.',
    no_data_for_partner: '— partner not in database',
    plants_count: 'plants with companion data',
    source_label: 'Source',
    notes_label: 'Notes',
    pick_plant: 'Please pick a plant above.',
  },
} as const;

// === 4. KOMPONENTE ===
export default function CompanionExplorer({ plants, locale }: Props) {
  // === 4a. LOOKUPS ===
  // Map slug → plant for fast partner-lookup; sorted German/English list for autocomplete.
  const bySlug = useMemo(() => {
    const m = new Map<string, CompanionPlant>();
    for (const p of plants) m.set(p.slug, p);
    return m;
  }, [plants]);

  // Codex P21: consistent Intl.Collator for stable cross-environment sorting.
  const sorted = useMemo(() => {
    const collator = new Intl.Collator(locale, { sensitivity: 'base' });
    return [...plants].sort((a, b) => collator.compare(a.names[locale], b.names[locale]));
  }, [plants, locale]);

  // === 4b. STATE ===
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Default-Pflanze: Tomate als bestes "Hello World" (viele Companion-Beziehungen).
  // Fallback: Pflanze mit den meisten dokumentierten Beziehungen
  // (good + bad + neutral), damit die Seite nie leer/öde startet.
  const defaultSlug = useMemo(() => {
    if (plants.length === 0) return null;
    const PREFERRED = 'solanum-lycopersicum';
    if (bySlug.has(PREFERRED)) return PREFERRED;
    // Fallback: Pflanze mit den meisten dokumentierten Beziehungen.
    let best: CompanionPlant | null = null;
    let bestScore = -1;
    for (const p of plants) {
      const cp = p.companion_planting;
      if (!cp) continue;
      const score =
        (cp.good_partners?.length ?? 0) +
        (cp.bad_partners?.length ?? 0) +
        (cp.neutral?.length ?? 0);
      if (score > bestScore) {
        best = p;
        bestScore = score;
      }
    }
    return best ? best.slug : sorted[0]?.slug ?? null;
  }, [plants, bySlug, sorted]);

  // Initial: setze Default (Tomate oder Fallback) sobald Daten da sind.
  useEffect(() => {
    if (!selectedSlug && defaultSlug) setSelectedSlug(defaultSlug);
  }, [defaultSlug, selectedSlug]);

  // Restore selection via URL hash (e.g. /de/mischkultur#tomate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && bySlug.has(hash)) {
      setSelectedSlug(hash);
    }
  }, [bySlug]);

  // === 4c. AUTOCOMPLETE-FILTER ===
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as CompanionPlant[];
    return sorted
      .filter(p => {
        return (
          p.names[locale].toLowerCase().includes(q) ||
          p.names.latin.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [query, sorted, locale]);

  const selected = selectedSlug ? bySlug.get(selectedSlug) ?? null : null;
  const strings = L[locale];

  return (
    <div>
      {/* === Header === */}
      <header className="mb-6">
        <h1 className="text-3xl font-serif font-bold text-emerald-800 mb-2">
          {strings.intro_h1}
        </h1>
        <p className="text-gray-700">{strings.intro_lead}</p>
        <p className="text-sm text-gray-500 mt-1">
          {plants.length} {strings.plants_count}
        </p>
      </header>

      {/* === Search + Quick-Picks === */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label htmlFor="companion-search" className="block text-sm font-semibold text-gray-700 mb-2">
          {strings.search_label}
        </label>
        <input
          id="companion-search"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={strings.search_placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoComplete="off"
        />
        {/* Autocomplete suggestions */}
        {query.trim() && (
          <ul className="mt-2 border border-gray-200 rounded-md max-h-64 overflow-y-auto bg-white shadow-sm">
            {suggestions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{strings.no_matches}</li>
            ) : (
              suggestions.map(p => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlug(p.slug);
                      setQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-900">{p.names[locale]}</span>
                    <span className="italic text-gray-500 text-xs">{p.names.latin}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {/* Quick-pick chips — first 12 alphabetically */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sorted.slice(0, 12).map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setSelectedSlug(p.slug)}
              className={`px-2.5 py-1 text-xs rounded-full border transition ${
                selectedSlug === p.slug
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
              }`}
            >
              {p.names[locale]}
            </button>
          ))}
        </div>
      </div>

      {/* === Selected Plant Header === */}
      {selected ? (
        <SelectedPlantView
          plant={selected}
          bySlug={bySlug}
          locale={locale}
          strings={strings}
          onPick={setSelectedSlug}
        />
      ) : (
        <p className="text-gray-500 text-center py-8">{strings.pick_plant}</p>
      )}
    </div>
  );
}

// === 5. SUBKOMPONENTE: SELECTED-PLANT-VIEW ===
function SelectedPlantView({
  plant,
  bySlug,
  locale,
  strings,
  onPick,
}: {
  plant: CompanionPlant;
  bySlug: Map<string, CompanionPlant>;
  locale: Locale;
  strings: (typeof L)[Locale];
  onPick: (slug: string) => void;
}) {
  const cp = plant.companion_planting as CompanionPlanting; // guaranteed by parent-filter

  return (
    <section>
      {/* Header-Card for selected plant */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 flex items-center gap-4">
        <img
          src={`/images/plants/${plant.image.filename}`}
          alt={plant.image.alt[locale]}
          title={`© ${plant.image.author} · ${plant.image.license}`}
          className="w-20 h-20 object-cover rounded-md shrink-0"
          loading="lazy"
        />
        <div>
          <a
            href={`/${locale}/plant/${plant.slug}/`}
            className="text-xl font-bold text-emerald-800 hover:underline"
          >
            {plant.names[locale]}
          </a>
          <p className="italic text-sm text-gray-600">{plant.names.latin}</p>
          <p
            className="text-xs text-gray-500 mt-1"
            title={cp.source}
          >
            <span className="font-semibold">{strings.source_label}:</span>{' '}
            {cp.source.length > 80 ? cp.source.slice(0, 77) + '…' : cp.source}
          </p>
        </div>
      </div>

      {/* 3-column grid: good | bad | neutral (mobile: stacked) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PartnerColumn
          title={strings.column_good}
          emoji="✅"
          accent="emerald"
          slugs={cp.good_partners}
          emptyText={strings.empty_good}
          bySlug={bySlug}
          locale={locale}
          missingText={strings.no_data_for_partner}
          onPick={onPick}
        />
        <PartnerColumn
          title={strings.column_bad}
          emoji="❌"
          accent="rose"
          slugs={cp.bad_partners}
          emptyText={strings.empty_bad}
          bySlug={bySlug}
          locale={locale}
          missingText={strings.no_data_for_partner}
          onPick={onPick}
        />
        <PartnerColumn
          title={strings.column_neutral}
          emoji="◯"
          accent="slate"
          slugs={cp.neutral ?? []}
          emptyText={strings.empty_neutral}
          bySlug={bySlug}
          locale={locale}
          missingText={strings.no_data_for_partner}
          onPick={onPick}
        />
      </div>

      {/* Optional notes block */}
      {(cp.notes_de || cp.notes_en) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <h3 className="font-semibold text-amber-900 mb-1">{strings.notes_label}</h3>
          <p className="text-amber-900 leading-relaxed">
            {locale === 'de' ? cp.notes_de : cp.notes_en}
          </p>
        </div>
      )}
    </section>
  );
}

// === 6. SUBKOMPONENTE: PARTNER-COLUMN ===
function PartnerColumn({
  title,
  emoji,
  accent,
  slugs,
  emptyText,
  bySlug,
  locale,
  missingText,
  onPick,
}: {
  title: string;
  emoji: string;
  accent: 'emerald' | 'rose' | 'slate';
  slugs: string[];
  emptyText: string;
  bySlug: Map<string, CompanionPlant>;
  locale: Locale;
  missingText: string;
  onPick: (slug: string) => void;
}) {
  // Tailwind colour-map; kept explicit so JIT can pick the classes up.
  const headerClass =
    accent === 'emerald'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : accent === 'rose'
      ? 'bg-rose-100 text-rose-900 border-rose-300'
      : 'bg-slate-100 text-slate-700 border-slate-300';

  const cardHover =
    accent === 'emerald'
      ? 'hover:border-emerald-400 hover:bg-emerald-50'
      : accent === 'rose'
      ? 'hover:border-rose-400 hover:bg-rose-50'
      : 'hover:border-slate-400 hover:bg-slate-50';

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
      <h2 className={`px-3 py-2 font-semibold text-sm border-b ${headerClass}`}>
        <span aria-hidden="true">{emoji}</span> {title}{' '}
        <span className="text-xs opacity-70">({slugs.length})</span>
      </h2>
      {slugs.length === 0 ? (
        <p className="p-3 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {slugs.map(slug => {
            const partner = bySlug.get(slug);
            if (!partner) {
              return (
                <li key={slug} className="px-3 py-2 text-sm text-gray-500">
                  <span className="font-mono text-xs">{slug}</span> {missingText}
                </li>
              );
            }
            return (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => onPick(slug)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 transition border-l-2 border-transparent ${cardHover}`}
                  title={`${partner.names[locale]} (${partner.names.latin})`}
                >
                  <img
                    src={`/images/plants/${partner.image.filename}`}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-10 h-10 object-cover rounded shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-gray-900 text-sm leading-tight truncate">
                      {partner.names[locale]}
                    </span>
                    <span className="block italic text-xs text-gray-500 truncate">
                      {partner.names.latin}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
