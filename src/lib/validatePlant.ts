import type { Plant, PermacultureFunction } from './types';
// === Single source of truth: enum arrays come from plantSchema.ts (Codex v1 P1) ===
// Permaculture stays manual — not yet in zod schema.
import {
  USE_FORMS,
  INTERNAL_EXTERNAL as INT_EXT,
  SOURCE_TYPES,
  PLANT_PARTS,
  EVIDENCE_LEVELS,
  SAFETY_STATUSES,
  DRUG_INTERACTION_SEVERITIES as DRUG_INT_SEVERITIES,
  CONSTITUENT_CATEGORIES,
} from './plantSchema.ts';

// Permaculture-function enum — kept in sync with types.ts PermacultureFunction.
// (Permakultur-Funktions-Werte; muss synchron mit types.ts bleiben.)
const PERMACULTURE_FUNCTIONS: PermacultureFunction[] = [
  'nitrogen_fixer',
  'pest_repellent',
  'ground_cover',
  'pollinator_attractor',
  'root_loosener',
  'dynamic_accumulator',
  'vertical_high',
  'vertical_mid',
  'vertical_low',
  'shade_provider',
  'aromatic_repellent',
  'edible_flower',
  'medicinal',
  'microclimate',
];

class ValidationError extends Error {
  constructor(field: string, reason: string) {
    super(`Plant validation failed at '${field}': ${reason}`);
  }
}

function requireString(obj: any, field: string): void {
  if (typeof obj[field] !== 'string' || obj[field].length === 0) {
    throw new ValidationError(field, 'must be a non-empty string');
  }
}

function requireLocalizedString(obj: any, field: string): void {
  const v = obj[field];
  if (!v || typeof v.de !== 'string' || typeof v.en !== 'string') {
    throw new ValidationError(field, 'must be { de: string, en: string }');
  }
}

function requireLocalizedStringWithLatin(obj: any, field: string): void {
  const v = obj[field];
  if (!v || typeof v.de !== 'string' || typeof v.en !== 'string' || typeof v.latin !== 'string') {
    throw new ValidationError(field, 'must be { de, en, latin } all strings');
  }
}

