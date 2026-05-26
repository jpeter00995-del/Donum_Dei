# TODO v1.0 — Donum Dei Selbstversorger-Planer

**Erstellt:** 2026-05-17
**Basis:** Brainstorming-Session 2026-05-17 mit Maikel
**Bisheriger Stand:** v0.8 (154 Pflanzen, Indoor-Bereich, Quiz, Filter) — siehe `SESSION_STATE.md`
**Diese Datei:** Phase 1 von 3-Phasen-Vision "Donum Dei wird zum Selbstversorger-Begleiter für DACH+SEE"

---

## 🎯 Vision v1.0

Donum Dei verwandelt sich von "Pflanzen-Lexikon" zu **"Wöchentlich genutzte Selbstversorger-App"** durch drei sich verstärkende Killer-Features:

1. **Personalisierter Garten-Plan** — Klimazone + Garten-Typ + Familiengröße → automatischer Pflanz-Vorschlag aus 154 Pflanzen-DB
2. **Aussaat-Kalender (Wochen-View)** — "diese Woche säen / pflanzen / ernten", basiert auf gewähltem Plan + Region
3. **Companion-Planting-Matrix** — Mischkultur-Wissen: was wächst gut zusammen, was nicht — integriert als Warnung im Plan

Ziel-Outcome: User öffnet App **mindestens 1× pro Woche** (statt 2× total wie bei Lexikon-Apps).

---

## 🔒 Constraints (HART)

- **KEIN Backend** — pure statische Astro-Site, alles via LocalStorage
- **KEINE KI-API** in v1.0 (keine laufenden Kosten, kein Vendor-Lock-in)
- **KEINE Accounts / Login** — Anonymität by Design
- **KEINE neuen paid APIs** — Cloudflare Pages free tier muss reichen
- **Bestehende Datenstruktur erweitern**, nicht ersetzen — alle 154 Pflanzen müssen weiter funktionieren
- **Bilingual DE/EN** für jeden neuen User-Facing Text
- **Mobile-first** (Hauptnutzung im Garten via Handy)
- **Tests grün halten** (aktuell 41/41) — pro neue Funktion ≥1 Test
- **P10:** Backup vor jeder größeren Änderung an bestehenden Files

---

## 🤖 Hinweise für ausführende Subagenten

- **Reihenfolge:** Tasks 1-3 müssen zuerst (Schema-Basis). Tasks 4-9, 10-13, 14-17 sind danach **parallel-fähig** (drei Subagenten gleichzeitig möglich).
- **Pro Task:** Akzeptanzkriterien sind Pflicht. Task ist erst "done" wenn alle Kriterien erfüllt + Tests grün + Build clean.
- **Bei Unklarheit:** STOPPEN und Maikel fragen — nicht raten.
- **Sprache:** Code/Identifier/Dateinamen Englisch, Code-Kommentare und User-Texte Deutsch+Englisch.
- **Commit-Style:** wie bisheriger Projekt-Standard (`v1.0: <kurze Beschreibung>`).
- **Output-Beleg:** jeder Task endet mit Test-Run-Output + Build-Status im Commit-Body.

---

## 📋 Tasks

### Phase 0 — Schema-Basis (Tasks 1-3, sequenziell)

#### Task 1 — Plant-Type erweitern: `garden_meta`
**Was:** Neues optionales Feld `garden_meta` zum Plant-Type hinzufügen.
**Struktur:**
```ts
garden_meta?: {
  climate_zones: string[];        // z.B. ["7a", "7b", "8a"] (USDA) — wo gedeiht die Pflanze
  sowing_window: {                // wann säen pro Methode
    indoor?: { start_month: number; end_month: number }; // 1-12
    outdoor_direct?: { start_month: number; end_month: number };
    transplant?: { start_month: number; end_month: number };
  };
  harvest_window: { start_month: number; end_month: number };
  days_to_harvest: number;        // Tage von Aussaat bis Ernte
  spacing_cm: number;             // Pflanzabstand
  garden_type: ('balcony' | 'raised_bed' | 'field' | 'greenhouse')[];
  difficulty: 1 | 2 | 3;          // 1=Anfänger, 3=Profi
}
```
**Files:** `src/types/Plant.ts` (oder wo der Plant-Type liegt)
**Akzeptanz:**
- [ ] TypeScript kompiliert ohne Fehler
- [ ] Bestehende 154 Pflanzen weiterhin valide (Feld ist `?`)
- [ ] JSDoc-Kommentar pro Feld auf Englisch
- [ ] Schema-Doc `docs/data_schema.md` aktualisiert

