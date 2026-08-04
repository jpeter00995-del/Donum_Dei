#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Schema-Pruefung fuer `indoor_growing` — das Tor, das am 2026-08-02 fehlte.

Was passiert war: 237 Pflanzendateien bekamen einen unvollstaendigen
`indoor_growing`-Block. Der Astro-Build brach ab
("indoor_growing.purpose: must be a non-empty array"), alles musste aus dem
Backup zurueckgerollt werden. Die Regeln standen die ganze Zeit in
`src/lib/validatePlant.ts` - sie wurden nur nicht vorher gelesen.

Ab jetzt gilt: kein Schreibvorgang ohne diese Pruefung.

Die erlaubten Werte werden aus `validatePlant.ts` AUSGELESEN, nicht
abgeschrieben. Aendert jemand dort eine Liste, aendert sie sich hier mit -
sonst haetten wir zwei Wahrheiten, die irgendwann auseinanderlaufen.

Benutzung:
    from indoor_schema import pruefe_block
    maengel = pruefe_block(block)       # leere Liste = in Ordnung
"""

# === 1. IMPORTE + PFADE ===

import re
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parent.parent
VALIDATOR = ROOT / "src" / "lib" / "validatePlant.ts"

# Welche Liste im TypeScript gehoert zu welchem Feld?
LISTEN = {
    "purpose": "PURPOSES",
    "rooms": "ROOMS",
    "light": "LIGHTS",
    "water_frequency": "FREQS",
}

PFLICHTFELDER = ["suitable", "purpose", "rooms", "light",
                 "water_frequency", "difficulty", "pet_safe"]


# === 2. DIE ERLAUBTEN WERTE AUS DEM VALIDATOR LESEN ===

def _listen_lesen() -> Dict[str, List[str]]:
    """
    Holt `const NAME = ['a', 'b', ...]` aus validatePlant.ts.

    Faellt die Datei aus oder aendert sich ihre Form, ist das ein harter
    Fehler - lieber ein Abbruch als eine stille Pruefung gegen veraltete
    Werte.
    """
    quelle = VALIDATOR.read_text(encoding="utf-8")
    ergebnis = {}
    for feld, name in LISTEN.items():
        treffer = re.search(rf"const\s+{name}\s*=\s*\[(.*?)\]", quelle, re.S)
        if not treffer:
            raise RuntimeError(
                f"Liste '{name}' nicht in {VALIDATOR.name} gefunden - "
                f"hat sich der Validator geaendert?")
        ergebnis[feld] = re.findall(r"'([^']+)'", treffer.group(1))
    return ergebnis


ERLAUBT = _listen_lesen()


# === 3. DIE PRUEFUNG ===

def pruefe_block(block: dict) -> List[str]:
    """
    Prueft einen `indoor_growing`-Block gegen das Schema.
    Rueckgabe: Liste der Maengel im Klartext. Leer = in Ordnung.
    """
    maengel = []
    if not isinstance(block, dict):
        return ["indoor_growing: muss ein Objekt sein"]

    # --- Pflichtfelder mit fester Werteliste ---
    for feld in ("purpose", "rooms"):
        wert = block.get(feld)
        if not isinstance(wert, list) or not wert:
            maengel.append(f"{feld}: fehlt oder ist leer "
                           f"(erlaubt: {', '.join(ERLAUBT[feld])})")
            continue
        for v in wert:
            if v not in ERLAUBT[feld]:
                maengel.append(f"{feld}: unbekannter Wert '{v}' "
                               f"(erlaubt: {', '.join(ERLAUBT[feld])})")

    for feld in ("light", "water_frequency"):
        if block.get(feld) not in ERLAUBT[feld]:
            maengel.append(f"{feld}: fehlt oder unbekannt "
                           f"(erlaubt: {', '.join(ERLAUBT[feld])})")

    # --- Wahrheitswerte: echte, keine Texte oder Zahlen ---
    for feld in ("suitable", "pet_safe"):
        if not isinstance(block.get(feld), bool):
            maengel.append(f"{feld}: fehlt oder ist kein Wahrheitswert")

    # --- Schwierigkeit ---
    if block.get("difficulty") not in (1, 2, 3):
        maengel.append("difficulty: fehlt oder ist nicht 1, 2 oder 3")

    # --- Optionale Felder, wenn vorhanden ---
    if "pot_size_cm" in block:
        wert = block["pot_size_cm"]
        if not isinstance(wert, (int, float)) or isinstance(wert, bool) or wert <= 0:
            maengel.append("pot_size_cm: muss eine positive Zahl sein")

    for feld in ("soil",):
        if feld in block:
            wert = block[feld]
            if (not isinstance(wert, dict)
                    or not isinstance(wert.get("de"), str)
                    or not isinstance(wert.get("en"), str)):
                maengel.append(f"{feld}: braucht Text in de UND en")

    if "tips" in block:
        wert = block["tips"]
        if (not isinstance(wert, dict)
                or not isinstance(wert.get("de"), list)
                or not isinstance(wert.get("en"), list)):
            maengel.append("tips: braucht Listen in de UND en")

    return maengel


def klartext(name: str, maengel: List[str]) -> str:
    if not maengel:
        return f"{name}: in Ordnung"
    return f"{name}: " + " | ".join(maengel)


# === 4. START (alle Pflanzen durchsehen) ===

if __name__ == "__main__":
    import json

    plants = ROOT / "src" / "data" / "plants"
    gut = schlecht = ohne = 0
    for datei in sorted(plants.glob("*.json")):
        d = json.loads(datei.read_text(encoding="utf-8"))
        ig = d.get("indoor_growing")
        if not ig:
            ohne += 1
            continue
        m = pruefe_block(ig)
        if m:
            schlecht += 1
            print(klartext(datei.name, m))
        else:
            gut += 1

    print()
    print(f"gueltig: {gut} | fehlerhaft: {schlecht} | ohne Block: {ohne}")
    print(f"erlaubte Werte (aus {VALIDATOR.name}):")
    for feld, werte in ERLAUBT.items():
        print(f"  {feld:<18} {', '.join(werte)}")
