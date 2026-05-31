// === Symptom-Finder — Welle M.2 ===
// Interactive page: pick a symptom (chips or free-text search) → see plants
// traditionally used for it. Pure client component, no network calls.
// (Symptom-Suche: Chip oder Free-Text → passende Pflanzen aus DB.)

import { useMemo, useState } from 'react';
import type { Plant, Locale } from '@/lib/types';
import type { SymptomPlant } from '@/lib/symptomCard';
import {
  getAllSymptoms,
  getSymptomById,
  getSymptomDisclaimer,
  findPlantsForSymptom,
  suggestSymptoms,
  type Symptom,
} from '@/lib/symptomSearch';
import { t as t_i18n } from '@/lib/i18n';
import ToxicityBadge from './ToxicityBadge';

// === 1. PROPS ===

interface Props {
  // Schlanke DTO statt voller Plant[] — spart ~90% Prop-Groesse im HTML.
  plants: SymptomPlant[];
  locale: Locale;
}

// === 2. COMPONENT ===

export default function SymptomFinder({ plants, locale }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  const allSymptoms = useMemo(() => getAllSymptoms(), []);
  const selected = selectedId ? getSymptomById(selectedId) : null;
  const suggestions = useMemo(() => suggestSymptoms(query), [query]);

  const matches = useMemo(
    // Cast sicher: findPlantsForSymptom liest nur uses[].target/description,
    // teaser, description und names.latin — alle in SymptomPlant vorhanden.
    () => (selected ? findPlantsForSymptom(selected.id, plants as unknown as Plant[], 30) : []),
    [selected, plants],
  );

  const pickSymptom = (id: string) => {
    setSelectedId(id);
    setQuery('');
    // Scroll the results section into view on mobile.
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('symptom-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* 2.1 — Search input + autocomplete */}
      <section aria-labelledby="symptom-search-label">
        <label
          id="symptom-search-label"
          htmlFor="symptom-search-input"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {t_i18n(locale, 'symptoms.search_label')}
        </label>
        <div className="relative">
          <input
            id="symptom-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t_i18n(locale, 'symptoms.search_placeholder')}
            autoComplete="off"
            className="w-full min-h-[44px] px-3 py-2 rounded border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          />
          {query.trim().length > 0 && suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label={t_i18n(locale, 'symptoms.suggestions_label')}
              className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-64 overflow-auto"
            >
              {suggestions.map(({ symptom }) => (
                <li key={symptom.id} role="option" aria-selected={selectedId === symptom.id}>
                  <button
                    type="button"
                    onClick={() => pickSymptom(symptom.id)}
                    className="w-full text-left min-h-[44px] px-3 py-2 flex items-center gap-2 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                  >
                    <span className="text-xl" aria-hidden="true">{symptom.emoji}</span>
                    <span className="text-slate-800">{locale === 'de' ? symptom.name_de : symptom.name_en}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 2.2 — Chip grid */}
      <section aria-labelledby="symptom-chips-heading">
        <h2 id="symptom-chips-heading" className="text-lg font-serif font-semibold text-slate-900 mb-3">
          {t_i18n(locale, 'symptoms.chips_heading')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {allSymptoms.map((s) => {
            const active = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSymptom(s.id)}
                aria-pressed={active}
                className={
                  'min-h-[44px] px-3 py-2 rounded-full border text-sm transition flex items-center gap-1.5 ' +
                  (active
                    ? 'bg-emerald-600 border-emerald-700 text-white'
                    : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50')
                }
              >
                <span className="text-base" aria-hidden="true">{s.emoji}</span>
                <span>{locale === 'de' ? s.name_de : s.name_en}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2.3 — Results */}
      <section id="symptom-results" aria-live="polite" className="scroll-mt-4">
        {selected === null ? (
          <p className="text-slate-600 italic">{t_i18n(locale, 'symptoms.no_selection')}</p>
        ) : (
          <ResultsBlock
            symptom={selected}
            matches={matches}
            locale={locale}
            onReset={() => setSelectedId(null)}
          />
        )}
      </section>
    </div>
  );
}

// === 3. RESULTS BLOCK ===

interface ResultsBlockProps {
  symptom: Symptom;
  matches: ReturnType<typeof findPlantsForSymptom>;
  locale: Locale;
  onReset: () => void;
}

function ResultsBlock({ symptom, matches, locale, onReset }: ResultsBlockProps) {
  const symptomName = locale === 'de' ? symptom.name_de : symptom.name_en;
  const disclaimer = getSymptomDisclaimer(locale);
  const headingKey = matches.length === 1 ? 'symptoms.results_heading_one' : 'symptoms.results_heading';
  const heading = t_i18n(locale, headingKey, { count: matches.length, symptom: symptomName });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-serif font-semibold text-slate-900 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{symptom.emoji}</span>
          <span>{heading}</span>
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] px-3 py-2 text-sm text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          {t_i18n(locale, 'symptoms.reset')}
        </button>
      </div>

      <aside className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong className="block mb-1">{t_i18n(locale, 'symptoms.disclaimer_heading')}</strong>
        <p className="leading-relaxed">{disclaimer}</p>
      </aside>

      {matches.length === 0 ? (
        <p className="text-slate-600 italic">{t_i18n(locale, 'symptoms.no_matches')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <PlantCard key={m.plant.slug} match={m} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

// === 4. PLANT CARD ===

function PlantCard({
  match,
  locale,
}: {
  match: ReturnType<typeof findPlantsForSymptom>[number];
  locale: Locale;
}) {
  const { plant, matched_terms } = match;
  const name = plant.names[locale] ?? plant.names.latin;
  const teaser = plant.teaser?.[locale] ?? '';
  const alt = plant.image?.alt?.[locale] ?? name;

  return (
    <article className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col hover:border-emerald-400 hover:shadow-sm transition">
      <a
        href={`/${locale}/plant/${plant.slug}/`}
        className="block aspect-[4/3] bg-slate-100 overflow-hidden"
        aria-label={name}
      >
        <img
          src={`/images/plants/${plant.image.filename}`}
          alt={alt}
          title={`© ${plant.image.author} · ${plant.image.license}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </a>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <header>
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="text-base font-serif font-semibold text-slate-900 leading-tight">{name}</h3>
            <ToxicityBadge plant={plant} locale={locale} variant="badge" />
          </div>
          <p className="text-xs italic text-slate-500">{plant.names.latin}</p>
        </header>
        {teaser && <p className="text-sm text-slate-700 leading-snug">{teaser}</p>}
        {matched_terms.length > 0 && (
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">{t_i18n(locale, 'symptoms.matched_terms_label')}</span>{' '}
            {matched_terms.slice(0, 4).join(', ')}
          </p>
        )}
        <div className="mt-auto pt-2">
          <a
            href={`/${locale}/plant/${plant.slug}/`}
            className="inline-block min-h-[44px] w-full text-center px-3 py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            {t_i18n(locale, 'symptoms.show_details')}
          </a>
        </div>
      </div>
    </article>
  );
}
