// === 1. IMPORTS ===
import { useEffect, useState } from 'react';
import type { Plant, Locale } from '@/lib/types';
import type { GardenPlant } from '@/lib/plantCard';
import type {
  CalendarTask,
  CalendarAction,
  CalendarPlan,
  CalendarUserProfile,
} from '@/lib/calendarEngine';
import { tasksForWeek, isoWeekFromDate } from '@/lib/calendarEngine';
import { buildIcs, downloadIcs } from '@/lib/icalExport';
import { generateGardenPlan, type RecommendedPlant } from '@/lib/gardenPlan';
import { loadProfile, type UserProfile, type PlanOverrides } from '@/lib/userProfile';

// === 2. TYPES & PROPS ===
type PlantsBySlug = Record<string, GardenPlant>;

interface Props {
  /** All known plants — used to render mini-cards for tasks. */
  plantsBySlug: PlantsBySlug;
  locale: Locale;
}

// === 3. TEXTE ===
const TEXTS = {
  de: {
    week_header: 'Diese Woche im Garten',
    next_2_weeks: 'Nächste 2 Wochen',
    no_plan_title: 'Du hast noch keinen Garten-Plan',
    no_plan_cta: 'Erstelle erst deinen Plan',
    no_plan_btn: 'Plan erstellen',
    no_tasks_this_week: 'Diese Woche steht nichts Dringendes an. Genieße den Garten!',
    no_tasks_next: 'Auch in den nächsten 2 Wochen ist nichts geplant.',
    section: {
      sow_indoor: 'Vorziehen (drinnen)',
      sow_outdoor: 'Säen (Freiland)',
      transplant: 'Auspflanzen',
      harvest: 'Ernten',
    } as Record<CalendarAction, string>,
    verb: {
      sow_indoor: 'Vorziehen',
      sow_outdoor: 'Säen',
      transplant: 'Auspflanzen',
      harvest: 'Ernten',
    } as Record<CalendarAction, string>,
    week_label: 'KW',
    detail_link: 'Mehr erfahren',
    export_btn: 'In meinen Kalender exportieren (.ics)',
  },
  en: {
    week_header: 'This week in the garden',
    next_2_weeks: 'Next 2 weeks',
    no_plan_title: 'You have no garden plan yet',
    no_plan_cta: 'Create your plan first',
    no_plan_btn: 'Create plan',
    no_tasks_this_week: 'Nothing urgent this week. Enjoy the garden!',
    no_tasks_next: 'No tasks scheduled in the next 2 weeks either.',
    section: {
      sow_indoor: 'Start indoors',
      sow_outdoor: 'Sow outdoors',
      transplant: 'Transplant',
      harvest: 'Harvest',
    } as Record<CalendarAction, string>,
    verb: {
      sow_indoor: 'Start indoors',
      sow_outdoor: 'Sow',
      transplant: 'Transplant',
      harvest: 'Harvest',
    } as Record<CalendarAction, string>,
    week_label: 'Week',
    detail_link: 'Details',
    export_btn: 'Export to my calendar (.ics)',
  },
} as const;

const PLAN_KEY = 'donumdei_user_plan_v1';

const ACTION_ORDER: CalendarAction[] = ['sow_indoor', 'sow_outdoor', 'transplant', 'harvest'];

const ACTION_COLOR: Record<CalendarAction, string> = {
  sow_indoor: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  sow_outdoor: 'bg-amber-50 border-amber-300 text-amber-900',
  transplant: 'bg-sky-50 border-sky-300 text-sky-900',
  harvest: 'bg-orange-50 border-orange-300 text-orange-900',
};

// === 4. ZEIT-HELPER ===
/**
 * Compute current ISO week using the Europe/Sofia timezone as default.
 * Falls back to local timezone if Intl is unavailable.
 * (Aktuelle ISO-Woche in Sofia-TZ ermitteln.)
 */
function getCurrentSofiaWeek(): { week: number; year: number } {
  try {
    // 'Europe/Sofia' liefert das tatsächliche Datum in Sofia.
    const sofiaNow = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Europe/Sofia' }),
    );
    return isoWeekFromDate(sofiaNow);
  } catch {
    return isoWeekFromDate(new Date());
  }
}

