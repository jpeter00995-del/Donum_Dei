#!/usr/bin/env node
// === 1. KONSTANTEN ===
// Export the Zod plant schema as JSON Schema for sub-agents to validate
// their output before submission.
// Per Codex-Review v1 P11: "Validator als CLI + JSON-Schema-Export. Sub-Agents
// sollten gegen maschinenlesbares Schema arbeiten, nicht gegen manuell kopierte Regeln."
//
// Usage:
//   npm run schema:export
//   → writes docs/plant_schema.json
//
// Then agents can be briefed with: "Your output MUST validate against
// docs/plant_schema.json (JSON Schema Draft 2020-12)."

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const OUTPUT = join(ROOT, 'docs', 'plant_schema.json');

// === 2. MAIN ===
async function main() {
  const mod = await import(`file://${join(ROOT, 'src', 'lib', 'plantSchema.ts')}`);
  const jsonSchema = z.toJSONSchema(mod.plantSchema);
  await writeFile(
    OUTPUT,
    JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://donum-dei.pages.dev/plant_schema.json',
      title: 'Donum Dei Plant Schema',
      description: 'Generated from src/lib/plantSchema.ts via z.toJSONSchema(). Source of truth — do not edit by hand.',
      generated: new Date().toISOString(),
      ...jsonSchema,
    }, null, 2) + '\n',
    'utf-8'
  );
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((err) => {
  console.error('Schema export failed:', err);
  process.exit(1);
});
