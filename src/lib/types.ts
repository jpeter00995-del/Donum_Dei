// Plant data types — mirror docs/data_schema.md
//
// === Codex P1 final ===
// Enum types come from `./plantSchema` (zod single source of truth).
// Structural types (Plant, PlantUse, IndoorGrowing, GardenMeta,
// CompanionPlanting, PermacultureFunction) remain here for now because they
// extend the core plant shape with garden/companion subtypes that aren't yet
// in the zod schema.
import type {
  UseForm,
  InternalExternal,
  PlantPart,
  EvidenceLevel,
  SafetyStatus,
  DrugInteractionSeverity,
  ConstituentCategory,
  SourceType,
  ToxicityLevel,
} from './plantSchema.ts';
export type {
  UseForm,
  InternalExternal,
  PlantPart,
  EvidenceLevel,
  SafetyStatus,
  DrugInteractionSeverity,
  ConstituentCategory,
  SourceType,
  ToxicityLevel,
};

export type Locale = 'de' | 'en';

// UI-Sprachen: DE/EN haben volle Inhalte. FR/ES/BG sind „Light"-Sprachen —
// nur Oberfläche (Menü, Startseite) übersetzt; Pflanzen-Inhalte fallen auf
// Englisch zurück (siehe contentLocale()). Erweiterung ohne Bruch der {de,en}-Daten.
export type UiLocale = Locale | 'fr' | 'es' | 'bg';

/** Inhalts-Sprache zu einer UI-Sprache: nur DE oder EN (Light-Sprachen → EN). */
export function contentLocale(ui: UiLocale): Locale {
  return ui === 'de' ? 'de' : 'en';
}

export type LocalizedString = {
  de: string;
  en: string;
};

export type LocalizedStringWithLatin = LocalizedString & {
  latin: string;
};

// UseForm, InternalExternal, PlantPart, EvidenceLevel — re-exported above
// from plantSchema.ts (Codex P1 single source of truth).

// Structured preparation/dosage for a specific use.
// All fields optional — UI falls back to `description` freitext when absent.
// (Strukturierte Zubereitung/Dosierung; alle Felder optional.)
export type Preparation = {
  /** Trockengewicht der Droge in Gramm (für Tee/Aufguss/Tinktur). */
  amount_dry_g?: { min: number; max: number };
  /** Flüssigkeitsmenge in Millilitern (für fertige Tinkturen, Säfte, Öle). */
  amount_ml?: { min: number; max: number };
  /** Wassermenge in Millilitern (für Tee/Aufguss). */
  water_ml?: number;
  /** Ziehzeit in Minuten. */
  steep_min?: number;
  /** Tagesdosen. */
  doses_per_day?: number;
  /** Maximale kontinuierliche Anwendungsdauer in Wochen. */
  max_duration_weeks?: number;
  /** Step-by-Step-Anleitung als bilingualer Freitext-Fallback. */
  instructions?: LocalizedString;
};

// Age restriction for an application.
export type AgeRestriction = {
  /** Mindestalter in Jahren (z.B. 12 für Echinacea oral). */
  min_age: number;
  /** Optionale Erklärung. */
  note?: LocalizedString;
};

export type PlantUse = {
  form: UseForm;
  target: string[];
  internal_external: InternalExternal;
  description: LocalizedString;
  source_ids: string[];
  // === Welle O.1 — alle optional, backwards-compat ===
  /** Welcher Pflanzenteil wird verwendet (Blatt/Wurzel/...). */
  plant_part?: PlantPart;
  /** Evidenz-Stufe dieser Anwendung. */
  evidence_level?: EvidenceLevel;
  /** Strukturierte Zubereitung/Dosierung. */
  preparation?: Preparation;
  /** Altersbeschränkung (z.B. "≥12 Jahre"). */
  age_restriction?: AgeRestriction;
};

export type PlantSeason = {
  active_months: number[];
  harvest_part: LocalizedString;
};

// ToxicityLevel + SafetyStatus — re-exported from plantSchema.ts (Codex P1).

