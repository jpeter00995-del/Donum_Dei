# Donum ∞ Dei

> Interaktive Heilpflanzen-Datenbank + Selbstversorger-Begleiter — bilingual DE/EN, quellenbelegt, offline-fähig.

**Live:** [donum-dei.pages.dev](https://donum-dei.pages.dev/)
**Status:** v1.10.41 — **181/223 Pflanzen voll vertieft (81,2 %)**, 285 Tests, 477 statische Seiten

---

## Features

- 🌿 **223 Pflanzen** mit Anwendungen, Wirkstoffen, Sicherheits-Profil, Ernte-Tipps, Toxizitäts-Klassifikation
- 🇩🇪🇬🇧 **Bilingual** DE/EN inklusive Latein botanisch
- 📚 **Quellenangabe pro Fakt** (EMA, Kommission E, ESCOP, PFAF, Henriette's Herbal, Wikipedia, klinische Studien mit CrossRef-DOI, …)
- 🎯 **Filter** nach Form (Tee/Tinktur/Salbe/…), Ziel-System, Saison, Standort
- 🗺 **Karte** mit Wildsammlungs-Hinweisen (OpenStreetMap + GBIF-Verbreitungsdaten)
- 🌱 **Mein Garten** — Beet-Planer mit Mischkultur, Permakultur-Sets, Indoor-Anbau, Companion-Planting-Matrix
- 🎯 **Symptom-Finder** — „Hilfe bei …" findet passende Heilpflanzen
- 🧠 **Pflanzen-Quiz** zum Lernen (Foto-Erkennung, mehrere Schwierigkeitsgrade)
- 📱 **PWA** — offline-fähig, installierbar auf Mobile
- ⚠️ **Sicherheits-Warnungen** für Schwangerschaft/Stillzeit/Kinder, Wechselwirkungen, Verwechslungsgefahr
- 🪴 **Indoor-Profil** — 14 Zier-/Luftqualität-Pflanzen mit eigener Tiefe-Metrik (NASA-Wolverton-basiert)

---

## Setup

Voraussetzung: Node.js ≥ 22.12.0

```sh
git clone <repo>
cd Donum_Dei
npm install --legacy-peer-deps   # @vite-pwa/astro peer-Konflikt mit Astro 6
bash scripts/hooks/install.sh    # pre-commit-Hook aktivieren
```

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Dev-Server auf `localhost:4321` |
| `npm run build` | Production-Build → `dist/` |
| `npm run preview` | Build lokal testen |
| `npm run test` | Vitest (285 Tests) |
| `npm run validate:data` | Legacy schema-validator |
| `npm run validate:zod` | Zod-schema-validator (canonical) |
| `npm run validate:all` | data + zod + tests |
| `npm run schema:export` | Generate `docs/plant_schema.json` from zod schema |
| `wrangler pages deploy dist --project-name=donum-dei` | Production-Deploy zu Cloudflare Pages |

## Multi-Device (Mac ↔ Windows)

- **Never sync `node_modules/` across devices.** It contains OS-specific binaries (Mac arm64 vs Windows x64).
  After switching machines, always run:
  ```sh
  npm install --legacy-peer-deps
  ```
- The `node_modules/` folder is git-ignored. If you sync the project via Nextcloud, ensure your sync tool excludes `node_modules/` (most clients honour `.gitignore` or have a `Sync exclude` setting).
- Lockfile (`package-lock.json`) IS synced — keeps dep versions consistent.
- Don't deploy from two devices simultaneously — the `wrangler pages deploy` is unique per commit hash.
- **Filemode-Drift Win↔Mac:** Set `git config core.filemode false` on both devices to avoid endless `M scripts/hooks/*` loop (chmod-tracking differs across OS).

## Build & Deploy

Astro Static + Cloudflare Pages. Kein Backend, keine Server-Logik.

- Build erzeugt **477 statische HTML-Seiten** (DE + EN für jede Pflanze + Listen + Symptom-Finder + Quiz + Garten-Planer + …).
- Deploy via Wrangler-CLI (`wrangler pages deploy`). GitHub-Integration noch nicht aktiv.
- ServiceWorker (vite-pwa) cached HTML (`NetworkFirst`) + OSM-Tiles (`CacheFirst`).

---

## Datenquellen

Jeder medizinische Fakt verlinkt auf eine **explizit benannte Quelle** in `src/data/plants/<slug>.json` → `sources[]`. Quellentypen:

| Type | Beispiel |
|------|----------|
| `monograph` | EMA HMPC, Kommission E, ESCOP, WHO Monographs |
| `clinical_trial` | RCTs mit CrossRef-DOI-Verifikation (z.B. Ried 2016 Knoblauch-Meta-Analyse) |
| `wikipedia` | de.wikipedia.org / en.wikipedia.org |
| `wikidata` | Q-IDs |
| `book` | Madaus 1938, Künzle 1911, Hildegard von Bingen, NASA-Wolverton 1989 (alle Public Domain oder Open) |
| `commons` | Wikimedia Commons (CC-Bild-Lizenz) |

**Public-Domain-Zitate** sind als `classical_quotes` markiert mit Autor + Jahr + Lizenz=PD.
**Klinische Studien** werden via CrossRef-API DOI-verifiziert (Welle XII–XV: 121/121 DOIs OK, ~70 erfundene Kandidaten von H1-Preflight-Bot abgefangen).

## Lizenz & Attribution

### Code
MIT License (siehe LICENSE — folgt).

### Inhalte (Plant-JSONs, Texte)
Eigene Synthese aus Public-Domain- + Open-Access-Quellen.
Verbreitung bevorzugt unter **CC-BY-SA 4.0**. Wenn du Inhalte weiterverwendest, verlinke auf [donum-dei.pages.dev](https://donum-dei.pages.dev) und übernimm Quellenangaben.

### Bilder
Ausschließlich **CC-lizenzierte Werke** (vorwiegend Wikimedia Commons).
Bild-Metadaten (`image.license`, `image.author`, `image.source_url`) sind in jedem Plant-JSON gespeichert UND müssen am gerenderten Bild **sichtbar** attributiert werden (CC-BY-SA-Konformität).

⚠️ Wenn ein Bild ohne sichtbare Attribution erscheint: **Bug, bitte melden.**

---

## Disclaimer

**Donum Dei ist KEIN medizinischer Ratgeber.**

Alle Inhalte sind ausschließlich edukativ und beruhen auf publizierter Literatur. Sie ersetzen **keine ärztliche Beratung, Diagnose oder Behandlung**.

- Vor Anwendung von Heilpflanzen bei Krankheit, Schwangerschaft, Stillzeit, Säuglingen, Kleinkindern, chronischen Erkrankungen oder unter Medikation: **immer Arzt oder Apotheker fragen**.
- Verwechslungsgefahr bei Wildsammlung — manche Pflanzen haben **lebensgefährliche** Doppelgänger (z.B. Bärlauch ↔ Maiglöckchen ↔ Herbstzeitlose).
- Naturschutz beachten — Roter-Listen-Arten (z.B. Bitterklee, Schlüsselblume) **nicht aus der Wildnis ernten**.

---

## Datenschutz

- **Keine Tracking-Cookies, keine Analytics, keine externen Marketing-Pixel.**
- Fonts (`Inter`, `Crimson Pro`) werden **self-hosted** ausgeliefert (`@fontsource`). Keine Google-Fonts-Request.
- OpenStreetMap-Tiles werden vom OSM-CDN geladen (siehe [osm.org/privacy](https://wiki.osmfoundation.org/wiki/Privacy_Policy)). Anonyme Karten-Tile-Requests.
- ServiceWorker speichert HTML + Tiles im Browser-Cache (Offline-Fähigkeit) — kein Upload, keine Telemetrie.
- **Kein Login, keine Accounts, keine User-Profile auf dem Server** — alle persönlichen Einstellungen (Garten-Plan, Quiz-Bestwerte) bleiben im LocalStorage des Browsers.

---

## Project Structure

```
src/
  data/plants/<slug>.json   ← 223 Plant-Datendateien
  lib/
    types.ts                ← TypeScript-Schema (Top-Level-Typen + Enums)
    plantSchema.ts          ← Zod-Schema (Single-Source-of-Truth, canonical seit Codex v1)
    validatePlant.ts        ← Runtime-Validator (Build-Time + CLI-Time)
    i18n.ts                 ← Re-Export-Hub (t() + otherLocale())
    i18n/
      ├── de.ts             ← Aggregator: spreads 7 DE-Domain-Files
      ├── en.ts             ← Aggregator: spreads 7 EN-Domain-Files
      └── {de,en}/          ← Per-Domain Strings (common, plant, indoor, plan,
                              permaculture, symptoms, feedback)
    loadPlants.ts           ← Plant-Loader mit konsistenter Sortierung
    gardenPlan.ts           ← Beet-Planer-Algorithmus
    companionSuggestions.ts ← Mischkultur-Empfehlungen
    symptomSearch.ts        ← Symptom-Finder
    toxicity.ts             ← Toxizitäts-Klassifikation
  components/               ← React-Islands + Astro-Components
  layouts/BaseLayout.astro  ← Globales HTML-Gerüst + Self-hosted Fonts
  pages/{de,en}/            ← Astro-Pages mit i18n-Routing
scripts/
  validate_data.mjs         ← CLI-Validator (`npm run validate:data`)
  validate_data_zod.mjs     ← Zod-CLI-Validator (`npm run validate:zod`, canonical)
  hooks/                    ← Pre-commit-Hook (validate + tests)
docs/
  data_schema.md            ← Plant-JSON Schema-Doku
  plant_schema.json         ← Auto-exportiert aus Zod
  deploy.md                 ← Deploy-Anleitung
_backups/                   ← Historische Versionen (außerhalb src/)
```

## Contributing

Solo-Projekt von Maikel (MG) mit Claude-Agents als Research-/Code-Helfer.

Wenn du beitragen möchtest:
1. Issue öffnen mit Pflanze + Quelle + Vorschlag
2. Plant-JSON-Snippet erstellen (siehe `docs/data_schema.md`)
3. `npm run validate:all` muss grün sein
4. Quellenangabe verpflichtend
5. Bei Wellen-Pipelines: `_tmp/welleX/`-Snippets liegen während der Welle, werden nach Merge aufgeräumt

---

## Roadmap / Open Items

Siehe [TODO_Donum_Dei.md](TODO_Donum_Dei.md) und [TODO_v1.0_selbstversorger.md](TODO_v1.0_selbstversorger.md).

**Aktuelle Prioritäten (Stand 2026-05-26, Session 12):**
- [x] Backup-Dateien aus `src/` raus (zuletzt 158 Files am 2026-05-26 entfernt — Routine-Aufgabe nach Welle-Pipelines)
- [x] Self-hosted Fonts (DSGVO)
- [x] `npm run validate:data` + Pre-commit-Hook
- [x] `i18n.ts` modularisieren (827 LoC → 14 Domain-Files unter `src/lib/i18n/{de,en}/`, Commit `8905ce7`)
- [x] Visible Image-Attribution-Komponente
- [x] Inline Warning-Boxen für `contraindicated`-Pflanzen (SafetyAlerts)
- [x] Indoor-Sonderregel-Doku (6 Zierpflanzen mit eigener Tiefe-Metrik)
- [ ] Schema mit Zod zentralisieren (plantSchema.ts existiert, Validator-Migration steht aus)
- [ ] GitHub-Repo + CI-Pipeline (Cloudflare-Pages-Git-Integration freischalten)
- [ ] Welle XVI Richtung 85–90 % (Pool 42 Pflanzen shallow)
- [ ] Pagefind Full-Text-Search
- [ ] About-Page „Donum Dei" (Namens-Bedeutung, Vision, Datenquellen)
- [ ] Performance-Lighthouse-Check + SEO-Meta + sitemap.xml + robots.txt
- [ ] PWA-Icons komplett (iOS/Android-Größen, dediziertes maskable)

---

*Pflanzen ehren, Wissen teilen.* 🌿
