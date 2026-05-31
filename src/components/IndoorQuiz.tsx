import { useState } from 'react';
import type { Plant, Locale } from '@/lib/types';
import type { IndoorPlant } from '@/lib/indoorCard';
import { matchPlants, type QuizAnswers } from '@/lib/quizMatch';

// === 1. TYPEN ===

interface Props {
  plants: IndoorPlant[];
  locale: Locale;
}

// === 2. LABELS ===

const ROOM_LABELS = {
  de: {
    kitchen:     'Küche',
    living_room: 'Wohnzimmer',
    bathroom:    'Bad',
    bedroom:     'Schlafzimmer',
    balcony:     'Balkon / Terrasse',
  },
  en: {
    kitchen:     'Kitchen',
    living_room: 'Living room',
    bathroom:    'Bathroom',
    bedroom:     'Bedroom',
    balcony:     'Balcony / Terrace',
  },
} as const;

const LIGHT_LABELS = {
  de: {
    sonnig: 'Sonniges Fenster',
    hell:   'Helles Zimmer',
    dunkel: 'Eher dunkel',
  },
  en: {
    sonnig: 'Sunny window',
    hell:   'Bright room',
    dunkel: 'Rather dark',
  },
} as const;

const WATER_LABELS = {
  de: {
    vergesslich: 'Vergesslich',
    normal:      'Normal',
    pingelig:    'Gärtnerisch-pingelig',
  },
  en: {
    vergesslich: 'Forgetful',
    normal:      'Normal',
    pingelig:    'Conscientious',
  },
} as const;

// === 3. KOMPONENTE ===

export default function IndoorQuiz({ plants, locale }: Props) {
  const [open, setOpen]       = useState(false);
  const [step, setStep]       = useState<0 | 1 | 2 | 3>(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [results, setResults] = useState<IndoorPlant[] | null>(null);

  const ROOMS  = ROOM_LABELS[locale];
  const LIGHTS = LIGHT_LABELS[locale];
  const WATERS = WATER_LABELS[locale];

  // Quiz-Zustand zurücksetzen
  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
  };

  // --- Geschlossener Zustand: CTA-Button ---
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="block w-full bg-emerald-100 hover:bg-emerald-200 rounded-lg p-4 text-left transition"
      >
        <span className="font-bold text-emerald-800">
          🌱 {locale === 'de' ? 'Welche passt zu dir? (3 Fragen)' : 'Which one fits you? (3 questions)'}
        </span>
        <span className="block text-sm text-emerald-600 mt-1">
          {locale === 'de' ? 'Quiz starten' : 'Start quiz'}
        </span>
      </button>
    );
  }

  // --- Ergebnis-Ansicht ---
  if (results) {
    return (
      <div className="bg-emerald-50 rounded-lg p-4">
        <h3 className="font-bold mb-3">
          {locale === 'de' ? 'Diese passen zu dir 🌿' : 'These fit you 🌿'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {results.map(p => (
            <a
              key={p.slug}
              href={`/${locale}/plant/${p.slug}/`}
              className="block bg-white rounded shadow hover:shadow-lg p-2 text-center"
            >
              <img
                src={`/images/plants/${p.image.filename}`}
                alt={p.image.alt[locale]}
                className="w-full h-20 object-cover rounded mb-1"
              />
              <div className="text-xs font-semibold">{p.names[locale]}</div>
            </a>
          ))}
        </div>
        <button onClick={reset} className="mt-3 text-sm text-emerald-700 hover:underline">
          {locale === 'de' ? '↺ Quiz zurücksetzen' : '↺ Reset quiz'}
        </button>
      </div>
    );
  }

  // --- Fortschritts-Indikator ---
  const progress = '●'.repeat(step) + '○'.repeat(3 - step);

  // --- Frage-Ansicht ---
  return (
    <div className="bg-emerald-50 rounded-lg p-4">
      <div className="text-xs text-emerald-700 mb-2">{progress}</div>

      {/* Schritt 0: Zimmer */}
      {step === 0 && (
        <>
          <h3 className="font-bold mb-3">
            {locale === 'de' ? 'Wo soll deine Pflanze stehen?' : 'Where should your plant stand?'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(ROOMS) as [string, string][]).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setAnswers(a => ({ ...a, room: k as QuizAnswers['room'] })); setStep(1); }}
                className="px-3 py-2 bg-white rounded hover:bg-emerald-100"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Schritt 1: Licht */}
      {step === 1 && (
        <>
          <h3 className="font-bold mb-3">
            {locale === 'de' ? 'Wie viel Licht kommt da hin?' : 'How much light reaches it?'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(LIGHTS) as [string, string][]).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setAnswers(a => ({ ...a, light: k as QuizAnswers['light'] })); setStep(2); }}
                className="px-3 py-2 bg-white rounded hover:bg-emerald-100"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Schritt 2: Gießen */}
      {step === 2 && (
        <>
          <h3 className="font-bold mb-3">
            {locale === 'de' ? 'Wie oft denkst du ans Gießen?' : 'How often do you remember watering?'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(WATERS) as [string, string][]).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  const finalAnswers = { ...answers, water: k as QuizAnswers['water'] } as QuizAnswers;
                  setAnswers(finalAnswers);
                  // Cast an der Engine-Grenze: matchPlants ist auf Plant[] typisiert,
                  // liest aber nur slug + indoor_growing.{suitable,rooms,light,
                  // water_frequency,difficulty} — alle im IndoorPlant-DTO enthalten.
                  // Rueckgabe ebenfalls auf IndoorPlant[] zurueckgecastet, da die
                  // Ergebnis-Ansicht nur slug/names/image nutzt. Daher feld-sicher.
                  setResults(
                    matchPlants(plants as unknown as Plant[], finalAnswers) as unknown as IndoorPlant[],
                  );
                  setStep(3);
                }}
                className="px-3 py-2 bg-white rounded hover:bg-emerald-100"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
