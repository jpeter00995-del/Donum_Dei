# === 1. ZWECK ===
# Uebernimmt geprueft Aenderungen an `description` und `names` in Pflanzendateien.
# Vorschau ist Standard; erst mit --schreiben wird geaendert.
# Nutzung: python scripts/patch_apply.py <patch.json> [--schreiben]
#
# Format:
#   { "<slug>": { "description": {"de": "...", "en": "..."},
#                 "names": {"de": "..."} }, ... }

import json
import sys
from pathlib import Path

# === 2. REGELN ===
MIN_BESCHR = 250
VERBOTEN = ("Wikipedia", "folgt —", "pending — see", "_")


# === 3. PRUEFUNG ===
def pruefe(slug, feld, sprache, text):
    fehler = []
    t = (text or "").strip()
    if not t:
        return [f"{slug} {feld}[{sprache}]: leer"]
    if feld == "description" and len(t) < MIN_BESCHR:
        fehler.append(f"{slug} {feld}[{sprache}]: zu kurz ({len(t)} Zeichen)")
    for wort in VERBOTEN:
        if wort in t:
            fehler.append(f"{slug} {feld}[{sprache}]: enthaelt '{wort}'")
    if t.endswith(("...", "…")):
        fehler.append(f"{slug} {feld}[{sprache}]: endet abgeschnitten")
    return fehler


# === 4. HAUPTLAUF ===
def lauf(datei, schreiben):
    patch = json.loads(Path(datei).read_text(encoding="utf-8"))
    fehler, geplant = [], []
    for slug, aend in patch.items():
        pfad = Path("src/data/plants") / f"{slug}.json"
        if not pfad.exists():
            fehler.append(f"{slug}: Datei fehlt")
            continue
        d = json.loads(pfad.read_text(encoding="utf-8"))
        for feld in ("description", "names"):
            for sprache, wert in (aend.get(feld) or {}).items():
                fehler += pruefe(slug, feld, sprache, wert)
        geplant.append((pfad, d, aend))

    if fehler:
        print(f"ABBRUCH — {len(fehler)} Problem(e):")
        for f in fehler:
            print("  " + f)
        return 1

    print(f"OK — {len(geplant)} Pflanzen geprueft, keine Beanstandung.")
    if not schreiben:
        pfad, d, aend = geplant[0]
        print(f"\nVORSCHAU {d['slug']}")
        print(f"  alt: {(d.get('description',{}).get('de') or '')[:80]}")
        print(f"  neu: {(aend.get('description',{}).get('de') or '')[:160]}")
        print("\n(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
        return 0

    for pfad, d, aend in geplant:
        for feld in ("description", "names"):
            for sprache, wert in (aend.get(feld) or {}).items():
                d.setdefault(feld, {})[sprache] = wert.strip()
        pfad.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"GESCHRIEBEN — {len(geplant)} Dateien geaendert.")
    return 0


# === 5. EINSTIEG ===
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Aufruf: python scripts/patch_apply.py <patch.json> [--schreiben]")
        sys.exit(2)
    sys.exit(lauf(sys.argv[1], "--schreiben" in sys.argv))
