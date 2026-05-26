// === 1. IMPORTS ===
import type { Plant } from './types';
import symptomsData from '@/data/symptoms.json';

// === 2. TYPES ===

/**
 * A single symptom definition loaded from symptoms.json.
 * (Eine Symptom-Definition aus symptoms.json.)
 */
export interface Symptom {
  id: string;
  emoji: string;
  name_de: string;
  name_en: string;
  /** Free-text keywords (DE+EN) used for autocomplete matching. */
  keywords: string[];
  /** Plant `uses[].target` values that count as a strong match. */
  target_matches: string[];
}

/**
 * Result of `findPlantsForSymptom`: one plant plus its match score and
 * the concrete terms that triggered the match (for debugging/UI hints).
 * (Ergebnis einer Symptom-Suche; Plant + Score + getroffene Terme.)
 */
export interface SymptomMatch {
  plant: Plant;
  /** Higher = better match. Capped at 100 for UI consistency. */
  score: number;
  /** Distinct terms that contributed to the match. */
  matched_terms: string[];
}

interface SymptomsFile {
  _meta: {
    version: number;
    disclaimer_de: string;
    disclaimer_en: string;
  };
  symptoms: Symptom[];
}

// === 3. CONSTANTS ===

// Score weights — keep in sync with the SKILL.md / JSDoc table.
const SCORE_TARGET_HIT = 30;
const SCORE_USE_DESC_HIT = 15;
const SCORE_TEASER_HIT = 10;
const SCORE_DESCRIPTION_HIT = 5;

const SCORE_CAP = 100;

const FILE = symptomsData as SymptomsFile;

// === 4. PUBLIC API — SYMPTOM CATALOGUE ===

/**
 * Returns all symptoms as defined in symptoms.json (preserves order).
 * (Alle Symptome in der Reihenfolge der JSON-Datei.)
 */
export function getAllSymptoms(): Symptom[] {
  return FILE.symptoms;
}

/**
 * Lookup a single symptom by its stable id.
 * Returns null when the id is unknown.
 */
export function getSymptomById(id: string): Symptom | null {
  return FILE.symptoms.find((s) => s.id === id) ?? null;
}

/**
 * Disclaimer string per locale — same text shown above every result list.
 */
export function getSymptomDisclaimer(locale: 'de' | 'en'): string {
  return locale === 'de' ? FILE._meta.disclaimer_de : FILE._meta.disclaimer_en;
}

// === 5. PUBLIC API — PLANT MATCHING ===

/**
 * Finds plants that are traditionally used for a given symptom.
 *
 * Match strategy:
 *   1. Look up the symptom by id (returns [] for unknown ids).
 *   2. For each plant, score against every `uses[]` entry plus the plant's
 *      teaser / description fields.
 *      - `uses[].target` contains a `target_match`     → +30 per distinct target
 *      - `uses[].description.de/en` contains a keyword → +15 per distinct keyword
 *      - `teaser.de/en` contains a keyword             → +10 per distinct keyword
 *      - `description.de/en` contains a keyword        → +5 per distinct keyword
 *   3. Filter out plants with score 0, sort by score DESC then by localised
 *      name for a stable order, and return the top `maxResults` entries.
 *
 * Pure function — does not mutate `plants`, no I/O, deterministic.
 *
 * (Findet Pflanzen, die traditionell für ein Symptom verwendet werden.
 * Strategie: Target-Hits zählen am stärksten, dann uses-Description,
 * dann Teaser, dann Description. Pure function, deterministisch.)
 *
 * @param symptomId  Symptom id from symptoms.json (e.g. "erkaeltung")
 * @param plants     All plants
 * @param maxResults Max number of results (default 30)
 */
