#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Topfhaltung ableiten — der Teil, der OHNE KI geht.

Ausgangslage (gemessen 2026-08-02): 248 der 297 Pflanzen haben keinen
`indoor_growing`-Block. Ein Sprachmodell koennte ihn fuellen - aber nur
51 Pflanzen haben ueberhaupt Daten, aus denen sich etwas ableiten laesst.
Bei den uebrigen waere jede Angabe erfunden. Genau das hat Donum Dei schon
einmal die AdSense-Zulassung gekostet (damals abgeschrieben, diesmal waere
es ausgedacht).

Diese Datei macht deshalb nur, was WIRKLICH aus den vorhandenen Daten folgt:

    safety.pet_toxic        ->  indoor_growing.pet_safe
    garden_meta.difficulty  ->  indoor_growing.difficulty
    garden_meta.garden_type ->  indoor_growing.suitable (+ Begruendung)

Alles andere - Licht, Wasser, Boden, Topfgroesse, Pflegetipps - ist
Gartenwissen und wird hier NICHT geraten. Es landet in `_offen` und ist
damit die Arbeitsliste fuer den naechsten Schritt.

WICHTIG: Diese Datei aendert NIEMALS eine Pflanzendatei. Sie schreibt
Vorschlaege nach `_vorschlaege/indoor_growing/`. Was davon uebernommen wird,
entscheidet Maikel.

Start:
    python3 scripts/ableiten_indoor.py              # Bericht, schreibt nichts
    python3 scripts/ableiten_indoor.py --schreiben  # Vorschlaege ablegen