export type SafetyDetail = {
  status: SafetyStatus;
  /** Optionale Erklärung (z.B. "nur unter ärztlicher Aufsicht"). */
  note?: LocalizedString;
};

// DrugInteractionSeverity — re-exported from plantSchema.ts (Codex P1).

export type DrugInteraction = {
  /** Wirkstoff-Klasse, z.B. "MAO-Hemmer", "Antikoagulanzien", "SSRI", "orale Kontrazeptiva". */
  drug_class: string;
  /** Mechanismus / klinische Bedeutung. */
  mechanism: LocalizedString;
  /** Schweregrad: monitor (beobachten), caution (vorsichtig), avoid (meiden). */
  severity: DrugInteractionSeverity;
  /** Optional: Quelle aus sources[]. */
  source_id?: string;
};

export type PlantSafety = {
  warnings: LocalizedString;
  external_only: boolean;
  /**
   * Overall toxicity classification. Optional for backwards compatibility
   * with plant JSONs written before Welle M.3 — UI defaults to `'none'`
   * when absent (and existing `warnings` text still shows up).
   * (Gesamt-Toxizitätsstufe; optional damit alte Pflanzen-JSONs gültig bleiben.)
   */
  toxicity_level?: ToxicityLevel;
  /**
   * True when the plant is specifically toxic to common pets (cats, dogs).
   * Independent of `toxicity_level`: a plant can be `none` for humans but
   * still pet-toxic (rare, but possible). Optional / additive.
   * (Pflanze ist für Haustiere giftig — separates Flag.)
   */
  pet_toxic?: boolean;
  // === Welle O.1 — Strukturierte Risiko-Felder, alle optional ===
  /** Anwendung in Schwangerschaft. */
  pregnancy?: SafetyDetail;
  /** Anwendung in Stillzeit. */
  lactation?: SafetyDetail;
  /** Anwendung bei Kindern. */
  children?: SafetyDetail;
  /** Wechselwirkungen mit Medikamenten. */
  drug_interactions?: DrugInteraction[];
  /** Max. kontinuierliche Anwendungsdauer in Wochen (pflanzen-weite Empfehlung). */
  max_continuous_use_weeks?: number;
  /** Strukturierte Gegenanzeigen (zusätzlich zum freiformigen warnings-Text). */
  contraindications?: LocalizedString[];
};

// ConstituentCategory — re-exported from plantSchema.ts (Codex P1).

export type Constituent = {
  /** Stoffname, z.B. "Hypericin", "Apigenin", "Menthol". */
  name: string;
  /** Stoffklasse. */
  category: ConstituentCategory;
  /** Konzentrationsbereich, z.B. "0.5-2%". Optional. */
  percent_range?: string;
  /** Pflanzenteil, in dem der Stoff vorkommt. */
  plant_part?: PlantPart;
  /** Optionale Wirkungs-Notiz (1 Zeile). */
  note?: LocalizedString;
};

// === Welle O.1 — Sammelzeit / Verarbeitung ===
// Harvest, drying and storage information per plant part.
// (Sammel-, Trocknungs- und Lagerungs-Info je Pflanzenteil.)
export type HarvestInfo = {
  /** Pflanzenteil, das geerntet wird. */
  plant_part: PlantPart;
  /** Optimale Sammelmonate (1-12). */
  best_months: number[];
  /** Tageszeit-Hinweis, z.B. "vormittags nach dem Tau". */
  time_of_day?: LocalizedString;
  /** Trocknungs-Hinweis (Methode + Bedingungen). */
  drying?: LocalizedString;
  /** Lagerfähigkeit in Monaten (getrocknet). */
  storage_months?: number;
  /** Lagerungs-Bedingungen, z.B. "lichtgeschützt, trocken". */
  storage_condition?: LocalizedString;
};

export type ClassicalQuote = {
  author: string;
  year: number;
  license: 'PD';
  text_de: string;
  text_en: string | null;
  // Codex P15: Werk + Kapitel/Abschnitt für vollständige PD-Attribution.
  work?: string;
  chapter?: string;
};

