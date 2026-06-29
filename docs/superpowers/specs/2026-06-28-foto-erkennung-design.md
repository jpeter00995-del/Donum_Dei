# Design — Foto-Erkennung (Plant Photo Identification)

**Date:** 2026-06-28
**Project:** Donum Dei
**Author:** MG + Claude (Session 23)
**Status:** Draft for review

---

## 1. Ziel (Goal)

Nutzer fotografieren eine Pflanze und bekommen einen Bestimmungs-Vorschlag.
Ist die erkannte Art in der Donum-Dei-Datenbank vorhanden, wird direkt auf den
Eintrag verlinkt. Quelle der Erkennung: **Pl@ntNet API** (CC-BY-Daten, gratis
bis 500 Anfragen/Tag).

Eingebettet **in eine bestehende Seite** (Entscheidung MG): die **Suche**
(`/de/suche`, `/en/search`) — „Pflanze finden" ist der natürliche Ort für
„oder per Foto bestimmen". Eigene Route wird **nicht** angelegt.

### Nicht-Ziele (YAGNI)
- Keine Krankheits-/Schädlingsdiagnose (das kann PictureThis, wir nicht).
- Kein Speichern/Verlauf der Fotos, keine Nutzer-Galerie.
- Kein eigenes ML-Modell, kein Training.
- v1: genau **1 Foto** pro Anfrage (Pl@ntNet erlaubt 1–5; Erweiterung später).

---

## 2. Architektur-Überblick

```
Browser (React-Island)                Cloudflare Pages              Pl@ntNet
─────────────────────                 ──────────────                ────────
PlantIdentifier.tsx                   functions/api/identify.js
  Foto wählen/aufnehmen   ── POST ─▶  (Serverless Proxy)   ── POST ─▶  /v2/identify/all
  (multipart, 1 Bild)                   liest PLANTNET_API_KEY          ?api-key=...
  zeigt Ergebnisse        ◀── JSON ──  aus env, trimmt Antwort  ◀── JSON ──
  + Link zu DB-Eintrag
```

**Kernpunkt — Secret-Handling (löst den API-Key-Haken):**
Der API-Key darf **nie** in den Browser oder ins Repo. Lösung:
- Eine **Cloudflare Pages Function** (`functions/api/identify.js`) hält den Key
  serverseitig und ruft Pl@ntNet auf.
- Der Key liegt als **Cloudflare-Environment-Variable** `PLANTNET_API_KEY`
  (im CF-Pages-Dashboard gesetzt, **nicht** committet) → Projektregel
  „keine Secrets im Projekt/Vault" bleibt gewahrt.
- Pages Functions sind Teil von Cloudflare Pages — kein neuer Dienst, keine Kosten.

**Auswirkung auf den Build:** Bisher reines statisches `astro build` → `dist`.
Mit `functions/` deployt Cloudflare die Function automatisch mit. Astro bleibt
statisch (kein SSR-Adapter nötig). **Lokales Testen** der Function braucht
`npx wrangler pages dev dist` (nicht `astro dev` allein).

---

## 3. Komponenten (Units)

### 3.1 `functions/api/identify.js` — Proxy (Cloudflare Pages Function)
- **Was:** Nimmt `POST` multipart/form-data mit einem Bild entgegen, ruft
  Pl@ntNet `POST /v2/identify/all` mit `env.PLANTNET_API_KEY`, gibt eine
  **getrimmte** JSON-Antwort zurück.
- **Eingang:** `FormData { images: File, organs?: "auto" }`
- **Ausgang (trimmed):**
  ```json
  { "results": [
      { "latin": "Actaea racemosa", "score": 0.92,
        "commonNames": ["Black cohosh"] }
  ] }
  ```
  Kein `remaining`/Pl@ntNet-spezifisches Feld nach außen (entkoppelt; das UI
  braucht es nicht). Limit-Monitoring serverseitig über Logs (§10).
- **Timeout:** `AbortController`, **15 s**. Bei Überschreitung → `504
  {error:"timeout"}`, damit ein hängendes Pl@ntNet die Suche nie blockiert.
- **Abhängigkeiten:** `env.PLANTNET_API_KEY`, Pl@ntNet REST.
- **Fehler:** kein Key → `503 {error:"unavailable"}`; Pl@ntNet 429 (Limit) →
  `429 {error:"rate_limit"}`; Timeout → `504 {error:"timeout"}`; sonst `502`.
  Nie Key oder Rohfehler durchreichen.

