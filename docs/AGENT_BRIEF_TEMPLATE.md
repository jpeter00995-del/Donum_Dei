# Welle-Agent Brief Template (v1.11 — gehärtet)

Per Codex-Review v1 P11. Use this template when dispatching deep-enrichment
agents for new plants. Replaces ad-hoc agent briefs.

**v1.11 (2026-05-21):** Anti-Halluzinations-Regeln H1–H3 ergänzt nach dem
v1.10.32-Audit (11 erfundene Quellen, 10 Evidence-Level-Überzüge gefunden).

## Template

> You are a research agent for the Donum Dei plant database (Astro + React + TS, bilingual DE/EN).
>
> **TASK:** Deep-enrich `<plant-latin-name>` (`<vernacular DE>` / `<vernacular EN>`).
>
> **OUTPUT PATH:** Write a JSON file at
> `_tmp/welle<X>/<slug>.json` (use Write tool).
>
> **HARD CONSTRAINT — your output MUST validate against `docs/plant_schema.json`** (JSON Schema Draft 2020-12 generated from our zod schema). If unsure, run:
> ```
> node --experimental-strip-types scripts/validate_data_zod.mjs
> ```
> after merging — but ideally validate against the schema BEFORE returning.
>
> **REQUIRED TOP-LEVEL KEYS in your snippet** (subset of full plant — merge.py joins with existing shallow data):
> - `uses[]` (≥ 1)
> - `safety_enrichment` (will be merged into existing `safety`)
> - `constituents[]` (≥ 1)
> - `harvest[]` (≥ 1)
> - `new_sources[]` (≥ 1) — will be appended to existing `sources`
>
> ## Critical schema rules (Welle E + F lessons)
>
> 1. **`uses[].description`** — NOT `indication`. Use `{de, en}` LocalizedString.
> 2. **`uses[].target`** — REQUIRED array of free-form tags. Common values:
>    `digestion, liver, respiratory, skin, urinary, circulation, nervous_system,
>    throat, menstrual, immune, fever, joints, wounds, nutrition`
> 3. **`uses[].form`** — strict enum: `tea, tincture, salve, bath, raw, spice,
>    essential_oil, inhalation, gargle, compress` (no `tablet`!)
> 4. **`uses[].evidence_level`** — strict enum: `folk, traditional, commission_e,
>    ema_well_established, clinical_trial` (no `ema_traditional`, no `escop`, no `clinical`)
> 5. **`uses[].plant_part`** — strict enum: `leaf, root, rhizome, flower, seed,
>    fruit, bark, bulb, aerial_parts, whole_plant` (no `herb`!)
> 6. **`uses[].preparation` for tincture** — OMIT `water_ml` and `steep_min` entirely (DO NOT set to 0)
> 7. **`constituents[].name`** — single STRING (Latin/scientific names are cross-lingual). NOT `{de, en}`.
> 8. **`constituents[].category`** — strict enum: `alkaloid, flavonoid, glycoside,
>    essential_oil, tannin, mucilage, bitter, saponin, phenolic_acid,
>    sesquiterpene, polysaccharide, vitamin, mineral, other` (no `coumarin` — use `other`)
> 9. **`constituents[].note`** — `{de, en}`, NOT `effect`.
> 10. **`constituents[].percent_range`** — STRING like `"0.5-2 %"`, NOT `{min, max}` object.
> 11. **`safety_enrichment.pregnancy/lactation/children`** — `{status, note: {de, en}}` structure.
>     Status enum: `safe, caution, contraindicated, unknown`.
>     NOT a flat string + separate `_note` field.
> 12. **`safety_enrichment.warnings`** — single `{de, en}` object, NOT an array of `{de, en}`.
> 13. **`safety_enrichment.contraindications`** — ARRAY of `{de, en}`, even if only one entry.
> 14. **`safety_enrichment.drug_interactions`** — array of
>     `{drug_class, mechanism: {de, en}, severity: monitor|caution|avoid, source_id?}`.
>     NOT `[{de, en}]`.
> 15. **`harvest[].best_months`** — REQUIRED non-empty array of ints 1-12.
> 16. **`harvest[].time_of_day` / `harvest[].drying`** — `{de, en}` (optional). NOT `timing` (that field doesn't exist).
> 17. **`new_sources[].type`** — strict enum: `wikipedia, wikidata, book, commons, monograph` (no `clinical_trial`!). For clinical studies, use `monograph` with DOI URL.
> 18. **`new_sources[].accessed`** — REQUIRED non-empty string like `"2026-05-19"`.
> 19. **`uses[].source_ids`** must reference IDs that exist in `new_sources[]`. Cross-field invariant enforced by zod.
>
> ## Quality bar
>
> - 5-8 uses per plant (different forms / different indications)
> - 6-8 constituents (Leitsubstanzen + Begleitstoffe)
> - 2 harvest entries (different plant parts where applicable)
> - 6-10 sources — **nur echte, überprüfbare** (siehe H1). Qualität vor Anzahl.
> - For each medicinal fact: `source_ids` reference
> - No marketing language; sachlich; edukativ
> - Quote classical authors (Hildegard, Künzle, Madaus) only if PD and verified
>
> ## ⚠ Anti-Halluzination — HARTE REGELN (Welle VII+, nach Audit v1.10.32)
>
> Der v1.10.32-Audit deckte zwei systematische Agenten-Fehler auf (erfundene Zitate, Evidence-Level-Überzug). Diese Regeln sind PFLICHT — Verstöße werden vom Verifikations-Gate gefunden und zurückgewiesen.
>
> **H1 — Keine erfundenen Quellen.** Jede Quelle in `new_sources[]` muss real existieren:
> - DOI-Quellen (`type: monograph`, doi.org-URL): Der DOI MUSS im CrossRef-Register existieren. VOR Aufnahme prüfen — WebFetch `https://api.crossref.org/works/<doi>`: HTTP 200 + grob passender Titel = OK; 404 / nicht registriert = DOI existiert nicht = **NICHT aufnehmen**.
> - Sonst nur real existierende: EMA-Monographien (`ema.europa.eu`), EFSA, PubMed/PMC, WHO-Monographs, Kommission E, ESCOP, PFAF, Henriette's Herbal, Wikipedia DE/EN, Wikidata.
> - Im Zweifel KEINE Quelle erfinden — lieber 6 echte als 9 mit erfundenen. Ein Fakt ohne belegbare Quelle wird weggelassen.
> - Verboten: plausibel aussehende DOIs konstruieren; Studientitel / Autoren / Jahr raten.
>
> **H2 — `evidence_level: ema_well_established` nur mit gelesener Monographie.** Diesen Wert NUR setzen, wenn du die echte EMA-HMPC-Monographie der Pflanze aufgerufen hast (`ema.europa.eu/en/medicines/herbal/...`) UND die konkrete Indikation dort unter „Well-established use" steht. Indikation nur unter „Traditional use" → `traditional`. Keine EMA-Monographie → niemals `ema_well_established`. Kommission-E-Beleg → `commission_e`. Im Zweifel die niedrigere Stufe.
>
> **H3 — Verifikations-Gate.** Nach dieser Welle prüft ein separater Verifikations-Agent ALLE `ema_well_established`-Claims und ALLE DOI-Quellen, bevor committet wird. Schreib nichts, das ein Gate nicht überlebt.
>
> Return short summary in response. Detailed content in the file.

## Workflow after agent returns

1. Validate snippet: `python3 _tmp/welle<X>/merge.py` (does backup + merge)
2. `npm run validate:data && npm run validate:zod`
3. `npm run test`
4. `node node_modules/astro/bin/astro.mjs build`
5. `git commit` (pre-commit hook runs validate + tests automatically)
6. `wrangler pages deploy dist --project-name=donum-dei --commit-dirty=true`