// SourceType — re-exported from plantSchema.ts (Codex P1).

export type PlantSource = {
  id: string;
  type: SourceType;
  title: string;
  url: string;
  accessed: string;
};

export type PlantImage = {
  filename: string;
  alt: LocalizedString;
  license: string;
  author: string;
  source_url: string;
};

export type Plant = {
  slug: string;
  names: LocalizedStringWithLatin;
  family: LocalizedStringWithLatin;
  description: LocalizedString;
  teaser: LocalizedString;
  uses: PlantUse[];
  season: PlantSeason;
  safety: PlantSafety;
  classical_quotes: ClassicalQuote[];
  sources: PlantSource[];
  image: PlantImage;
  indoor_growing?: IndoorGrowing;
  garden_meta?: GardenMeta;
  companion_planting?: CompanionPlanting;
  /**
   * Permaculture functions a plant fulfils within a mixed-culture bed.
   * Optional and additive — existing JSONs without this field remain valid.
   * See `PermacultureFunction` for the enum values.
   * (Permakultur-Funktionen, die die Pflanze in einer Mischkultur erfüllt.)
   */
  permaculture_functions?: PermacultureFunction[];
  // === Welle O.1 — Heilpflanzen-Tiefe (alle optional, additiv) ===
  /** Wirkstoffe / Inhaltsstoffe (Monographie-Stil). */
  constituents?: Constituent[];
  /** Sammel-, Trocknungs- und Lagerungs-Infos pro Pflanzenteil. */
  harvest?: HarvestInfo[];
  // === Themen-Erweiterung Drogen/Rausch + Pilze (alle optional, additiv) ===
  /**
   * Reich des Organismus. Fehlt das Feld, gilt `'plant'` (alle bestehenden
   * 223 Einträge bleiben gültig). `'fungus'` für Pilze (keine Pflanzen) —
   * Mischkultur-/Beet-Felder bleiben dann leer.
   * (Kingdom; absence implies plant. fungus = mushrooms, no garden fields.)
   */
  kingdom?: Kingdom;
  /**
   * Rechtlicher/Legalitäts-Status für kontrollierte oder psychoaktive Arten
   * (z. B. Cannabis, Schlafmohn, psychoaktive Pilze). Nur gesetzt, wenn relevant.
   * (Legal status for controlled/psychoactive species; only set when relevant.)
   */
  legal_status?: LegalStatus;
};

// === Themen-Erweiterung: Kingdom + Legal-Status ===

export type Kingdom = 'plant' | 'fungus';

/**
 * Legalitäts-Einordnung für kontrollierte/psychoaktive Arten. Bewusst
 * länder-neutral gehalten (`note` trägt den Pro-Land-Hinweis), da Donum Dei
 * edukativ ist und keine Rechtsberatung gibt.
 * (Legal classification; deliberately country-neutral — `note` carries the
 * per-country caveat. Educational, NOT legal advice.)
 */
export type LegalStatus = {
  /** true = irgendwo als kontrollierte Substanz reguliert → Disclaimer zeigen. */
  controlled: boolean;
  /** Kurz-Einordnung (z. B. „Betäubungsmittel in vielen Ländern"). */
  summary: LocalizedString;
  /** Optionaler Pro-Land-/Detail-Hinweis. */
  note?: LocalizedString;
  /** Quellen-IDs (verweisen auf sources[]) für die rechtliche Aussage. */
  source_ids?: string[];
};

// Filter-related types
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type FilterState = {
  forms: UseForm[];
  seasons: Season[];
};

// === Indoor growing types — see spec docs/superpowers/specs/2026-05-17-donum-dei-v0.8-indoor-growing-design.md

export type IndoorPurpose =
  | 'medicinal'
  | 'edible'
  | 'air_purifying'
  | 'pest_repelling'
  | 'humidifying'
  | 'night_oxygen'
  | 'ornamental';

