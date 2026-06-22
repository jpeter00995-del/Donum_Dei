# Donum Dei — Skalierbare Nischen-Seite (Design / Konzept)

**Datum:** 2026-06-22
**Owner:** Maikel (MG)
**Status:** Phase 1 (D) erledigt + verifiziert (2026-06-22); Konzept an realen Stand angepasst
**Ziel des Users:** A = Geld verdienen (Werbung/Affiliate) + B = nützliche, seriöse Seite

> Hinweis: Dies ist ein Plan-Dokument (kein Code). Es beschreibt, WIE aus dem
> bestehenden Donum-Dei-Projekt eine skalierbare Nischen-Seite wird.
> Files in English üblich; Body hier bewusst Deutsch, weil der Owner Anfänger ist
> und das Dokument selbst review-t.

---

## 1. AUSGANGSLAGE (Fact — gemessen 2026-06-22, Phase-1-Bestandsaufnahme)

Donum Dei ist eine **reife** "Seiten-Fabrik" (programmatic SEO), kein Frühstadium:

- **Daten:** je Pflanze eine JSON-Datei in `src/data/plants/` — **266 Pflanzen**
  (die 152 Dateien in `src/data/occurrences/` sind nur Karten-Fundorte).
- **Vorlage:** `src/pages/de/plant/[slug].astro` + `.../en/plant/[slug].astro`,
  zentrale Hülle `src/layouts/BaseLayout.astro`.
- **Generator:** `getStaticPaths()` + `loadAllPlants().map(...)`.
- **Build verifiziert:** `npm run build` = Exit 0, **571 Seiten** gebaut
  (siehe [[project_donum_dei_build_env]] für die Windows-Build-Fixes).

**Bereits gebaut (großer Teil des Fahrplans schon erledigt):**
- Strenges Daten-**Schema** mit Single-Source-Enums (`validatePlant.ts` + `plantSchema.ts`):
  Quellen pro Aussage Pflicht, Bild-Lizenz Pflicht, Giftigkeit/Wechselwirkungen/
  Schwangerschaft-Stillzeit-Kinder, rechtlicher Status.
- **Sitemap** (`@astrojs/sitemap` → `sitemap-index.xml`), **robots.txt** (`public/robots.txt`).
- **Suche** (Pagefind, 571 Seiten indexiert), **Offline-App** (PWA), Karte (Leaflet).
- Feature-Seiten: Quiz, Garten-Planer, Symptom-Finder, Permakultur, Mischkultur, Kalender, Indoor.
- **Rechtstexte vorhanden** (DE+EN): Impressum, Datenschutz, Bildnachweis.
- Selbst-gehostete Fonts (DSGVO, kein Google-Fonts-Request).
- Seiten-**Titel** pro Pflanze einzigartig (`title={plant.names[locale]}`).

Stack: Astro 6 + React + TypeScript + Tailwind + Leaflet. Keine Secrets, keine paid APIs.
Deploy-Ziel bereits konfiguriert: Cloudflare Pages (`site: https://donum-dei.pages.dev`).

---

## 2. WAS "SKALIERBAR" KONKRET HEISST (für diesen Plan)

Mehr Daten → automatisch mehr Seiten, **ohne** pro Seite neu zu programmieren.
Der Aufwand pro zusätzlicher Seite geht gegen null.
Geld entsteht später aus: viele Seiten × echter Nutzen × Besucher.

---

## 3. FAHRPLAN (D → A+ → C → B)

Reihenfolge bewusst so, weil jeder Schritt auf dem vorigen aufbaut und
Werbe-Netzwerke (AdSense) neue/dünne Seiten oft ablehnen — Geld also zuletzt.

