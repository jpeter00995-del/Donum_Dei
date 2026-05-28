import { useEffect } from 'react';
import type { Locale } from '@/lib/types';

interface Props {
  currentLocale: Locale;
  currentPath: string;
}

const STORAGE_KEY = 'donum_dei_lang';

function otherLocale(l: Locale): Locale {
  return l === 'de' ? 'en' : 'de';
}

function swapLocaleInPath(path: string, from: Locale, to: Locale): string {
  return path.replace(new RegExp(`^/${from}(/|$)`), `/${to}$1`);
}

export default function LanguageToggle({ currentLocale, currentPath }: Props) {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentLocale);
    } catch {
      // ignore storage errors
    }
  }, [currentLocale]);

  const target = otherLocale(currentLocale);
  const targetPath = swapLocaleInPath(currentPath, currentLocale, target);

  const handleClick = () => {
    try {
      localStorage.setItem(STORAGE_KEY, target);
    } catch {
      // ignore
    }
    window.location.href = targetPath;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition"
      aria-label={`${currentLocale.toUpperCase()} | ${target.toUpperCase()} — switch to ${target.toUpperCase()}`}
    >
      <span className="font-semibold text-slate-900">{currentLocale.toUpperCase()}</span>
      <span className="text-slate-400">|</span>
      <span className="text-slate-600">{target.toUpperCase()}</span>
    </button>
  );
}
