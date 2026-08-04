#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Selbsttest fuer indoor_schema.py.

Start:
    python3 scripts/test_indoor_schema.py

Warum es diese Pruefung gibt: am 2026-08-02 wurden 237 Pflanzendateien mit
einem unvollstaendigen `indoor_growing`-Block geschrieben. Der Astro-Build
brach ab, alles musste aus dem Backup zurueckgerollt werden. Die Regeln
standen die ganze Zeit in `src/lib/validatePlant.ts` - sie wurden nur nicht
vorher gelesen. Diese Pruefung laeuft ab jetzt VOR jedem Schreibvorgang.

Wichtig: die erlaubten Werte werden aus validatePlant.ts AUSGELESEN, nicht
abgeschrieben. Sonst gaebe es zwei Wahrheiten, die auseinanderlaufen.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from indoor_schema import pruefe_block, ERLAUBT, PFLICHTFELDER

BESTANDEN = 0


def pruefe(bedingung, name):
    global BESTANDEN
    if not bedingung:
        raise AssertionError("DURCHGEFALLEN: " + name)
    BESTANDEN += 1
    print("ok: " + name)


# === 1. DIE LISTEN KOMMEN AUS DEM ECHTEN VALIDATOR ===

pruefe("direct_sun" in ERLAUBT["light"], "LIGHTS wurde aus der TS-Datei gelesen")
pruefe(len(ERLAUBT["light"]) == 4, "und zwar vollstaendig (4 Werte)")
pruefe("every_few_days" in ERLAUBT["water_frequency"], "FREQS ebenfalls")
pruefe("edible" in ERLAUBT["purpose"] and len(ERLAUBT["purpose"]) == 7,
       "PURPOSES ebenfalls (7 Werte)")
pruefe("balcony" in ERLAUBT["rooms"] and len(ERLAUBT["rooms"]) == 5,
       "ROOMS ebenfalls (5 Werte)")


# === 2. EIN VOLLSTAENDIGER BLOCK GEHT DURCH ===

GUT = {
    "suitable": True,
    "purpose": ["edible"],
    "rooms": ["balcony", "kitchen"],
    "light": "direct_sun",
    "water_frequency": "every_few_days",
    "difficulty": 1,
    "pet_safe": True,
}
pruefe(pruefe_block(GUT) == [], "ein vollstaendiger, gueltiger Block passiert")


# === 3. GENAU DER FEHLER VON HEUTE ===

kaputt = {"pet_safe": True, "difficulty": 1, "suitable": False}
maengel = pruefe_block(kaputt)
pruefe(maengel, "der Teil-Block von heute faellt durch")
pruefe(any("purpose" in m for m in maengel), "purpose fehlt")
pruefe(any("rooms" in m for m in maengel), "rooms fehlt")
pruefe(any("light" in m for m in maengel), "light fehlt")
pruefe(any("water_frequency" in m for m in maengel), "water_frequency fehlt")


# === 4. JEDES PFLICHTFELD EINZELN ===

for feld in PFLICHTFELDER:
    ohne = {k: v for k, v in GUT.items() if k != feld}
    pruefe(any(feld in m for m in pruefe_block(ohne)),
           f"ohne '{feld}' faellt der Block durch")


# === 5. FALSCHE WERTE ===

pruefe(pruefe_block({**GUT, "light": "sonnig"}),
       "ein Lichtwert ausserhalb der Liste faellt durch")
pruefe(pruefe_block({**GUT, "purpose": ["heilend"]}),
       "ein unbekannter purpose faellt durch")
pruefe(pruefe_block({**GUT, "purpose": []}),
       "ein leeres purpose-Array faellt durch")
pruefe(pruefe_block({**GUT, "difficulty": 4}),
       "difficulty 4 gibt es nicht (nur 1-3)")
pruefe(pruefe_block({**GUT, "pet_safe": "ja"}),
       "pet_safe muss ein echter Wahrheitswert sein, kein Text")
pruefe(pruefe_block({**GUT, "suitable": 1}),
       "suitable ebenso")


# === 6. OPTIONALE FELDER ===

pruefe(pruefe_block({**GUT, "pot_size_cm": 20}) == [], "pot_size_cm darf dabei sein")
pruefe(pruefe_block({**GUT, "pot_size_cm": 0}), "aber nicht als 0")
pruefe(pruefe_block({**GUT, "soil": {"de": "Sandig", "en": "Sandy"}}) == [],
       "soil in beiden Sprachen ist erlaubt")
pruefe(pruefe_block({**GUT, "soil": {"de": "Sandig"}}), "nur Deutsch reicht nicht")
pruefe(pruefe_block({**GUT, "tips": {"de": ["a"], "en": ["b"]}}) == [],
       "tips in beiden Sprachen ist erlaubt")
pruefe(pruefe_block({**GUT, "_abgeleitet_aus": ["x"]}) == [],
       "eigene Zusatzfelder stoeren nicht")


print()
print(f"{BESTANDEN} von {BESTANDEN} Pruefungen bestanden.")