### 3.2 `src/lib/plantMatch.ts` — Latin→Slug-Matching (rein, testbar)
- **Was:** Normalisiert einen lateinischen Namen und schlägt ihn in einer
  Lookup-Map nach.
- **`normalizeLatin` muss konkret leisten** (botanische Namen sind unsauber):
  - lowercase + Diakritika weg (`ACTAEA RACEMOSA` → `actaea racemosa`);
  - **Autor-Kürzel** abschneiden (`Actaea racemosa L.`,
    `Actaea racemosa (L.) Nutt.` → `actaea racemosa`);
  - **Hybrid-Zeichen** `×`/`x ` entfernen (`Actaea × hybrida` → `actaea hybrida`);
  - **auf Gattung + Art kürzen** — `subsp.`/`ssp.`/`var.`/`f.` + Folgewort weg
    (`Taraxacum officinale subsp. vulgare` → `taraxacum officinale`).
- **Funktionen:**
  - `normalizeLatin(name: string): string`
  - `buildLatinIndex(plants): Record<string, slug>` (aus `names.latin`)
  - `matchSlug(latin, index): string | null`
  - `getLatinIndex(): Record<string, slug>` — Convenience: ruft
    `loadAllPlants()` + `buildLatinIndex`, **am Build im Astro-Frontmatter**
    aufgerufen (Muster wie `loadPlants` in `kalender.astro`). **Kein**
    eingechecktes `generated/*.json` — es gibt im Projekt kein
    Generated-Artefakt-Muster (verifiziert); der Index (~266 Paare) wird zur
    Build-Zeit erzeugt und als schlankes DTO an das Island gereicht.
- **Abhängigkeiten:** `normalize*`/`match*` keine (pure → vitest);
  `getLatinIndex` nur `@/lib/loadPlants` (Build-Zeit, nicht im Client-Chunk).
- **Warum eigene Unit:** Kernlogik, muss verlässlich sein, unabhängig testbar.

### 3.3 `src/components/PlantIdentifier.tsx` — UI-Island (React)
- **Was:** Foto wählen/aufnehmen, Vorschau, „Bestimmen", Ergebnisliste mit
  Confidence-Balken; je Treffer Link zu `/<locale>/plant/<slug>` wenn in DB,
  sonst neutraler Hinweis „nicht in unserer Datenbank".
- **Input:** `<input type="file" accept="image/*" capture="environment">`
  (Kamera auf Mobil, Datei auf Desktop — kein Extra-SDK).
- **Props:** `locale`, `latinIndex` (kleines DTO via `getLatinIndex()`,
  Muster wie `kalender.astro` → `WeekView`).
- **Confidence-Schwellen (feste Stufen für konsistentes UI):**
  | Score | Anzeige |
  |---|---|
  | ≥ 0.70 | „Hohe Übereinstimmung" |
  | 0.40–0.69 | „Mögliche Übereinstimmung" |
  | < 0.40 | „Unsichere Bestimmung — bitte schärferes Foto von Blatt/Blüte" |
