# === 1. ZWECK ===
# Drei Pflanzen stehen bei uns als haustiersicher, waehrend die ASPCA eine
# ANDERE Art derselben Gattung als giftig fuehrt. Das ist kein Beweis gegen
# unsere Art — aber es verschweigen waere unehrlich.
#
# Das Skript haengt je einen Satz an den Warntext. Kein Urteil, nur die
# Tatsache mit Namen der gelisteten Art.
#
# Nutzung:
#   python scripts/gattungs_hinweis.py               (Vorschau)
#   python scripts/gattungs_hinweis.py --schreiben

import json
import sys
from pathlib import Path

PFLANZEN = Path(__file__).parent.parent / "src" / "data" / "plants"

EINLEITUNG_DE = "Zur Gattung: "
EINLEITUNG_EN = "About the genus: "

# slug -> (deutscher Satz, englischer Satz)
HINWEISE = {
    "artemisia-vulgaris": (
        "Die ASPCA führt Estragon (Artemisia dracunculus) als giftig für Hunde und "
        "Katzen. Für den Beifuß selbst liegt dort keine Einstufung vor — die "
        "Gattung enthält jedoch dieselben Bitter- und Terpenstoffe. Im Zweifel "
        "vom Tier fernhalten.",
        "The ASPCA lists tarragon (Artemisia dracunculus) as toxic to dogs and cats. "
        "Mugwort itself is not classified there — but the genus contains the same "
        "bitter compounds and terpenes. When in doubt, keep it away from pets.",
    ),
    "juglans-regia": (
        "Die ASPCA führt die Schwarznuss (Juglans nigra) als giftig für Hunde. Für "
        "die Walnuss liegt dort keine Einstufung vor. Tierärztlich gilt vor allem "
        "schimmeliges Fallobst als gefährlich — es kann Zittergifte enthalten.",
        "The ASPCA lists black walnut (Juglans nigra) as toxic to dogs. The English "
        "walnut is not classified there. Veterinary practice regards mouldy fallen "
        "nuts as the main hazard — they can contain tremorgenic mycotoxins.",
    ),
    "primula-veris": (
        "Die ASPCA führt die Kissenprimel (Primula vulgaris) als giftig für Hunde "
        "und Katzen. Für die Schlüsselblume liegt dort keine Einstufung vor; die "
        "Giftinformationszentrale Bonn stuft sie als gering giftig ein. Die "
        "Saponine der Wurzel reizen den Magen-Darm-Trakt.",
        "The ASPCA lists common primrose (Primula vulgaris) as toxic to dogs and "
        "cats. Cowslip itself is not classified there; the Bonn poison centre rates "
        "it as slightly toxic. The saponins in the root irritate the digestive tract.",
    ),
}


# === 2. HILFE ===
def satz_setzen(text, einleitung, satz):
    """Haengt den Satz an oder ersetzt einen frueher geschriebenen."""
    i = text.find(einleitung)
    if i >= 0:
        text = text[:i].rstrip()
    return (text.rstrip() + " " + einleitung + satz).strip()


# === 3. LAUF ===
def lauf(schreiben):
    geaendert = 0
    for slug, (de, en) in HINWEISE.items():
        datei = PFLANZEN / f"{slug}.json"
        p = json.loads(datei.read_text(encoding="utf-8"))
        w = p.setdefault("safety", {}).setdefault("warnings", {"de": "", "en": ""})

        neu_de = satz_setzen(w.get("de") or "", EINLEITUNG_DE, de)
        neu_en = satz_setzen(w.get("en") or "", EINLEITUNG_EN, en)
        if (neu_de, neu_en) == (w.get("de"), w.get("en")):
            print(f"  {slug:22s} unveraendert")
            continue

        print(f"* {slug:22s} Gattungs-Hinweis gesetzt")
        if schreiben:
            w["de"], w["en"] = neu_de, neu_en
            datei.write_text(
                json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            geaendert += 1

    print()
    print(f"GESCHRIEBEN — {geaendert} Dateien." if schreiben
          else "(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
    return 0


if __name__ == "__main__":
    sys.exit(lauf("--schreiben" in sys.argv))
