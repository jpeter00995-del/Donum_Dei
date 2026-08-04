#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Die 16 balkontauglichen Pflanzen vervollstaendigen — mit Mensch in der Mitte.

Warum ueberhaupt ein Formular (Befund 2026-08-02):
    `indoor_growing` ist im Schema ein Alles-oder-nichts-Block. Pflicht sind
    suitable, purpose, rooms, light, water_frequency, difficulty, pet_safe.
    Fuenf davon lassen sich aus den vorhandenen Daten BELEGEN. Zwei nicht:
    **light** und **water_frequency**. In keiner der 297 Pflanzendateien
    steht irgendwo eine Licht- oder Wasserangabe (nachgesehen, nicht geraten).

    Diese beiden Werte kann also weder ein Skript noch ein Sprachmodell
    liefern, ohne sie zu erfinden. Sie kommen von Maikel - je Pflanze eine
    Auswahl aus vier festen Werten. Das sind 32 Entscheidungen, keine
    Schreibarbeit.

Ablauf:
    1. python3 scripts/indoor_16.py --formular
       legt `_vorschlaege/indoor_16/AUSFUELLEN.csv` an. Alles, was feststeht,
       ist schon eingetragen. Zwei Spalten sind leer.

    2. Maikel fuellt `light` und `water_frequency` aus (Numbers, Excel oder
       ein Texteditor). Erlaubte Werte stehen in der Anleitung daneben.

    3. python3 scripts/indoor_16.py --pruefen
       prueft die ausgefuellte Datei gegen das Schema. Schreibt nichts.

    4. python3 scripts/uebernehmen_indoor.py --uebernehmen
       uebernimmt erst dann, wenn Schritt 3 sauber ist.
"""

# === 1. IMPORTE + PFADE ===

import argparse
import csv
import json
from pathlib import Path

from indoor_schema import ERLAUBT, pruefe_block, klartext

ROOT = Path(__file__).resolve().parent.parent
PLANTS = ROOT / "src" / "data" / "plants"
ORDNER = ROOT / "_vorschlaege" / "indoor_16"
FORMULAR = ORDNER / "AUSFUELLEN.csv"
ANLEITUNG = ORDNER / "ANLEITUNG.md"
FERTIG = ROOT / "_vorschlaege" / "indoor_growing"

SPALTEN = ["slug", "name", "light", "water_frequency",
           "purpose", "rooms", "difficulty", "pet_safe", "hinweis"]

# uses[].form  ->  purpose (aus der erlaubten Liste)
FORM_ZU_ZWECK = {
    "spice": "edible", "raw": "edible",
    "tea": "medicinal", "tincture": "medicinal", "compress": "medicinal",
    "salve": "medicinal", "gargle": "medicinal", "essential_oil": "medicinal",
}


# === 2. WAS SCHON FESTSTEHT ===

def kandidaten():
    """Die Pflanzen ohne Block, die laut garden_type auf den Balkon duerfen."""
    for datei in sorted(PLANTS.glob("*.json")):
        d = json.loads(datei.read_text(encoding="utf-8"))
        if d.get("indoor_growing"):
            continue
        gm = d.get("garden_meta") or {}
        if not any(t in ("balcony", "greenhouse")
                   for t in (gm.get("garden_type") or [])):
            continue
        yield datei, d


def vorbelegen(d: dict) -> dict:
    """Die fuenf belegbaren Felder. light/water bleiben leer."""
    gm = d.get("garden_meta") or {}
    sicherheit = d.get("safety") or {}

    zwecke = []
    for u in (d.get("uses") or []):
        z = FORM_ZU_ZWECK.get(u.get("form"))
        if z and z not in zwecke:
            zwecke.append(z)
    if not zwecke:
        zwecke = ["ornamental"]

    raeume = ["balcony"]
    if "edible" in zwecke:
        raeume.append("kitchen")

    giftig = sicherheit.get("pet_toxic")
    return {
        "slug": d.get("slug", ""),
        "name": (d.get("names") or {}).get("de", ""),
        "light": "",                       # <- Maikel
        "water_frequency": "",             # <- Maikel
        "purpose": ",".join(zwecke),
        "rooms": ",".join(raeume),
        "difficulty": gm.get("difficulty", ""),
        "pet_safe": "" if not isinstance(giftig, bool) else str(not giftig).lower(),
        "hinweis": "",
    }


# === 3. FORMULAR SCHREIBEN ===

def formular_anlegen() -> int:
    ORDNER.mkdir(parents=True, exist_ok=True)
    zeilen = [vorbelegen(d) for _, d in kandidaten()]

    with FORMULAR.open("w", encoding="utf-8", newline="") as f:
        schreiber = csv.DictWriter(f, fieldnames=SPALTEN, delimiter=";")
        schreiber.writeheader()
        schreiber.writerows(zeilen)

    ANLEITUNG.write_text(f"""# Die 16 Balkonpflanzen vervollstaendigen

In `AUSFUELLEN.csv` sind **zwei Spalten leer**: `light` und `water_frequency`.
Alles andere steht schon drin und ist aus deinen Daten belegt.

