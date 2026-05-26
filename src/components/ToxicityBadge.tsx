// === ToxicityBadge — Welle M.3 ===
// Visual safety badge for plant cards/lists. Three flavours + a pet-toxic
// add-on. Compact ("badge") or full ("box") rendering.
// (Visueller Warner-Badge für Pflanzen-Karten.)

import type { Plant, Locale } from '@/lib/types';
import { getToxicityLevel, isPetToxic, shouldShowSafetyBadge } from '@/lib/toxicity';
import { t as t_i18n } from '@/lib/i18n';

// === 1. PROPS ===

interface Props {
  plant: Plant;
  locale: Locale;
  /**
   * `badge`  — small pill, fits in card corners or inline with the title.
   * `box`    — full alert box with the warning text inside; used on
   *            plant-detail pages where it must be read.
   */
  variant?: 'badge' | 'box';
}

// === 2. COMPONENT ===

export default function ToxicityBadge({ plant, locale, variant = 'badge' }: Props) {
  if (!shouldShowSafetyBadge(plant)) return null;

  const level = getToxicityLevel(plant);
  const pet = isPetToxic(plant);

  if (variant === 'box') {
    return <ToxicityBox plant={plant} locale={locale} level={level} pet={pet} />;
  }
  return <ToxicityPill locale={locale} level={level} pet={pet} />;
}

// === 3. PILL (compact) ===

function ToxicityPill({
  locale,
  level,
  pet,
}: {
  locale: Locale;
  level: ReturnType<typeof getToxicityLevel>;
  pet: boolean;
}) {
  const styles = STYLES[level === 'none' && pet ? 'caution' : level];
  const label =
    level === 'toxic'
      ? t_i18n(locale, 'toxicity.badge.toxic')
      : level === 'caution'
        ? t_i18n(locale, 'toxicity.badge.caution')
        : null;

  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ' +
        styles.pill
      }
      data-testid={`toxicity-pill-${level}`}
    >
      {label && (
        <>
          <span aria-hidden="true">{styles.icon}</span>
          <span>{label}</span>
        </>
      )}
      {pet && (
        <span
          className="ml-0.5"
          aria-label={t_i18n(locale, 'toxicity.badge.pet_aria')}
          title={t_i18n(locale, 'toxicity.badge.pet_title')}
        >
          🐾
        </span>
      )}
    </span>
  );
}

// === 4. BOX (full alert, plant-detail) ===

function ToxicityBox({
  plant,
  locale,
  level,
  pet,
}: {
  plant: Plant;
  locale: Locale;
  level: ReturnType<typeof getToxicityLevel>;
  pet: boolean;
}) {
  const effective = level === 'none' ? 'caution' : level; // shouldShow already true
  const styles = STYLES[effective];
  const warningText = plant.safety?.warnings?.[locale] ?? '';
  const heading =
    level === 'toxic'
      ? t_i18n(locale, 'toxicity.box.toxic_heading')
      : t_i18n(locale, 'toxicity.box.caution_heading');

  return (
    <aside
      className={'rounded-lg border p-4 text-sm ' + styles.box}
      role="alert"
      data-testid={`toxicity-box-${effective}`}
    >
      <p className="flex items-center gap-2 font-semibold mb-1">
        <span aria-hidden="true" className="text-lg">{styles.icon}</span>
        <span>{heading}</span>
        {pet && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-xs"
            title={t_i18n(locale, 'toxicity.badge.pet_title')}
          >
            🐾 {t_i18n(locale, 'toxicity.badge.pet_short')}
          </span>
        )}
      </p>
      {warningText && <p className="leading-relaxed">{warningText}</p>}
    </aside>
  );
}

// === 5. STYLE TABLE ===

const STYLES = {
  toxic: {
    icon: '☠️',
    pill: 'bg-red-50 border-red-300 text-red-800',
    box: 'bg-red-50 border-red-300 text-red-900',
  },
  caution: {
    icon: '⚠️',
    pill: 'bg-amber-50 border-amber-300 text-amber-800',
    box: 'bg-amber-50 border-amber-300 text-amber-900',
  },
  none: {
    icon: '',
    pill: '',
    box: '',
  },
} as const;
