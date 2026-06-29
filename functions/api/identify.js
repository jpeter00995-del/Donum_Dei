// === Donum Dei — Pl@ntNet-Proxy (Cloudflare Pages Function) ===
// Hält den API-Key serverseitig (env.PLANTNET_API_KEY) und reicht NUR eine
// getrimmte Antwort an den Browser. Key liegt als CF-Secret, nie im Repo/Vault.
// Endpoint: POST /api/identify   (multipart/form-data, Feld "images" = 1 Bild)

const PLANTNET_URL = 'https://my-api.plantnet.org/v2/identify/all';
const TIMEOUT_MS = 15_000;

// === 1. HANDLER ===
export async function onRequestPost({ request, env }) {
  const key = env.PLANTNET_API_KEY;
  if (!key) return json({ error: 'unavailable' }, 503);

  // --- Eingangsbild lesen ---
  let image;
  try {
    const form = await request.formData();
    image = form.get('images');
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!image || typeof image === 'string') return json({ error: 'bad_request' }, 400);

  // --- Anfrage an Pl@ntNet bauen ---
  const upstreamForm = new FormData();
  upstreamForm.append('images', image, image.name || 'photo.jpg');
  upstreamForm.append('organs', 'auto');

  const url = `${PLANTNET_URL}?api-key=${encodeURIComponent(key)}&include-related-images=false&nb-results=5&lang=de`;

  // --- Aufruf mit hartem Timeout ---
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp;
  try {
    resp = await fetch(url, { method: 'POST', body: upstreamForm, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err && err.name === 'AbortError') return json({ error: 'timeout' }, 504);
    return json({ error: 'upstream' }, 502);
  }
  clearTimeout(timer);

  // --- Statuscodes von Pl@ntNet abbilden ---
  if (resp.status === 429) return json({ error: 'rate_limit' }, 429);
  if (resp.status === 404) return json({ results: [] }, 200); // "species not found"
  if (!resp.ok) return json({ error: 'upstream' }, 502);

  let data;
  try {
    data = await resp.json();
  } catch {
    return json({ error: 'upstream' }, 502);
  }

  // === 2. ANTWORT TRIMMEN (entkoppelt von Pl@ntNet, kein "remaining" nach außen) ===
  const results = (Array.isArray(data.results) ? data.results : [])
    .slice(0, 5)
    .map((r) => ({
      latin: r?.species?.scientificNameWithoutAuthor || '',
      score: typeof r?.score === 'number' ? r.score : 0,
      commonNames: Array.isArray(r?.species?.commonNames) ? r.species.commonNames.slice(0, 3) : [],
    }))
    .filter((r) => r.latin);

  return json({ results }, 200);
}

// === 3. HELFER ===
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