Diese beiden Werte stehen in KEINER deiner Pflanzendateien. Ein Skript oder
ein Sprachmodell koennte sie nur erfinden - deshalb kommen sie von dir.
Es sind {len(zeilen)} Zeilen mal zwei Auswahlen.

## Erlaubte Werte (mehr gibt es nicht)

**light** — wie viel Licht braucht die Pflanze auf dem Balkon?
{chr(10).join('- `' + w + '`' for w in ERLAUBT['light'])}

**water_frequency** — wie oft giessen?
{chr(10).join('- `' + w + '`' for w in ERLAUBT['water_frequency'])}

Schreib den Wert genau so, klein und mit Unterstrich. Alles andere faellt
in der Pruefung durch.

## Wenn du bei einer Pflanze unsicher bist

Zeile einfach leer lassen. Sie wird dann uebersprungen, nicht geraten.
Lieber 12 saubere Eintraege als 16 mit vier Vermutungen.
In die Spalte `hinweis` kannst du schreiben, warum.

## Danach

    python3 scripts/indoor_16.py --pruefen

Das prueft gegen das echte Schema (`src/lib/validatePlant.ts`) und schreibt
noch nichts. Erst wenn dort alles sauber ist:

    python3 scripts/uebernehmen_indoor.py --uebernehmen

Dann wird uebernommen - mit automatischem Backup.
""", encoding="utf-8")
    return len(zeilen)


# === 4. AUSGEFUELLTES FORMULAR PRUEFEN ===

def pruefen(schreiben: bool = False) -> dict:
    """
    Liest das ausgefuellte Formular, baut daraus vollstaendige Bloecke und
    prueft jeden gegen das Schema. Schreibt hoechstens Vorschlagsdateien -
    niemals eine Pflanzendatei.
    """
    if not FORMULAR.exists():
        raise SystemExit(f"Formular fehlt: {FORMULAR}\n"
                         f"Erst anlegen mit: --formular")

    zahlen = {"gesamt": 0, "fertig": 0, "offen": 0, "fehlerhaft": 0}
    with FORMULAR.open(encoding="utf-8", newline="") as f:
        for zeile in csv.DictReader(f, delimiter=";"):
            zahlen["gesamt"] += 1
            name = zeile.get("name") or zeile.get("slug") or "?"

            if not (zeile.get("light") or "").strip() or \
               not (zeile.get("water_frequency") or "").strip():
                zahlen["offen"] += 1
                continue

            block = {
                "suitable": True,
                "purpose": [x for x in (zeile.get("purpose") or "").split(",") if x],
                "rooms": [x for x in (zeile.get("rooms") or "").split(",") if x],
                "light": zeile["light"].strip(),
                "water_frequency": zeile["water_frequency"].strip(),
                "_abgeleitet_aus": ["garden_meta.garden_type", "uses[].form",
                                    "safety.pet_toxic", "Angabe von Maikel"],
            }
            try:
                block["difficulty"] = int(zeile.get("difficulty") or 0)
            except ValueError:
                block["difficulty"] = 0
            wert = (zeile.get("pet_safe") or "").strip().lower()
            if wert in ("true", "false"):
                block["pet_safe"] = (wert == "true")

            maengel = pruefe_block(block)
            if maengel:
                zahlen["fehlerhaft"] += 1
                print(klartext(name, maengel))
                continue

            zahlen["fertig"] += 1
            if schreiben:
                FERTIG.mkdir(parents=True, exist_ok=True)
                (FERTIG / f"{zeile['slug']}.json").write_text(
                    json.dumps({"indoor_growing": block,
                                "_slug": zeile["slug"], "_name": name},
                               ensure_ascii=False, indent=2),
                    encoding="utf-8")
    return zahlen


# === 5. START ===

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--formular", action="store_true",
                   help="Formular zum Ausfuellen anlegen")
    p.add_argument("--pruefen", action="store_true",
                   help="ausgefuelltes Formular gegen das Schema pruefen")
    p.add_argument("--vorschlaege", action="store_true",
                   help="gepruefte Zeilen als Vorschlagsdateien ablegen")
    args = p.parse_args()

    if args.formular:
        n = formular_anlegen()
        print(f"Formular angelegt: {FORMULAR}")
        print(f"{n} Pflanzen, zwei Spalten sind auszufuellen.")
        print(f"Anleitung daneben: {ANLEITUNG.name}")
        return

    if args.pruefen or args.vorschlaege:
        z = pruefen(schreiben=args.vorschlaege)
        print()
        print(f"Zeilen gesamt          : {z['gesamt']}")
        print(f"vollstaendig + gueltig : {z['fertig']}")
        print(f"noch offen             : {z['offen']}")
        print(f"fehlerhaft             : {z['fehlerhaft']}")
        if args.vorschlaege and z["fertig"]:
            print()
            print(f"Vorschlaege liegen in: {FERTIG}")
            print("Uebernehmen mit: python3 scripts/uebernehmen_indoor.py")
        return

    p.print_help()


if __name__ == "__main__":
    main()