---

#### Task 2 — Validator + Tests für `garden_meta`
**Was:** Validator-Funktion + 5 neue Vitest-Tests.
**Files:** `src/lib/validatePlant.ts` (oder wo der Validator lebt), `src/lib/validatePlant.test.ts`
**Akzeptanz:**
- [ ] Validator wirft bei ungültigem Monat (z.B. 13) oder Klimazone-Format
- [ ] 5 neue Tests: valid full / valid minimal / invalid month / invalid zone / missing required when present
- [ ] Alle 41+5=46 Tests grün
- [ ] Build clean (`npm run build`)

---

#### Task 3 — Klimazonen-Datenstruktur DACH+SEE
**Was:** Statische Klimazone-Tabelle erstellen — USDA-Zonen mit deutschen/bulgarischen Vergleichswerten + Postleitzahl→Zone Mapping (vereinfacht).
**Files:** `src/data/climate_zones.json`, `src/lib/climateZone.ts`
**Akzeptanz:**
- [ ] JSON enthält USDA-Zonen 5a-9b (alle in DACH+SEE relevanten)
- [ ] Helper `zoneFromPostalCode(country, postal)` für DE/AT/CH/BG (mindestens grobe Auflösung auf Bundesland/Oblast-Ebene)
- [ ] Quellen-Attribution in Datei-Header (DWD, ARSO, NIMH)
- [ ] 3 Tests für Postleitzahl-Lookup (1× DE, 1× AT, 1× BG)

---

### Phase 1.1 — Garten-Plan (Tasks 4-9, parallel zu 1.2/1.3 möglich nach Phase 0)

#### Task 4 — Onboarding-Wizard React-Island
**Was:** 4-Step Wizard für Nutzer-Profil-Erfassung.
**Steps:** (1) Standort/PLZ → Klimazone-Auto-Detect mit Override, (2) Garten-Typ (Balkon/Hochbeet/Feld/Gewächshaus mit Quadratmeter-Angabe), (3) Familiengröße + "wie viel selbst versorgen?" (Slider: ergänzend/halb/voll), (4) Erfahrung (Anfänger/Fortgeschritten/Profi).
**Files:** `src/components/OnboardingWizard.tsx` (React, `client:load`), `src/pages/de/mein-garten/start.astro`, `src/pages/en/my-garden/start.astro`
**Akzeptanz:**
- [ ] Wizard bilingual DE+EN
- [ ] Progress-Bar oben (1/4, 2/4, ...)
- [ ] "Zurück" + "Weiter" Buttons mit Tastatur-Navigation (a11y)
- [ ] Speichert am Ende in LocalStorage unter Key `donumdei_user_profile_v1`
- [ ] Mobile-Layout getestet (375px Viewport)

---

#### Task 5 — LocalStorage-Schema + Helpers
**Was:** TypeScript-Schema für User-Profil + Save/Load/Reset-Helpers + Migration-Mechanismus für zukünftige Schema-Updates.
**Files:** `src/lib/userProfile.ts`, `src/lib/userProfile.test.ts`
**Schema:**
```ts
{
  schema_version: 1,
  created_at: ISO_string,
  zone: string,
  garden: { type, area_sqm },
  household_size: number,
  self_sufficiency_goal: 'supplementary' | 'half' | 'full',
  experience: 'beginner' | 'intermediate' | 'expert',
  custom_plan?: PlanOverrides
}
```
**Akzeptanz:**
- [ ] Helpers: `saveProfile`, `loadProfile`, `resetProfile`, `migrateProfile`
- [ ] 4 Tests (save/load roundtrip, default-on-empty, migration from v0→v1, corrupt-data fallback)
- [ ] Browser-getestet (LocalStorage tatsächlich gefüllt)

---

