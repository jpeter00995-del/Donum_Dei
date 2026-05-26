# TODO — Donum Dei

Project-specific TODOs. Cross-project items go to `Claude/_TODO.md`.

---

## 🚀 AKTIVER FOKUS: v1.0 Selbstversorger-Planer

**Ab 2026-05-17** läuft die Vision-Erweiterung "Donum Dei wird Selbstversorger-App".
Vollständige atomare Task-Liste (22 Tasks, subagent-freundlich):
→ **[`TODO_v1.0_selbstversorger.md`](./TODO_v1.0_selbstversorger.md)**

Drei Killer-Features:
1. Personalisierter Garten-Plan (Klimazone + Garten-Typ → Pflanz-Vorschlag)
2. Aussaat-Kalender (Wochen-View + iCal-Export)
3. Companion-Planting-Matrix (Mischkultur-Wissen)

Tech-Constraint: kein Backend, kein KI-API, kein Login. Cloudflare Pages deploybar.

---

## 🔥 Bisheriges (Pre-v1.0) — Nach v0.1 Ship

- [ ] **Maikel reviewt v0.1 live** — `npm run dev` und im Browser anschauen
- [ ] Auf Handy testen (responsive)
- [ ] Inhalte der 7 Pflanzen reviewen — alles korrekt? Was ändern?
- [ ] Entscheidung: jetzt Public-Deploy (Cloudflare/Vercel) oder erst v0.2?

---

## ✏️ v0.3 — Content-Curation Pass für 50 Stub-Pflanzen

Die 50 v0.2-Pflanzen haben Wikipedia-basierte Beschreibungen + 1 Standard-Verwendung. Curation hebt sie auf v0.1-Qualität:

- [ ] Für jede der 50: 2-3 spezifische Verwendungen statt 1 generische
- [ ] Für jede: 1 klassisches PD-Zitat (Hildegard/Künzle/Madaus/Thomé), wo passend
- [ ] Bildqualität review: einige sind botanische Illustrationen (Köhler/Thomé) — wo es bessere Fotos auf Commons gibt, ersetzen
- [ ] Stichproben-Faktenprüfung mit deutscher Apotheker-Standardliteratur

---

## 🗺️ v0.4 — Karten-Erweiterung (Basis-Map jetzt in v0.3 erledigt)

- [ ] Optional: Übersichtskarte mit allen 57 Pflanzen (eigene Page `/de/karte/`)
- [ ] Karten-Region-Filter ("zeige nur Pflanzen mit Vorkommen in dieser Region")
- [ ] Cluster-Marker für viele Punkte (besser lesbar)
- [ ] Mobile-Touch-Optimierung review (pinch-zoom, etc.)

---

## 📅 v0.5 — Saisonkalender (war v0.4)

- [ ] Phenology-Daten-Source
- [ ] Jahreskreis-Komponente
- [ ] "Jetzt aktiv"-Filter
- [ ] Bloom-Time vs. Harvest-Time Layer

---

## 🎓 v0.6+ — Quiz, PWA, Wissenschaft (war v0.5+)

- [x] Quiz-Modus "Erkenne am Foto" — done 2026-05-18 (v1.10.2 mit Runden 5/10/20 + Auswertung + Bewertungsstufen)
- [ ] Quiz-Modus "Welche Pflanze hilft bei X?"
- [x] Score-Tracking (localStorage) — done 2026-05-18 (v1.10.2 per-Länge Bestwert + Statistik)
- [ ] PWA-Manifest + Service-Worker (Offline-Nutzung)
- [ ] PubMed-Studien-Integration

---

## 🚀 Pre-Public-Launch (wenn v0.2-v0.4 stabil)

- [ ] Performance-Check (Lighthouse)
- [ ] SEO-Meta-Tags pro Pflanze
- [ ] sitemap.xml final
- [ ] robots.txt
- [ ] Domain entscheiden
- [ ] Hosting-Anbieter wählen
- [ ] Deploy-Anleitung in `docs/deploy.md`

---

## 💡 Backlog (v2+)

- [ ] Mehr Sprachen (FR/ES/BG?)
- [ ] Foto-Upload mit KI-Erkennung
- [ ] User-Notizen / Favoriten (würde Backend brauchen)
- [ ] Push-Notification "Jetzt erntereif"
- [ ] Rezepte-Sektion (Tee/Tinktur/Salbe-Anleitungen)
- [ ] Crowd-sourced contributions (Pull-Request-style)

---

## ✅ Erledigt

