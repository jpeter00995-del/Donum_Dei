# === 1. ZWECK ===
# Bei Tomate, Aubergine und Kartoffel ist die ASPCA-Einstufung "giftig fuer
# Hunde und Katzen" richtig, aber missverstaendlich: giftig ist das Kraut,
# nicht die reife Frucht bzw. die gesunde Knolle. Ohne diesen Zusatz liest
# sich die Seite so, als duerfe kein Hund je ein Stueck Tomate sehen.
#
# Der Zusatz haengt bewusst mit Gedankenstrich am ASPCA-Satz, statt ein
# eigener Satz zu sein: die Giftpflanzen-Listen zeigen als Begruendung genau
# einen Satz, ein zweiter ginge dort verloren.
#
# Wiederholbar: erkennt den eigenen Zusatz und laesst ihn stehen.
#
# Nutzung:
#   python scripts/nachtschatten_hinweis.py               (Vorschau)
#   python scripts/nachtschatten_hinweis.py --schreiben

import json
import re
import sys
from pathlib import Path

PFLANZEN = Path(__file__).parent.parent / "src" / "data" / "plants"

# === 2. TEXTE ===
# slug -> (deutscher Zusatz, englischer Zusatz), jeweils klein beginnend
ZUSATZ = {
    "solanum-lycopersicum": (
        "gemeint ist das Kraut (Blätter, Stängel, unreife grüne Früchte), "
        "reifes Tomatenfleisch in kleinen Mengen gilt als unbedenklich",
        "the toxic parts are the leaves, stems and unripe green fruit, while small "
        "amounts of ripe tomato flesh are considered harmless",
    ),
    "solanum-melongena": (
        "gemeint sind Blätter und Blüten, gegartes Fruchtfleisch in kleinen "
        "Mengen gilt als unbedenklich",
        "the toxic parts are the leaves and flowers, while small amounts of cooked "
        "fruit flesh are considered harmless",
    ),
    "solanum-tuberosum": (
        "gemeint sind Kraut, Keime und grüne Stellen der Knolle, gekochte "
        "grünfreie Kartoffel in kleinen Mengen gilt als unbedenklich",
        "the toxic parts are the foliage, sprouts and green patches on the tuber, "
        "while small amounts of cooked, green-free potato are considered harmless",
    ),
}

# Der pauschale ASPCA-Satz, an den der Zusatz angehaengt wird.
SATZ_DE = re.compile(r"(ASPCA-Einstufung \(abgerufen [\d-]+\): für [^.—]+?) ?\.")
SATZ_EN = re.compile(r"(ASPCA classification \(accessed [\d-]+\): toxic to [^.—]+?) ?\.")

# Frueherer Stand: Zusatz stand als eigener Satz dahinter. Wird eingesammelt.
ALT_DE = re.compile(r"\. ((?:Giftig|Gemeint) (?:ist|sind) (?:dabei )?[^.]+\.)")
ALT_EN = re.compile(r"\. (The toxic parts? (?:is|are) [^.]+\.)")


# === 3. LAUF ===
def anhaengen(text, muster, alt_muster, zusatz):
    # alten Zusatz-Satz entfernen, damit nichts doppelt steht
    text = alt_muster.sub(".", text)
    if f"— {zusatz}" in text:
        return text
    return muster.sub(lambda m: f"{m.group(1)} — {zusatz}.", text, count=1)


def lauf(schreiben):
    geaendert = 0
    for slug, (zu_de, zu_en) in ZUSATZ.items():
        datei = PFLANZEN / f"{slug}.json"
        d = json.loads(datei.read_text(encoding="utf-8"))
        w = d["safety"]["warnings"]

        neu_de = anhaengen(w["de"], SATZ_DE, ALT_DE, zu_de)
        neu_en = anhaengen(w["en"], SATZ_EN, ALT_EN, zu_en)

        if (neu_de, neu_en) == (w["de"], w["en"]):
            print(f"  {slug:24s} unveraendert")
            continue
        if f"— {zu_de}" not in neu_de or f"— {zu_en}" not in neu_en:
            print(f"! {slug:24s} ASPCA-Satz nicht gefunden — nichts geaendert")
            continue

        print(f"* {slug:24s} Hinweis ergaenzt")
        print(f"    DE ... {neu_de[-230:]}")
        if schreiben:
            w["de"], w["en"] = neu_de, neu_en
            datei.write_text(
                json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            geaendert += 1

    print()
    print(f"GESCHRIEBEN — {geaendert} Dateien." if schreiben
          else "(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
    return 0


if __name__ == "__main__":
    sys.exit(lauf("--schreiben" in sys.argv))
