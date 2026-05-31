import { useMemo, useState } from 'react';
import { t } from '@/lib/i18n';
import type { Locale, UseForm, Season, FilterState } from '@/lib/types';
import type { PlantCard } from '@/lib/plantCard';

interface Props {
  plants: PlantCard[];
  locale: Locale;
}

const FORMS: UseForm[] = ['tea', 'tincture', 'salve', 'bath', 'raw', 'spice'];
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

export default function FilterBar({ plants, locale }: Props) {
  const [filter, setFilter] = useState<FilterState>({ forms: [], seasons: [] });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    // Filter auf dem schlanken Card-DTO: forms + seasons sind vorab abgeleitet.
    const byFilters = plants.filter(p => {
      if (filter.forms.length > 0 && !filter.forms.some(f => p.forms.includes(f))) return false;
      if (filter.seasons.length > 0 && !filter.seasons.some(s => p.seasons.includes(s))) return false;
      return true;
    });
    const q = search.trim().toLowerCase();
    if (!q) return byFilters;
    return byFilters.filter(p =>
      p.names.de.toLowerCase().includes(q) ||
      p.names.en.toLowerCase().includes(q) ||
      p.names.latin.toLowerCase().includes(q)
    );
  }, [plants, filter, search]);

  const totalCount = plants.length;
  const filteredCount = filtered.length;

  const hasActiveFilter = filter.forms.length > 0 || filter.seasons.length > 0 || search.trim().length > 0;

  const searchPlaceholder = locale === 'de' ? 'Pflanze suchen — z.B. Tomate, Basilikum, Echinacea...' : 'Search plant — e.g. tomato, basil, echinacea...';
  const searchAriaLabel = locale === 'de' ? 'Pflanze nach Namen suchen' : 'Search plant by name';

  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-4">
        <div>
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchAriaLabel}
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true">
              🔍
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={locale === 'de' ? 'Suche löschen' : 'Clear search'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 px-2 py-1 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">{t(locale, 'filter.use')}</h2>
          <div className="flex flex-wrap gap-2">
            {FORMS.map(form => {
              const active = filter.forms.includes(form);
              return (
                <button
                  key={form}
                  type="button"
                  onClick={() => setFilter(f => ({ ...f, forms: toggleInArray(f.forms, form) }))}
                  className={[
                    'px-3 py-1 text-sm rounded-full border transition',
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  ].join(' ')}
                >
                  {t(locale, `use.${form}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">{t(locale, 'filter.season')}</h2>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map(season => {
              const active = filter.seasons.includes(season);
              return (
                <button
                  key={season}
                  type="button"
                  onClick={() => setFilter(f => ({ ...f, seasons: toggleInArray(f.seasons, season) }))}
                  className={[
                    'px-3 py-1 text-sm rounded-full border transition',
                    active
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  ].join(' ')}
                >
                  {t(locale, `season.${season}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-sm text-slate-600">
            {t(locale, 'filter.counter', { count: filteredCount, total: totalCount })}
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => { setFilter({ forms: [], seasons: [] }); setSearch(''); }}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              {t(locale, 'filter.reset')}
            </button>
          )}
        </div>
      </div>

      <div>
        {filteredCount === 0 ? (
          <p className="text-center text-slate-500 py-8">{t(locale, 'filter.no_match')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((plant, i) => (
              <a
                key={plant.slug}
                href={`/${locale}/plant/${plant.slug}`}
                className="group block bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-400 hover:shadow-md transition"
              >
                {/* Nur erstes Bild = LCP → eager + fetchpriority high; Rest lazy (keine Bandbreiten-Konkurrenz auf Mobil). */}
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={`/images/plants/${plant.image.filename}`}
                    alt={plant.image.alt[locale]}
                    title={`© ${plant.image.author} · ${plant.image.license}`}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-serif font-semibold text-slate-900">
                    {plant.names[locale]}
                  </h2>
                  <p className="text-sm italic text-slate-500 mt-0.5">({plant.names.latin})</p>
                  <p className="text-sm text-slate-700 mt-2 line-clamp-2">{plant.teaser[locale]}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {plant.forms.map(form => (
                      <span
                        key={form}
                        className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {t(locale, `use.${form}`)}
                      </span>
                    ))}
                    {plant.externalOnly && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {t(locale, 'detail.external_only')}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