### v0.8 (2026-05-17) — Indoor-Growing-Bereich (Phase 1 + 2)
- [x] **brainstorming**: Schema + Page-Layout + Plant-Liste + erweiterte Kat. 2 (Mückenabwehr/Befeuchter/Nacht-O2)
- [x] Spec geschrieben + Self-Review (350 Zeilen): `docs/superpowers/specs/2026-05-17-donum-dei-v0.8-indoor-growing-design.md`
- [x] **writing-plans**: 13-Task Implementation-Plan (2061 Zeilen, 2 Phasen)
- [x] **subagent-driven-development**: alle 13 Tasks via Subagent-Pattern (Haiku/Sonnet model-mix)
- [x] Schema: `IndoorGrowing` Type (Plant.indoor_growing optional) + Validator + 9 Tests
- [x] 28 neue Indoor-Pflanzen gescraped (12 heil/küche + 8 luftreiniger + 4 mückenabwehr + 3 befeuchter + 1 nacht-O2)
- [x] `seed_indoor_growing.py` mit 46 indoor_growing-Blocks (28 neu + 18 retrofits)
- [x] i18n-Strings für Indoor-Bereich (DE+EN, 62 Keys)
- [x] `loadIndoorPlants()` Helper (filter+sort by difficulty) + 2 Tests
- [x] PlantDetail.astro "🪴 Zuhause anbauen"-Sektion (Pflege-Karte + Tipps + Disclaimer)
- [x] `/de/zuhause-anbauen` + `/en/grow-at-home` Pages mit IndoorCards-Grid
- [x] Nav-Link "Zuhause" / "Home" in BaseLayout (5. Link)
- [x] `quizMatch.ts` Algorithmus (room=3pt, light=2pt, water=2pt, difficulty-Bonus) + 4 Tests
- [x] `IndoorQuiz.tsx` React-Island (3 Fragen, Top-5-Ergebnisse)
- [x] `IndoorFilterBar.tsx` React-Island (Raum-Toggle, Purpose-Multi-Select, Pet-Safe-Checkbox) + 1 Test
- [x] **154 Pflanzen total, 46 indoor-tagged, 319 statische Seiten, 41/41 Tests grün**
- [x] **Git tags v0.8.0-phase1 + v0.8.0**

### v0.7 (2026-05-17) — +34 Pflanzen (Heilbäume + Vergessene + Küche/Gewürze)
- [x] 10 Heilbäume Europa (Esche, Buche, Fichte, Eberesche, Kornelkirsche, Hainbuche, Edelkastanie, Espe, Sommerlinde, Feldulme)
- [x] 12 Vergessene Heilpflanzen (Beinwell, Bingelkraut, Blutweiderich, Hauhechel, Hauswurz, Küchenschelle, Lungenkraut, Maiglöckchen, Schlangen-Knöterich, Kl. Immergrün, Fieberklee, Schneerose)
- [x] 12 Küchenkräuter & Gewürze (Dill, Ingwer, Kurkuma, Zimt, Bohnenkraut, Grüne Minze, Vanille, Gewürznelke, Kreuzkümmel, Lorbeer, Estragon, Rosengeranie)
- [x] Validator-Fix: decoction→tea (3×), external→salve (5×), 3× fallback source_urls
- [x] 125/126 plants mit GBIF; 25 neue mit BG-Daten; Bilder von 38MB → 16MB (sips)
- [x] **126 Pflanzen total, 261 Seiten, Tests grün**
- [x] Git tag v0.7.0

### v0.3 (2026-05-16, gleiche Session) — Leaflet-Karten mit GBIF
- [x] GBIF-Scraper (`scripts/scrape_occurrences.py`) — Taxonomie + Occurrences, Europe-Bbox
- [x] 56/57 Pflanzen mit GBIF-Verbreitungsdaten (max 300 Punkte/Pflanze)
- [x] Leaflet 1.9 + OpenStreetMap-Tiles (kein API-Key)
- [x] PlantMap-Komponente (vanilla Leaflet via React, `client:only`)
- [x] In PlantDetail eingebaut, lädt nur wenn Daten vorhanden
- [x] **Tag v0.3.0**

### v0.2 (2026-05-16, gleiche Session wie v0.1)
- [x] Python-Scraper (`scripts/scrape_plants.py`) — Wikipedia DE+EN, Commons API, parallel
- [x] 50 weitere Heilpflanzen (B-Z) gescraped: Bilder, Lizenzen, Autoren, Beschreibungen, Quellen
- [x] Plant-spezifische Sicherheitswarnungen (Holunder roh giftig, Johanniskraut-Wechselwirkungen, Salix-Aspirin, ...)
- [x] Bilder optimiert (99MB → 34MB, max 1600px)
- [x] **57 Pflanzen total, 117 statische Seiten, build clean**
- [x] Git tag v0.2.0

### v0.1 (2026-05-16)
- [x] Projekt-Setup (CONVENTIONS, SESSION_STATE, alle Standard-Files)
- [x] Superpowers Plugin installiert (v5.1.0)
- [x] REFLECTION zur Scope-Critique geschrieben
- [x] **brainstorming**: v0.1-Scope-Cut (Cards + Filter, 7 Pflanzen, Mock-First)
- [x] **writing-plans**: 24-Task Implementation-Plan
- [x] git init + .gitignore
- [x] Astro 6 + React 19 + Tailwind v4 + Sitemap + i18n DE/EN scaffold
- [x] Vitest + 25 Unit Tests (Validator, i18n, Loader, Filter)
- [x] TypeScript types + JSON-Schema (`docs/data_schema.md`)
- [x] 7 Pflanzen-JSONs hand-curated (Equisetum, Achillea, Inula, Marrubium, Pimpinella, Arnica, Euphrasia)
- [x] 7 CC-Bilder von Commons + Attribution
- [x] BaseLayout + 5 Komponenten (Disclaimer, LanguageToggle, FilterBar, SourceList, PlantDetail)
- [x] Landing-Pages DE+EN + Detail-Pages [slug] DE+EN + root-Redirect
- [x] Build verifiziert: 17 statische HTML-Seiten in `dist/`
- [x] CONVENTIONS bumped auf v1.1
- [x] Git tag v0.1.0
