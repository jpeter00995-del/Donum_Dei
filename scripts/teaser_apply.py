# === 1. ZWECK ===
# Schreibt neue `teaser`-Texte in die Pflanzendateien — kontrolliert.
# Vorschau ist Standard; erst mit --schreiben wird wirklich geaendert.
# Nutzung:
#   python scripts/teaser_apply.py <vorschlaege.json>
#   python scripts/teaser_apply.py <vorschlaege.json> --schreiben
#
# Erwartetes Format der Vorschlagsdatei:
#   { "<slug>": { "de": "...", "en": "..." }, ... }

import json
import sys
import re
from pathlib import Path

# === 2. REGELN ===
MIN_LEN = 40
MAX_LEN = 210

# Wikipedia-Einleitungs-Floskeln (gleiche Logik wie scan_descriptions.mjs)
WIKI_MUSTER = [
    r"ist eine Pflanzenart",
    r"ist eine( \w+)? Art (der|aus der) Gattung",
    r"ist die einzige (Pflanzen)?art",
    r"innerhalb der Familie",
    r"Art der Gattung",
    r"commonly known as",
    r"\bis a species of\b",
    r"formerly (known as|classified)",
    r"is a (flowering|herbaceous|perennial|annual|biennial|deciduous) plant in the family",
    r"(of|in) the family [A-Z][a-z]+aceae",
]


# === 3. PRUEFUNG EINES VORSCHLAGS ===
def pruefe(slug, text, sprache, alt_text):
    fehler = []
    t = (text or "").strip()
    if not t:
        fehler.append(f"{slug} [{sprache}]: leer")
        return fehler
    if len(t) < MIN_LEN:
        fehler.append(f"{slug} [{sprache}]: zu kurz ({len(t)} Zeichen)")
    if len(t) > MAX_LEN:
        fehler.append(f"{slug} [{sprache}]: zu lang ({len(t)} Zeichen)")
    if t.endswith(("...", "…")):
        fehler.append(f"{slug} [{sprache}]: endet abgeschnitten")
    if "Wikipedia" in t or "folgt —" in t:
        fehler.append(f"{slug} [{sprache}]: Platzhalter-Rest")
    for muster in WIKI_MUSTER:
        if re.search(muster, t, re.IGNORECASE):
            fehler.append(f"{slug} [{sprache}]: Wikipedia-Floskel ({muster})")
    alt = (alt_text or "").strip().rstrip(". …")
    if alt and t[:60] == alt[:60]:
        fehler.append(f"{slug} [{sprache}]: gleicher Anfang wie der alte Text")
    return fehler


# === 4. HAUPTLAUF ===
def lauf(vorschlags_datei, schreiben):
    vorschlaege = json.loads(Path(vorschlags_datei).read_text(encoding="utf-8"))
    alle_fehler = []
    geplant = []

    for slug, neu in vorschlaege.items():
        pfad = Path("src/data/plants") / f"{slug}.json"
        if not pfad.exists():
            alle_fehler.append(f"{slug}: Datei fehlt")
            continue
        d = json.loads(pfad.read_text(encoding="utf-8"))
        alt = d.get("teaser") or {}
        for sprache in ("de", "en"):
            alle_fehler += pruefe(slug, neu.get(sprache), sprache, alt.get(sprache))
        geplant.append((pfad, d, neu, alt))

    # Doppelte Texte ueber alle Vorschlaege hinweg abfangen
    gesehen = {}
    for slug, neu in vorschlaege.items():
        for sprache in ("de", "en"):
            schluessel = (sprache, (neu.get(sprache) or "").strip().lower()[:70])
            if schluessel[1] and schluessel in gesehen:
                alle_fehler.append(f"{slug} [{sprache}]: gleicher Text wie {gesehen[schluessel]}")
            else:
                gesehen[schluessel] = slug

    if alle_fehler:
        print(f"ABBRUCH — {len(alle_fehler)} Problem(e):")
        for f in alle_fehler:
            print("  " + f)
        return 1

    print(f"OK — {len(geplant)} Pflanzen geprueft, keine Beanstandung.")
    if not schreiben:
        for pfad, d, neu, alt in geplant[:3]:
            print(f"\nVORSCHAU {d['slug']}")
            print(f"  alt de: {alt.get('de','')[:90]}")
            print(f"  neu de: {neu['de']}")
        print("\n(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
        return 0

    for pfad, d, neu, alt in geplant:
        d["teaser"]["de"] = neu["de"].strip()
        d["teaser"]["en"] = neu["en"].strip()
        pfad.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"GESCHRIEBEN — {len(geplant)} Dateien geaendert.")
    return 0


# === 5. EINSTIEG ===
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Aufruf: python scripts/teaser_apply.py <vorschlaege.json> [--schreiben]")
        sys.exit(2)
    sys.exit(lauf(sys.argv[1], "--schreiben" in sys.argv))