- **Accessibility (Pflicht, nicht optional):** Confidence-Balken mit
  `role="progressbar"` + `aria-valuenow/min/max`; Lade-/Ergebnis-Status in
  `aria-live="polite"`-Region; Ergebnisliste als echtes `<ul>`; Vorschaubild
  mit sinnvollem `alt` (z. B. „Hochgeladenes Pflanzenfoto").
- **Abhängigkeiten:** `fetch('/api/identify')`, `plantMatch`, i18n-Strings,
  `<PlantNetAttribution>` (§3.5).

### 3.5 `src/components/PlantNetAttribution.astro` — Attribution (zentral)
- **Was:** Pflicht-Attribution (CC-BY) an einer Stelle, DE/EN über i18n:
  „Pflanzenbestimmung über Pl@ntNet. Daten unter CC-BY." + Link.
- **Warum eigene Unit:** rechtlich wartbar, wiederverwendbar, keine verstreuten
  Attribution-Strings im Island.

### 3.4 Einbettung in `suche.astro` / `search` (DE + EN)
- Block **unter** der Pagefind-Suche: Überschrift „📷 Per Foto bestimmen" +
  `<PlantIdentifier client:visible locale={locale} latinIndex={latinIndex} />`.
- `client:visible` (lädt erst beim Scrollen) → keine Startlast für die Textsuche.

---

## 4. Datenfluss

1. Nutzer wählt/schießt Foto → Vorschau im Island.
2. Klick „Bestimmen" → `POST /api/identify` (multipart, 1 Bild).
3. Function ruft Pl@ntNet, trimmt, antwortet.
4. Island normalisiert jeden `latin` → `matchSlug` gegen `latinIndex`.
5. Anzeige: Top-Treffer (z. B. 5), je mit Confidence-Balken; DB-Treffer als
   interner Link, sonst „nicht in unserer DB" (kein erfundener Inhalt).
6. Pl@ntNet-Attribution unter den Ergebnissen (Lizenzpflicht CC-BY).

---

## 5. Fehlerbehandlung & Grenzfälle
- **Kein Key gesetzt:** Island zeigt „Foto-Erkennung momentan nicht verfügbar".
  Textsuche funktioniert unabhängig weiter.
- **Tageslimit (500/Tag) erreicht:** freundlicher Hinweis „heute ausgelastet,
  später erneut".
- **Kein/zu unscharfes Pflanzenbild:** Pl@ntNet-Scores niedrig → Hinweis
  „keine sichere Bestimmung; bitte schärferes Foto von Blatt/Blüte".
- **Timeout (504, > 15 s):** „Die Bilderkennung antwortet momentan nicht."
  Retry-Button; Textsuche bleibt nutzbar.
- **Netzwerkfehler:** Retry-Button, keine Rohfehler im UI.
- **Großes Foto — clientseitiger Resize (Canvas) vor Upload:**
  max. Kantenlänge **1280 px**, **JPEG q0.8**, **EXIF wird entfernt**
  (Canvas-Reencode strippt Metadaten automatisch → Datenschutz-Plus + kein
  GPS-Leak). Erwartete Größe danach ~150–500 KB → schneller + schont das Limit.

---

## 6. Recht & Datenschutz
- Foto wird **erst beim Klick** an Pl@ntNet gesendet; Hinweis direkt am Button.
- Ergänzung in `datenschutz.astro` / `privacy.astro`: „Bei Nutzung der
  Foto-Erkennung wird das Bild an Pl@ntNet (Frankreich/EU) übertragen."
- Pl@ntNet-Attribution + Link an der Ergebnisliste (CC-BY), via `<PlantNetAttribution>`.
- EXIF (inkl. GPS) wird durch den clientseitigen Canvas-Resize entfernt, bevor
  das Bild den Browser verlässt.
- Bildungs-Disclaimer der Seite gilt weiter; **keine** medizinische Aussage
  aus der Bilderkennung (nur Arten-Vorschlag → Verlinkung auf den kuratierten
  Eintrag, dessen Evidenz wie gehabt belegt ist).

## 7. Testing
- `src/lib/plantMatch.test.ts` (vitest, Muster wie `PlanEditor.test.ts`):
  `normalizeLatin` (Autor-Kürzel `L.`/`(L.) Nutt.`, `×`-Hybriden,
  `subsp.`/`var.`-Kürzung, GROSSschreibung, Diakritika), `matchSlug`
  (Treffer / Synonym-Miss / kein Treffer).
- Function + Pl@ntNet-Call werden in UI-Tests gemockt (kein Live-Key in CI).
- `npm run validate:data` + `validate:zod` + bestehende Test-Suite müssen grün
  bleiben (keine Schema-Änderung an Plant-JSONs nötig).
- Manuelle Verifikation lokal via `wrangler pages dev` mit Test-Key.

## 8. Abhängigkeiten / neue Pakete
- **Keine** neuen Runtime-Deps zwingend nötig (Pages Function = plain JS,
  Island = vorhandenes React, Resize = Browser-Canvas).
- Dev/Test-Komfort optional: `wrangler` (bereits via `.wrangler/` präsent).

## 9. Offene Punkte (vor Bau zu klären)
- **API-Key:** MG registriert bei my.plantnet.org → Key als CF-Env-Var
  `PLANTNET_API_KEY` (entschieden: erst Spec, Key später).
- `organs`-Parameter: v1 fix `auto`; optional später Auswahl Blatt/Blüte/Frucht.
- Anzahl Top-Treffer im UI: Vorschlag 5.

## 10. Telemetrie ohne Tracking (optional, v1.1 — nicht bau-blockierend)
Zur Betriebsbeobachtung darf die Function pro Aufruf **nur** loggen:
`timestamp`, `success/fail`, `latency`, `matched/not_matched`.
**Nie** loggen: Bild, Dateiname, IP, Pflanzenname. Damit lässt sich beurteilen,
wie oft die Funktion genutzt wird, wie oft Donum Dei einen DB-Treffer hat und ob
das Tageslimit überhaupt relevant wird — ohne Personenbezug. Bewusst aus dem
v1-Kern ausgeklammert (YAGNI); aufnehmen, sobald Nutzung beobachtet werden soll.
