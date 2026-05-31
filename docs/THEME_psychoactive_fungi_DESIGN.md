# Design-Doc — Themen-Erweiterung: Drogen-/Rauschpflanzen + Pilze

**Status:** Fundament gebaut (v1.10.60), Content-Welle ausstehend
**Owner:** MG · **Erstellt:** 2026-05-31 (Session 17)
**Scope-Entscheidung MG:** Voller Scope inkl. Rauschpflanzen (Cannabis, Schlafmohn,
psychoaktive Pilze) — mit Länder-Legalitäts-Disclaimer pro Profil.

---

## 1. Leitplanken (Projekt-Regeln)

- **Edukativ/dokumentarisch, KEIN Konsum-Guide, keine Rechts-/Medizinberatung.** Ton wie im Rest der DB.
- **Jeder Fakt quellenbelegt** (`source_ids` → `sources[]`); keine erfundenen Pharma-/Rechtsdaten.
- **Bilingual DE/EN**, lateinische Namen kursiv in Klammern.
- **Bilder nur CC/Public-Domain von Wikimedia Commons** mit Attribution; 1000px-Full + 700px-Thumb (`thumbs/`).
- **Disclaimer auf jeder Seite** (bestehend) + **zusätzlicher Rechts-Hinweis** für kontrollierte Arten.

## 2. Schema (gebaut, v1.10.60 — rückwärtskompatibel)

Erweiterungen in `src/lib/types.ts` + `src/lib/plantSchema.ts` + manuelle Checks in `validatePlant.ts`:

```ts
kingdom?: 'plant' | 'fungus'            // fehlt → 'plant'; 'fungus' = Pilze (keine Garten-/Mischkultur-Felder)
legal_status?: {
  controlled: boolean                   // true → LegalStatusNotice wird gerendert
  summary: { de, en }                   // Kurz-Einordnung
  note?: { de, en }                     // optionaler Pro-Land-/Detail-Hinweis
  source_ids?: string[]                 // müssen in sources[] existieren (validiert)
}
```

- Beide Felder **optional + additiv** → alle 223 bestehenden Einträge bleiben gültig (Tests grün).
- `legal_status.source_ids` wird gegen `sources[]` gecheckt (Zod superRefine + validatePlant).

## 3. UI (gebaut + offen)

- **Gebaut:** `LegalStatusNotice.astro` — prominenter lila Rechts-Hinweis-Block auf der Detail-Seite
  (neben/unter der Toxicity-Warnung), rendert nur bei `legal_status.controlled`. Statischer Disclaimer-Satz
  + `summary` + optional `note`.
- **Offen (mit Content):**
  - Filter-/Kategorie-Tag „Pilze" und „Giftig/Rausch" — erst sinnvoll, wenn Daten existieren.
    Umsetzung dann: kingdom-Filter im FilterBar-Grid ODER eigene Übersichts-Seiten `/de/pilze`, `/de/giftpflanzen`.
  - Pilze: Garten-Tabs (Mischkultur/Beet/Aussaat) ausblenden, wenn `kingdom === 'fungus'`.
  - ToxicityBadge greift für Giftpflanzen bereits (`safety.toxicity_level`).

## 4. Content-Welle (ausstehend — Sourcing-Pipeline wie bisherige Wellen)

Vollständige Tiefen-Profile via Brief-Template (`docs/AGENT_BRIEF_TEMPLATE.md`) + Audit-Pass.
**Reihenfolge nach Sensibilität (unkritisch → heikel):**

1. **Heilpilze** (`kingdom: fungus`, kein legal_status): Reishi (*Ganoderma lingzhi*), Chaga (*Inonotus obliquus*),
   Löwenmähne/Igelstachelbart (*Hericium erinaceus*), Schmetterlingstramete (*Trametes versicolor*), Shiitake (*Lentinula edodes*).
2. **Klassische Gift-/Hexenpflanzen** (`safety.toxicity_level: toxic`, ggf. legal_status): Stechapfel (*Datura stramonium*),
   Tollkirsche (*Atropa belladonna*), Bilsenkraut (*Hyoscyamus niger*), Engelstrompete (*Brugmansia*), Eisenhut (*Aconitum* — teils vorhanden).
3. **Rausch-/Drogenpflanzen** (`legal_status.controlled: true` + `note` pro Land): Cannabis (*Cannabis sativa*),
   Schlafmohn (*Papaver somniferum*); ggf. Kokastrauch, Khat.
4. **Psychoaktive Pilze** (`kingdom: fungus`, `legal_status.controlled: true`): *Psilocybe*-Arten, Fliegenpilz (*Amanita muscaria*).

Pro Profil Pflicht: botanik + Geschichte + Wirkstoffe (constituents) + Toxizität (safety) + sources[] + CC-Bild.
Bei 3.+4. zusätzlich `legal_status` mit länder-neutralem `summary` + `note` + Rechts-Quelle.

## 5. Offene Entscheidungen für die Welle
- Eigene Filter-Kategorie vs. eigene Themen-Seiten? (UI-Frage, mit erstem Content entscheiden.)
- Wie viele Arten pro Batch? (bisherige Wellen: 4–14, parallel via Sub-Agenten.)
- `note`-Granularität: nur „je nach Land unterschiedlich" vs. konkrete Beispiel-Länder (DE/BG/US)?