> **Codex-Review 2026-06-22 (GPT-5.4):** "GO mit Bedingung X" — Architektur ist
> geeignet, NICHT neu erfinden. Bedingung: vor dem Daten-Ausbau ein verbindliches
> Pflanzen-Schema inkl. Quellen-, Lizenz- und SEO-Feldern definieren. Sonst wird
> der Pflegeaufwand bei mehreren hundert Pflanzen größer als die Entwicklung.
> Daraus: Phase A wird zu **A+** (Schema zuerst, dann Daten); SEO-Felder wandern
> ins Datenschema; Search Console vor AdSense; DE als Primärsprache zuerst.

### Phase 1 — D: Bestandsaufnahme — ✅ ERLEDIGT 2026-06-22
**Ergebnis:** Build verifiziert (Exit 0, 571 Seiten); 266 Pflanzen; reifer Stand
dokumentiert (siehe Abschnitt 1). Zwei Windows-Build-Stolpersteine behoben
(node_modules-Neuinstall + `--legacy-peer-deps`, siehe [[project_donum_dei_build_env]]).
**Ziel war:** verstehen, was läuft; saubere Ausgangslage; Owner lernt sein System.
Schritte:
1. Projekt lokal starten (`npm install`, `npm run dev`) und prüfen, ob es ohne Fehler baut.
2. Echte Zahl der Pflanzen zählen (Daten-Dateien vs. tatsächlich gerenderte Seiten).
3. Schnell-Check: Tests vorhanden? (`vitest` liegt im Projekt). Laufen sie grün?
4. Offene Baustellen notieren (fehlende Felder, kaputte Seiten, fehlende Bilder/Quellen).
**Ergebnis (Deliverable):** kurze IST-Liste in `SESSION_STATE.md` + diese Spec bestätigt.
**Risiko:** keines (nur lesen/lokal starten). Kein Datenverlust.

### Phase 2 — A+: Schema-Lücke schließen (Schema existiert bereits!)
**Realität:** Das verbindliche Schema (Codex-"Bedingung X") ist bereits gebaut und
übertrifft die Anforderung (`validatePlant.ts` + `plantSchema.ts`). Quellen, Bild-Lizenz,
Sicherheit usw. sind Pflicht. **Nicht** neu bauen.
**Einzige echte Lücke fürs SEO:** ein eigenes Feld für die **Meta-Beschreibung pro Seite**.
Aktuell zieht `BaseLayout.astro` für ALLE Seiten denselben Slogan (`site.tagline`).
Schritte:
1. Schema additiv erweitern: optionales Feld `seo_description: { de, en }` je Pflanze
   (oder ersatzweise das vorhandene `teaser`-Feld als Beschreibung nutzen — billiger).
2. Entscheiden: dediziertes Feld pflegen ODER `teaser` wiederverwenden (Empfehlung:
   `teaser`, da bereits vorhanden und zweisprachig → keine 266× Handarbeit).
3. Mehr Daten ist **optional** (266 reichen für den Start); falls Ausbau: DE zuerst.
**Ergebnis:** jede Pflanze hat eine Quelle für eine einzigartige Beschreibung.
**Regeln:** nur CC-lizenzierte Bilder, Quelle pro Fakt Pflicht (bereits erzwungen).

### Phase 3 — C: SEO-Restlücken in `BaseLayout.astro` (klein & gezielt)
**Realität:** Sitemap + robots.txt + eindeutige Titel sind schon da. Es fehlen nur
wenige, klar benannte Dinge — alle in einer zentralen Datei (`BaseLayout.astro`):
Schritte:
1. **Einzigartige `meta description`** je Seite (Prop durchreichen statt fixem Slogan).
   Für Pflanzen aus `teaser`/`seo_description` (Phase A+).
2. **`<link rel="canonical">`** je Seite (saubere Original-URL).
3. **`hreflang`-Alternates** DE↔EN (wichtig bei Zweisprachigkeit — sagt Google,
   dass die DE- und EN-Seite zusammengehören).
4. **Open-Graph + Twitter-Card** Tags (schöne Vorschau beim Teilen; og:title, og:description, og:image).
5. **Interne Verlinkung** auf Pflanzen-Detailseiten: ähnliche Pflanzen / gleiche Familie
   (das Schema hat `family` + `companion_planting` — Daten sind da).
