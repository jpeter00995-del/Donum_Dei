// === 1. IMPORTS ===
import { useState, useEffect, type FormEvent } from 'react';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

// === 2. KONSTANTEN ===
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY as string | undefined;

// === 3. TYPES ===
interface Props {
  locale: Locale;
  /** Optionaler Pflanzen-Slug aus URL-Parameter (?plant=tomate) */
  initialPlantSlug?: string;
}

type Category = 'bug' | 'feature' | 'correction' | 'other';
type Status = 'idle' | 'submitting' | 'success' | 'error';

// === 4. KOMPONENTE ===
export default function FeedbackForm({ locale, initialPlantSlug = '' }: Props) {
  // === 4.1 STATE ===
  const [category, setCategory] = useState<Category>('bug');
  const [plantSlug, setPlantSlug] = useState(initialPlantSlug);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [botcheck, setBotcheck] = useState(''); // Honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [errorDetail, setErrorDetail] = useState<string>('');

  // === 4.2 URL-PARAMETER AUTO-FILL ===
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('plant');
      if (p && !plantSlug) {
        setPlantSlug(p);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === 4.3 KATEGORIE-LABELS ===
  const categoryLabel: Record<Category, string> = {
    bug: t(locale, 'feedback.category_bug'),
    feature: t(locale, 'feedback.category_feature'),
    correction: t(locale, 'feedback.category_correction'),
    other: t(locale, 'feedback.category_other'),
  };

  // === 4.4 SUBMIT ===
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot: Wenn gefüllt → Bot, leise abbrechen (kein Error)
    if (botcheck.trim() !== '') {
      setStatus('success'); // Fake-Success für Bots
      return;
    }

    if (!ACCESS_KEY) {
      setStatus('error');
      setErrorDetail('PUBLIC_WEB3FORMS_ACCESS_KEY missing in build');
      return;
    }

    if (message.trim().length < MESSAGE_MIN) {
      return; // HTML5 validation should catch this, defensive guard
    }

    setStatus('submitting');
    setErrorDetail('');

    const payload = {
      access_key: ACCESS_KEY,
      subject: `Donum Dei Feedback: ${categoryLabel[category]}`,
      from_name: 'Donum Dei Feedback Form',
      category: categoryLabel[category],
      plant_slug: plantSlug || '(none)',
      message,
      reply_email: email || '(not provided)',
      locale,
      botcheck, // Web3Forms erkennt das selbst
    };

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success !== false) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorDetail(data?.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      setStatus('error');
      setErrorDetail(err instanceof Error ? err.message : 'Network error');
    }
  }

  // === 4.5 RESET ===
  function handleReset() {
    setCategory('bug');
    setPlantSlug('');
    setMessage('');
    setEmail('');
    setBotcheck('');
    setStatus('idle');
    setErrorDetail('');
  }

  // === 5. SUCCESS-CARD ===
  if (status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h2 className="text-2xl font-serif font-bold text-emerald-800 mb-2">
          {t(locale, 'feedback.success_title')}
        </h2>
        <p className="text-emerald-700 mb-4">{t(locale, 'feedback.success_body')}</p>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          {t(locale, 'feedback.success_again')}
        </button>
      </div>
    );
  }

  // === 6. FORM ===
  const charCount = message.length;
  const isOverLimit = charCount > MESSAGE_MAX;
  const canSubmit = status !== 'submitting' && message.trim().length >= MESSAGE_MIN && !isOverLimit;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* === 6.1 KATEGORIE === */}
      <div>
        <label htmlFor="feedback-category" className="block text-sm font-medium text-slate-700 mb-1">
          {t(locale, 'feedback.category_label')} <span className="text-rose-600">*</span>
        </label>
        <select
          id="feedback-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          required
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="bug">{categoryLabel.bug}</option>
          <option value="feature">{categoryLabel.feature}</option>
          <option value="correction">{categoryLabel.correction}</option>
          <option value="other">{categoryLabel.other}</option>
        </select>
      </div>

      {/* === 6.2 PFLANZEN-SLUG === */}
      <div>
        <label htmlFor="feedback-plant" className="block text-sm font-medium text-slate-700 mb-1">
          {t(locale, 'feedback.plant_slug_label')}
        </label>
        <input
          id="feedback-plant"
          name="plant_slug"
          type="text"
          value={plantSlug}
          onChange={(e) => setPlantSlug(e.target.value)}
          placeholder={t(locale, 'feedback.plant_slug_placeholder')}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* === 6.3 NACHRICHT === */}
      <div>
        <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-700 mb-1">
          {t(locale, 'feedback.message_label')} <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="feedback-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          rows={6}
          placeholder={t(locale, 'feedback.message_placeholder')}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-y"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{t(locale, 'feedback.message_min_hint')}</span>
          <span className={isOverLimit ? 'text-rose-600 font-medium' : ''}>
            {t(locale, 'feedback.char_count', { n: charCount, max: MESSAGE_MAX })}
          </span>
        </div>
      </div>

      {/* === 6.4 EMAIL === */}
      <div>
        <label htmlFor="feedback-email" className="block text-sm font-medium text-slate-700 mb-1">
          {t(locale, 'feedback.email_label')}
        </label>
        <input
          id="feedback-email"
          name="reply_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t(locale, 'feedback.email_placeholder')}
          autoComplete="email"
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">{t(locale, 'feedback.reply_hint')}</p>
      </div>

      {/* === 6.5 HONEYPOT (versteckt fuer Bots) === */}
      <input
        type="text"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        value={botcheck}
        onChange={(e) => setBotcheck(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        aria-hidden="true"
      />

      {/* === 6.6 ERROR-CARD === */}
      {status === 'error' && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm">
          <p className="font-semibold text-rose-800">{t(locale, 'feedback.error_title')}</p>
          <p className="mt-1 text-rose-700">{t(locale, 'feedback.error_body')}</p>
          {errorDetail && (
            <p className="mt-2 text-xs text-rose-600 font-mono">{errorDetail}</p>
          )}
        </div>
      )}

      {/* === 6.7 SUBMIT === */}
      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center px-5 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          {status === 'submitting' ? t(locale, 'feedback.submitting') : t(locale, 'feedback.submit')}
        </button>
      </div>
    </form>
  );
}
