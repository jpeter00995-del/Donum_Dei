# === 1. ZWECK ===
# Ersetzt die Bild-Beschreibungen (image.alt), in denen noch der Slug mit
# Unterstrich statt des echten Namens steht. Vorschau ist Standard.
# Nutzung: python scripts/fix_alt_texte.py [--schreiben]
#
# Die Quellen-URLs zu Wikipedia bleiben unangetastet — dort gehoert der
# Unterstrich zum Link.

import json
import sys
from pathlib import Path

# === 2. ZUORDNUNG ===
NEU = {
    "cinnamomum-verum":       ("de", "Foto von Echter Zimt"),
    "hippeastrum-vittatum":   ("de", "Foto von Ritterstern"),
    "hyssopus-officinalis":   ("de", "Foto von Echter Ysop"),
    "nepeta-cataria":         ("en", "Photo of catnip"),
    "potentilla-anserina":    ("de", "Foto von Gemeines Gänsefingerkraut"),
    "raphanus-sativus-niger": ("en", "Photo of black Spanish radish"),
}


# === 3. LAUF ===
def lauf(schreiben):
    for slug, (sprache, text) in NEU.items():
        pfad = Path("src/data/plants") / f"{slug}.json"
        d = json.loads(pfad.read_text(encoding="utf-8"))
        alt = (d.get("image") or {}).get("alt")
        if alt is None:
            print(f"UEBERSPRUNGEN {slug}: kein image.alt")
            continue
        print(f"{slug} [{sprache}]: {alt.get(sprache)!r} -> {text!r}")
        if schreiben:
            if "_" in text:
                print("ABBRUCH: neuer Text enthaelt Unterstrich")
                return 1
            alt[sprache] = text
            pfad.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("GESCHRIEBEN." if schreiben else "\n(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
    return 0


# === 4. EINSTIEG ===
if __name__ == "__main__":
    sys.exit(lauf("--schreiben" in sys.argv))