export function findPlantsForSymptom(
  symptomId: string,
  plants: readonly Plant[],
  maxResults: number = 30
): SymptomMatch[] {
  const symptom = getSymptomById(symptomId);
  if (!symptom) return [];

  const targetSet = new Set(symptom.target_matches.map((t) => t.toLowerCase()));
  const keywords = symptom.keywords.map((k) => k.toLowerCase()).filter((k) => k.length > 0);

  const matches: SymptomMatch[] = [];

  for (const plant of plants) {
    let score = 0;
    const matchedTerms = new Set<string>();

    // 5.1 — `uses[].target` hits (strongest signal).
    const plantTargets = new Set<string>();
    for (const use of plant.uses ?? []) {
      for (const t of use.target ?? []) {
        plantTargets.add(t.toLowerCase());
      }
    }
    for (const t of plantTargets) {
      if (targetSet.has(t)) {
        score += SCORE_TARGET_HIT;
        matchedTerms.add(t);
      }
    }

    // 5.2 — keyword hits in uses[].description (DE+EN combined haystack).
    const usesText = (plant.uses ?? [])
      .map((u) => `${u.description?.de ?? ''} ${u.description?.en ?? ''}`)
      .join(' ')
      .toLowerCase();
    if (usesText.length > 0) {
      for (const kw of keywords) {
        if (usesText.includes(kw)) {
          score += SCORE_USE_DESC_HIT;
          matchedTerms.add(kw);
        }
      }
    }

    // 5.3 — keyword hits in teaser (DE+EN).
    const teaserText = `${plant.teaser?.de ?? ''} ${plant.teaser?.en ?? ''}`.toLowerCase();
    if (teaserText.length > 0) {
      for (const kw of keywords) {
        if (teaserText.includes(kw)) {
          score += SCORE_TEASER_HIT;
          matchedTerms.add(kw);
        }
      }
    }

    // 5.4 — keyword hits in description (DE+EN, weakest signal).
    const descText = `${plant.description?.de ?? ''} ${plant.description?.en ?? ''}`.toLowerCase();
    if (descText.length > 0) {
      for (const kw of keywords) {
        if (descText.includes(kw)) {
          score += SCORE_DESCRIPTION_HIT;
          matchedTerms.add(kw);
        }
      }
    }

    if (score > 0) {
      matches.push({
        plant,
        score: Math.min(score, SCORE_CAP),
        matched_terms: Array.from(matchedTerms),
      });
    }
  }

  // 5.5 — Sort: score DESC, then alphabetical (Latin) for stable ordering.
  // Codex P21: consistent Intl.Collator instead of default localeCompare.
  const latinCollator = new Intl.Collator('en', { sensitivity: 'base' });
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return latinCollator.compare(a.plant.names.latin, b.plant.names.latin);
  });

  return matches.slice(0, maxResults);
}

// === 6. PUBLIC API — FREE-TEXT SYMPTOM SUGGESTIONS ===

/**
 * Free-text search: user types "kopfschmerzen" → we score that against every
 * symptom's keywords + display names and return the best matches.
 *
 * Score formula per symptom:
 *   - exact id match                              → +100
 *   - keyword starts with query                   → +50 per keyword
 *   - keyword contains query                      → +20 per keyword
 *   - display name (DE/EN) contains query         → +15 per locale-name hit
 *
 * Returns up to 3 suggestions sorted by score DESC.
 *
 * (Free-text Suche: tippt User "kopfschmerzen" → wir matchen gegen alle
 * Symptom-Keywords und finden den besten Match.)
 *
 * @param query  Free-text input (DE or EN)
 * @returns Top-3 symptom suggestions with match score
 */
export function suggestSymptoms(query: string): Array<{ symptom: Symptom; score: number }> {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const results: Array<{ symptom: Symptom; score: number }> = [];

  for (const symptom of FILE.symptoms) {
    let score = 0;

    // 6.1 — Exact id match (e.g. user typed "erkaeltung").
    if (symptom.id.toLowerCase() === q) {
      score += 100;
    }

    // 6.2 — Keyword scoring.
    for (const kw of symptom.keywords) {
      const k = kw.toLowerCase();
      if (k === q) {
        score += 100;
      } else if (k.startsWith(q)) {
        score += 50;
      } else if (k.includes(q)) {
        score += 20;
      }
    }

    // 6.3 — Display name scoring.
    if (symptom.name_de.toLowerCase().includes(q)) score += 15;
    if (symptom.name_en.toLowerCase().includes(q)) score += 15;

    if (score > 0) {
      results.push({ symptom, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}
