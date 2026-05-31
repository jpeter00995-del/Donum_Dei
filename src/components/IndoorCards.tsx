// === 1. IMPORTS ===
import type { Locale } from '@/lib/types';
import type { IndoorPlant } from '@/lib/indoorCard';
import { t } from '@/lib/i18n';

// === 2. PROPS ===
interface Props {
  plants: IndoorPlant[];
  locale: Locale;
}

// === 3. ICON-TABELLEN ===
const LIGHT_ICON: Record<string, string> = {
  direct_sun: '☀',
  bright_indirect: '🌤',
  partial_shade: '🌥',
  low_light: '🌑',
};

const WATER_ICON: Record<string, string> = {
  daily: '💧💧💧',
  every_few_days: '💧💧',
  weekly: '💧',
  sparse: '·',
};

const PURPOSE_ICON: Record<string, string> = {
  medicinal: '🌿',
  edible: '🍃',
  air_purifying: '💨',
  pest_repelling: '🦟',
  humidifying: '💦',
  night_oxygen: '🌙',
  ornamental: '🪴',
};

// === 4. KOMPONENTE ===
export default function IndoorCards({ plants, locale }: Props) {
  // Leerer-Zustand Meldung (wird vom FilterBar-Parent gesteuert)
  if (plants.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        {locale === 'de'
          ? 'Keine Pflanzen passen zu dieser Auswahl.'
          : 'No plants match this selection.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {plants.map(p => (
        <a
          key={p.slug}
          href={`/${locale}/plant/${p.slug}/`}
          className="block bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden border border-slate-100"
        >
          <img
            src={`/images/plants/${p.image.filename}`}
            alt={p.image.alt[locale]}
            title={`© ${p.image.author} · ${p.image.license}`}
            className="w-full h-40 object-cover"
            loading="lazy"
          />
          <div className="p-3">
            <h3 className="font-bold text-emerald-700 leading-tight">{p.names[locale]}</h3>
            <p className="text-xs italic text-gray-500 mb-2">{p.names.latin}</p>
            <div className="flex items-center justify-between text-sm">
              <span
                className="text-amber-500"
                title={t(locale, `indoor.diff.${p.indoor_growing!.difficulty}`)}
              >
                {'★'.repeat(p.indoor_growing!.difficulty)}
                {'☆'.repeat(3 - p.indoor_growing!.difficulty)}
              </span>
              <span className="text-gray-600 text-xs">
                {LIGHT_ICON[p.indoor_growing!.light]}&nbsp;
                {WATER_ICON[p.indoor_growing!.water_frequency]}
              </span>
              {p.indoor_growing!.pet_safe && (
                <span title={t(locale, 'indoor.pet_safe.yes')} className="text-sm">
                  🐾
                </span>
              )}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {p.indoor_growing!.purpose.map(pur => (
                <span
                  key={pur}
                  title={t(locale, `indoor.purpose.${pur}`)}
                  className="text-sm"
                >
                  {PURPOSE_ICON[pur]}
                </span>
              ))}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