#### Task 6 — Empfehlungs-Algorithmus `generateGardenPlan()`
**Was:** Reine Funktion: Profile → Liste empfohlener Pflanzen mit Mengen.
**Logik:** Filter alle Pflanzen mit `garden_meta` → matche `climate_zones` mit User-Zone → matche `garden_type` → score nach `difficulty` vs User-Experience → wähle Top-N (abhängig von Garten-Größe und Selbstversorgungsgrad) → berechne Pflanz-Anzahl (Familiengröße × Empfehlungs-Faktor pro Pflanze, z.B. 4 Tomatenstöcke/Person).
**Files:** `src/lib/gardenPlan.ts`, `src/lib/gardenPlan.test.ts`
**Akzeptanz:**
- [ ] Pure Function (input → output, keine Side-Effects)
- [ ] 8 Tests: Anfänger-Balkon-1Person / Profi-Feld-5Personen / unbekannte Zone (Fallback) / leere DB (graceful) / etc.
- [ ] Output ist typisiertes Array `RecommendedPlant[]` mit `{ plant_slug, quantity, sowing_method, notes_de, notes_en }`
- [ ] Performance: 154 Pflanzen → Plan in <50ms

---

#### Task 7 — Garten-Plan-Page DE+EN
**Was:** Page die das Onboarding-Ergebnis als schöner Plan rendert.
**Layout:** Hero "Dein Plan für 2026" → Sortier-Kategorien (Gemüse / Kräuter / Heilpflanzen / Obst) → pro Pflanze Card mit Bild + Menge + "Mehr erfahren"-Link zur Detail-Page → Footer mit Aktionen (Bearbeiten / Neu generieren / Drucken).
**Files:** `src/pages/de/mein-garten/index.astro`, `src/pages/en/my-garden/index.astro`, `src/components/PlanCard.astro`
**Akzeptanz:**
- [ ] Bilingual, Nav-Link "Mein Garten" / "My Garden" in BaseLayout (6. Link)
- [ ] Bei fehlendem Profil → Redirect zu Onboarding
- [ ] Hover-Effekte, Cards-Grid responsive
- [ ] "Neu generieren"-Button zeigt Warnung "Du verlierst deine Anpassungen"
- [ ] Mobile-Layout getestet

---

#### Task 8 — PDF-Export (Browser-nativ)
**Was:** "Plan als PDF speichern"-Button → druckt eine clean-print-Stylesheet-Version via `window.print()`. Keine externen Libs.
**Files:** `src/styles/print.css`, Integration in Plan-Page
**Akzeptanz:**
- [ ] PDF-Output enthält: Plan-Titel, Datum, Pflanzen-Liste mit Mengen, Aussaat-Empfehlungen
- [ ] PDF-Output enthält NICHT: Nav, Cookie-Banner, Buttons
- [ ] Testet in Chrome, Firefox, Safari (zumindest visuell)
- [ ] A4-Format, lesbar gedruckt

---

#### Task 9 — Plan-Edit-Mode
**Was:** Nutzer kann generierten Plan anpassen — Pflanze entfernen, Menge ändern, Pflanze hinzufügen (aus DB-Picker). Änderungen in LocalStorage unter `custom_plan` gespeichert.
**Files:** `src/components/PlanEditor.tsx` (React, `client:load`), Integration in Plan-Page
**Akzeptanz:**
- [ ] "Bearbeiten"-Mode togglebar
- [ ] Add-Plant-Picker mit Search (alle 154 Pflanzen)
- [ ] Remove + Quantity-Adjust pro Card
- [ ] "Speichern" persistiert, "Abbrechen" verwirft
- [ ] 3 Tests für die Edit-Logik (Pure-Function-Anteil)

---

### Phase 1.2 — Aussaat-Kalender (Tasks 10-13, parallel zu 1.1/1.3 möglich)

#### Task 10 — Kalender-Engine
**Was:** Reine Funktion: User-Profil + aktuelle Woche → Liste der Aufgaben (säen/pflanzen/ernten) basierend auf Plan und `garden_meta.sowing_window/harvest_window` + Klimazone-Adjustment.
**Files:** `src/lib/calendarEngine.ts`, `src/lib/calendarEngine.test.ts`
**Akzeptanz:**
- [ ] Funktion `tasksForWeek(profile: UserProfile, plan: Plan, isoWeek: number, year: number): CalendarTask[]`
- [ ] CalendarTask hat `{ plant_slug, action: 'sow_indoor'|'sow_outdoor'|'transplant'|'harvest', urgency: 'this_week'|'next_2_weeks' }`
- [ ] Klimazone verschiebt Aussaat-Fenster (Zone 8 = 2 Wochen früher als Zone 6, vereinfachte Heuristik)
- [ ] 6 Tests (mid-summer, winter, edge-of-window, zone-shift, etc.)

