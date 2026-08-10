# === 1. ZWECK ===
# Zweite Welle des ASPCA-Abgleichs: uebertraegt die Einstufung der ASPCA fuer
# ALLE Pflanzen, die dort gefuehrt werden (nicht nur die 28 Zimmerpflanzen aus
# Welle 1), und macht den Beleg im Datensatz sichtbar.
#
# Geschrieben wird je Treffer:
#   safety.pet_toxic          true / false laut ASPCA
#   safety.pet_check          Beleg: Quelle, Datum, Trefferart, ASPCA-Eintrag
#   safety.warnings.de/en     ein Satz mit der Einstufung
#   sources[]                 Verweis auf die ASPCA-Seite
#   indoor_growing.pet_safe   wird an safety.pet_toxic angeglichen
#
# Ausserdem: bei allen uebrigen Pflanzen wird `indoor_growing.pet_safe` mit
# `safety.pet_toxic` in Einklang gebracht — beide Felder standen bisher
# unabhaengig nebeneinander und widersprachen sich bei 16 Pflanzen.
#
# Nutzung:
#   python scripts/aspca_welle2.py               (Vorschau, schreibt nichts)
#   python scripts/aspca_welle2.py --schreiben

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aspca_abgleich import index_bauen, suchen, einstufung  # noqa: E402

WURZEL = Path(__file__).parent.parent
PFLANZEN = WURZEL / "src" / "data" / "plants"
ASPCA_DATEI = Path(__file__).parent / "daten" / "aspca_liste.json"
SEITE = "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/"

TREFFERART = {"exakt": "species", "aehnlich": "species", "gattung": "genus"}

# Die Listen-Kennungen aus dem Abgleich in englische Datenfelder uebersetzen
# (Daten und Code sind im Projekt englisch, nur Kommentare deutsch).
LISTEN_EN = {
    "giftig_hund": "toxic_dogs",
    "giftig_katze": "toxic_cats",
    "ungiftig_hund": "non_toxic_dogs",
    "ungiftig_katze": "non_toxic_cats",
}


# === 2. TEXTBAUSTEINE ===
def tiere(listen, giftig):
    marke = "giftig_" if giftig else "ungiftig_"
    namen = {"hund": ("Hunde", "dogs"), "katze": ("Katzen", "cats")}
    treffer = [namen[k] for k in ("hund", "katze") if marke + k in listen]
    if not treffer:
        return "", ""
    return (" und ".join(t[0] for t in treffer), " and ".join(t[1] for t in treffer))


def satz_de(giftig, listen, gattungsweit, abgerufen):
    wer, _ = tiere(listen, giftig)
    zusatz = " Die ASPCA stuft die ganze Gattung so ein." if gattungsweit else ""
    if giftig:
        return (f" ASPCA-Einstufung (abgerufen {abgerufen}): für {wer} giftig.{zusatz}")
    return (f" ASPCA-Einstufung (abgerufen {abgerufen}): für {wer} ungiftig.{zusatz}")


def satz_en(giftig, listen, gattungsweit, abgerufen):
    _, wer = tiere(listen, giftig)
    zusatz = " The ASPCA classifies the whole genus this way." if gattungsweit else ""
    if giftig:
        return (f" ASPCA classification (accessed {abgerufen}): toxic to {wer}.{zusatz}")
    return (f" ASPCA classification (accessed {abgerufen}): non-toxic to {wer}.{zusatz}")


# === 3. LAUF ===
def lauf(schreiben):
    daten = json.loads(ASPCA_DATEI.read_text(encoding="utf-8"))
    abgerufen = daten["abgerufen"]
    exakt, gattung = index_bauen(daten)

    gesetzt = 0
    gedreht = []
    angeglichen = []

    for datei in sorted(PFLANZEN.glob("*.json")):
        p = json.loads(datei.read_text(encoding="utf-8"))
        aenderung = False
        latein = (p.get("names") or {}).get("latin") or ""
        eintrag, art = suchen(latein, exakt, gattung)
        sicherheit = p.setdefault("safety", {})

        if eintrag:
            wert = einstufung(eintrag["listen"])
            if wert == "unklar":
                eintrag = None

        if eintrag:
            giftig = wert == "giftig"
            gattungsweit = art == "gattung"
            alt = sicherheit.get("pet_toxic")

            beleg = {
                "source": "aspca",
                "accessed": abgerufen,
                "match": TREFFERART[art],
                "entry": eintrag["slug"],
                "entry_name": eintrag["name"],
                "listing": [LISTEN_EN[k] for k in eintrag["listen"]],
            }
            if sicherheit.get("pet_check") != beleg:
                sicherheit["pet_check"] = beleg
                aenderung = True
            if alt != giftig:
                sicherheit["pet_toxic"] = giftig
                gedreht.append((p["slug"], alt, giftig, eintrag["name"], art))
                aenderung = True

            warnungen = sicherheit.setdefault("warnings", {"de": "", "en": ""})
            if "ASPCA-Einstufung" not in (warnungen.get("de") or ""):
                warnungen["de"] = (warnungen.get("de") or "").rstrip() + satz_de(
                    giftig, eintrag["listen"], gattungsweit, abgerufen
                )
                aenderung = True
            if "ASPCA classification" not in (warnungen.get("en") or ""):
                warnungen["en"] = (warnungen.get("en") or "").rstrip() + satz_en(
                    giftig, eintrag["listen"], gattungsweit, abgerufen
                )
                aenderung = True

            quell_id = f"src_aspca_{eintrag['slug'].replace('-', '_')}"
            if not any(s.get("id") == quell_id for s in p.get("sources", [])):
                p.setdefault("sources", []).append(
                    {
                        "id": quell_id,
                        "type": "monograph",
                        "title": f"ASPCA Animal Poison Control — {eintrag['name']} "
                                 f"({eintrag['lateinisch']})",
                        "url": SEITE + eintrag["slug"],
                        "accessed": abgerufen,
                    }
                )
                aenderung = True
            gesetzt += 1

        # --- indoor_growing.pet_safe an die eine Wahrheit angleichen ---
        indoor = p.get("indoor_growing")
        if indoor and "pet_safe" in indoor and sicherheit.get("pet_toxic") is not None:
            soll = sicherheit["pet_toxic"] is False
            if indoor["pet_safe"] != soll:
                angeglichen.append((p["slug"], indoor["pet_safe"], soll))
                indoor["pet_safe"] = soll
                aenderung = True

        if aenderung and schreiben:
            datei.write_text(
                json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )

    # === 4. BERICHT ===
    print(f"ASPCA-Beleg gesetzt bei:   {gesetzt} Pflanzen")
    print(f"Einstufung gedreht:        {len(gedreht)}")
    for slug, alt, neu, name, art in gedreht:
        print(f"   {slug:32s} pet_toxic {str(alt):5s} -> {str(neu):5s}  ({name}, {art})")
    print(f"indoor_growing.pet_safe angeglichen: {len(angeglichen)}")
    for slug, alt, neu in angeglichen:
        print(f"   {slug:32s} pet_safe {str(alt):5s} -> {str(neu):5s}")
    print()
    print("GESCHRIEBEN." if schreiben else "(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
    return 0


if __name__ == "__main__":
    sys.exit(lauf("--schreiben" in sys.argv))
