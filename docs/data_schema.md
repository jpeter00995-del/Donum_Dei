# Plant Data Schema (v0.1)

Each plant lives in `src/data/plants/<slug>.json`. The slug is the lowercase, hyphenated Latin botanical name (e.g. `equisetum-arvense`).

## Top-level structure

```json
{
  "slug": "equisetum-arvense",
  "names": { "de": "...", "en": "...", "latin": "..." },
  "family": { "de": "...", "en": "...", "latin": "..." },
  "description": { "de": "...", "en": "..." },
  "teaser": { "de": "...", "en": "..." },
  "uses": [ /* see below */ ],
  "season": { /* see below */ },
  "safety": { /* see below */ },
  "classical_quotes": [ /* see below */ ],
  "sources": [ /* see below */ ],
  "image": { /* see below */ }
}
```

## Field details

### `slug` (string, required)
Lowercase Latin name, hyphenated. Stable across languages.

### `names` (object, required)
Names in DE, EN, and Latin. Latin always present.

### `family` (object, required)
Botanical family in DE, EN, Latin.

### `description` (object, required)
Long-form description, both languages. 2-4 sentences. Botanical + cultural/medicinal context.

### `teaser` (object, required)
One short sentence (~80 chars) for the plant card. Both languages.

### `uses` (array, required, ≥ 1 entry)
Each entry:
```json
{
  "form": "tea" | "tincture" | "salve" | "bath" | "raw" | "spice",
  "target": ["digestion", "respiratory", "skin", "urinary", ...],
  "internal_external": "internal" | "external" | "both",
  "description": { "de": "...", "en": "..." },
  "source_ids": ["src_1", "src_2"]
}
```
`form` maps to filter values. `target` is free-tag.

### `season` (object, required)
```json
{
  "active_months": [4, 5, 6, 7, 8],
  "harvest_part": { "de": "junge Triebe", "en": "young shoots" }
}
```
`active_months` = month numbers (1-12) when the plant is gathered or active. Used to derive filter season tags:
- Frühling/Spring = months 3, 4, 5
- Sommer/Summer = months 6, 7, 8
- Herbst/Autumn = months 9, 10, 11
- Winter = months 12, 1, 2

A plant is "in season X" if `active_months` overlaps that season's months.

### `safety` (object, required)
```json
{
  "warnings": { "de": "...", "en": "..." },
  "external_only": false
}
```
`external_only: true` means the plant must not be ingested (e.g. Arnika). Important UI badge.

### `classical_quotes` (array, optional, can be empty)
Each entry:
```json
{
  "author": "Künzle",
  "year": 1911,
  "license": "PD",
  "text_de": "...",
  "text_en": "..."
}
```
`text_en` may be `null` if no translation available. Only public-domain authors (Hildegard, Künzle, Madaus, etc.).

### `sources` (array, required, ≥ 1 entry)
Each entry:
```json
{
  "id": "src_1",
  "type": "wikipedia" | "wikidata" | "book" | "commons",
  "title": "...",
  "url": "https://...",
  "accessed": "2026-05-16"
}
```
`id` is referenced by `uses[].source_ids` for fact-level attribution.

### `image` (object, required)
```json
{
  "filename": "equisetum-arvense.jpg",
  "alt": { "de": "...", "en": "..." },
  "license": "CC BY-SA 4.0",
  "author": "Photographer name",
  "source_url": "https://commons.wikimedia.org/wiki/File:..."
}
```
The image file lives in `public/images/plants/<filename>`.

### `garden_meta` (object, optional — v1.0)

Garden-planning metadata for the v1.0 Selbstversorger features
(climate-zone matching, sowing/harvest calendar, companion planting).
Optional — existing plant JSON files without this field stay valid.

(Garten-Planungs-Metadaten; optional, damit bestehende Pflanzen-JSONs gültig bleiben.)

```json
{
  "garden_meta": {
    "climate_zones": ["7a", "7b", "8a"],
    "sowing_window": {
      "indoor": { "start_month": 3, "end_month": 4 },
      "outdoor_direct": { "start_month": 5, "end_month": 6 },
      "transplant": { "start_month": 5, "end_month": 6 }
    },
    "harvest_window": { "start_month": 7, "end_month": 10 },
    "days_to_harvest": 70,
    "spacing_cm": 40,
    "garden_type": ["raised_bed", "field", "greenhouse"],
    "difficulty": 1
  }
}
```

Fields:

- `climate_zones` (string[], required) — USDA hardiness zones where the
  plant thrives, e.g. `"7a"`, `"7b"`. Format: digits 1-13 followed by an
  optional `a` or `b` sub-zone.