// === 5. KOMPONENTE ===
export default function WeekView({ plantsBySlug, locale }: Props) {
  const tx = TEXTS[locale];
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<CalendarPlan | null>(null);
  const [week, setWeek] = useState<{ week: number; year: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // === 5.1 LocalStorage laden (client-side only) ===
  // Lade Profil + (optional) gespeicherten Plan. Wenn kein Plan da ist,
  // generieren wir ihn on-the-fly aus dem Profil — Kalender soll genauso
  // wie die Plan-Page sofort etwas zeigen.
  useEffect(() => {
    setWeek(getCurrentSofiaWeek());
    // 1) Vollständiges UserProfile via loadProfile() (Migration + Validierung).
    const loaded = loadProfile();
    setProfile(loaded);

    // 2) Optional: separater donumdei_user_plan_v1 (Legacy/Forward-Compat).
    //    Aktuell schreibt die App diesen Key nicht — User-Anpassungen leben in
    //    profile.custom_plan. Wir lesen ihn trotzdem für Forward-Compatibility.
    try {
      const rawPlan = localStorage.getItem(PLAN_KEY);
      if (rawPlan) {
        const parsed = JSON.parse(rawPlan);
        if (Array.isArray(parsed)) setPlan(parsed);
        else if (parsed && Array.isArray(parsed.entries)) setPlan(parsed.entries);
      }
    } catch {
      setPlan(null);
    }
    setHydrated(true);
  }, []);

  // === 5.1b Plan ableiten (effektiver Plan) ===
  // Reihenfolge der Quellen:
  //   1) explizit gespeicherter PLAN_KEY (User-Save hat Vorrang)
  //   2) on-the-fly aus Profil generiert + custom_plan-Overrides angewendet
  const effectivePlan: CalendarPlan = (() => {
    if (plan && plan.length > 0) return plan;
    if (!profile) return [];
    const allPlants = Object.values(plantsBySlug);
    if (allPlants.length === 0) return [];
    // Cast an der Engine-Grenze: generateGardenPlan liest nur GardenPlant-Felder
    // (garden_meta/names/family/companion_planting/slug) — verifiziert.
    const base = generateGardenPlan(profile, allPlants as unknown as Plant[]);
    const merged = applyOverridesLocal(base, profile.custom_plan, allPlants);
    // RecommendedPlant ist struktur-kompatibel zu CalendarPlanEntry
    // (plant_slug + quantity). Wir reichen ihn direkt durch.
    return merged.map(r => ({
      plant_slug: r.plant_slug,
      quantity: r.quantity,
      sowing_method: r.sowing_method,
      notes_de: r.notes_de,
      notes_en: r.notes_en,
    }));
  })();

  // === 5.2 Empty-State: weder Profil noch Plan ===
  if (week === null || !hydrated) {
    return <div className="text-center py-12 text-slate-500">…</div>;
  }
  if (!profile || effectivePlan.length === 0) {
    const planHref = locale === 'de' ? '/de/mein-garten/start/' : '/en/my-garden/start/';
    return (
      <div className="max-w-xl mx-auto bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-serif font-bold text-emerald-900 mb-2">
          {tx.no_plan_title}
        </h2>
        <p className="text-slate-700 mb-4">{tx.no_plan_cta}</p>
        <a
          href={planHref}
          className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded px-5 py-2 transition"
        >
          {tx.no_plan_btn}
        </a>
      </div>
    );
  }

  // Profil-Subset für tasksForWeek (akzeptiert CalendarUserProfile-Shape).
  const calProfile: CalendarUserProfile = {
    zone: profile.zone,
    garden: profile.garden,
    household_size: profile.household_size,
    self_sufficiency_goal: profile.self_sufficiency_goal,
    experience: profile.experience,
  };

  // === 5.3 Tasks berechnen ===
  const tasks = tasksForWeek(calProfile, effectivePlan, week.week, week.year);
  const thisWeekTasks = tasks.filter(t => t.urgency === 'this_week');
  const nextTasks = tasks.filter(t => t.urgency === 'next_2_weeks');

  // === 5.4 iCal-Export ===
  function handleExport() {
    // Cast an der Engine-Grenze: buildIcs liest nur names/slug/image aus der Map.
    const ics = buildIcs(calProfile, effectivePlan, week!.week, week!.year, plantsBySlug as unknown as Record<string, Plant>, locale);
    downloadIcs(ics, `donumdei-kw${week!.week}-${week!.year}.ics`);
  }

  return (
    <div className="space-y-8">
      {/* === Header === */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-serif font-bold text-slate-900">
          {tx.week_header} ({tx.week_label} {week.week})
        </h1>
        <button
          type="button"
          onClick={handleExport}
          className="self-start sm:self-auto bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded px-3 py-2 transition"
        >
          {tx.export_btn}
        </button>
      </header>

      {/* === This week — 4 Sektionen === */}
      <section aria-labelledby="thisweek-h">
        <h2 id="thisweek-h" className="sr-only">{tx.week_header}</h2>
        {thisWeekTasks.length === 0 ? (
          <p className="italic text-slate-500">{tx.no_tasks_this_week}</p>
        ) : (
          <div className="space-y-6">
            {ACTION_ORDER.map(action => {
              const sectionTasks = thisWeekTasks.filter(t => t.action === action);
              if (sectionTasks.length === 0) return null;
              return (
                <div key={action}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {tx.section[action]}
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sectionTasks.map(task => (
                      <TaskCard
                        key={`${task.plant_slug}|${task.action}`}
                        task={task}
                        plant={plantsBySlug[task.plant_slug]}
                        locale={locale}
                        verb={tx.verb[task.action]}
                        colorClass={ACTION_COLOR[task.action]}
                        detailLinkLabel={tx.detail_link}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* === Next 2 weeks preview === */}
      <section aria-labelledby="next-h" className="pt-6 border-t border-slate-200">
        <h2 id="next-h" className="text-xl font-serif font-bold text-slate-900 mb-3">
          {tx.next_2_weeks}
        </h2>
        {nextTasks.length === 0 ? (
          <p className="italic text-slate-500">{tx.no_tasks_next}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nextTasks.map(task => (
              <TaskCard
                key={`next|${task.plant_slug}|${task.action}`}
                task={task}
                plant={plantsBySlug[task.plant_slug]}
                locale={locale}
                verb={tx.verb[task.action]}
                colorClass={ACTION_COLOR[task.action]}
                detailLinkLabel={tx.detail_link}
                dim
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// === 5.5 OVERRIDES (lokale Mini-Variante) ===
/**
 * Wendet PlanOverrides (User-Anpassungen) auf einen generierten Plan an.
 * Duplikat der Logik aus PlanView.applyOverrides, hier inline gehalten, um
 * Bundle-Bloat (PlanView + alle React-Subkomponenten) im Kalender-Island
 * zu vermeiden. Pure Funktion; Quelle-of-Truth bleibt PlanView.applyOverrides
 * für UI-relevante Pfade. (Reine Funktion, kein State.)
 */
function applyOverridesLocal(
  base: RecommendedPlant[],
  overrides: PlanOverrides | undefined,
  plants: readonly GardenPlant[],
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

// === 6. SUB-COMPONENT ===
interface TaskCardProps {
  task: CalendarTask;
  plant: GardenPlant | undefined;
  locale: Locale;
  verb: string;
  colorClass: string;
  detailLinkLabel: string;
  dim?: boolean;
}

function TaskCard({ task, plant, locale, verb, colorClass, detailLinkLabel, dim }: TaskCardProps) {
  if (!plant) {
    // Unbekannte Pflanze (Plan-Eintrag ohne passende JSON).
    return (
      <li className={`border rounded-lg p-3 ${colorClass} ${dim ? 'opacity-70' : ''}`}>
        <strong>{verb}:</strong> {task.plant_slug}
      </li>
    );
  }
  return (
    <li className={`border rounded-lg p-3 flex gap-3 items-start ${colorClass} ${dim ? 'opacity-70' : ''}`}>
      <img
        src={`/images/plants/${plant.image.filename}`}
        alt=""
        className="w-12 h-12 rounded object-cover shrink-0"
        loading="lazy"
      />
      <div className="min-w-0">
        <div className="font-semibold text-sm leading-tight">
          {verb}: {plant.names[locale]}
        </div>
        <div className="text-xs italic opacity-80">{plant.names.latin}</div>
        <a
          href={`/${locale}/plant/${plant.slug}/`}
          className="text-xs underline mt-1 inline-block"
        >
          {detailLinkLabel} →
        </a>
      </div>
    </li>
  );
}
