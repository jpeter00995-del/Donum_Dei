import { useEffect, useRef, useState } from 'react';
import type { Locale, UiLocale } from '@/lib/types';
import { translatePath } from '@/lib/routeMap';

interface Props {
  currentLocale: UiLocale;
  currentPath: string;
}

const STORAGE_KEY = 'donum_dei_lang';

// Alle UI-Sprachen mit Anzeige-Namen.
const LANGS: { code: UiLocale; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'bg', label: 'Български' },
];

// Ziel-Link: DE/EN behalten die aktuelle Seite, FR/ES/BG → Startseite.
// Die Slugs sind uebersetzt (/de/kalender ↔ /en/calendar), deshalb laeuft die
// Umrechnung ueber routeMap statt ueber einen reinen Praefix-Tausch — der
// landete sonst auf nicht existierenden Seiten (404).
function hrefFor(target: UiLocale, currentLocale: UiLocale, currentPath: string): string {
  if (target === 'de' || target === 'en') {
    return translatePath(currentPath, currentLocale, target as Locale);
  }
  return `/${target}/`;
}

export default function LanguageToggle({ currentLocale, currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentLocale);
    } catch {
      // ignore storage errors
    }
  }, [currentLocale]);

  // Klick ausserhalb schliesst das Menue.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function choose(target: UiLocale) {
    try {
      localStorage.setItem(STORAGE_KEY, target);
    } catch {
      // ignore
    }
    window.location.href = hrefFor(target, currentLocale, currentPath);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition"
      >
        <span aria-hidden="true">🌐</span>
        <span className="font-semibold text-slate-900">{currentLocale.toUpperCase()}</span>
        <span className="text-slate-400 text-xs" aria-hidden="true">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 z-50 min-w-[150px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
        >
          {LANGS.map(lng => {
            const active = lng.code === currentLocale;
            return (
              <li key={lng.code}>
                <button
                  type="button"
                  onClick={() => choose(lng.code)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left transition ${
                    active ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{lng.label}</span>
                  <span className="text-xs text-slate-400">{lng.code.toUpperCase()}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
