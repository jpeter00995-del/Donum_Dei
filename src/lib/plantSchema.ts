// === 1. ZOD SCHEMA FOR PLANT DATA ===
// Single source of truth for plant JSON validation + TypeScript types.
// Per Codex-Review v1 Pkt 2: ersetzt die manuelle Doppel-Wahrheit
// zwischen types.ts und validatePlant.ts.
//
// Usage:
//   import { plantSchema, type Plant } from '@/lib/plantSchema';
//   plantSchema.parse(rawJson);     // throws zod error
//   plantSchema.safeParse(rawJson); // returns { success, data | error }
//
// Backwards-compatibility: This schema co-exists with src/lib/types.ts
// for now. Fields not relevant to validation (IndoorGrowing, GardenMeta,
// CompanionPlanting, PermacultureFunction) still live in types.ts and
// are referenced via z.unknown() / z.any() here. Future migration step:
// move those enums into this file too.

import { z } from 'zod';

// === 2. LOCALIZED STRINGS ===
export const localizedString = z.object({
  de: z.string().min(1),
  en: z.string().min(1),
});

export const localizedStringWithLatin = localizedString.extend({
  latin: z.string().min(1),
});

// === 3. ENUMS (single declaration, exported as both type + array) ===
export const USE_FORMS = ['tea', 'tincture', 'salve', 'bath', 'raw', 'spice', 'essential_oil', 'inhalation', 'gargle', 'compress'] as const;
export const useForm = z.enum(USE_FORMS);

export const INTERNAL_EXTERNAL = ['internal', 'external', 'both'] as const;
export const internalExternal = z.enum(INTERNAL_EXTERNAL);

export const PLANT_PARTS = ['leaf', 'root', 'rhizome', 'flower', 'seed', 'fruit', 'bark', 'bulb', 'aerial_parts', 'whole_plant'] as const;
export const plantPart = z.enum(PLANT_PARTS);

export const EVIDENCE_LEVELS = ['folk', 'traditional', 'commission_e', 'ema_well_established', 'clinical_trial'] as const;
export const evidenceLevel = z.enum(EVIDENCE_LEVELS);

export const SAFETY_STATUSES = ['safe', 'caution', 'contraindicated', 'unknown'] as const;
export const safetyStatus = z.enum(SAFETY_STATUSES);

export const DRUG_INTERACTION_SEVERITIES = ['monitor', 'caution', 'avoid'] as const;
export const drugInteractionSeverity = z.enum(DRUG_INTERACTION_SEVERITIES);

export const CONSTITUENT_CATEGORIES = [
  'alkaloid', 'flavonoid', 'glycoside', 'essential_oil', 'tannin', 'mucilage',
  'bitter', 'saponin', 'phenolic_acid', 'sesquiterpene', 'polysaccharide',
  'vitamin', 'mineral', 'other',
] as const;
export const constituentCategory = z.enum(CONSTITUENT_CATEGORIES);

export const SOURCE_TYPES = ['wikipedia', 'wikidata', 'book', 'commons', 'monograph'] as const;
export const sourceType = z.enum(SOURCE_TYPES);

export const TOXICITY_LEVELS = ['none', 'caution', 'toxic'] as const;
export const toxicityLevel = z.enum(TOXICITY_LEVELS);

// Themen-Erweiterung: Reich (Pflanze vs. Pilz). Fehlt das Feld → 'plant'.
export const KINGDOMS = ['plant', 'fungus'] as const;
export const kingdom = z.enum(KINGDOMS);

// === 4. SUB-SCHEMAS ===
// Preparation accepts either the structured object form (Welle O.1 typed fields)
// OR the Welle F bilingual freetext form ({de, en}). UI normalises at display time.
export const preparationSchema = z.union([
  z.object({
    amount_dry_g: z.object({ min: z.number(), max: z.number() }).optional(),
    amount_ml: z.object({ min: z.number(), max: z.number() }).optional(),
    water_ml: z.number().positive().optional(),
    steep_min: z.number().positive().optional(),
    doses_per_day: z.number().positive().optional(),
    max_duration_weeks: z.number().positive().optional(),
    instructions: localizedString.optional(),
  }).passthrough(),
  localizedString,  // Welle F shape: preparation = {de, en} freetext
]).optional();

export const ageRestrictionSchema = z.object({
  // Allow fractional years (e.g. 0.5 = 6 months for Matricaria chamomilla).
  min_age: z.number().nonnegative(),
  note: localizedString.optional(),
});

export const plantUseSchema = z.object({
  form: useForm,
  target: z.array(z.string()),
  internal_external: internalExternal,
  description: localizedString,
  source_ids: z.array(z.string()).min(1),
  plant_part: plantPart.optional(),
  evidence_level: evidenceLevel.optional(),
  preparation: preparationSchema,
  age_restriction: ageRestrictionSchema.optional(),
  // Tolerate Welle F extra fields (dose_amount, dose_unit, frequency_per_day, indication).
  // They are stored but not validated by the strict pass — for now keep loose.
}).passthrough();

export const plantSeasonSchema = z.object({
  active_months: z.array(z.number().int().min(1).max(12)),
  harvest_part: localizedString,
});

export const safetyDetailSchema = z.object({
  status: safetyStatus,
  note: localizedString.optional(),
});

export const drugInteractionSchema = z.object({
  drug_class: z.string().min(1),
  mechanism: localizedString,
  severity: drugInteractionSeverity,
  source_id: z.string().optional(),
});

