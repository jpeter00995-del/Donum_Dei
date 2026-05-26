import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/types';
import type { GardenType } from '@/lib/types';
import { zoneFromPostalCode, listClimateZones, type SupportedCountry } from '@/lib/climateZone';
import {
  saveProfile,
  type ExperienceLevel,
  type ProfileDraft,
  type SelfSufficiencyGoal,
} from '@/lib/userProfile';

// === 1. PROPS ===

interface Props {
  locale: Locale;
  /** Path to redirect to after successful save (e.g. "/de/mein-garten/"). */
  redirectTo: string;
}

// === 2. LABELS (DE+EN) ===

const L = {
  de: {
    title: 'Dein Garten — Schritt für Schritt',
    intro: 'In vier Schritten erstellen wir deinen persönlichen Selbstversorger-Plan.',
    progress: (n: number) => `Schritt ${n} von 4`,
    next: 'Weiter',
    back: 'Zurück',
    finish: 'Plan erstellen',
    // Step 1
    s1_title: 'Wo gärtnerst du?',
    s1_country: 'Land',
    s1_postal: 'Postleitzahl',
    s1_zone: 'Klimazone (USDA)',
    s1_zone_detected: 'Automatisch erkannt:',
    s1_zone_override: 'Klimazone manuell wählen',
    s1_zone_unknown: 'Konnte aus PLZ keine Zone ermitteln — bitte manuell wählen.',
    s1_country_de: 'Deutschland',
    s1_country_at: 'Österreich',
    s1_country_ch: 'Schweiz',
    s1_country_bg: 'Bulgarien',
    // Step 2
    s2_title: 'Was für ein Garten?',
    s2_type_balcony: 'Balkon / Terrasse',
    s2_type_raised_bed: 'Hochbeet',
    s2_type_field: 'Garten / Feld',
    s2_type_greenhouse: 'Gewächshaus',
    s2_area: 'Verfügbare Fläche (m²)',
    s2_area_hint: 'Grobe Schätzung reicht — du kannst es später ändern.',
    // Step 3
    s3_title: 'Wer isst mit?',
    s3_household: 'Personen im Haushalt',
    s3_goal: 'Wie viel selbst versorgen?',
    s3_goal_supplementary: 'Ergänzend',
    s3_goal_half: 'Etwa die Hälfte',
    s3_goal_full: 'Voll',
    s3_goal_supplementary_desc: 'Frische Kräuter und ein paar Lieblings-Gemüse',
    s3_goal_half_desc: 'Großteil der Sommer-Saison aus dem eigenen Garten',
    s3_goal_full_desc: 'Volle Selbstversorgung mit Lagergemüse über den Winter',
    // Step 4
    s4_title: 'Wie viel Erfahrung hast du?',
    s4_beginner: 'Anfänger',
    s4_intermediate: 'Fortgeschritten',
    s4_expert: 'Profi',
    s4_beginner_desc: 'Erste eigene Saison oder noch nie etwas angepflanzt',
    s4_intermediate_desc: 'Schon ein paar Saisons Erfahrung, kenne meine Pflanzen',
    s4_expert_desc: 'Jahrelange Erfahrung, traue mich an Profi-Kulturen',
    saving: 'Speichern…',
  },
  en: {
    title: 'Your Garden — Step by Step',
    intro: 'In four steps we create your personal self-sufficiency plan.',
    progress: (n: number) => `Step ${n} of 4`,
    next: 'Next',
    back: 'Back',
    finish: 'Create plan',
    s1_title: 'Where do you garden?',
    s1_country: 'Country',
    s1_postal: 'Postal code',
    s1_zone: 'Climate zone (USDA)',
    s1_zone_detected: 'Auto-detected:',
    s1_zone_override: 'Choose climate zone manually',
    s1_zone_unknown: 'Could not derive a zone from postal code — please pick manually.',
    s1_country_de: 'Germany',
    s1_country_at: 'Austria',
    s1_country_ch: 'Switzerland',
    s1_country_bg: 'Bulgaria',
    s2_title: 'What kind of garden?',
    s2_type_balcony: 'Balcony / Terrace',
    s2_type_raised_bed: 'Raised bed',
    s2_type_field: 'Garden / field',
    s2_type_greenhouse: 'Greenhouse',
    s2_area: 'Available area (m²)',
    s2_area_hint: 'A rough estimate is enough — you can change it later.',
    s3_title: 'Who eats with you?',
    s3_household: 'Household size',
    s3_goal: 'How much self-sufficiency?',
    s3_goal_supplementary: 'Supplementary',
    s3_goal_half: 'About half',
    s3_goal_full: 'Full',
    s3_goal_supplementary_desc: 'Fresh herbs and a few favourite vegetables',
    s3_goal_half_desc: 'Bulk of the summer season from your own garden',
    s3_goal_full_desc: 'Full self-sufficiency with storage crops for winter',
    s4_title: 'How much experience do you have?',
    s4_beginner: 'Beginner',
    s4_intermediate: 'Intermediate',
    s4_expert: 'Expert',
    s4_beginner_desc: 'First season ever or never grown anything yet',
    s4_intermediate_desc: 'A few seasons of experience, know my plants',
    s4_expert_desc: 'Years of experience, comfortable with advanced crops',
    saving: 'Saving…',
  },
} as const;

