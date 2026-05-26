#!/usr/bin/env python3
"""
=== Welle M.3 — Toxicity heuristic migration ===

Adds `safety.toxicity_level` ('none' | 'caution' | 'toxic') and
`safety.pet_toxic` (boolean) to every plant JSON in src/data/plants/.

Heuristic — applied to `safety.warnings.{de,en}`, `safety.external_only`,
and `indoor_growing.pet_safe`:

  toxic     UPPERCASE 'GIFTIG' / 'TOXIC' / 'TÖDLICH' / 'DEADLY' / 'LETHAL'
            / 'FATAL' / 'POISONOUS' or 'lebensgefährlich' in warnings text
  caution   real warning signal (Schwangerschaft, Allergie, Verwechslung,
            rohe Samen, external_only=true, etc.) but not toxic
  none      safe-tone phrases ("keine bekannten Nebenwirkungen") or
            very short / empty warnings

Pet-toxic when warnings explicitly mention Hund/Katz/dog/cat near a
toxicity word, OR indoor_growing.pet_safe === false.

Writes back to JSON in-place with sorted keys + indent=2 + utf-8.
Also writes a review file: scripts/_toxicity_review_<timestamp>.md
listing all classifications so Maikel can spot-correct.

Usage:
    python3 scripts/migrate_toxicity_welleM3.py            # apply
    python3 scripts/migrate_toxicity_welleM3.py --dry-run  # report only
"""

# === 1. KONSTANTEN ===
import json
import re
import sys
import glob
import datetime
from pathlib import Path

PLANTS_DIR = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'plants'
SCRIPTS_DIR = Path(__file__).resolve().parent

UPPER_TOXIC_RE = re.compile(r'\b(GIFTIG|TOXIC|TÖDLICH|DEADLY|LETHAL|FATAL|POISONOUS)\b')
LIFE_DANGER_RE = re.compile(r'(lebensgefährlich|life-threatening)', re.IGNORECASE)

PET_TOXIC_RE = re.compile(
    r'(GIFTIG|TOXIC|POISON|toxisch).{0,40}(Hund|Katz|Tier|dog|cat|pet)',
    re.IGNORECASE | re.DOTALL,
)

SAFE_TONE_RE = re.compile(
    r'(keine bekannten? nebenwirkung|keine bekannten? gegenanzeig|gut verträglich|gut vertragen|'
    r'no known side effect|no known contraind|well tolerated)',
    re.IGNORECASE,
)

REAL_WARN_RE = re.compile(
    r'(schwanger|stillzeit|kinder|allerg|arzt|vorsicht|verwechs|überdosier|blutverdünner|'
    r'operation|nicht überschreiten|reizung|rohe? samen|rohe? blätt|gegenanzeige|'
    r'kontraindikat|große mengen|photosensib|sonneneinstrahlung|nicht innerlich|nur äußerlich|meiden|'
    r'pregnan|breastfeed|children|consult.{0,20}doctor|caution|overdose|blood thinner|surgery|'
    r'contraindicat|photosensitiv|large doses|raw seeds|raw leaves|avoid|external only)',
    re.IGNORECASE,
)


# === 2. CLASSIFY ===
def classify(plant: dict) -> tuple[str, bool]:
    """Return (toxicity_level, pet_toxic) for a single plant."""
    safety = plant.get('safety') or {}
    warnings = safety.get('warnings') or {}
    de = warnings.get('de') or ''
    en = warnings.get('en') or ''
    combined = de + ' ' + en
    external = bool(safety.get('external_only'))
    indoor = plant.get('indoor_growing') or {}
    pet_safe = indoor.get('pet_safe')

    is_toxic = bool(UPPER_TOXIC_RE.search(combined) or LIFE_DANGER_RE.search(combined))
    pet_toxic = bool(PET_TOXIC_RE.search(combined)) or (pet_safe is False)

    if is_toxic:
        return 'toxic', pet_toxic

    has_real = bool(REAL_WARN_RE.search(combined) or external)
    has_safe = bool(SAFE_TONE_RE.search(combined))

    if has_real:
        return 'caution', pet_toxic
    if has_safe or len(de.strip()) < 20:
        return 'none', pet_toxic

    # Conservative default — substantial text, no clear signal → caution
    return 'caution', pet_toxic


# === 3. APPLY ===
def main() -> int:
    dry_run = '--dry-run' in sys.argv
    files = sorted(PLANTS_DIR.glob('*.json'))
    if not files:
        print(f'No JSONs found in {PLANTS_DIR}', file=sys.stderr)
        return 1

    counts = {'none': 0, 'caution': 0, 'toxic': 0}
    pet_count = 0
    review_rows = []
    updated_files = 0

    for path in files:
        plant = json.loads(path.read_text(encoding='utf-8'))
        level, pet_toxic = classify(plant)
        counts[level] += 1
        if pet_toxic:
            pet_count += 1

        review_rows.append({
            'slug': plant['slug'],
            'level': level,
            'pet_toxic': pet_toxic,
            'warnings_de': (plant.get('safety') or {}).get('warnings', {}).get('de', '')[:140],
        })

        # Mutate
        if 'safety' not in plant:
            plant['safety'] = {'warnings': {'de': '', 'en': ''}, 'external_only': False}
        plant['safety']['toxicity_level'] = level
        plant['safety']['pet_toxic'] = pet_toxic

        if not dry_run:
            path.write_text(
                json.dumps(plant, ensure_ascii=False, indent=2) + '\n',
                encoding='utf-8',
            )
            updated_files += 1

    # Review file
    ts = datetime.datetime.now().strftime('%Y-%m-%d_%H%M')
    review_path = SCRIPTS_DIR / f'_toxicity_review_{ts}.md'
    lines = [
        f'# Toxicity Review — Welle M.3 ({ts})',
        '',
        f'Total: {sum(counts.values())} plants | toxic: {counts["toxic"]} | caution: {counts["caution"]} | none: {counts["none"]} | pet-toxic: {pet_count}',
        '',
        '_To correct a classification: edit `src/data/plants/<slug>.json` → `safety.toxicity_level` and `safety.pet_toxic`._',
        '',
        '| Level | 🐾 | Slug | Warnings (DE, kürzt) |',
        '|-------|----|------|---------------------|',
    ]
    for r in sorted(review_rows, key=lambda r: (
        {'toxic': 0, 'caution': 1, 'none': 2}[r['level']], r['slug']
    )):
        pet = '🐾' if r['pet_toxic'] else ''
        warn = r['warnings_de'].replace('|', '\\|').replace('\n', ' ')
        lines.append(f'| {r["level"]} | {pet} | {r["slug"]} | {warn} |')

    review_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    print(f'Distribution: {counts}  pet_toxic={pet_count}')
    if dry_run:
        print('(dry-run, no files written)')
    else:
        print(f'Updated {updated_files} plant JSONs in place.')
    print(f'Review file: {review_path.relative_to(Path.cwd())}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