export type IndoorRoom =
  | 'kitchen'
  | 'living_room'
  | 'bathroom'
  | 'bedroom'
  | 'balcony';

export type IndoorLight =
  | 'direct_sun'
  | 'bright_indirect'
  | 'partial_shade'
  | 'low_light';

export type IndoorWaterFrequency =
  | 'daily'
  | 'every_few_days'
  | 'weekly'
  | 'sparse';

export type IndoorDifficulty = 1 | 2 | 3;

export type IndoorGrowing = {
  suitable: boolean;
  purpose: IndoorPurpose[];
  rooms: IndoorRoom[];
  light: IndoorLight;
  water_frequency: IndoorWaterFrequency;
  difficulty: IndoorDifficulty;
  pet_safe: boolean;
  soil?: LocalizedString;
  pot_size_cm?: number;
  tips?: {
    de: string[];
    en: string[];
  };
};

// === Garden meta types — see TODO_v1.0_selbstversorger.md Task 1
// (Garten-Meta-Typen für den Selbstversorger-Planer in v1.0)

/**
 * Month range used by sowing/harvest windows.
 * Months are integers 1-12 (January = 1, December = 12).
 * If a window wraps the year boundary, `start_month` may be greater than
 * `end_month` (e.g. start_month = 11, end_month = 2 means Nov–Feb).
 * (Monats-Bereich; Werte 1-12; Wrap über Jahreswechsel erlaubt.)
 */
export type MonthRange = {
  /** First month of the window, integer 1-12. */
  start_month: number;
  /** Last month of the window, integer 1-12. */
  end_month: number;
};

/** Sowing methods supported by the planner. */
export type SowingWindow = {
  /**
   * Indoor pre-sowing window (e.g. on a windowsill, before transplanting).
   * (Vorkultur drinnen, z.B. auf der Fensterbank.)
   */
  indoor?: MonthRange;
  /**
   * Direct outdoor sowing window — seeds go straight into the final bed.
   * (Direkt-Aussaat ins Freiland.)
   */
  outdoor_direct?: MonthRange;
  /**
   * Transplant window — moving pre-grown seedlings to their final location.
   * (Auspflanz-Fenster für vorgezogene Jungpflanzen.)
   */
  transplant?: MonthRange;
};

/** Garden contexts a plant is suitable for. */
export type GardenType = 'balcony' | 'raised_bed' | 'field' | 'greenhouse';

/**
 * Gardening difficulty for the v1.0 Selbstversorger planner.
 * 1 = beginner, 2 = intermediate, 3 = expert.
 * (Anfänger / Fortgeschritten / Profi.)
 */
export type GardenDifficulty = 1 | 2 | 3;

/**
 * Garden-planning metadata used by the v1.0 Selbstversorger features
 * (climate-zone matching, sowing/harvest calendar, companion planting).
 * Optional on `Plant` so the existing 154 plant JSON files stay valid.
 * (Garten-Planungs-Metadaten für die v1.0 Selbstversorger-Features;
 * optional, damit bestehende Pflanzen-JSONs weiterhin gültig sind.)
 */
export type GardenMeta = {
  /**
   * USDA hardiness zones where the plant thrives, e.g. ["7a", "7b", "8a"].
   * Format: digits 1-13 followed by optional "a" or "b" sub-zone.
   * (USDA-Klimazonen, in denen die Pflanze gedeiht.)
   */
  climate_zones: string[];
  /**
   * Sowing windows per method (indoor / outdoor direct / transplant).
   * At least one sub-field should be populated; all are individually optional.
   * (Aussaat-Fenster je Methode; mindestens eines sollte gesetzt sein.)
   */
  sowing_window: SowingWindow;
  /**
   * Harvest window — months in which the plant is typically harvested
   * from a v1.0 garden-planner perspective. Distinct from `season.active_months`
   * which describes general wild/medicinal availability.
   * (Ernte-Fenster aus Selbstversorger-Sicht; unabhängig von season.active_months.)
   */
  harvest_window: MonthRange;
  /**
   * Days from sowing to first harvest under typical conditions.
   * (Tage von Aussaat bis Ernte unter typischen Bedingungen.)
   */
  days_to_harvest: number;
  /**
   * Recommended plant spacing in centimetres (centre-to-centre).
   * (Empfohlener Pflanzabstand in Zentimetern.)
   */
  spacing_cm: number;
  /**
   * Garden contexts the plant is suitable for (multi-select).
   * (Geeignete Garten-Kontexte; Mehrfachauswahl.)
   */
  garden_type: GardenType[];
  /**
   * Gardening difficulty (1 = beginner, 3 = expert).
   * (Schwierigkeitsgrad im Garten.)
   */
  difficulty: GardenDifficulty;
};

