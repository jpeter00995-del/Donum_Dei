#!/usr/bin/env node
// === 1. KONSTANTEN ===
// Zod-based plant data validator. Single source of truth: src/lib/plantSchema.ts.
// Per Codex-Review v1 Pkt 2: zentrale Schema-Definition.
//
// Usage:
//   npm run validate:zod
//   node --experimental-strip-types scripts/validate_data_zod.mjs
//
// Exit codes: 0 = all valid, 1 = at least one failure, 2 = read/load error.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PLANTS_DIR = join(ROOT, 'src', 'data', 'plants');

// === 2. LOAD SCHEMA ===
async function loadSchema() {
  const mod = await import(`file://${join(ROOT, 'src', 'lib', 'plantSchema.ts')}`);
  return mod.plantSchema;
}

// === 3. MAIN ===
async function main() {
  const plantSchema = await loadSchema();
  const files = (await readdir(PLANTS_DIR))
    .filter((f) => f.endsWith('.json') && !f.includes('.backup'))
    .sort();

  let ok = 0;
  const failures = [];
  for (const file of files) {
    const path = join(PLANTS_DIR, file);
    let raw;
    try {
      raw = JSON.parse(await readFile(path, 'utf-8'));
    } catch (err) {
      failures.push({ file, error: `JSON parse: ${err.message}` });
      continue;
    }
    const result = plantSchema.safeParse(raw);
    if (result.success) {
      ok++;
    } else {
      const messages = result.error.issues.slice(0, 3).map(
        (i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`
      ).join('\n');
      failures.push({ file, error: `\n${messages}` });
    }
  }

  const total = ok + failures.length;
  if (failures.length === 0) {
    console.log(`OK: ${ok}/${total} plants valid (zod).`);
    process.exit(0);
  }
  console.error(`FAIL: ${failures.length}/${total} plants failed validation (zod):`);
  for (const f of failures) {
    console.error(`  ${f.file}: ${f.error}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(2);
});
