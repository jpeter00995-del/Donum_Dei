# === 1. ZWECK ===
# Traegt die CliniTox-Befunde (scripts/daten/clinitox_treffer.json) in die
# Pflanzendaten ein.
#
# GRUNDSATZ: Der CliniTox-Giftgrad ist KEIN Hund/Katze-Urteil. Es ist ein
# allgemeiner Pflanzen-Giftgrad, der oft aus der Nutztier-Medizin stammt.
# Salbei zum Beispiel steht dort als "schwach giftig (+)", waehrend die ASPCA
# ihn ausdruecklich als ungiftig fuer Hunde und Katzen fuehrt. Deshalb wird
# der Grad NICHT automatisch in `pet_toxic` umgemuenzt, sondern als das
# gezeigt, was er ist: ein Hinweis mit Quelle (`safety.tox_note`).
#
# Umgestuft wird nur, wo es einen tierspezifischen Grund gibt — die Liste
# UMSTUFEN unten nennt ihn je Pflanze.
#
# Nutzung:
#   python scripts/clinitox_uebernehmen.py               (Vorschau)
#   python scripts/clinitox_uebernehmen.py --schreiben

import json
import sys
from pathlib import Path

WURZEL = Path(__file__).parent.parent
PFLANZEN = WURZEL / "src" / "data" / "plants"
TREFFER = Path(__file__).parent / "daten" / "clinitox_treffer.json"

# === 2. BEGRUENDETE UMSTUFUNGEN ===
# slug -> (deutscher Grund, englischer Grund)
# Nur Faelle, in denen der Schaden bei Hund oder Katze belegt ist.
UMSTUFEN = {
    "allium-ursinum": (
        "Alle vier von der ASPCA geführten Allium-Arten (Zwiebel, Knoblauch, "
        "Schnittlauch, Lauch) sind für Hunde und Katzen giftig; CliniTox führt "
        "Bärlauch als giftig und nennt ausdrücklich „andere Allium-Arten – giftig“. "
        "Wirkung: Zerstörung roter Blutkörperchen.",
        "All four Allium species listed by the ASPCA (onion, garlic, chives, leek) are "
        "toxic to dogs and cats; CliniTox lists wild garlic as toxic and explicitly "
        "names 'other Allium species - toxic'. Mechanism: destruction of red blood cells.",
    ),
    "quercus-robur": (
        "Eichel- und Blattvergiftung beim Hund ist ein tiermedizinischer "
        "Standardfall (Gerbstoffe, Magen-Darm- und Nierenschäden). CliniTox: "
        "giftig +, Giftzentrale Bonn: gering giftig bis giftig.",
        "Acorn and leaf poisoning in dogs is a standard veterinary case (tannins, "
        "gastrointestinal and kidney damage). CliniTox: toxic +, poison centre Bonn: "
        "slightly to moderately toxic.",
    ),
    "phaseolus-vulgaris-nanus": (
        "Rohe Bohnen enthalten Phasin (ein Lektin), das auch bei Hund und Katze "
        "Erbrechen und Durchfall auslöst. CliniTox: stark giftig ++. Gekochte "
        "Bohnen sind unbedenklich.",
        "Raw beans contain phasin (a lectin) that causes vomiting and diarrhoea in dogs "
        "and cats too. CliniTox: strongly toxic ++. Cooked beans are harmless.",
    ),
    "phaseolus-vulgaris-vulgaris": (
        "Rohe Bohnen enthalten Phasin (ein Lektin), das auch bei Hund und Katze "
        "Erbrechen und Durchfall auslöst. CliniTox: stark giftig ++. Gekochte "
        "Bohnen sind unbedenklich.",
        "Raw beans contain phasin (a lectin) that causes vomiting and diarrhoea in dogs "
        "and cats too. CliniTox: strongly toxic ++. Cooked beans are harmless.",
    ),
}


# === 3. HILFE ===
def satz_ersetzen(text, einleitung, grund):
    """Haengt den Satz an oder ersetzt einen frueher geschriebenen."""
    i = text.find(einleitung)
    if i >= 0:
        text = text[:i].rstrip()
    return (text.rstrip() + " " + einleitung + grund).strip()


# === 4. LAUF ===
def lauf(schreiben):
    daten = json.loads(TREFFER.read_text(encoding="utf-8"))
    abgerufen = daten["abgerufen"]
    notiert = umgestuft = 0

    for z in daten["pflanzen"]:
        if not z["giftgrade"]:
            continue
        datei = PFLANZEN / f"{z['slug']}.json"
        p = json.loads(datei.read_text(encoding="utf-8"))
        sicherheit = p.setdefault("safety", {})
        aenderung = False

        # --- Hinweis mit Quelle ---
        name, wert = sorted(z["giftgrade"].items())[0]
        notiz = {
            "source": "clinitox",
            "accessed": abgerufen,
            "grade": wert["grad"],
            "entry_name": name,
            "url": wert["url"],
        }
        if sicherheit.get("tox_note") != notiz:
            sicherheit["tox_note"] = notiz
            aenderung = True
        notiert += 1

        quell_id = "src_clinitox_" + z["slug"].replace("-", "_")
        if not any(s.get("id") == quell_id for s in p.get("sources", [])):
            p.setdefault("sources", []).append({
                "id": quell_id,
                "type": "monograph",
                "title": f"CliniTox Giftpflanzen — {name}: {wert['grad']} "
                         f"(Institut für Veterinärpharmakologie und -toxikologie, "
                         f"Universität Zürich)",
                "url": wert["url"],
                "accessed": abgerufen,
            })
            aenderung = True

        # --- begruendete Umstufung ---
        if z["slug"] in UMSTUFEN:
            grund_de, grund_en = UMSTUFEN[z["slug"]]
            if sicherheit.get("pet_toxic") is not True:
                sicherheit["pet_toxic"] = True
                umgestuft += 1
                print(f"* {z['slug']:30s} pet_toxic -> True ({wert['grad']})")
                aenderung = True
            w = sicherheit.setdefault("warnings", {"de": "", "en": ""})
            # Vorhandenen Satz ersetzen statt daneben schreiben — sonst
            # sammeln sich bei jeder Textkorrektur Dubletten an.
            neu_de = satz_ersetzen(w.get("de") or "", "Für Hunde und Katzen giftig: ", grund_de)
            neu_en = satz_ersetzen(w.get("en") or "", "Toxic to dogs and cats: ", grund_en)
            if (neu_de, neu_en) != (w.get("de"), w.get("en")):
                w["de"], w["en"] = neu_de, neu_en
                aenderung = True
            indoor = p.get("indoor_growing")
            if indoor and "pet_safe" in indoor and indoor["pet_safe"] is not False:
                indoor["pet_safe"] = False
                aenderung = True

        if aenderung and schreiben:
            datei.write_text(
                json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )

    print()
    print(f"CliniTox-Hinweis gesetzt bei: {notiert} Pflanzen")
    print(f"Begruendet umgestuft:         {umgestuft}")
    print("GESCHRIEBEN." if schreiben
          else "(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
    return 0


if __name__ == "__main__":
    sys.exit(lauf("--schreiben" in sys.argv))