// === Companion-planting types — see TODO_v1.0_selbstversorger.md Task 14
// (Mischkultur-Typen für den Selbstversorger-Planer in v1.0)

/**
 * Companion-planting relationships — which plants grow well together,
 * which conflict (allelopathy, pest attraction, nutrient competition),
 * and which are explicitly neutral.
 *
 * Slugs in `good_partners` / `bad_partners` / `neutral` reference other
 * Plant entries by their `slug` field. The bidirectional-consistency
 * invariant (if A.good_partners includes B, then B.good_partners must
 * include A) is enforced by a separate cross-file test, not by the
 * per-plant validator.
 *
 * (Mischkultur-Beziehungen — welche Pflanzen zusammen gedeihen,
 * welche sich gegenseitig stören (Allelopathie, Schädlinge,
 * Nährstoff-Konkurrenz), und welche explizit neutral sind.)
 */
export interface CompanionPlanting {
  /**
   * Plant slugs that benefit each other (growth, yield, pest resistance).
   * Can be empty.
   * (Pflanzen-Slugs, die sich gegenseitig fördern.)
   */
  good_partners: string[];
  /**
   * Plant slugs that harm each other via allelopathy / competition / pests.
   * Can be empty.
   * (Pflanzen-Slugs, die sich gegenseitig stören.)
   */
  bad_partners: string[];
  /**
   * Plant slugs explicitly tested as neutral. Optional.
   * (Pflanzen-Slugs, die explizit als neutral dokumentiert sind.)
   */
  neutral?: string[];
  /**
   * Short per-relationship reasons keyed by partner slug.
   * One line each, didactic, no marketing language. Optional and additive —
   * UI falls back to a generic "classic companion" string when missing.
   * The slug key may appear under good, bad or neutral; the reason text
   * describes the relationship from THIS plant's perspective (so reason
   * texts on the two sides of a pair may differ).
   *
   * (Kurze Begründungen pro Beziehung, geschlüsselt nach Partner-Slug.
   * Eine Zeile, didaktisch; optional. UI nutzt einen Fallback wenn fehlt.)
   */
  reasons?: Record<string, { de: string; en: string }>;
  /** Free-form German notes (e.g. spezielle Hinweise zur Beziehung). */
  notes_de?: string;
  /** Free-form English notes. */
  notes_en?: string;
  /**
   * Citation for the relationship table. Required.
   * (Quelle für die Beziehungs-Tabelle; Pflicht.)
   */
  source: string;
}

// === Permaculture-function types — see TODO_v1.0_selbstversorger.md Welle E.1
// (Permakultur-Funktions-Typen für die Mischkultur-Tiefe im Sepp-Holzer-Stil)