---

#### Task 11 — Wochen-View Page DE+EN
**Was:** `/de/kalender` + `/en/calendar` — zeigt aktuelle KW + nächste 2 als Cards mit Aufgaben.
**Layout:** Header "Diese Woche im Garten (KW 21)" → drei Sektionen ("Säen / Pflanzen / Ernten") → pro Aufgabe Plant-Card-Mini mit Action-Verb + Link → unten "Nächste 2 Wochen Vorschau".
**Files:** `src/pages/de/kalender.astro`, `src/pages/en/calendar.astro`, `src/components/WeekView.tsx` (React-Island für Datums-Reaktivität)
**Akzeptanz:**
- [ ] Bilingual, Nav-Link integriert (7. Link)
- [ ] Bei fehlendem Plan → CTA "Erstelle erst deinen Plan"
- [ ] Aktuelle KW automatisch ermittelt (Sofia-TZ als Default)
- [ ] Mobile-Layout getestet

---

#### Task 12 — Monats-Heatmap
**Was:** 12-Monats-Übersicht als Grid: Pflanze × Monat, gefärbt nach Aktivität (gelb=säen, grün=wachsen, orange=ernten).
**Files:** `src/components/MonthHeatmap.tsx` (React-Island), Integration in Kalender-Page als zweiter Tab
**Akzeptanz:**
- [ ] SVG oder CSS-Grid (keine schwere Chart-Lib)
- [ ] Hover zeigt Tooltip mit Details
- [ ] Mobile: scrollbar horizontal, sticky Pflanzen-Spalte links
- [ ] Druckbar (kommt in PDF-Export aus Task 8 mit rein)

---

#### Task 13 — iCal-Export
**Was:** "In meinen Kalender exportieren"-Button → generiert `.ics` Datei mit allen geplanten Aussaat-/Ernte-Terminen.
**Files:** `src/lib/icalExport.ts`, `src/lib/icalExport.test.ts`
**Akzeptanz:**
- [ ] Standard RFC 5545 ics-Format
- [ ] Events mit Titel, Beschreibung, Datum (all-day), Reminder 1 Tag vorher
- [ ] In Google Calendar + Apple Calendar getestet (manuell)
- [ ] 2 Tests (basic event, escaping special chars)

---

### Phase 1.3 — Companion-Planting-Matrix (Tasks 14-17, parallel zu 1.1/1.2 möglich)

#### Task 14 — `companion_planting`-Daten zu Pflanzen ergänzen
**Was:** Neues Feld `companion_planting` zum Plant-Type. Manuell Daten pflegen für die ~50 Gemüse/Kräuter aus der DB.
**Struktur:**
```ts
companion_planting?: {
  good_partners: string[];     // Plant-Slugs
  bad_partners: string[];      // Plant-Slugs
  neutral?: string[];
  notes_de?: string;
  notes_en?: string;
  source: string;              // z.B. "Klassische Mischkultur-Tabelle (Hellwig 2018, gemeinfrei nach 70 Jahren)"
}
```
**Datenquelle:** Klassische deutsche Mischkultur-Tabellen (Hellwig, Bohlken — Public Domain wo möglich, sonst eigene Kuration).
**Files:** Schema-Erweiterung in Plant-Type + Validator-Update + ca. 50 Plant-JSONs updated
**Akzeptanz:**
- [ ] Mindestens 50 Pflanzen haben `companion_planting`-Feld
- [ ] Bidirektionale Konsistenz geprüft (wenn A.good_partners enthält B, muss B.good_partners A enthalten) — als separater Test
- [ ] Quellen für jede Beziehung dokumentiert
- [ ] Validator-Tests aktualisiert

---