export const plantSafetySchema = z.object({
  warnings: localizedString,
  external_only: z.boolean(),
  toxicity_level: toxicityLevel.optional(),
  pet_toxic: z.boolean().optional(),
  pregnancy: safetyDetailSchema.optional(),
  lactation: safetyDetailSchema.optional(),
  children: safetyDetailSchema.optional(),
  drug_interactions: z.array(drugInteractionSchema).optional(),
  max_continuous_use_weeks: z.number().positive().optional(),
  contraindications: z.array(localizedString).optional(),
}).passthrough(); // allow extra _note fallback fields

export const constituentSchema = z.object({
  name: z.string().min(1),
  category: constituentCategory,
  percent_range: z.string().optional(),
  plant_part: plantPart.optional(),
  note: localizedString.optional(),
});

export const harvestInfoSchema = z.object({
  plant_part: plantPart,
  best_months: z.array(z.number().int().min(1).max(12)).min(1),
  time_of_day: localizedString.optional(),
  drying: localizedString.optional(),
  storage_months: z.number().positive().optional(),
  storage_condition: localizedString.optional(),
}).passthrough();

export const classicalQuoteSchema = z.object({
  author: z.string(),
  year: z.number().int(),
  license: z.literal('PD'),
  text_de: z.string(),
  text_en: z.string().nullable(),
  // Codex P15: full PD-quote attribution requires Werk + Kapitel/Abschnitt.
  // Optional for backward compat; new quotes SHOULD provide it.
  work: z.string().optional(),
  chapter: z.string().optional(),
});

export const plantSourceSchema = z.object({
  id: z.string().min(1),
  type: sourceType,
  title: z.string().min(1),
  url: z.string().min(1),
  accessed: z.string().min(1),
});

export const plantImageSchema = z.object({
  filename: z.string().min(1),
  alt: localizedString,
  license: z.string(),
  author: z.string(),
  source_url: z.string(),
});

// Themen-Erweiterung: Legalitäts-Status für kontrollierte/psychoaktive Arten.
// Länder-neutral (note = Pro-Land-Hinweis); edukativ, keine Rechtsberatung.
export const legalStatusSchema = z.object({
  controlled: z.boolean(),
  summary: localizedString,
  note: localizedString.optional(),
  source_ids: z.array(z.string()).optional(),
});

// === 5. ROOT PLANT SCHEMA ===
export const plantSchema = z.object({
  slug: z.string().min(1),
  names: localizedStringWithLatin,
  family: localizedStringWithLatin,
  description: localizedString,
  teaser: localizedString,
  uses: z.array(plantUseSchema).min(1),
  season: plantSeasonSchema,
  safety: plantSafetySchema,
  classical_quotes: z.array(classicalQuoteSchema),
  sources: z.array(plantSourceSchema).min(1),
  image: plantImageSchema,
  constituents: z.array(constituentSchema).optional(),
  harvest: z.array(harvestInfoSchema).optional(),
  // Themen-Erweiterung (optional, additiv — bestehende JSONs bleiben gültig):
  kingdom: kingdom.optional(),
  legal_status: legalStatusSchema.optional(),
  // Non-validated extra fields kept as passthrough so plant JSONs with
  // IndoorGrowing/GardenMeta/CompanionPlanting/PermacultureFunction stay valid.
}).passthrough()
  .superRefine((plant, ctx) => {
    // === Custom cross-field invariant: source_ids must exist in sources[] ===
    const knownIds = new Set((plant.sources ?? []).map((s) => s.id));
    plant.uses?.forEach((use, i) => {
      use.source_ids?.forEach((sid) => {
        if (!knownIds.has(sid)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['uses', i, 'source_ids'],
            message: `source_id '${sid}' not declared in sources[]`,
          });
        }
      });
    });
    // legal_status.source_ids müssen ebenfalls in sources[] deklariert sein.
    plant.legal_status?.source_ids?.forEach((sid) => {
      if (!knownIds.has(sid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['legal_status', 'source_ids'],
          message: `source_id '${sid}' not declared in sources[]`,
        });
      }
    });
  });

// === 6. DERIVED TYPESCRIPT TYPES ===
// Use z.infer<typeof X> to keep types in lockstep with schema.
export type Plant = z.infer<typeof plantSchema>;
export type PlantUse = z.infer<typeof plantUseSchema>;
export type PlantSafety = z.infer<typeof plantSafetySchema>;
export type Constituent = z.infer<typeof constituentSchema>;
export type HarvestInfo = z.infer<typeof harvestInfoSchema>;
export type PlantSource = z.infer<typeof plantSourceSchema>;
export type PlantImage = z.infer<typeof plantImageSchema>;
export type DrugInteraction = z.infer<typeof drugInteractionSchema>;
// Enum types (auto-derived from arrays — type matches array literal).
export type UseForm = (typeof USE_FORMS)[number];
export type InternalExternal = (typeof INTERNAL_EXTERNAL)[number];
export type PlantPart = (typeof PLANT_PARTS)[number];
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];
export type SafetyStatus = (typeof SAFETY_STATUSES)[number];
export type DrugInteractionSeverity = (typeof DRUG_INTERACTION_SEVERITIES)[number];
export type ConstituentCategory = (typeof CONSTITUENT_CATEGORIES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type ToxicityLevel = (typeof TOXICITY_LEVELS)[number];
export type Kingdom = (typeof KINGDOMS)[number];
export type LegalStatus = z.infer<typeof legalStatusSchema>;