export function validatePlant(input: unknown): asserts input is Plant {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('root', 'must be an object');
  }
  const p = input as any;

  requireString(p, 'slug');
  requireLocalizedStringWithLatin(p, 'names');
  requireLocalizedStringWithLatin(p, 'family');
  requireLocalizedString(p, 'description');
  requireLocalizedString(p, 'teaser');

  if (!Array.isArray(p.uses) || p.uses.length === 0) {
    throw new ValidationError('uses', 'must be a non-empty array');
  }

  if (!Array.isArray(p.sources) || p.sources.length === 0) {
    throw new ValidationError('sources', 'must be a non-empty array');
  }

  const knownSourceIds = new Set<string>();
  for (const [i, s] of p.sources.entries()) {
    requireString(s, 'id');
    if (!SOURCE_TYPES.includes(s.type)) {
      throw new ValidationError(`sources[${i}].type`, `unknown source type '${s.type}'`);
    }
    requireString(s, 'title');
    requireString(s, 'url');
    requireString(s, 'accessed');
    knownSourceIds.add(s.id);
  }

  for (const [i, u] of p.uses.entries()) {
    if (!USE_FORMS.includes(u.form)) {
      throw new ValidationError(`uses[${i}].form`, `unknown form '${u.form}'`);
    }
    if (!Array.isArray(u.target)) {
      throw new ValidationError(`uses[${i}].target`, 'must be an array');
    }
    if (!INT_EXT.includes(u.internal_external)) {
      throw new ValidationError(`uses[${i}].internal_external`, `unknown value '${u.internal_external}'`);
    }
    requireLocalizedString(u, 'description');
    if (!Array.isArray(u.source_ids) || u.source_ids.length === 0) {
      throw new ValidationError(`uses[${i}].source_ids`, 'must be a non-empty array');
    }
    for (const sid of u.source_ids) {
      if (!knownSourceIds.has(sid)) {
        throw new ValidationError(`uses[${i}].source_ids`, `source '${sid}' not found in sources[]`);
      }
    }
    // === Welle O.1: optional medicinal-depth fields per use ===
    if (u.plant_part !== undefined && !PLANT_PARTS.includes(u.plant_part)) {
      throw new ValidationError(`uses[${i}].plant_part`, `unknown plant_part '${u.plant_part}'`);
    }
    if (u.evidence_level !== undefined && !EVIDENCE_LEVELS.includes(u.evidence_level)) {
      throw new ValidationError(`uses[${i}].evidence_level`, `unknown evidence_level '${u.evidence_level}'`);
    }
    if (u.preparation !== undefined) {
      validatePreparation(u.preparation, `uses[${i}].preparation`);
    }
    if (u.age_restriction !== undefined) {
      const ar = u.age_restriction;
      if (!ar || typeof ar.min_age !== 'number' || ar.min_age < 0) {
        throw new ValidationError(`uses[${i}].age_restriction.min_age`, 'must be a non-negative number');
      }
      if (ar.note !== undefined) {
        requireLocalizedString(ar, 'note');
      }
    }
  }

  if (!p.season || !Array.isArray(p.season.active_months)) {
    throw new ValidationError('season.active_months', 'must be an array');
  }
  for (const m of p.season.active_months) {
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      throw new ValidationError('season.active_months', `month ${m} out of range 1-12`);
    }
  }
  requireLocalizedString(p.season, 'harvest_part');

  if (!p.safety || typeof p.safety.external_only !== 'boolean') {
    throw new ValidationError('safety.external_only', 'must be boolean');
  }
  requireLocalizedString(p.safety, 'warnings');
  if (p.safety.toxicity_level !== undefined) {
    if (!['none', 'caution', 'toxic'].includes(p.safety.toxicity_level)) {
      throw new ValidationError('safety.toxicity_level', "must be 'none' | 'caution' | 'toxic'");
    }
  }
  if (p.safety.pet_toxic !== undefined && typeof p.safety.pet_toxic !== 'boolean') {
    throw new ValidationError('safety.pet_toxic', 'must be boolean if present');
  }
  // === Welle O.1: strukturierte Risiko-Felder ===
  for (const dim of ['pregnancy', 'lactation', 'children'] as const) {
    if (p.safety[dim] !== undefined) {
      const sd = p.safety[dim];
      if (!sd || !SAFETY_STATUSES.includes(sd.status)) {
        throw new ValidationError(`safety.${dim}.status`, `must be one of ${SAFETY_STATUSES.join(' | ')}`);
      }
      if (sd.note !== undefined) {
        requireLocalizedString(sd, 'note');
      }
    }
  }
  if (p.safety.drug_interactions !== undefined) {
    if (!Array.isArray(p.safety.drug_interactions)) {
      throw new ValidationError('safety.drug_interactions', 'must be an array when present');
    }
    for (const [i, di] of p.safety.drug_interactions.entries()) {
      if (!di || typeof di.drug_class !== 'string' || di.drug_class.length === 0) {
        throw new ValidationError(`safety.drug_interactions[${i}].drug_class`, 'must be a non-empty string');
      }
      requireLocalizedString(di, 'mechanism');
      if (!DRUG_INT_SEVERITIES.includes(di.severity)) {
        throw new ValidationError(`safety.drug_interactions[${i}].severity`, `must be one of ${DRUG_INT_SEVERITIES.join(' | ')}`);
      }
      if (di.source_id !== undefined && !knownSourceIds.has(di.source_id)) {
        throw new ValidationError(`safety.drug_interactions[${i}].source_id`, `source '${di.source_id}' not found in sources[]`);
      }
    }
  }
  if (p.safety.max_continuous_use_weeks !== undefined) {
    const w = p.safety.max_continuous_use_weeks;
    if (typeof w !== 'number' || w <= 0) {
      throw new ValidationError('safety.max_continuous_use_weeks', 'must be a positive number when present');
    }
  }
  if (p.safety.contraindications !== undefined) {
    if (!Array.isArray(p.safety.contraindications)) {
      throw new ValidationError('safety.contraindications', 'must be an array when present');
    }
    for (const [i, c] of p.safety.contraindications.entries()) {
      if (!c || typeof c.de !== 'string' || typeof c.en !== 'string') {
        throw new ValidationError(`safety.contraindications[${i}]`, 'must be { de: string, en: string }');
      }
    }
  }

  // === Themen-Erweiterung: kingdom + legal_status (beide optional, additiv) ===
  if (p.kingdom !== undefined && !['plant', 'fungus'].includes(p.kingdom)) {
    throw new ValidationError('kingdom', "must be 'plant' | 'fungus' when present");
  }
  if (p.legal_status !== undefined) {
    const ls = p.legal_status;
    if (!ls || typeof ls.controlled !== 'boolean') {
      throw new ValidationError('legal_status.controlled', 'must be boolean');
    }
    requireLocalizedString(ls, 'summary');
    if (ls.note !== undefined) {
      requireLocalizedString(ls, 'note');
    }
    if (ls.source_ids !== undefined) {
      if (!Array.isArray(ls.source_ids)) {
        throw new ValidationError('legal_status.source_ids', 'must be an array when present');
      }
      for (const sid of ls.source_ids) {
        if (!knownSourceIds.has(sid)) {
          throw new ValidationError('legal_status.source_ids', `source '${sid}' not found in sources[]`);
        }
      }
    }
  }

  if (!Array.isArray(p.classical_quotes)) {
    throw new ValidationError('classical_quotes', 'must be an array (can be empty)');
  }
  for (const [i, q] of p.classical_quotes.entries()) {
    requireString(q, 'author');
    if (typeof q.year !== 'number') {
      throw new ValidationError(`classical_quotes[${i}].year`, 'must be number');
    }
    if (q.license !== 'PD') {
      throw new ValidationError(`classical_quotes[${i}].license`, 'must be "PD"');
    }
    requireString(q, 'text_de');
    if (q.text_en !== null && typeof q.text_en !== 'string') {
      throw new ValidationError(`classical_quotes[${i}].text_en`, 'must be string or null');
    }
  }

  if (!p.image) {
    throw new ValidationError('image', 'required');
  }
  requireString(p.image, 'filename');
  requireLocalizedString(p.image, 'alt');
  requireString(p.image, 'license');
  requireString(p.image, 'author');
  requireString(p.image, 'source_url');

  // === Indoor growing field — optional, but if present must be fully valid ===
  if (p.indoor_growing !== undefined) {
    const ig = p.indoor_growing;
    if (!ig || typeof ig !== 'object') {
      throw new ValidationError('indoor_growing', 'must be an object when present');
    }
    if (typeof ig.suitable !== 'boolean') {
      throw new ValidationError('indoor_growing.suitable', 'must be boolean');
    }
    if (!Array.isArray(ig.purpose) || ig.purpose.length === 0) {
      throw new ValidationError('indoor_growing.purpose', 'must be a non-empty array');
    }
    const PURPOSES = ['medicinal', 'edible', 'air_purifying', 'pest_repelling', 'humidifying', 'night_oxygen', 'ornamental'];
    for (const v of ig.purpose) {
      if (!PURPOSES.includes(v)) {
        throw new ValidationError('indoor_growing.purpose', `unknown value '${v}'`);
      }
    }
    if (!Array.isArray(ig.rooms) || ig.rooms.length === 0) {
      throw new ValidationError('indoor_growing.rooms', 'must be a non-empty array');
    }
    const ROOMS = ['kitchen', 'living_room', 'bathroom', 'bedroom', 'balcony'];
    for (const v of ig.rooms) {
      if (!ROOMS.includes(v)) {
        throw new ValidationError('indoor_growing.rooms', `unknown value '${v}'`);
      }
    }
    const LIGHTS = ['direct_sun', 'bright_indirect', 'partial_shade', 'low_light'];
    if (!LIGHTS.includes(ig.light)) {
      throw new ValidationError('indoor_growing.light', `unknown value '${ig.light}'`);
    }
    const FREQS = ['daily', 'every_few_days', 'weekly', 'sparse'];
    if (!FREQS.includes(ig.water_frequency)) {
      throw new ValidationError('indoor_growing.water_frequency', `unknown value '${ig.water_frequency}'`);
    }
    if (![1, 2, 3].includes(ig.difficulty)) {
      throw new ValidationError('indoor_growing.difficulty', 'must be 1, 2 or 3');
    }
    if (typeof ig.pet_safe !== 'boolean') {
      throw new ValidationError('indoor_growing.pet_safe', 'must be boolean');
    }
    if (ig.soil !== undefined) {
      requireLocalizedString(ig, 'soil');
    }
    if (ig.pot_size_cm !== undefined && (typeof ig.pot_size_cm !== 'number' || ig.pot_size_cm <= 0)) {
      throw new ValidationError('indoor_growing.pot_size_cm', 'must be positive number when present');
    }
    if (ig.tips !== undefined) {
      if (!ig.tips || !Array.isArray(ig.tips.de) || !Array.isArray(ig.tips.en)) {
        throw new ValidationError('indoor_growing.tips', 'must be { de: string[], en: string[] }');
      }
    }
  }

  // === Garden meta field — optional, but if present must be fully valid ===
  // (Garten-Meta-Feld — optional; wenn vorhanden, muss alles stimmen)
  if (p.garden_meta !== undefined) {
    const gm = p.garden_meta;
    if (!gm || typeof gm !== 'object') {
      throw new ValidationError('garden_meta', 'must be an object when present');
    }

    // climate_zones: non-empty array of strings matching pattern [0-9]{1,2}[ab]?
    // (z.B. "7a", "8b", "11"); USDA-Zonen 1-13
    if (!Array.isArray(gm.climate_zones) || gm.climate_zones.length === 0) {
      throw new ValidationError('garden_meta.climate_zones', 'must be a non-empty array');
    }
    const CLIMATE_ZONE_RE = /^[0-9]{1,2}[ab]?$/;
    for (const z of gm.climate_zones) {
      if (typeof z !== 'string' || !CLIMATE_ZONE_RE.test(z)) {
        throw new ValidationError('garden_meta.climate_zones', `invalid climate zone '${z}'`);
      }
    }

    // sowing_window: object with optional indoor / outdoor_direct / transplant MonthRanges
    // (Aussaat-Fenster; alle Sub-Felder optional, aber wenn gesetzt: valider MonthRange)
    if (!gm.sowing_window || typeof gm.sowing_window !== 'object') {
      throw new ValidationError('garden_meta.sowing_window', 'must be an object');
    }
    const SOWING_KEYS = ['indoor', 'outdoor_direct', 'transplant'] as const;
    for (const key of SOWING_KEYS) {
      if (gm.sowing_window[key] !== undefined) {
        validateMonthRange(gm.sowing_window[key], `garden_meta.sowing_window.${key}`);
      }
    }

    // harvest_window: required MonthRange
    if (gm.harvest_window === undefined) {
      throw new ValidationError('garden_meta.harvest_window', 'is required');
    }
    validateMonthRange(gm.harvest_window, 'garden_meta.harvest_window');

    // days_to_harvest: positive number
    if (typeof gm.days_to_harvest !== 'number' || gm.days_to_harvest <= 0) {
      throw new ValidationError('garden_meta.days_to_harvest', 'must be a positive number');
    }

    // spacing_cm: positive number
    if (typeof gm.spacing_cm !== 'number' || gm.spacing_cm <= 0) {
      throw new ValidationError('garden_meta.spacing_cm', 'must be a positive number');
    }

    // garden_type: non-empty array of known values
    const GARDEN_TYPES = ['balcony', 'raised_bed', 'field', 'greenhouse'];
    if (!Array.isArray(gm.garden_type) || gm.garden_type.length === 0) {
      throw new ValidationError('garden_meta.garden_type', 'must be a non-empty array');
    }
    for (const t of gm.garden_type) {
      if (!GARDEN_TYPES.includes(t)) {
        throw new ValidationError('garden_meta.garden_type', `unknown value '${t}'`);
      }
    }

    // difficulty: 1 | 2 | 3
    if (![1, 2, 3].includes(gm.difficulty)) {
      throw new ValidationError('garden_meta.difficulty', 'must be 1, 2 or 3');
    }
  }

  // === Companion-planting field — optional, but if present must be fully valid ===
  // (Mischkultur-Feld — optional; wenn vorhanden, muss alles stimmen)
  if (p.companion_planting !== undefined) {
    const cp = p.companion_planting;
    if (!cp || typeof cp !== 'object') {
      throw new ValidationError('companion_planting', 'must be an object when present');
    }

    // good_partners + bad_partners: required arrays of strings (may be empty);
    // (Pflicht-Arrays von Strings; dürfen leer sein, beide gleichzeitig leer ist OK)
    if (!Array.isArray(cp.good_partners)) {
      throw new ValidationError('companion_planting.good_partners', 'must be an array');
    }
    for (const s of cp.good_partners) {
      if (typeof s !== 'string' || s.length === 0) {
        throw new ValidationError('companion_planting.good_partners', `entry '${s}' must be a non-empty string`);
      }
    }

    if (!Array.isArray(cp.bad_partners)) {
      throw new ValidationError('companion_planting.bad_partners', 'must be an array');
    }
    for (const s of cp.bad_partners) {
      if (typeof s !== 'string' || s.length === 0) {
        throw new ValidationError('companion_planting.bad_partners', `entry '${s}' must be a non-empty string`);
      }
    }

    // neutral: optional array of strings
    if (cp.neutral !== undefined) {
      if (!Array.isArray(cp.neutral)) {
        throw new ValidationError('companion_planting.neutral', 'must be an array when present');
      }
      for (const s of cp.neutral) {
        if (typeof s !== 'string' || s.length === 0) {
          throw new ValidationError('companion_planting.neutral', `entry '${s}' must be a non-empty string`);
        }
      }
    }

    // notes_de / notes_en: optional strings
    if (cp.notes_de !== undefined && typeof cp.notes_de !== 'string') {
      throw new ValidationError('companion_planting.notes_de', 'must be a string when present');
    }
    if (cp.notes_en !== undefined && typeof cp.notes_en !== 'string') {
      throw new ValidationError('companion_planting.notes_en', 'must be a string when present');
    }

    // reasons: optional map slug → { de, en }
    // (Begründungen pro Beziehung — optional; wenn gesetzt: Format prüfen)
    if (cp.reasons !== undefined) {
      if (!cp.reasons || typeof cp.reasons !== 'object' || Array.isArray(cp.reasons)) {
        throw new ValidationError('companion_planting.reasons', 'must be an object map when present');
      }
      for (const [slug, val] of Object.entries(cp.reasons)) {
        if (typeof slug !== 'string' || slug.length === 0) {
          throw new ValidationError('companion_planting.reasons', `key '${slug}' must be a non-empty slug string`);
        }
        const r = val as any;
        if (!r || typeof r !== 'object' || typeof r.de !== 'string' || typeof r.en !== 'string') {
          throw new ValidationError(
            `companion_planting.reasons['${slug}']`,
            'must be { de: string, en: string }'
          );
        }
        if (r.de.length === 0 || r.en.length === 0) {
          throw new ValidationError(
            `companion_planting.reasons['${slug}']`,
            'de and en must be non-empty strings'
          );
        }
      }
    }

    // source: required non-empty string
    requireString(cp, 'source');
  }

  // === Welle O.1: top-level constituents[] — optional ===
  if (p.constituents !== undefined) {
    if (!Array.isArray(p.constituents)) {
      throw new ValidationError('constituents', 'must be an array when present');
    }
    for (const [i, c] of p.constituents.entries()) {
      if (!c || typeof c.name !== 'string' || c.name.length === 0) {
        throw new ValidationError(`constituents[${i}].name`, 'must be a non-empty string');
      }
      if (!CONSTITUENT_CATEGORIES.includes(c.category)) {
        throw new ValidationError(`constituents[${i}].category`, `unknown category '${c.category}'`);
      }
      if (c.percent_range !== undefined && typeof c.percent_range !== 'string') {
        throw new ValidationError(`constituents[${i}].percent_range`, 'must be a string when present');
      }
      if (c.plant_part !== undefined && !PLANT_PARTS.includes(c.plant_part)) {
        throw new ValidationError(`constituents[${i}].plant_part`, `unknown plant_part '${c.plant_part}'`);
      }
      if (c.note !== undefined) {
        requireLocalizedString(c, 'note');
      }
    }
  }

  // === Welle O.1: top-level harvest[] — optional ===
  if (p.harvest !== undefined) {
    if (!Array.isArray(p.harvest)) {
      throw new ValidationError('harvest', 'must be an array when present');
    }
    for (const [i, h] of p.harvest.entries()) {
      if (!h || !PLANT_PARTS.includes(h.plant_part)) {
        throw new ValidationError(`harvest[${i}].plant_part`, `unknown plant_part '${h?.plant_part}'`);
      }
      if (!Array.isArray(h.best_months) || h.best_months.length === 0) {
        throw new ValidationError(`harvest[${i}].best_months`, 'must be a non-empty array');
      }
      for (const m of h.best_months) {
        if (!Number.isInteger(m) || m < 1 || m > 12) {
          throw new ValidationError(`harvest[${i}].best_months`, `month ${m} out of range 1-12`);
        }
      }
      if (h.time_of_day !== undefined) {
        requireLocalizedString(h, 'time_of_day');
      }
      if (h.drying !== undefined) {
        requireLocalizedString(h, 'drying');
      }
      if (h.storage_months !== undefined && (typeof h.storage_months !== 'number' || h.storage_months <= 0)) {
        throw new ValidationError(`harvest[${i}].storage_months`, 'must be a positive number when present');
      }
      if (h.storage_condition !== undefined) {
        requireLocalizedString(h, 'storage_condition');
      }
    }
  }

  // === Permaculture functions — optional, but if present must be a non-empty
  // array of known enum values ===
  // (Permakultur-Funktionen — optional; wenn vorhanden, alles validieren)
  if (p.permaculture_functions !== undefined) {
    if (!Array.isArray(p.permaculture_functions) || p.permaculture_functions.length === 0) {
      throw new ValidationError('permaculture_functions', 'must be a non-empty array when present');
    }
    const seen = new Set<string>();
    for (const v of p.permaculture_functions) {
      if (typeof v !== 'string' || !PERMACULTURE_FUNCTIONS.includes(v as PermacultureFunction)) {
        throw new ValidationError('permaculture_functions', `unknown value '${v}'`);
      }
      if (seen.has(v)) {
        throw new ValidationError('permaculture_functions', `duplicate value '${v}'`);
      }
      seen.add(v);
    }
  }
}