#### Task 15 — Companion-Matrix-Page DE+EN
**Was:** `/de/mischkultur` + `/en/companion-planting` — interaktive Tabelle/Visualisierung.
**Layout:** Suchfeld oben → Klick auf Pflanze zeigt "Gute Nachbarn / Schlechte Nachbarn / Neutral" als 3 Spalten mit Cards.
**Files:** `src/pages/de/mischkultur.astro`, `src/pages/en/companion-planting.astro`, `src/components/CompanionExplorer.tsx`
**Akzeptanz:**
- [ ] Bilingual, Nav-Link integriert (8. Link)
- [ ] Search-Autocomplete für die ~50 Pflanzen
- [ ] Klick auf Partner-Card navigiert weiter
- [ ] Quellen-Hinweis pro Beziehung sichtbar
- [ ] Mobile-Layout

---

#### Task 16 — Konflikt-Warnung im Garten-Plan
**Was:** Wenn User in Plan-Edit-Mode zwei inkompatible Pflanzen hat, zeige rote Warnung mit Erklärung.
**Files:** Erweiterung von `PlanEditor.tsx` aus Task 9
**Akzeptanz:**
- [ ] Warnung erscheint live beim Hinzufügen
- [ ] Erklärung verlinkt zur Companion-Matrix-Page
- [ ] User kann Warnung ignorieren (Plan trotzdem speichern)
- [ ] 2 Tests für Konflikt-Detection-Logik

---

#### Task 17 — Mischkultur-Vorschläge im Plan
**Was:** Wenn User Pflanze X im Plan hat, zeige Card "💡 Diese Pflanzen passen gut dazu" mit Top-3 guten Partnern.
**Files:** Erweiterung der Plan-Page aus Task 7
**Akzeptanz:**
- [ ] Vorschläge nur wenn Pflanze in DB ein `companion_planting`-Feld hat
- [ ] "Hinzufügen"-Button erweitert direkt den Plan
- [ ] Maximal 3 Vorschläge pro Pflanze (sonst Overwhelm)

---

### Phase 1.4 — Polish + Launch (Tasks 18-22, sequenziell am Schluss)

#### Task 18 — Mobile-Audit aller neuen Pages
**Was:** Manuelle Durchsicht aller 4 neuen Pages auf 375px (iPhone SE) + 414px (Standard).
**Akzeptanz:**
- [ ] Keine horizontalen Scroll-Leisten
- [ ] Alle Touch-Targets ≥44px
- [ ] Schriftgrößen ≥14px
- [ ] Screenshots der 4 Pages auf 375px in `docs/screenshots/v1.0/`

---

#### Task 19 — Lighthouse-Audit
**Was:** `npx lighthouse` für alle neuen Pages, Mindest-Score 90/85/90/100 (Perf/A11y/BP/SEO).
**Akzeptanz:**
- [ ] Reports in `docs/lighthouse/v1.0/`
- [ ] Bei < Threshold: Issues fixen oder dokumentieren warum nicht möglich

---

#### Task 20 — Cloudflare Pages Deploy
**Was:** Erste Public-Deploy auf Cloudflare Pages (free tier). Custom Domain Setup wenn Maikel eine hat.
**Akzeptanz:**
- [ ] Build-Pipeline läuft (npm run build → dist/ → Cloudflare)
- [ ] Public URL erreichbar
- [ ] HTTPS aktiv
- [ ] 404-Page funktioniert
- [ ] Maikel bestätigt Live-Site

---

#### Task 21 — PWA install-prompt + Offline-Mode für Kalender
**Was:** Service-Worker so erweitern dass Kalender-Page komplett offline-fähig ist (im Garten meist kein Empfang).
**Akzeptanz:**
- [ ] Add-to-Homescreen-Prompt erscheint nach 2. Besuch
- [ ] Kalender-Page funktioniert offline (Service-Worker cached HTML+JS+Daten)
- [ ] Manuell auf iPhone + Android getestet

---

#### Task 22 — Launch-Page mit Feature-Übersicht
**Was:** Landing-Page für v1.0-Launch — erklärt 3 Killer-Features, hat CTA "Loslegen" zum Onboarding.
**Akzeptanz:**
- [ ] Hero mit Tagline DE+EN
- [ ] 3 Feature-Cards mit Screenshot + Beschreibung
- [ ] Footer mit Links (Datenschutz, Impressum-Platzhalter, GitHub)
- [ ] Mobile-Layout

---

## 📦 Optional v1.0.x (nach Launch, wenn Lust)

