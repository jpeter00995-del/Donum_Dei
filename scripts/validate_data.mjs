#!/usr/bin/env node
// === 1. KONSTANTEN ===
// Standalone data validator. Runs the same validatePlant() as the Astro build.
// Used by: `npm run validate:data`, pre-commit hook, future CI.
// Exit codes: 0 = all valid, 1 = at least one failure, 2 = read/load error.
//
// Why: Per Codex-Review v1, schema bugs from agent-merged content should fail
// fast (not at build time, not at runtime). This CLI gives sub-second feedback.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// Allow .ts imports from this .mjs script (Node 22+ via tsx loader if installed,
// else use a small in-process loader). We avoid that complexity by re-implementing
// the minimal type-stripping that vitest already does: just dynamic-import the .ts.
// Node 22.12+ supports --experimental-strip-types — try that first.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PLANTS_DIR = join(ROOT, 'src', 'data', 'plants');

// === 2. LOAD VALIDATOR ===
// Use tsx via dynamic-import if available; else fall back to a shipped node loader.
async function loadValidator() {
  try {
    const mod = await import(`file://${join(ROOT, 'src', 'lib', 'validatePlant.ts')}`);
    return mod.validatePlant;
  } catch (err) {
    console.error('Failed to import validatePlant.ts directly. Trying tsx fallback.');
    console.error('Run: node --experimental-strip-types scripts/validate_data.mjs');
    console.error('Or:  npx tsx scripts/validate_data.mjs');
    throw err;
  }
}

// === 3. MAIN ===
async function main() {
  const validatePlant = await loadValidator();

  let files;
  try {
    files = (await readdir(PLANTS_DIR))
      .filter((f) => f.endsWith('.json') && !f.includes('.backup'))
      .sort();
  } catch (err) {
    console.error(`Cannot read ${PLANTS_DIR}: ${err.message}`);
    process.exit(2);
  }

  let ok = 0;
  const failures = [];
  for (const file of files) {
    const path = join(PLANTS_DIR, file);
    let raw;
    try {
      raw = JSON.parse(await readFile(path, 'utf-8'));
    } catch (err) {
      failures.push({ file, error: `JSON parse error: ${err.message}` });
      continue;
    }
    try {
      validatePlant(raw);
      ok++;
    } catch (err) {
      failures.push({ file, error: err.message });
    }
  }

  const total = ok + failures.length;
  if (failures.length === 0) {
    console.log(`OK: ${ok}/${total} plants valid.`);
    process.exit(0);
  }
  console.error(`FAIL: ${failures.length}/${total} plants failed validation:`);
  for (const f of failures) {
    console.error(`  ${f.file}: ${f.error}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(2);
});