// === Welle O.1: Preparation validator ===
// (Strukturierte Zubereitung — alle Felder optional, aber wenn gesetzt: prüfen.)
function validatePreparation(prep: any, field: string): void {
  if (!prep || typeof prep !== 'object') {
    throw new ValidationError(field, 'must be an object when present');
  }
  if (prep.amount_dry_g !== undefined) {
    const a = prep.amount_dry_g;
    if (!a || typeof a.min !== 'number' || typeof a.max !== 'number') {
      throw new ValidationError(`${field}.amount_dry_g`, 'must be { min: number, max: number }');
    }
    if (a.min < 0 || a.max < a.min) {
      throw new ValidationError(`${field}.amount_dry_g`, 'must have min ≥ 0 and max ≥ min');
    }
  }
  if (prep.amount_ml !== undefined) {
    const a = prep.amount_ml;
    if (!a || typeof a.min !== 'number' || typeof a.max !== 'number') {
      throw new ValidationError(`${field}.amount_ml`, 'must be { min: number, max: number }');
    }
    if (a.min < 0 || a.max < a.min) {
      throw new ValidationError(`${field}.amount_ml`, 'must have min ≥ 0 and max ≥ min');
    }
  }
  for (const numKey of ['water_ml', 'steep_min', 'doses_per_day', 'max_duration_weeks'] as const) {
    if (prep[numKey] !== undefined) {
      const v = prep[numKey];
      if (typeof v !== 'number' || v <= 0) {
        throw new ValidationError(`${field}.${numKey}`, 'must be a positive number when present');
      }
    }
  }
  if (prep.instructions !== undefined) {
    requireLocalizedString(prep, 'instructions');
  }
}

/**
 * Validate a MonthRange (start_month, end_month each integer 1-12).
 * Year-wrap (start_month > end_month) is allowed by design (e.g. Nov-Feb for
 * Mediterranean herbs / winter vegetables) — see TODO_v1.0_selbstversorger.md Task 1.
 * (Monats-Bereich validieren; Jahreswechsel-Wrap ist absichtlich erlaubt.)
 */
function validateMonthRange(mr: any, field: string): void {
  if (!mr || typeof mr !== 'object') {
    throw new ValidationError(field, 'must be an object');
  }
  if (!Number.isInteger(mr.start_month) || mr.start_month < 1 || mr.start_month > 12) {
    throw new ValidationError(`${field}.start_month`, `month ${mr.start_month} out of range 1-12`);
  }
  if (!Number.isInteger(mr.end_month) || mr.end_month < 1 || mr.end_month > 12) {
    throw new ValidationError(`${field}.end_month`, `month ${mr.end_month} out of range 1-12`);
  }
  // Note: start_month > end_month is intentionally allowed (year-wrap).
}