/**
 * Permaculture functions a plant fulfils within a mixed-culture bed.
 * Documented in Sepp Holzer / Bill Mollison / Toby Hemenway tradition,
 * paraphrased — no direct quotes.
 *
 * (Permakultur-Funktionen einer Pflanze; inspiriert von Holzer/Mollison/
 * Hemenway, paraphrasiert.)
 *
 * Values:
 * - `nitrogen_fixer`        — fixes atmospheric N₂ via root nodules (legumes)
 * - `pest_repellent`        — actively deters pests (e.g. garlic, marigold)
 * - `ground_cover`          — dense low foliage that shades and protects soil
 * - `pollinator_attractor`  — flowers attract bees/butterflies
 * - `root_loosener`         — deep tap root that loosens compacted soil
 * - `dynamic_accumulator`   — mines nutrients from deep soil layers (mulch)
 * - `vertical_high`         — tall vertical layer in stacked planting
 * - `vertical_mid`          — mid-height vertical layer
 * - `vertical_low`          — low / ground-level vertical layer
 * - `shade_provider`        — provides shade for heat-sensitive neighbours
 * - `aromatic_repellent`    — aromatic foliage that masks crops from pests
 * - `edible_flower`         — flowers are edible (added garden value)
 * - `medicinal`             — medicinal use beyond culinary
 * - `microclimate`          — modifies microclimate (windbreak, humidity)
 */
export type PermacultureFunction =
  | 'nitrogen_fixer'
  | 'pest_repellent'
  | 'ground_cover'
  | 'pollinator_attractor'
  | 'root_loosener'
  | 'dynamic_accumulator'
  | 'vertical_high'
  | 'vertical_mid'
  | 'vertical_low'
  | 'shade_provider'
  | 'aromatic_repellent'
  | 'edible_flower'
  | 'medicinal'
  | 'microclimate';

// === Permaculture-set types — see src/data/permaculture_sets.json
// (Mischkultur-Pakete im Sepp-Holzer-Stil; jedes Set ist ein fertiges Beet-Layout)

/**
 * A single plant entry inside a permaculture set.
 * `quantity` is a suggested seedling/seed count for the documented total area.
 * (Eine Pflanzen-Position in einem Mischkultur-Paket inkl. Stückzahl.)
 */
export type PermacultureSetPlant = {
  /** Plant slug — must match a real entry in `src/data/plants/`. */
  slug: string;
  /** Suggested plant count for the set's `total_area_sqm`. */
  quantity: number;
};

/**
 * Difficulty for a permaculture set: 1 = beginner, 2 = intermediate, 3 = expert.
 * Mirrors `GardenDifficulty` and `IndoorDifficulty` for UI consistency.
 */
export type PermacultureSetDifficulty = 1 | 2 | 3;

/**
 * A ready-to-plant permaculture set (mixed-culture package).
 * Loaded from `src/data/permaculture_sets.json` and used by UI / planner
 * to let the user adopt a documented bed layout with a single click.
 *
 * (Fertiges Mischkultur-Paket; aus permaculture_sets.json geladen.)
 */
export type PermacultureSet = {
  /** Stable kebab-case id, e.g. `"three-sisters"`. */
  id: string;
  /** Single Unicode emoji used as visual badge in the UI. */
  emoji: string;
  /** Display name in German. */
  name_de: string;
  /** Display name in English. */
  name_en: string;
  /** 2-3 sentence description in German, Sepp-Holzer-style. */
  description_de: string;
  /** 2-3 sentence description in English. */
  description_en: string;
  /** Plants in the set with suggested counts (≥ 1 entry). */
  plants: PermacultureSetPlant[];
  /** Total bed area in square metres the quantities are calibrated for. */
  total_area_sqm: number;
  /** Difficulty of growing the set successfully. */
  difficulty: PermacultureSetDifficulty;
  /** Permaculture-function tags that summarise the set's character. */
  function_tags: PermacultureFunction[];
  /** Optional tradition / origin label (e.g. "Native American (Maya/Hopi)"). */
  tradition?: string;
  /** Citation for the set composition. Required. */
  source: string;
  /** Optional German growing tips, one short bullet per array entry. */
  tips_de?: string[];
  /** Optional English growing tips, one short bullet per array entry. */
  tips_en?: string[];
};

/**
 * Top-level structure of `src/data/permaculture_sets.json`.
 * (Datei-Wurzel-Struktur für permaculture_sets.json.)
 */
export type PermacultureSetsFile = {
  schema_version: number;
  _meta: {
    source_notes: string;
    sources: string[];
  };
  sets: PermacultureSet[];
};