- **Saatgut-Bezugsquellen** — Affiliate-Links zu Bingenheimer, Demeter, Bio-Saatgut.de pro Pflanze (Einnahmequelle ohne Backend-Aufwand)
- **Plan-Sharing** — "Plan als Link teilen" via URL-Parameter (kein Server, alles in URL kodiert)
- **Print-optimierte Kalender-Wochenkarte** — A6-Format zum Aufhängen im Schuppen

---

## 🔄 Nach v1.0 (Verweis auf Vision)

- **v2.0:** Ernte-zu-Rezept-Modul (nutzt bestehende Heilpflanzen-DB)
- **v3.0:** Tagebuch + Push-Erinnerungen (braucht Backend — Architektur-Entscheidung dann fällig)
- **v3.1:** Pflanzen-Diagnose via Foto (braucht KI-API, abhängig von Markt-Reife)

---

## 📊 Fortschritt-Tracking

Bitte pro abgeschlossenem Task abhaken und Git-Commit-SHA notieren.

| Task | Status | Commit | Bemerkung |
|------|--------|--------|-----------|
| 1 | ✅ | `18786ab` | Plant-Type um `garden_meta` erweitert (2026-05-17, Subagent 96s) |
| 2 | ✅ | `3dd0cf2` | Validator + 5 Tests, Jahres-Wrap erlaubt (2026-05-17, Subagent 54s) |
| 3 | ✅ | `f282476` | 10 USDA-Zonen + PLZ-Lookup DE/AT/CH/BG + 12 Tests (2026-05-17, Subagent 95s) |
| 4 | ✅ | `e9ec1ab` | OnboardingWizard + Start-Pages DE/EN (2026-05-17 Welle A, Subagent 1) |
| 5 | ✅ | `0b8c4d1` | userProfile.ts + 10 Tests (save/load/reset/migrate/corrupt/future-version) |
| 6 | ✅ | `39f5b4b` | gardenPlan.ts Empfehlungs-Engine + 9 Tests, Perf <50ms |
| 7 | ✅ | `96ce699` | Mein-Garten Pages DE/EN + 3 Nav-Links (Mein Garten/Kalender/Mischkultur) + PlanCard |
| 8 | ✅ | `54e8470` | print.css + window.print() Browser-natives PDF |
| 9 | ✅ | `5e053e0` | PlanEditor (Add/Remove/Quantity) + 6 Tests |
| 10 | ✅ | `a3a3584` | calendarEngine.ts mit Zone-Shift-Heuristik + 12 Tests (Welle A, Subagent 2) |
| 11 | ✅ | `5e3adbd` | WeekView React-Island + Kalender-Pages DE/EN mit Tab-Switch |
| 12 | ✅ | `397ee59` | MonthHeatmap React-Island (12-Monats-Grid) |
| 13 | ✅ | `ea3382a` | iCal Export (.ics) mit VALARM-Reminder + 6 Tests |
| 14 | ✅ | `616c46c` | companion_planting für 37 Pflanzen + Validator + Bidirektional-Test (Welle A, Subagent 3) |
| 15 | ✅ | `246dd4a` | Mischkultur-Matrix-Page DE/EN mit CompanionExplorer-Island |
| 16 | ✅ | `ad5e162` | Companion-Konflikt-Detection + Warnung-Card in PlanEditor (Welle B, Subagent 4) |
| 17 | ✅ | `09eceeb` | Companion-Suggestion-Cards in PlanView mit "+Hinzufügen"-Button |
| **+Welle C.1** | ✅ | `294c38c` | **BONUS** — garden_meta-Backfill für 37 existierende Garten-Pflanzen |
| **+Welle C.2** | ✅ | `c6052cc` | **BONUS** — 32 neue Gemüse-Plants (Tomate, Kartoffel, Karotte, Kohl-Familie etc.) mit CC-Bildern |
| **+Welle C.3** | ✅ | `b5a888d` | **BONUS** — Companion-Matrix-Erweiterung (Three Sisters + 100+ Bauernregel-Allianzen) |
| 18 | ☐ | - | Phase 1.4 — Mobile-Audit (pending) |
| 19 | ☐ | - | |
| 20 | ☐ | - | |
| 21 | ☐ | - | |
| 22 | ☐ | - | |

---

**End of TODO v1.0**