- `sowing_window` (object, required) — at least one sub-window should be
  populated; all sub-fields are individually optional:
  - `indoor` (`{ start_month, end_month }`) — indoor pre-sowing window.
  - `outdoor_direct` (`{ start_month, end_month }`) — direct outdoor sowing.
  - `transplant` (`{ start_month, end_month }`) — moving seedlings out.
  Months are integers 1-12. If a window wraps the year boundary,
  `start_month` may be greater than `end_month` (e.g. `11 → 2` = Nov-Feb).
- `harvest_window` (`{ start_month, end_month }`, required) — months in
  which the plant is typically harvested from a garden-planner perspective.
  Distinct from `season.active_months` (which describes general wild /
  medicinal availability).
- `days_to_harvest` (number, required) — days from sowing to first harvest
  under typical conditions.
- `spacing_cm` (number, required) — recommended plant spacing in
  centimetres (centre-to-centre).
- `garden_type` (string[], required, ≥ 1) — one or more of `"balcony"`,
  `"raised_bed"`, `"field"`, `"greenhouse"`.
- `difficulty` (number, required) — `1` (beginner), `2` (intermediate) or
  `3` (expert).

### `companion_planting` (object, optional — v1.0)

Companion-planting relationships for the v1.0 Selbstversorger mixed-culture
matrix (`/de/mischkultur`, `/en/companion-planting`). Optional — only vegetables
and culinary herbs in the database carry this field; trees and pure
medicinal/woodland plants without a garden context do not.

(Mischkultur-Beziehungen für die v1.0-Companion-Matrix. Optional und nur für
Gemüse/Kräuter mit Garten-Kontext gepflegt.)

```json
{
  "companion_planting": {
    "good_partners": ["allium-sativum", "calendula-officinalis"],
    "bad_partners": ["foeniculum-vulgare"],
    "neutral": ["artemisia-dracunculus"],
    "reasons": {
      "allium-sativum": {
        "de": "Knoblauch hält Tomaten-Schädlinge fern.",
        "en": "Garlic deters tomato pests."
      },
      "foeniculum-vulgare": {
        "de": "Fenchel hemmt Tomaten-Wachstum stark.",
        "en": "Fennel strongly inhibits tomato growth."
      }
    },
    "notes_de": "allium-sativum: Basilikum unterstützt Knoblauch-Wachstum...",
    "notes_en": "allium-sativum: Basil supports garlic growth...",
    "source": "Helga und Margarete Langerhorst, Mein gesunder Naturgarten (eigene Kuration)"
  }
}
```

Fields:

- `good_partners` (string[], required) — plant slugs that benefit each other
  (growth, yield, pest resistance). May be empty.
- `bad_partners` (string[], required) — plant slugs that harm each other
  through allelopathy, nutrient competition, shared pests, or cross-
  pollination. May be empty.
- `neutral` (string[], optional) — plant slugs explicitly documented as
  neutral (neither benefit nor harm).
- `reasons` (object, optional — v1.0 Welle E.1) — short per-relationship
  reasons keyed by partner slug. Each value is `{ "de": string, "en": string }`
  (both required, both non-empty). One line each, didactic, no marketing
  language. UI falls back to a generic "classic companion" string when a
  partner has no entry. Reason texts are written from THIS plant's
  perspective and may differ from the partner's reverse entry.
- `notes_de` / `notes_en` (string, optional) — free-form bilingual notes
  describing the relationships. Generated from a single source-of-truth matrix
  by `scripts/apply_companion_planting.mjs`.
- `source` (string, required) — citation for the relationship table. Sources
  used:
  - `Klassische Mischkultur-Tradition (Three Sisters, Bauernregel)`
  - `Helga und Margarete Langerhorst, Mein gesunder Naturgarten (eigene Kuration)`
  - `Gertrud Franck, Gesunder Garten durch Mischkultur (1980, eigene Kuration)`
  - `Sepp Holzer, Sepp Holzers Permakultur (2004, eigene Kuration)`
  - `Bill Mollison, Permaculture: A Designers' Manual (1988, eigene Kuration)`
  - `Toby Hemenway, Gaia's Garden (2009, eigene Kuration)`

**Bidirectional invariant:** if plant A lists plant B in `good_partners`,
then plant B must list plant A in `good_partners`. Same for `bad_partners`.
Enforced by a cross-file test in `src/lib/validatePlant.test.ts`
(`companion_planting bidirectional consistency`). Maintain pairs through
`scripts/apply_companion_planting.mjs` to guarantee consistency by
construction. The same script also keeps `reasons` entries on both sides
of each pair (different perspectives → different reason texts allowed).

(Bidirektionale Invariante: jede Beziehung muss in BEIDEN Pflanzen-JSONs
gepflegt sein; das Apply-Skript garantiert das per Konstruktion. Reasons
ebenfalls bidirektional gepflegt — jede Seite mit eigener Perspektive.)

### `permaculture_functions` (string[], optional — v1.0 Welle E.1)

