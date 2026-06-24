// === 1. IMPORTS ===
import { useEffect, useState } from 'react';
import { t } from '@/lib/i18n';
import { splitUsesForToxicity } from '@/lib/toxicUses';
import type {
  Plant,
  Locale,
  PlantUse,
  PlantSource,
  Constituent,
  HarvestInfo,
  SafetyStatus,
  ConstituentCategory,
  SourceType,
  DrugInteractionSeverity,
} from '@/lib/types';

// === 2. TYPES ===
type TabKey = 'use' | 'safety' | 'harvest' | 'constituents' | 'sources';

interface Props {
  plant: Plant;
  locale: Locale;
}

// === 3. KONSTANTEN ===
// Monatsnamen je Sprache (kurz, 3 Buchstaben) — für Sammeln-Tab Heatmap.
const MONTH_NAMES: Record<Locale, string[]> = {
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

// Tab-Definitionen (Reihenfolge ist UI-relevant).
const TAB_ORDER: TabKey[] = ['use', 'safety', 'harvest', 'constituents', 'sources'];

const TAB_ICON: Record<TabKey, string> = {
  use: '💊',
  safety: '⚠',
  harvest: '🌾',
  constituents: '🧪',
  sources: '📚',
};

// Status-Pillen-Farben für SafetyStatus.
const SAFETY_STATUS_CLASS: Record<SafetyStatus, string> = {
  safe: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  caution: 'bg-amber-50 text-amber-700 border border-amber-200',
  contraindicated: 'bg-red-50 text-red-700 border border-red-200',
  unknown: 'bg-slate-100 text-slate-600 border border-slate-200',
};

// Schweregrad-Farben für Wechselwirkungen.
const SEVERITY_CLASS: Record<DrugInteractionSeverity, string> = {
  monitor: 'border-l-2 border-amber-300 bg-amber-50/40',
  caution: 'border-l-2 border-amber-500 bg-amber-50/60',
  avoid: 'border-l-2 border-red-500 bg-red-50/60',
};

// Kategorie-Farben für Wirkstoffe (Tailwind-Paletten passend zur klassischen Phytopharmakologie).
const CONSTITUENT_CATEGORY_CLASS: Record<ConstituentCategory, string> = {
  alkaloid: 'bg-red-50 text-red-700 border border-red-200',
  flavonoid: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  glycoside: 'bg-purple-50 text-purple-700 border border-purple-200',
  essential_oil: 'bg-teal-50 text-teal-700 border border-teal-200',
  tannin: 'bg-amber-100 text-amber-800 border border-amber-300',
  mucilage: 'bg-blue-50 text-blue-700 border border-blue-200',
  bitter: 'bg-lime-50 text-lime-700 border border-lime-200',
  saponin: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  phenolic_acid: 'bg-rose-50 text-rose-700 border border-rose-200',
  sesquiterpene: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  polysaccharide: 'bg-sky-50 text-sky-700 border border-sky-200',
  vitamin: 'bg-orange-50 text-orange-700 border border-orange-200',
  mineral: 'bg-stone-100 text-stone-700 border border-stone-300',
  other: 'bg-slate-100 text-slate-700 border border-slate-200',
};

// Source-Type Farben (Monographie = blau/seriös; Wikipedia = slate; Buch = amber; Commons/Wikidata = slate).
const SOURCE_TYPE_CLASS: Record<SourceType, string> = {
  monograph: 'bg-blue-50 text-blue-700 border border-blue-200',
  book: 'bg-amber-50 text-amber-700 border border-amber-200',
  wikipedia: 'bg-slate-100 text-slate-700 border border-slate-200',
  commons: 'bg-slate-100 text-slate-700 border border-slate-200',
  wikidata: 'bg-slate-100 text-slate-700 border border-slate-200',
};

// Reihenfolge für Source-Gruppierung (kredibel zuerst).
const SOURCE_TYPE_ORDER: SourceType[] = ['monograph', 'book', 'wikipedia', 'commons', 'wikidata'];

// === 4. KOMPONENTE ===
export default function PlantTabs({ plant, locale }: Props) {
  // === 4.1 STATE ===
  const [active, setActive] = useState<TabKey>('use');

  // === Hash-Switch: Klick auf [#src_X] im Use-Tab → switcht zum Quellen-Tab + scrollt zur Quelle ===
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash;
      if (hash.startsWith('#src_')) {
        setActive('sources');
        // Warten bis React den Sources-Tab gerendert hat, dann scrollen.
        setTimeout(() => {
          document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    }
    onHashChange(); // Initial-Check für Deep-Links
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // === 4.2 BEDINGTE TABS ===
  // Wirkstoffe-Tab nur wenn Daten vorhanden — sonst aus dem Strip ausblenden.
  const hasConstituents = !!plant.constituents && plant.constituents.length > 0;
  const visibleTabs: TabKey[] = TAB_ORDER.filter(
    tab => tab !== 'constituents' || hasConstituents,
  );

  // === 4.3 RENDER ===
  return (
    <div className="mt-6">
      {/* === Tab-Strip (horizontal scrollbar auf Mobile) === */}
      <div
        className="border-b border-slate-200 overflow-x-auto"
        role="tablist"
        aria-label="Plant detail tabs"
      >
        <div className="flex gap-1 min-w-max">
          {visibleTabs.map(tab => {
            const isActive = tab === active;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab}`}
                id={`tab-${tab}`}
                onClick={() => setActive(tab)}
                className={
                  'whitespace-nowrap px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ' +
                  (isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900')
                }
              >
                <span aria-hidden="true">{TAB_ICON[tab]}</span>{' '}
                {t(locale, `tabs.${tab}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* === Aktives Panel === */}
      <div
        id={`panel-${active}`}
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className="pt-4"
      >
        {active === 'use' && <UseTab plant={plant} locale={locale} />}
        {active === 'safety' && <SafetyTab plant={plant} locale={locale} />}
        {active === 'harvest' && <HarvestTab plant={plant} locale={locale} />}
        {active === 'constituents' && hasConstituents && (
          <ConstituentsTab plant={plant} locale={locale} />
        )}
        {active === 'sources' && <SourcesTab plant={plant} locale={locale} />}
      </div>
    </div>
  );
}

// === 5. TAB 1 — ANWENDUNG (USES) ===
function UseTab({ plant, locale }: { plant: Plant; locale: Locale }) {
  if (plant.uses.length === 0) {
    return <p className="italic text-slate-500">—</p>;
  }

  // Bei hochgiftigen Pflanzen werden innere Anwendungen aus der normalen
  // Verwendung in einen "nur historische Doku"-Warn-Kasten getrennt (siehe toxicUses.ts).
  const { normalUses, historicalUses } = splitUsesForToxicity(plant);

  return (
    <div className="space-y-6">
      {normalUses.length > 0 && (
        <ul className="space-y-4">
          {normalUses.map((u, idx) => (
            <li key={idx} className="border-l-2 border-emerald-300 pl-3">
              <UseCard use={u} locale={locale} />
            </li>
          ))}
        </ul>
      )}

      {historicalUses.length > 0 && (
        <section
          className="rounded-lg border-2 border-rose-300 bg-rose-50 p-4"
          data-testid="historical-toxic-uses"
        >
          <h3 className="flex items-center gap-2 font-semibold text-rose-800">
            <span aria-hidden="true">☠️</span>
            {t(locale, 'use.historical_toxic_heading')}
          </h3>
          <p className="mt-1 text-sm leading-snug text-rose-900">
            {t(locale, 'use.historical_toxic_note')}
          </p>
          <ul className="mt-3 space-y-4">
            {historicalUses.map((u, idx) => (
              <li key={idx} className="border-l-2 border-rose-300 pl-3">
                <UseCard use={u} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function UseCard({ use, locale }: { use: PlantUse; locale: Locale }) {
  // Internal/external — "both" wird als "internal" gelabelt (gleiche Konvention wie PlantDetail.astro).
  const intExtKey = use.internal_external === 'both' ? 'internal' : use.internal_external;

  // Evidenz-Pille-Farbe je Level.
  const evidenceClass = (() => {
    if (use.evidence_level === 'ema_well_established') {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  })();

  return (
    <>
      {/* === Badges-Zeile === */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
          {t(locale, `use.${use.form}`)}
        </span>
        {use.plant_part && (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {t(locale, `use.plant_part.${use.plant_part}`)}
          </span>
        )}
        <span className="text-slate-500">{t(locale, `use.${intExtKey}`)}</span>
        {use.evidence_level && (
          <span className={`px-2 py-0.5 rounded ${evidenceClass}`}>
            {t(locale, `use.evidence.${use.evidence_level}`)}
          </span>
        )}
      </div>

      {/* === Beschreibung === */}
      <p className="mt-2 text-slate-800">{use.description[locale]}</p>

      {/* === Zubereitung (collapsible — native <details>) === */}
      {use.preparation && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium text-emerald-700">
            {t(locale, 'use.preparation.title')}
          </summary>
          <div className="mt-2 ml-4 space-y-2 text-sm">
            {/* Anleitung prominent — KALTAUSZUG & Co. */}
            {use.preparation.instructions && (
              <p className="bg-emerald-50 border-l-2 border-emerald-400 pl-3 py-2 text-slate-800">
                {use.preparation.instructions[locale]}
              </p>
            )}

            {/* Dosierungs-Grid (key → value) */}
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-slate-700">
              {use.preparation.amount_dry_g && (
                <>
                  <dt>{t(locale, 'use.preparation.amount_dry')}</dt>
                  <dd>
                    {use.preparation.amount_dry_g.min}–{use.preparation.amount_dry_g.max} g
                  </dd>
                </>
              )}
              {use.preparation.amount_ml && (
                <>
                  <dt>{t(locale, 'use.preparation.amount_ml')}</dt>
                  <dd>
                    {use.preparation.amount_ml.min}–{use.preparation.amount_ml.max} ml
                  </dd>
                </>
              )}
              {use.preparation.doses_per_day !== undefined && (
                <>
                  <dt>{t(locale, 'use.preparation.doses_per_day')}</dt>
                  <dd>{use.preparation.doses_per_day}×</dd>
                </>
              )}
              {use.preparation.max_duration_weeks !== undefined && (
                <>
                  <dt>{t(locale, 'use.preparation.max_duration')}</dt>
                  <dd>
                    {use.preparation.max_duration_weeks} {t(locale, 'common.weeks')}
                  </dd>
                </>
              )}
            </dl>

            {/* Altersbeschränkung */}
            {use.age_restriction && (
              <p className="text-amber-700 text-xs">
                ⚠ {t(locale, 'use.preparation.age_restriction')}: ≥{' '}
                {use.age_restriction.min_age} {t(locale, 'common.years')}
                {use.age_restriction.note &&
                  ` — ${use.age_restriction.note[locale]}`}
              </p>
            )}
          </div>
        </details>
      )}

      {/* === Quellen-Anker (springen zum Quellen-Tab) === */}
      {use.source_ids.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {use.source_ids.map((sid, i) => (
            <span key={sid}>
              {i > 0 && ' '}
              <a href={`#${sid}`} className="hover:underline text-slate-500">
                [#{sid}]
              </a>
            </span>
          ))}
        </p>
      )}
    </>
  );
}

// === 6. TAB 2 — SICHERHEIT (SAFETY) ===
function SafetyTab({ plant, locale }: { plant: Plant; locale: Locale }) {
  const s = plant.safety;

  return (
    <div className="space-y-4">
      {/* === Nur-extern-Warnung === */}
      {s.external_only && (
        <p className="inline-block px-3 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-medium text-sm">
          ⚠ {t(locale, 'detail.external_only')}
        </p>
      )}

      {/* === Haupt-Warnungs-Text (immer da) === */}
      <p className="text-slate-800">{s.warnings[locale]}</p>

      {/* === Max. Daueranwendung als Pille === */}
      {s.max_continuous_use_weeks !== undefined && (
        <p className="inline-block px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-sm">
          ⏱ {t(locale, 'safety.max_continuous_use')}: {s.max_continuous_use_weeks}{' '}
          {t(locale, 'common.weeks')}
        </p>
      )}

      {/* === Status-Karten Schwangerschaft/Stillzeit/Kinder === */}
      {(s.pregnancy || s.lactation || s.children) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {s.pregnancy && (
            <SafetyStatusCard
              icon="🤰"
              label={t(locale, 'safety.pregnancy')}
              status={s.pregnancy.status}
              note={s.pregnancy.note?.[locale]}
              locale={locale}
            />
          )}
          {s.lactation && (
            <SafetyStatusCard
              icon="🍼"
              label={t(locale, 'safety.lactation')}
              status={s.lactation.status}
              note={s.lactation.note?.[locale]}
              locale={locale}
            />
          )}
          {s.children && (
            <SafetyStatusCard
              icon="👶"
              label={t(locale, 'safety.children')}
              status={s.children.status}
              note={s.children.note?.[locale]}
              locale={locale}
            />
          )}
        </div>
      )}

      {/* === Wechselwirkungen === */}
      {s.drug_interactions && s.drug_interactions.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">
            {t(locale, 'safety.drug_interactions')}
          </h3>
          <ul className="space-y-2">
            {s.drug_interactions.map((di, idx) => (
              <li
                key={idx}
                className={`pl-3 py-2 text-sm rounded ${SEVERITY_CLASS[di.severity]}`}
              >
                <p className="font-medium text-slate-800">{di.drug_class}</p>
                <p className="text-slate-700">{di.mechanism[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* === Kontraindikationen === */}
      {s.contraindications && s.contraindications.length > 0 && (
        <div>
          <h3 className="font-semibold text-red-700 mb-2">
            {t(locale, 'safety.contraindications')}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-800 bg-red-50/50 border border-red-100 rounded p-3">
            {s.contraindications.map((c, idx) => (
              <li key={idx}>{c[locale]}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SafetyStatusCard({
  icon,
  label,
  status,
  note,
  locale,
}: {
  icon: string;
  label: string;
  status: SafetyStatus;
  note?: string;
  locale: Locale;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-slate-800">
          <span aria-hidden="true">{icon}</span> {label}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${SAFETY_STATUS_CLASS[status]}`}>
          {t(locale, `safety.status.${status}`)}
        </span>
      </div>
      {note && <p className="text-xs text-slate-600">{note}</p>}
    </div>
  );
}

// === 7. TAB 3 — SAMMELN (HARVEST + SAISON) ===
function HarvestTab({ plant, locale }: { plant: Plant; locale: Locale }) {
  const months = MONTH_NAMES[locale];
  const activeSet = new Set(plant.season.active_months);

  return (
    <div className="space-y-4">
      {/* === Saison-Heatmap (12-Spalten-Grid) === */}
      <div>
        <div className="grid grid-cols-12 gap-1 text-xs text-center">
          {months.map((m, idx) => {
            const active = activeSet.has(idx + 1);
            return (
              <div
                key={m}
                className={
                  active
                    ? 'bg-amber-200 text-amber-900 rounded py-1'
                    : 'bg-slate-100 text-slate-400 rounded py-1'
                }
              >
                {m}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-slate-600 mt-2">
          <span className="font-medium">{t(locale, 'detail.harvest_part')}:</span>{' '}
          {plant.season.harvest_part[locale]}
        </p>
      </div>

      {/* === Detail-Karten pro Pflanzenteil === */}
      {plant.harvest && plant.harvest.length > 0 && (
        <div className="space-y-3">
          {plant.harvest.map((h, idx) => (
            <HarvestCard key={idx} info={h} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function HarvestCard({ info, locale }: { info: HarvestInfo; locale: Locale }) {
  const months = MONTH_NAMES[locale];
  const activeSet = new Set(info.best_months);

  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      {/* === Header: Pflanzenteil + Mini-Monatsgrid === */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium">
          {t(locale, `use.plant_part.${info.plant_part}`)}
        </span>
        <span className="text-xs text-slate-500">{t(locale, 'harvest.best_months')}:</span>
        <div className="grid grid-cols-12 gap-0.5 text-[10px] text-center flex-1 min-w-[180px]">
          {months.map((m, idx) => {
            const active = activeSet.has(idx + 1);
            return (
              <div
                key={m}
                className={
                  active
                    ? 'bg-amber-200 text-amber-900 rounded px-0.5'
                    : 'bg-slate-100 text-slate-400 rounded px-0.5'
                }
                title={m}
              >
                {m.charAt(0)}
              </div>
            );
          })}
        </div>
      </div>

      {/* === Detail-Liste (Tageszeit, Trocknung, Lagerung) === */}
      <dl className="text-sm space-y-1.5">
        {info.time_of_day && (
          <div>
            <dt className="inline font-medium text-slate-700">
              {t(locale, 'harvest.time_of_day')}:{' '}
            </dt>
            <dd className="inline text-slate-700">{info.time_of_day[locale]}</dd>
          </div>
        )}
        {info.drying && (
          <div>
            <dt className="inline font-medium text-slate-700">
              {t(locale, 'harvest.drying')}:{' '}
            </dt>
            <dd className="inline text-slate-700">{info.drying[locale]}</dd>
          </div>
        )}
        {(info.storage_months !== undefined || info.storage_condition) && (
          <div>
            <dt className="inline font-medium text-slate-700">
              {t(locale, 'harvest.storage')}:{' '}
            </dt>
            <dd className="inline text-slate-700">
              {info.storage_months !== undefined && (
                <>
                  {info.storage_months} {t(locale, 'harvest.storage_months_unit')}
                </>
              )}
              {info.storage_months !== undefined && info.storage_condition && ' — '}
              {info.storage_condition && info.storage_condition[locale]}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// === 8. TAB 4 — WIRKSTOFFE (CONSTITUENTS) ===
function ConstituentsTab({ plant, locale }: { plant: Plant; locale: Locale }) {
  // Sicher zugreifen — Tab wird nur gerendert wenn constituents existieren, aber TS will den Check.
  const items = plant.constituents ?? [];
  if (items.length === 0) return null;

  return (
    <ul className="space-y-3">
      {items.map((c, idx) => (
        <li key={idx}>
          <ConstituentCard c={c} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

function ConstituentCard({ c, locale }: { c: Constituent; locale: Locale }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="font-bold text-slate-900">{c.name}</span>
        <span
          className={`px-2 py-0.5 rounded text-xs ${CONSTITUENT_CATEGORY_CLASS[c.category]}`}
        >
          {t(locale, `constituents.category.${c.category}`)}
        </span>
        {c.percent_range && (
          <span className="text-xs text-slate-500">
            {t(locale, 'constituents.percent_range')}: {c.percent_range}
          </span>
        )}
        {c.plant_part && (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs">
            {t(locale, `use.plant_part.${c.plant_part}`)}
          </span>
        )}
      </div>
      {c.note && <p className="text-sm text-slate-700">{c.note[locale]}</p>}
    </div>
  );
}

// === 9. TAB 5 — QUELLEN (SOURCES) ===
function SourcesTab({ plant, locale }: { plant: Plant; locale: Locale }) {
  // Gruppieren nach Type, in der definierten Reihenfolge (Monographien zuerst).
  const grouped = new Map<SourceType, PlantSource[]>();
  for (const s of plant.sources) {
    const list = grouped.get(s.type) ?? [];
    list.push(s);
    grouped.set(s.type, list);
  }
  const orderedTypes = SOURCE_TYPE_ORDER.filter(st => grouped.has(st));
  // Falls noch ein Type übrig wäre, der nicht in ORDER ist (zukunfts-safe).
  for (const st of grouped.keys()) {
    if (!orderedTypes.includes(st)) orderedTypes.push(st);
  }

  if (plant.sources.length === 0) {
    return <p className="italic text-slate-500">—</p>;
  }

  return (
    <ul className="space-y-2">
      {orderedTypes.map(type =>
        (grouped.get(type) ?? []).map(s => (
          <li
            key={s.id}
            id={s.id}
            className="flex flex-wrap items-baseline gap-2 text-sm"
          >
            <span className={`px-2 py-0.5 rounded text-xs ${SOURCE_TYPE_CLASS[type]}`}>
              {t(locale, `sources.type.${type}`)}
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              {s.title}
            </a>
            <span className="text-xs text-slate-500">
              ({t(locale, 'sources.accessed')}: {s.accessed})
            </span>
          </li>
        )),
      )}
    </ul>
  );
}