"""

# === 1. IMPORTE + PFADE ===

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLANTS = ROOT / "src" / "data" / "plants"
VORSCHLAEGE = ROOT / "_vorschlaege" / "indoor_growing"

# Was ein vollstaendiger indoor_growing-Block sonst noch enthaelt. Diese
# Felder kann nur ein Mensch oder eine belegte Quelle fuellen.
NICHT_ABLEITBAR = ["light", "water_frequency", "soil", "pot_size_cm",
                   "rooms", "tips", "purpose"]


# === 2. DIE ABLEITUNG (die ganze Fachlogik an einer Stelle) ===

def ableiten(pflanze: dict) -> dict:
    """
    Aus einer Pflanzendatei ableiten, was sich belegen laesst.

    Rueckgabe:
        {"indoor_growing": {...}, "_offen": [...]}
    Ein leeres `indoor_growing` heisst: hier gibt es nichts zu holen.
    """
    ig = {}
    herkunft = []

    sicherheit = pflanze.get("safety") or {}
    garten = pflanze.get("garden_meta") or {}

    # --- Haustiere: folgt direkt, nur umgedreht ---
    giftig = sicherheit.get("pet_toxic")
    if isinstance(giftig, bool):
        ig["pet_safe"] = not giftig
        herkunft.append("safety.pet_toxic")

    # --- Schwierigkeit: wird uebernommen, nicht geschaetzt ---
    schwierig = garten.get("difficulty")
    if isinstance(schwierig, int):
        ig["difficulty"] = schwierig
        herkunft.append("garden_meta.difficulty")

    # --- Topfeignung: folgt aus dem Gartentyp ---
    # Wichtig: ein ehrliches "nein, das ist eine Feldpflanze" ist eine
    # nuetzliche Angabe. Ein Balkongaertner ist damit besser bedient als
    # mit einem erfundenen Pflegetipp.
    typen = garten.get("garden_type") or []
    hinweis = []
    if typen:
        topf_geeignet = any(t in ("balcony", "greenhouse") for t in typen)
        if topf_geeignet:
            # KEIN suitable=true! Das Frontend rendert bei suitable===true die
            # ganze Zimmerpflanzen-Ansicht und greift dabei ungeprueft auf
            # light, water_frequency und purpose zu (PlantDetail.astro:179ff,
            # IndoorCards.tsx: `purpose.map` stuerzt sogar ab). Ohne diese
            # Felder waere ein JA hier eine kaputte Seite.
            # Das JA muss ein Mensch oder eine belegte Quelle setzen.
            hinweis.append("balkon_moeglich_laut_garden_type")
        else:
            ig["suitable"] = topf_geeignet
            herkunft.append("garden_meta.garden_type")
        if not topf_geeignet:
            lesbar = ", ".join(typen)
            ig["grund"] = {
                "de": f"In den Daten nur fuer {lesbar} vorgesehen - "
                      f"fuer Topf oder Balkon ist nichts hinterlegt.",
                "en": f"Recorded only for {lesbar} - nothing on file for "
                      f"pots or balconies.",
            }

    if ig:
        ig["_abgeleitet_aus"] = herkunft

    return {"indoor_growing": ig,
            "_offen": list(NICHT_ABLEITBAR) if ig else [],
            "_hinweis": hinweis}


# === 3. UEBER ALLE PFLANZEN LAUFEN ===

def durchlauf(schreiben: bool = False) -> dict:
    zahlen = {"gesamt": 0, "hat_schon": 0, "vorschlag": 0, "nichts": 0,
              "pet_safe": 0, "difficulty": 0, "suitable_ja": 0,
              "suitable_nein": 0}
    if schreiben:
        VORSCHLAEGE.mkdir(parents=True, exist_ok=True)

    for datei in sorted(PLANTS.glob("*.json")):
        try:
            pflanze = json.loads(datei.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        zahlen["gesamt"] += 1

        if pflanze.get("indoor_growing"):
            zahlen["hat_schon"] += 1
            continue

        ergebnis = ableiten(pflanze)
        ig = ergebnis["indoor_growing"]
        if not ig:
            zahlen["nichts"] += 1
            continue

        zahlen["vorschlag"] += 1
        if "pet_safe" in ig:
            zahlen["pet_safe"] += 1
        if "difficulty" in ig:
            zahlen["difficulty"] += 1
        if ig.get("suitable") is True:
            zahlen["suitable_ja"] += 1
        elif ig.get("suitable") is False:
            zahlen["suitable_nein"] += 1

        if schreiben:
            ergebnis["_slug"] = pflanze.get("slug") or datei.stem
            ergebnis["_name"] = (pflanze.get("names") or {}).get("de", "")
            ergebnis["_quelldatei"] = datei.name
            (VORSCHLAEGE / datei.name).write_text(
                json.dumps(ergebnis, ensure_ascii=False, indent=2),
                encoding="utf-8")

    return zahlen


# === 4. START ===

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--schreiben", action="store_true",
                   help="Vorschlaege nach _vorschlaege/indoor_growing/ ablegen")
    args = p.parse_args()

    z = durchlauf(schreiben=args.schreiben)

    print("=" * 60)
    print("Topfhaltung - was sich OHNE KI ableiten laesst")
    print("=" * 60)
    print(f"Pflanzendateien gesamt          : {z['gesamt']}")
    print(f"hat schon indoor_growing        : {z['hat_schon']}")
    print(f"Vorschlag moeglich              : {z['vorschlag']}")
    print(f"nichts ableitbar                : {z['nichts']}")
    print()
    print("Im Vorschlag enthalten:")
    print(f"  pet_safe (aus Giftigkeit)     : {z['pet_safe']}")
    print(f"  difficulty (uebernommen)      : {z['difficulty']}")
    print(f"  suitable = ja                 : {z['suitable_ja']}")
    print(f"  suitable = nein (mit Grund)   : {z['suitable_nein']}")
    print()
    print("NICHT abgeleitet (waere geraten): " + ", ".join(NICHT_ABLEITBAR))
    if args.schreiben:
        print()
        print(f"Vorschlaege liegen in: {VORSCHLAEGE}")
        print("Es wurde KEINE Pflanzendatei veraendert.")
    else:
        print()
        print("Nichts geschrieben. Mit --schreiben Vorschlaege ablegen.")


if __name__ == "__main__":
    main()
