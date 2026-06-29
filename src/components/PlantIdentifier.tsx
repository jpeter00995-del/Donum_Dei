// === Donum Dei — Foto-Erkennung (React-Island) ===
// Foto wählen/aufnehmen → clientseitig verkleinern (1280px/q0.8, strippt EXIF)
// → POST /api/identify (Pl@ntNet-Proxy) → Trefferliste mit Confidence + DB-Link.
import { useState, useRef, useCallback } from 'react';
import { t } from '@/lib/i18n';
import { matchSlug } from '@/lib/plantMatch';
import type { Locale } from '@/lib/types';

// === 1. TYPEN ===
interface ApiResult {
  latin: string;
  score: number;
  commonNames: string[];
}
interface Props {
  locale: Locale;
  latinIndex: Record<string, string>;
}
type Status = 'idle' | 'loading' | 'done' | 'error';

// === 2. KONSTANTEN ===
const MAX_EDGE = 1280; // px
const JPEG_QUALITY = 0.8;
const CONF_HIGH = 0.7;
const CONF_POSSIBLE = 0.4;

// === 3. BILD-RESIZE (Canvas → JPEG, EXIF wird beim Reencode entfernt) ===
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  let { width, height } = bitmap;
  if (width > MAX_EDGE || height > MAX_EDGE) {
    const scale = MAX_EDGE / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    ),
  );
}

// === 4. KOMPONENTE ===
export default function PlantIdentifier({ locale, latinIndex }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<ApiResult[]>([]);
  const [errorKey, setErrorKey] = useState<string>('identify.err_generic');
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Foto gewählt ---
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('idle');
    setResults([]);
    try {
      const resized = await resizeImage(file);
      setBlob(resized);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch {
      // Resize fehlgeschlagen → Originaldatei verwenden
      setBlob(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, [previewUrl]);

  // --- Bestimmen ---
  const handleSubmit = useCallback(async () => {
    if (!blob) return;
    setStatus('loading');
    const form = new FormData();
    form.append('images', blob, 'photo.jpg');
    try {
      const resp = await fetch('/api/identify', { method: 'POST', body: form });
      if (!resp.ok) {
        const map: Record<number, string> = {
          503: 'identify.err_unavailable',
          429: 'identify.err_rate_limit',
          504: 'identify.err_timeout',
        };
        setErrorKey(map[resp.status] ?? 'identify.err_generic');
        setStatus('error');
        return;
      }
      const data = (await resp.json()) as { results?: ApiResult[] };
      setResults(Array.isArray(data.results) ? data.results : []);
      setStatus('done');
    } catch {
      setErrorKey('identify.err_generic');
      setStatus('error');
    }
  }, [blob]);

  // --- Confidence-Stufe → Label + Farbe ---
  function confidence(score: number): { label: string; bar: string; text: string } {
    if (score >= CONF_HIGH)
      return { label: t(locale, 'identify.match_high'), bar: 'bg-green-600', text: 'text-green-700' };
    if (score >= CONF_POSSIBLE)
      return { label: t(locale, 'identify.match_possible'), bar: 'bg-amber-500', text: 'text-amber-700' };
    return { label: t(locale, 'identify.match_unsure'), bar: 'bg-slate-400', text: 'text-slate-500' };
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white/60 p-4 sm:p-6">
      {/* --- Foto-Auswahl --- */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFile}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          {previewUrl ? t(locale, 'identify.change') : t(locale, 'identify.choose')}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
          >
            {status === 'loading' ? t(locale, 'identify.analyzing') : t(locale, 'identify.submit')}
          </button>
        )}
      </div>

      {/* --- Vorschau --- */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={t(locale, 'identify.preview_alt')}
          className="mt-4 max-h-64 rounded-md object-contain"
        />
      )}

      {/* --- Status / Ergebnisse (Screenreader-freundlich) --- */}
      <div aria-live="polite" className="mt-4">
        {status === 'loading' && (
          <p className="text-sm text-slate-500">{t(locale, 'identify.analyzing')}</p>
        )}

        {status === 'error' && (
          <div className="text-sm text-slate-700">
            <p>{t(locale, errorKey)}</p>
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-2 text-emerald-700 underline hover:text-emerald-900"
            >
              {t(locale, 'identify.retry')}
            </button>
          </div>
        )}

        {status === 'done' && results.length === 0 && (
          <p className="text-sm text-slate-600">{t(locale, 'identify.no_results')}</p>
        )}

        {status === 'done' && results.length > 0 && (
          <>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              {t(locale, 'identify.results_title')}
            </h3>
            <ul className="space-y-3">
              {results.map((r, i) => {
                const c = confidence(r.score);
                const slug = matchSlug(r.latin, latinIndex);
                const pct = Math.round(r.score * 100);
                return (
                  <li key={`${r.latin}-${i}`} className="rounded-md border border-slate-100 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-serif italic text-slate-900">{r.latin}</span>
                      <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
                    </div>
                    {r.commonNames.length > 0 && (
                      <p className="text-sm text-slate-500">{r.commonNames.join(', ')}</p>
                    )}
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={c.label}
                      className="mt-2 h-1.5 w-full overflow-hidden rounded bg-slate-100"
                    >
                      <div className={`h-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-2">
                      {slug ? (
                        <a
                          href={`/${locale}/plant/${slug}`}
                          className="text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
                        >
                          {t(locale, 'identify.in_db')}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">{t(locale, 'identify.not_in_db')}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* --- Datenschutz-/Medizin-Hinweis --- */}
      <p className="mt-4 text-xs text-slate-400">{t(locale, 'identify.disclaimer')}</p>
    </div>
  );
}