Permaculture functions a plant fulfils within a mixed-culture bed.
Inspired by Sepp Holzer, Bill Mollison and Toby Hemenway tradition
(paraphrased, no direct quotes). Used by the UI to badge plants and by
the planner to compose ecologically balanced beds.

(Permakultur-Funktionen, die die Pflanze in einer Mischkultur erfüllt;
inspiriert von Holzer/Mollison/Hemenway, paraphrasiert.)

```json
{
  "permaculture_functions": ["nitrogen_fixer", "pollinator_attractor", "edible_flower"]
}
```

Allowed values:

| Value | Meaning (DE) | Meaning (EN) |
|---|---|---|
| `nitrogen_fixer` | Stickstoff-Fixierer (Hülsenfrüchte) | Fixes atmospheric N₂ (legumes) |
| `pest_repellent` | Schädlings-Abwehr (Knoblauch, Tagetes) | Actively deters pests |
| `ground_cover` | Bodendecker (Kürbis, Erdbeere) | Dense low foliage shading soil |
| `pollinator_attractor` | Bestäuber-Magnet (Borretsch, Lavendel) | Attracts bees/butterflies |
| `root_loosener` | Wurzel-Lockerer / Tiefwurzler (Karotte) | Deep tap root loosens soil |
| `dynamic_accumulator` | Nährstoff-Sammler (Beinwell, Brennnessel) | Mines deep nutrients (mulch) |
| `vertical_high` | Hohe Schicht (Mais, Sonnenblume) | Tall vertical layer |
| `vertical_mid` | Mittlere Schicht (Tomate, Paprika) | Mid-height vertical layer |
| `vertical_low` | Niedrige Schicht (Salat, Erdbeere) | Low / ground-level layer |
| `shade_provider` | Schattenspender | Provides shade for neighbours |
| `aromatic_repellent` | Aromatische Abwehr (Basilikum, Rosmarin) | Aromatic foliage masks crops |
| `edible_flower` | Essbare Blüte (Borretsch, Kapuzinerkresse) | Edible flowers |
| `medicinal` | Heilpflanze (Doppelnutzung) | Medicinal use beyond culinary |
| `microclimate` | Mikroklima (Windschutz, Feuchte) | Modifies microclimate |

Rules:
- Optional and additive — existing JSONs without this field stay valid.
- If present, the array must be non-empty and contain only known values
  (no duplicates). Validated per-plant in `validatePlant.ts`.
- Maintained by `scripts/seed_permaculture.mjs` as single source of truth.

## Permaculture sets (`src/data/permaculture_sets.json`)

Ready-to-plant mixed-culture packages ("Mischkultur-Pakete") that can be
adopted with a single click. Loaded by the v1.0 garden planner.
(Fertige Mischkultur-Pakete; vom Garten-Planner geladen.)

File structure:

```json
{
  "schema_version": 1,
  "_meta": {
    "source_notes": "Permakultur-Inspiration aus Holzer/Mollison/Hemenway — paraphrasiert.",
    "sources": ["Sepp Holzer, Sepp Holzers Permakultur (2004)", "..."]
  },
  "sets": [
    {
      "id": "three-sisters",
      "emoji": "🌽",
      "name_de": "Three Sisters",
      "name_en": "Three Sisters",
      "description_de": "Mais gibt der Bohne Halt, ...",
      "description_en": "Maize supports the bean, ...",
      "plants": [
        { "slug": "zea-mays", "quantity": 4 },
        { "slug": "phaseolus-vulgaris-vulgaris", "quantity": 8 },
        { "slug": "cucurbita-pepo", "quantity": 2 }
      ],
      "total_area_sqm": 4,
      "difficulty": 2,
      "function_tags": ["nitrogen_fixer", "vertical_high", "ground_cover"],
      "tradition": "Native American (Maya/Hopi)",
      "source": "Klassische Mischkultur-Tradition (Three Sisters)",
      "tips_de": ["Mais zuerst pflanzen (Mai), ..."],
      "tips_en": ["Plant maize first (May), ..."]
    }
  ]
}
```

Field rules (per set):
- `id`, `emoji`, `name_de`, `name_en`, `description_de`, `description_en`,
  `total_area_sqm`, `difficulty`, `function_tags`, `source` — all required.
- `plants` — non-empty array of `{ slug, quantity }`. Every `slug` must
  exist in `src/data/plants/`.
- `difficulty` — `1` (beginner), `2` (intermediate), `3` (expert).
- `function_tags` — uses the same enum as `permaculture_functions` above.
- `tradition`, `tips_de`, `tips_en` — optional.

Maintained by `scripts/seed_permaculture.mjs` as single source of truth.

## Validation

The loader (`src/lib/loadPlants.ts`) validates each JSON against the TypeScript types in `src/lib/types.ts` at build time. Missing required fields, wrong types, or unknown enum values cause the build to fail loudly.