// === 3. TYPES ===

type Country = SupportedCountry;
type GoalLabelKey = 'supplementary' | 'half' | 'full';

interface WizardState {
  country: Country;
  postal: string;
  zoneOverride: string | null;
  gardenType: GardenType;
  areaSqm: number;
  householdSize: number;
  goal: SelfSufficiencyGoal;
  experience: ExperienceLevel;
}

// === 4. COMPONENT ===

export default function OnboardingWizard({ locale, redirectTo }: Props) {
  const t = L[locale];
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);

  const [state, setState] = useState<WizardState>({
    country: locale === 'de' ? 'DE' : 'DE',
    postal: '',
    zoneOverride: null,
    gardenType: 'raised_bed',
    areaSqm: 10,
    householdSize: 2,
    goal: 'supplementary',
    experience: 'beginner',
  });

  // Klimazone-Auto-Detect aus PLZ (überschreibbar)
  const detectedZone = useMemo(
    () => zoneFromPostalCode(state.country, state.postal),
    [state.country, state.postal],
  );
  const effectiveZone = state.zoneOverride ?? detectedZone;

  const zoneOptions = useMemo(() => listClimateZones().map(z => z.zone), []);

  // === 4.1 Validierung pro Step ===
  const canNext: Record<1 | 2 | 3 | 4, boolean> = {
    1: !!effectiveZone,
    2: state.areaSqm > 0,
    3: state.householdSize >= 1,
    4: true,
  };

  // === 4.2 Submit ===
  function finish() {
    if (!effectiveZone) return;
    setSaving(true);
    const draft: ProfileDraft = {
      zone: effectiveZone,
      garden: { type: state.gardenType, area_sqm: state.areaSqm },
      household_size: state.householdSize,
      self_sufficiency_goal: state.goal,
      experience: state.experience,
    };
    try {
      saveProfile(draft);
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    } catch {
      setSaving(false);
    }
  }

  // === 4.3 Tastatur-Navigation: Enter = weiter wenn möglich ===
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA') return;
      if (step < 4 && canNext[step]) {
        e.preventDefault();
        setStep((step + 1) as 1 | 2 | 3 | 4);
      } else if (step === 4 && canNext[4]) {
        e.preventDefault();
        finish();
      }
    }
  }

  // === 5. RENDER ===
  return (
    <div
      className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm p-6 md:p-8"
      onKeyDown={onKeyDown}
    >
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-serif font-bold text-slate-900">{t.title}</h2>
          <span className="text-sm text-slate-500">{t.progress(step)}</span>
        </div>
        <p className="text-sm text-slate-600 mb-3">{t.intro}</p>
        <div
          className="h-2 bg-slate-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={4}
        >
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <fieldset>
          <legend className="text-lg font-semibold text-slate-900 mb-4">{t.s1_title}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t.s1_country}</span>
              <select
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500"
                value={state.country}
                onChange={e => setState({ ...state, country: e.target.value as Country, zoneOverride: null })}
              >
                <option value="DE">{t.s1_country_de}</option>
                <option value="AT">{t.s1_country_at}</option>
                <option value="CH">{t.s1_country_ch}</option>
                <option value="BG">{t.s1_country_bg}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t.s1_postal}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500"
                value={state.postal}
                onChange={e => setState({ ...state, postal: e.target.value.replace(/\D/g, ''), zoneOverride: null })}
              />
            </label>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-sm text-slate-700">{t.s1_zone}: </span>
            {detectedZone && !state.zoneOverride ? (
              <span className="text-sm text-emerald-700 font-medium">
                {t.s1_zone_detected} <strong>{detectedZone}</strong>
              </span>
            ) : state.zoneOverride ? (
              <span className="text-sm text-slate-900 font-medium">{state.zoneOverride}</span>
            ) : state.postal ? (
              <span className="text-sm text-amber-700">{t.s1_zone_unknown}</span>
            ) : null}

            <div className="mt-3">
              <label className="text-sm text-slate-700">
                {t.s1_zone_override}
                <select
                  className="ml-2 border border-slate-300 rounded px-2 py-1 text-sm"
                  value={state.zoneOverride ?? ''}
                  onChange={e => setState({ ...state, zoneOverride: e.target.value || null })}
                >
                  <option value="">—</option>
                  {zoneOptions.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset>
          <legend className="text-lg font-semibold text-slate-900 mb-4">{t.s2_title}</legend>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {([
              ['balcony', t.s2_type_balcony],
              ['raised_bed', t.s2_type_raised_bed],
              ['field', t.s2_type_field],
              ['greenhouse', t.s2_type_greenhouse],
            ] as [GardenType, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={state.gardenType === key}
                onClick={() => setState({ ...state, gardenType: key })}
                className={`min-h-[44px] border-2 rounded-lg px-4 py-3 text-base font-medium transition ${
                  state.gardenType === key
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block mt-6">
            <span className="text-sm font-medium text-slate-700">{t.s2_area}</span>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500"
              value={state.areaSqm}
              onChange={e => setState({ ...state, areaSqm: Math.max(0, parseInt(e.target.value || '0', 10)) })}
            />
            <span className="text-xs text-slate-500 mt-1 block">{t.s2_area_hint}</span>
          </label>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset>
          <legend className="text-lg font-semibold text-slate-900 mb-4">{t.s3_title}</legend>
          <label className="block mb-6">
            <span className="text-sm font-medium text-slate-700">{t.s3_household}</span>
            <input
              type="number"
              min={1}
              max={20}
              step={1}
              className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-emerald-500"
              value={state.householdSize}
              onChange={e => setState({ ...state, householdSize: Math.max(1, parseInt(e.target.value || '1', 10)) })}
            />
          </label>

          <div>
            <span className="text-sm font-medium text-slate-700 block mb-2">{t.s3_goal}</span>
            <div className="space-y-2" role="radiogroup">
              {([
                ['supplementary', t.s3_goal_supplementary, t.s3_goal_supplementary_desc],
                ['half', t.s3_goal_half, t.s3_goal_half_desc],
                ['full', t.s3_goal_full, t.s3_goal_full_desc],
              ] as [GoalLabelKey, string, string][]).map(([key, label, desc]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={state.goal === key}
                  onClick={() => setState({ ...state, goal: key })}
                  className={`w-full text-left min-h-[44px] border-2 rounded-lg px-4 py-3 transition ${
                    state.goal === key
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900">{label}</div>
                  <div className="text-sm text-slate-600">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset>
          <legend className="text-lg font-semibold text-slate-900 mb-4">{t.s4_title}</legend>
          <div className="space-y-2" role="radiogroup">
            {([
              ['beginner', t.s4_beginner, t.s4_beginner_desc],
              ['intermediate', t.s4_intermediate, t.s4_intermediate_desc],
              ['expert', t.s4_expert, t.s4_expert_desc],
            ] as [ExperienceLevel, string, string][]).map(([key, label, desc]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={state.experience === key}
                onClick={() => setState({ ...state, experience: key })}
                className={`w-full text-left min-h-[44px] border-2 rounded-lg px-4 py-3 transition ${
                  state.experience === key
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900">{label}</div>
                <div className="text-sm text-slate-600">{desc}</div>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((Math.max(1, step - 1)) as 1 | 2 | 3 | 4)}
          disabled={step === 1}
          className="min-h-[44px] px-4 py-2 rounded border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
        >
          {t.back}
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => canNext[step] && setStep((step + 1) as 1 | 2 | 3 | 4)}
            disabled={!canNext[step]}
            className="min-h-[44px] px-6 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {t.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving || !canNext[4]}
            className="min-h-[44px] px-6 py-2 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {saving ? t.saving : t.finish}
          </button>
        )}
      </div>
    </div>
  );
}
