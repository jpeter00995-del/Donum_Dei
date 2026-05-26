# Donum Dei — Project Conventions

**Created:** 2026-05-16
**Last updated:** 2026-05-26 (Session 12 — Quick-Wins-Pass)
**Status:** [x] Approved by Maikel — v0.1 → v1.10.41 evolution dokumentiert

> ⚠️ **Reading guide:** Dieses Dokument hat zwei Layer.
> Oben: **Current Architecture (v1.10.41)** — aktueller Stand, mit Drift-Vermerken wo Realität von v0.1-Plan abweicht.
> Unten (ab "Historical v0.1 design"): historische v0.1-Vorgabe, für Projekt-Historie aufbewahrt.

---

## 📍 Current Architecture (v1.10.41) — Stand 2026-05-26

Nach 12 Sessions + 15 Wellen + Codex GPT-5.4 Review v1 ist der Stand:

| Field | v0.1 plan | v1.10.41 reality |
|-------|-----------|------------------|
| **Plant count** | 50 hand-curated | **223** (181 fully-deep = 81,2 %, davon 175 nach Standard-Metrik + 6 nach Indoor-Sonderregel) |
| **Stack** | Astro 4 | **Astro 6 + React 19 + Tailwind 4 + TypeScript 5 + Zod 4** |
| **Hosting** | Cloudflare Pages / Vercel / Netlify TBD | **Cloudflare Pages**, live at [donum-dei.pages.dev](https://donum-dei.pages.dev) |
| **Schema** | Manual TS types only | **Zod single source of truth** in `src/lib/plantSchema.ts` (Validator-Migration teils noch ausstehend) |
| **Validation** | At-build error throw | **CLI (`npm run validate:data` + `validate:zod`) + pre-commit hook + at-build** |
| **Tests** | "Tests over docs" | **285 vitest tests** passing (20 Test-Files) |
| **Build-Pages** | nicht spezifiziert | **477 statische HTML-Seiten** (DE+EN für 223 Pflanzen + Listen + Symptom-Finder + Quiz + Garten-Planer + …) |
| **Fonts** | Google Fonts CDN | **Self-hosted** via @fontsource (DSGVO) |
| **PWA** | Out of scope | **Vite-PWA active**, NetworkFirst HTML + CacheFirst OSM-tiles |
| **Image attribution** | JSON only | **/de/bildnachweis page** + inline tooltips on card images |
| **Safety warnings** | Footer disclaimer only | **Prominent inline SafetyAlerts component** + Toxicity-Badges |
| **i18n** | 1 monolith file (801 LoC) | **14 Domain-Files** unter `src/lib/i18n/{de,en}/{common,plant,indoor,plan,permaculture,symptoms,feedback}.ts` + Aggregator + Hub (Commit `8905ce7`, 2026-05-26) |
| **Backups** | Inside `src/` | **Moved to `_backups/<date>/`** (out of src/, .gitignore-ed); Routine-Cleanup nach Welle-Pipelines |

### 📐 Tiefe-Metrik (canonical definition, 2026-05-26)

Eine Pflanze gilt als **„volle Tiefe" / „fully deep"** wenn:

- **Standard-Profil (Heilpflanzen, Bäume, Gemüse, Gewürze):**
  `constituents.length ≥ 5` ∧ `harvest.length ≥ 1` ∧ `uses.length ≥ 4`
- **Indoor-Sonderregel (reine Zier-/Luftqualität-Pflanzen):**
  `constituents.length ≥ 5` ∧ `harvest.length ≥ 1` ∧ `uses.length ≥ 3`

Indoor-Profil heißt: alle Targets aus dem engen Set `{air_quality, humidity, ornamental, formaldehyde, benzene, xylene, toluene, low_maintenance, wellbeing, ethnobotany, skin, wounds}` und **kein** Target aus dem Heil-Set (digestion, immune, joints, nervous_system, respiratory, etc.). Begründung: Indoor-Pflanzen haben naturgemäß engeres Anwendungsspektrum (Raum-Effekt, keine Ingestion); 1-Schritt-niedrigere uses-Schwelle ist ehrlich, kein Daten-Fudging.

Diese Metrik ist **dokumentiert, nicht code-enforced**. Validator (`validatePlant.ts` / `validate_data_zod.mjs`) prüft nur Schema-Konformität, nicht Tiefe. Tiefe-Bilanz wird manuell in `SESSION_STATE.md § 3` gepflegt.

**Anti-Fudging-Regel:** Niemals Werte erfinden, um die Schwelle zu erreichen. Wenn ehrliche Recherche kein weiteres `use`/`constituent`/`harvest` hergibt, bleibt die Pflanze shallow. Stand 2026-05-26: 181/223 = 81,2 % voll vertieft.

### 🔄 Vision-Evolution: Lern-DB → Selbstversorger-Tool

**v0.1 Original-Vision (2026-05-16):** „Build a beautiful, interactive web application that lets users explore medicinal and useful plants. Learning mode + Map + seasonal calendar. Start size: 50 plants."

**v1.10 Realität (2026-05-26):** Lern-Datenbank-Kern weiterhin intakt, ABER stark erweitert um **Selbstversorger-Funktionen** (siehe `TODO_v1.0_selbstversorger.md`):
- 🌱 Garten-Planer mit Onboarding (Klimazone, Garten-Typ, Familiengröße)
- 🛒 Beet-Warenkorb mit Companion-Planting-Conflict/Suggestion-Logik
- 🪴 Indoor-Anbau-Sektion (46 Plants mit `indoor_growing`-Profil)
- 📦 Permakultur-Pakete (Three Sisters, Mediterrane Sonne, Wurzel-Schutz, …)
- 🌿 Symptom-Finder („Hilfe bei …")
- 📅 Aussaat-Kalender mit Wochen-View

**Beide Linien sind gleichwertig** und teilen die DB. Bei künftigen Feature-Entscheidungen Kontext bedenken: Pflege bestehender Tiefe vs Bau neuer Features.

### 🧪 Wellen workflow (v1.10)

Plants are deepened in **„Wellen"** (waves) of batched parallel agent dispatches.
A Welle handles 3–14 plants. Each agent fills `_tmp/welleX/<slug>.json` with full depth (uses + safety + constituents + harvest + sources). `python3 _tmp/welleX/merge.py` merges with backup. Tests + build + commit + push → Cloudflare auto-deploys.

**Welle-Bilanz (Stand v1.10.41):**
- Welle XII (2026-05-22): 10 Heil+Gemüse, 67 DOIs verifiziert
- Welle XIII (2026-05-23): 14 Indoor-Pflanzen, NASA-Wolverton-Quellen
- Welle XIV (2026-05-23): 10 Giftpflanzen mit Safety-Profil, 20 DOIs
- Welle XV (2026-05-24): 5 Mix-Pflanzen, 21 DOIs
- Summe Wellen XII–XV: **121/121 CrossRef-OK**, ~70 erfundene DOI-Kandidaten von H1-Preflight-Bot abgefangen

### Key files in v1.10

| File | Role |
|------|------|
| `src/lib/plantSchema.ts` | Zod schema = single source of truth (enums + Plant type) |
| `src/lib/validatePlant.ts` | Legacy validator — slated for replacement by zod schema |
| `src/lib/types.ts` | Legacy TS types — slated for derivation from plantSchema.ts |
| `src/lib/loadPlants.ts` | Plant loader with consistent locale-sorting |
| `src/lib/i18n.ts` | Re-Export-Hub: `t()` + `otherLocale()` (28 LoC) |
| `src/lib/i18n/{de,en}/*.ts` | 14 Domain-Files (common, plant, indoor, plan, permaculture, symptoms, feedback) |
| `src/components/PlantTabs.tsx` | Anwendung/Sicherheit/Sammeln/Wirkstoffe/Quellen tab UI |
| `src/components/SafetyAlerts.astro` | Prominent inline warnings (NEW, Codex v1) |
| `scripts/validate_data_zod.mjs` | Zod validator CLI (canonical) |
| `scripts/hooks/pre-commit` | Pre-commit hook (validate + tests) |

### Key files in v1.10

| File | Role |
|------|------|
| `src/lib/plantSchema.ts` | Zod schema = single source of truth (enums + Plant type) |
| `src/lib/validatePlant.ts` | Legacy validator — slated for replacement by zod schema |
| `src/lib/types.ts` | Legacy TS types — slated for derivation from plantSchema.ts |
| `src/lib/loadPlants.ts` | Plant loader with consistent locale-sorting |
| `src/components/PlantTabs.tsx` | Anwendung/Sicherheit/Sammeln/Wirkstoffe/Quellen tab UI |
| `src/components/SafetyAlerts.astro` | Prominent inline warnings (NEW, Codex v1) |
| `scripts/validate_data_zod.mjs` | Zod validator CLI (canonical) |
| `scripts/hooks/pre-commit` | Pre-commit hook (validate + tests) |

### Wellen workflow (v1.10)

Plants are deepened in **"Wellen"** (waves) of batched parallel agent dispatches.
A Welle handles 3-8 plants. Each agent fills `_tmp/welleX/<slug>.json` with full depth (uses + safety + constituents + harvest + sources). `python3 _tmp/welleX/merge.py` merges with backup. Tests + build + commit + push → Cloudflare auto-deploys.

### Tiefe-Metrik (canonical definition, 2026-05-26)

A plant is counted as **"volle Tiefe" / "fully deep"** when:

- **Standard-Profil (Heilpflanzen, Bäume, Gemüse, Gewürze):**
  `constituents.length ≥ 5` ∧ `harvest.length ≥ 1` ∧ `uses.length ≥ 4`
- **Indoor-Sonderregel (reine Zier-/Luftqualität-Pflanzen):**
  `constituents.length ≥ 5` ∧ `harvest.length ≥ 1` ∧ `uses.length ≥ 3`

  Indoor-Profil heißt: alle Targets aus dem engen Set `{air_quality, humidity, ornamental, formaldehyde, benzene, xylene, toluene, low_maintenance, wellbeing, ethnobotany, skin, wounds}` und **kein** Targets aus dem Heil-Set (digestion, immune, joints, nervous_system, respiratory, etc.). Begründung: solche Pflanzen haben naturgemäß ein engeres Anwendungsspektrum (Indoor = Raum-Effekt, keine Ingestion), daher 1-Schritt-niedrigere uses-Schwelle ist ehrlich, kein Daten-Fudging.

Diese Metrik ist **dokumentiert, nicht code-enforced**. Validator (`validatePlant.ts` / `validate_data_zod.mjs`) prüft nur Schema-Konformität, nicht Tiefe. Tiefe-Bilanz wird manuell in `SESSION_STATE.md § 3` gepflegt.

**Anti-Fudging-Regel:** Niemals Werte erfinden, um die Schwelle zu erreichen. Wenn ehrliche Recherche kein weiteres `use`/`constituent`/`harvest` hergibt, bleibt die Pflanze shallow. Stand 2026-05-26: 181/223 = 81,2 % voll vertieft.

### Open work post-Codex-v1 (priority order)

- [ ] i18n.ts modularisieren (801 LoC → per-domain files)
- [ ] Replace validatePlant.ts internals with `plantSchema.parse()`
- [ ] Migrate consumers of types.ts to plantSchema.ts derived types
- [ ] @vite-pwa/astro → Workbox direkt (mittelfristig)
- [ ] Cloudflare Git-Integration (sobald GitHub-Repo da)
- [ ] @astrojs/check installieren
- [ ] Scraper-Bug (Thumbnail-Präfix)

---

# Historical v0.1 design (kept for project history)

> **v1.1 change:** original "v1 = 50 plants + 4 features" scope was decomposed into phased releases. v0.1 = Plant browser + filter only, 7 hand-curated plants. v0.2-v0.4 add Scraper, Map, Calendar. v0.5+ adds Quiz, PWA, PubMed. See `docs/superpowers/specs/2026-05-16-donum-dei-v0.1-design.md` for the v0.1 spec.

> **Project tagline:** *Donum Dei* (lat. "Gift of God") — an interactive learning database for medicinal and useful plants, blending botanical facts, scientific studies, and folk knowledge.

---

## 1. Project goal

Build a beautiful, interactive web application that lets users explore **medicinal and useful plants** (not only herbs — also trees, shrubs, wildflowers). Two main modes:

- **Learning mode** — browseable plant cards with photo, name (DE + Latin), description, properties, and an optional quiz/flashcard system to memorise plants.
- **Map + seasonal calendar mode** — interactive map of where plants grow in Europe, with a phenology view ("what's flowering now, what's harvestable").

Each plant entry combines multiple sources, clearly labelled:
- Botanical core (Wikipedia / Wikidata)
- Distribution (GBIF)
- Phenology (Wikipedia / Wikidata)
- Medical studies (PubMed)
- Classical herbal knowledge (public-domain authors: Hildegard von Bingen, Künzle, Madaus, etc.)
- Folk knowledge / farmers' wisdom (curated, always attributed)
- Images (Wikimedia Commons, CC-licensed)

Start size: **50 plants**. Architecture must scale to several hundred without rewrite.

---

## 2. Technical base

### 2.1 Platform

| Environment | Platform | Details |
|-------------|----------|---------|
| Development | macOS (Maikel's MacBook) | macOS 25.4 |
| Local run | `npm run dev` → `localhost:4321` | Astro dev server |
| Production (later) | TBD: Cloudflare Pages / Vercel / Netlify (static deploy) | Decision deferred — Astro works on all |

**Local-first**, deployable to a public URL later without code changes (Astro produces static HTML by default).

### 2.2 Programming language / stack

| Layer | Tech | Version | Purpose |
|-------|------|---------|---------|
| Framework | **Astro** | 4.x | Static site generator with "island" architecture |
| Interactive islands | **React** | 18.x | Quiz, map, calendar widgets |
| Language | **TypeScript** | 5.x | Type safety, modern webdev learning |
| Styling | **Tailwind CSS** | 3.x | Utility-first CSS for fast, consistent design |
| UI components | **shadcn/ui** | latest | Pre-built, beautiful, customisable components |
| Maps | **Leaflet** | 1.9.x | Free, no API key, with OpenStreetMap tiles |
| Data fetching scripts | **Node.js / TypeScript** | Node 20 LTS | Scrapers for Wikipedia, GBIF, PubMed |
| Local data | **JSON files + SQLite (later)** | — | Start with JSON; switch to SQLite if write-ops needed |

### 2.3 Dependencies

Package management via `package.json` (Node/npm ecosystem — this is not a Python project, so no `env.yaml`/`requirements.txt`).

**External APIs (all free, no key required):**

| System | Purpose | Access |
|--------|---------|--------|
| Wikipedia REST API | Plant articles, summaries | Public, no auth |
| Wikidata SPARQL | Structured plant data (family, habitat, distribution) | Public, no auth |
| Wikimedia Commons | Plant images (CC-licensed) | Public, no auth |
| GBIF Occurrence API | Distribution data (where plants grow) | Public, no auth |
| PubMed E-utilities | Medical study abstracts | Public, no auth, rate-limited |

**No paid services. No API keys to manage.**

---

## 3. Input / Output

### 3.1 Input (data sources)

| Source | Format | Description |
|--------|--------|-------------|
| Wikipedia API | JSON | Plant descriptions, taxonomic info, summaries |
| Wikidata SPARQL | JSON | Structured: scientific name, family, habitat, native range |
| GBIF API | JSON | Geo-coordinates of plant occurrences (for map) |
| PubMed API | XML/JSON | Study titles + abstracts referencing each plant |
| Wikimedia Commons | image files (JPG/PNG) | Plant photos with attribution metadata |
| Classical PD books | manual extraction by Claude | Quotes from Hildegard, Künzle, Madaus, etc. |
| Folk knowledge | manual curation by Claude | Snippets from forums/blogs with link + source label |

### 3.2 Output (what users see)

| Target | Format | Description |
|--------|--------|-------------|
| Web app pages | HTML (static, from Astro) | Plant cards, detail pages, quiz, map, calendar |
| URL per plant | `/plant/[slug]` | Shareable individual plant pages |
| Local data files | JSON in `src/data/plants/` | One file per plant, version-controlled |
| Image folder | `public/images/plants/` | Optimised plant images |

---

## 4. Users & interface

### 4.1 Who uses it

| User | Technical level | Frequency |
|------|-----------------|-----------|
| Maikel (owner) | Beginner-intermediate webdev | Personal use, learning + testing |
| (Later, optional) Friends/family | None | If Maikel decides to share, simple link access |
| (Even later, optional) Public | Mixed | Only if Maikel decides to go public — no decision needed now |

### 4.2 Interface requirements

- [x] Web interface (responsive — works on phone for outdoor use)
- [x] Mobile-first design (Tailwind breakpoints: phone → tablet → desktop)
- [ ] CLI (not needed)
- [ ] Native GUI (not needed)

### 4.3 Language of the user interface

**Bilingual with toggle:** User switches UI language between **DE** and **EN** via a toggle button (top-right header). Default language detected from browser, fallback DE.

| Element | Behaviour |
|---------|-----------|
| Menus / buttons | DE/EN — switches with toggle |
| Plant names — display format | `German Name / English Name (Latin name)` — always all three visible, Latin in italic parentheses. Example: `Brennnessel / Stinging Nettle (Urtica dioica)` |
| Plant descriptions | DE + EN (both stored per plant). Toggle shows active language. If one language is missing for a field, fallback to the other with a small badge "DE only" / "EN only". |
| Classical quotes (Hildegard, Madaus, etc.) | Original German preserved, optional English translation next to it |
| Folk knowledge entries | Original source language + translation when available |
| Error messages / system text | DE + EN translations |
| Code, comments, identifiers, file paths | English (only) — per AI-Vault rule |

**Technical:** Astro built-in i18n (`@astrojs/i18n` or `astro:i18n`) — URLs become `/de/plant/...` and `/en/plant/...`, toggle just swaps the prefix.

### 4.4 Communication with Claude

Maikel ↔ Claude communication continues in **German** (per CLAUDE.md user preference).

---

## 5. Timeframe & priority

| Aspect | Value |
|--------|-------|
| Urgency | **Low** — hobby project, no deadline |
| Deadline | None |
| First testable version | Open — Maikel decides pace |
| Working style | Iterative: Claude builds in steps, Maikel reviews + tests each, adjusts course |

---

## 6. Project-specific rules

### 6.1 Special requirements
- **Source attribution is mandatory.** Every fact in the database must carry a `source` field. Folk knowledge and study citations especially — no anonymous "Studies have shown..." text.
- **Public-domain only for direct quotes.** Hildegard, Künzle (d. 1945, PD since 2016 in DE), Madaus (d. 1942, PD since 2013). Modern authors are paraphrased + cited, never quoted directly.
- **CC-licensed images only.** Each image stores its license + author + URL in metadata.
- **No medical advice tone.** App is educational, not diagnostic. Disclaimer on every page footer: "Educational use only — not medical advice." (translated DE/EN)
- **Cool, modern look matters.** Maikel chose Astro+shadcn/ui specifically for aesthetics. Default design must look polished, not like a Streamlit app.
- **Bilingual DE/EN throughout.** Every plant entry stores both German and English versions of name/description/usage where available. Latin botanical name is always present. UI language toggle persists across navigation (stored in localStorage).

### 6.2 Constraints
- **No paid APIs** in v1.
- **No user accounts / login** in v1 (single-user, local).
- **No write operations from the UI** in v1 (data is read-only, edited via JSON files).
- **No secrets in the repository** (per AI-Vault P10 rule).

### 6.3 Connection to other projects
- Standalone — no dependencies on PERSEUS, AutoTrader, epay-tracker, or other AI-Vault projects.
- Lives in `75_Maikel/` (Maikel's personal area), not in `05_projects/`.

---

## 7. Folder structure

```
75_Maikel/Donum_Dei/
├── CLAUDE.md                  # Short project pointer for Claude Code
├── CONVENTIONS.md             # This file
├── SESSION_STATE.md           # Current state (overwritten on pause)
├── SESSION_LOG.md             # Append-only session log
├── TODO_Donum_Dei.md          # Project-specific TODOs
├── ACTIVE_TASK.md             # Crash-resilience tracker
├── DIALOG_LOG.md              # Crash-resilience dialog log
├── RESPONSE_COUNTER.txt       # Crash-resilience counter
├── README.md                  # Public-facing project description (for later)
├── package.json               # Node dependencies
├── astro.config.mjs           # Astro configuration
├── tailwind.config.mjs        # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── src/
│   ├── pages/                 # Astro pages (index, plant/[slug], quiz, map, calendar)
│   ├── components/            # React + Astro components
│   ├── data/
│   │   └── plants/            # JSON file per plant (50 to start)
│   ├── lib/                   # Helper utilities (data loaders, image utils)
│   └── styles/                # Global CSS
├── public/
│   ├── images/plants/         # Plant images (CC-licensed)
│   └── favicon.svg
├── scripts/
│   ├── fetch_wikipedia.ts     # Scraper: Wikipedia/Wikidata
│   ├── fetch_gbif.ts          # Scraper: GBIF distribution
│   ├── fetch_pubmed.ts        # Scraper: PubMed studies
│   ├── fetch_images.ts        # Scraper: Commons images
│   └── build_plant_data.ts    # Combines all sources into per-plant JSON
└── docs/
    ├── data_schema.md         # JSON schema definition for plant entries
    ├── plant_seed_list.md     # The 50 starter plants
    └── design_notes.md        # UX/visual decisions
```

---

## 8. Plant seeding strategy

**Alphabetical processing**, starting with the letter **A** and working downward through the alphabet (B, C, D, …). v1 target: roughly 50 plants, but no hard cap — Claude works through letters systematically and Maikel decides when to pause and ship a first version.

Workflow per letter:
1. Claude proposes a list of relevant medicinal/useful plants for the current letter (DE name + Latin name).
2. Maikel reviews + approves (can add/remove).
3. Claude runs the scrapers for that batch and generates the per-plant JSON files + downloads images.
4. Maikel can preview the result, then move to the next letter.

This keeps progress visible, reviewable, and pauseable at any letter boundary.

---

## 9. Open questions

| Nr | Question | Status | Answer |
|----|----------|--------|--------|
| 1 | Domain name for later public deploy | Open | Deferred — not needed until deployment decision |
| 2 | Hosting cost preference if public | Open | Deferred — free tier (Cloudflare/Vercel) likely sufficient |
| 3 | Mobile native app version? | Open | Not in v1 scope — PWA via Astro possible later |

---

## 10. Roles

| Role | Person | Responsibilities |
|------|--------|------------------|
| Owner / Product | Maikel (MG) | Direction, feedback, final say on design + content |
| Lead developer | Claude | Architecture, code, scrapers, scaffolding, data curation |
| Co-access (read/help) | Ali (AM) | Available for advice / review when needed |

---

## 11. Access (ACL)

| User | Permission | Notes |
|------|------------|-------|
| MG (Maikel) | Full (31) | Owner |
| AM (Ali) | Full (admin group) | Always has access |
| AI-Share group | Blocked (0) | Personal project — rest of team has no access |

ACL request will be written to `00_meta/acl_requests.json` (or local fallback) after Maikel's OK on these conventions.

---

## 12. Change history

| Date | Version | Change | By |
|------|---------|--------|-----|
| 2026-05-16 | 1.0 | Initial version | Claude (Opus 4.7) |
| 2026-05-16 | 1.1 | Scope cut to phased v0.1-v0.5; v0.1 spec written + built (7 plants, Cards+Filter); MG approved | Claude (Opus 4.7) + MG |

---

**End of document**