6. **Google Search Console** anbinden = echte Such-/Besucher-Daten (Basis für Phase B).
**Ergebnis:** jede Seite eindeutig beschrieben, sprachverknüpft, teilbar, intern verlinkt,
in Search Console messbar.

### Phase 4 — B: Geld einbauen (zuletzt, wenn Basis + Traffic da sind)
**Ziel:** Einnahmen ohne den seriösen Charakter zu beschädigen.
**Voraussetzung (Codex):** erst genug vollständige Seiten (Richtwert 100+) UND erste
echte organische Besucher in der Search Console — NICHT als kurzfristiges Ziel sehen.
Schritte:
1. Werbung: ein dezenter Block je Seite (Google AdSense). AdSense-Antrag erst ab ~100+
   vollständigen Seiten realistisch.
2. Affiliate: passende, ehrliche Empfehlungen (Bücher/Saatgut/Gartenbedarf) mit Partner-Link;
   Affiliate-Links **klar kennzeichnen** (Pflicht in der EU).
3. Pflicht: "kein medizinischer Rat"-Hinweis bleibt; keine Health Claims ("heilt",
   "behandelt", "wirkt gegen") — nur vorsichtig und streng quellenbasiert.
4. Rechtliches: Impressum + Datenschutzerklärung + Cookie-/Consent-Hinweis (EU/DSGVO).
**Ergebnis:** erste Einnahme-Bausteine, seriös und rechtlich sauber.

---

## 4. NICHT-ZIELE (YAGNI — bewusst weggelassen)

- Kein eigener Server / kein Login (Seite bleibt statisch generiert = günstig, sicher).
- Keine paid APIs, keine Secrets.
- Kein zweites Thema (z. B. Anime) in diesem Plan — das ist ein **späteres**,
  eigenes Projekt, das dieselbe "Fabrik" wiederverwendet.
- Keine KI-Massen-Texte ohne echten Datenwert (würde Google-Filter auslösen).

---

## 5. ERFOLGS-KRITERIEN

- Phase 1 (D): Seite baut lokal fehlerfrei; Tests grün; IST-Liste existiert; Pflanzenzahl bekannt.
- Phase 2 (A+): verbindliches Schema dokumentiert (inkl. SEO-Felder); Owner ergänzt eine
  neue Pflanze selbstständig nach Muster; bestehende Pflanzen erfüllen das Schema.
- Phase 3 (C): gültige `sitemap.xml`; Titel + Beschreibung je Seite aus Daten; interne
  Verlinkung steht; Search Console angebunden.
- Phase 4 (B): Werbung/Affiliate aktiv; Affiliate-Links gekennzeichnet; Impressum +
  Datenschutz + Consent vorhanden; Disclaimer unverändert.

---

## 6. RISIKEN (aus Codex-Review)

- **Content-Pflege explodiert** (hoch/hoch): Gegenmittel = striktes Schema, Pflichtfelder, Muster.
- **Zweisprachigkeit verdoppelt Arbeit** (hoch/mittel-hoch): zuerst DE optimieren, EN danach.
- **Bildrechte werden Flaschenhals** (mittel/hoch): Lizenzfeld verpflichtend machen.
- **Google ignoriert dünne Seiten** (mittel/hoch): echte Daten, Quellen, Tabellen, interne Links.
- **AdSense-Erwartung unrealistisch** (hoch/mittel): Geld ist Phase 4, kein kurzfristiges Ziel.

## 7. OFFENE PUNKTE / GATES

- Hosting/Deploy-Weg final wählen (siehe `docs/deploy.md`) — Gate vor Phase 3-Live.
- AdSense-Freigabe braucht ~100+ vollständige Seiten + erste Besucher — Gate für Phase 4.
- Bild-Lizenzen lückenlos? — Check während Phase A+ (Lizenzfeld Pflicht).
