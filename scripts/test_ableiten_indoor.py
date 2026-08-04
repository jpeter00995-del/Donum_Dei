#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Selbsttest fuer ableiten_indoor.py.

Start:
    python3 scripts/test_ableiten_indoor.py

Der wichtigste Test ist der letzte: was NICHT aus den Daten folgt, wird auch
NICHT geschrieben. Lieber ein leeres Feld als ein erfundenes.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ableiten_indoor import ableiten

BESTANDEN = 0


def pruefe(bedingung, name):
    global BESTANDEN
    if not bedingung:
        raise AssertionError("DURCHGEFALLEN: " + name)
    BESTANDEN += 1
    print("ok: " + name)


# === 1. HAUSTIER-SICHERHEIT (folgt direkt aus safety.pet_toxic) ===

v = ableiten({"safety": {"pet_toxic": False}})
pruefe(v["indoor_growing"]["pet_safe"] is True,
       "pet_toxic=False wird zu pet_safe=True")

v = ableiten({"safety": {"pet_toxic": True}})
pruefe(v["indoor_growing"]["pet_safe"] is False,
       "pet_toxic=True wird zu pet_safe=False")

v = ableiten({"safety": {"pet_toxic": None}})
pruefe("pet_safe" not in v["indoor_growing"],
       "unbekannte Giftigkeit wird NICHT zu 'ungefaehrlich' geraten")

v = ableiten({})
pruefe("pet_safe" not in v["indoor_growing"],
       "ohne safety-Block gibt es keine Aussage")


# === 2. SCHWIERIGKEIT (wird uebernommen, nicht geschaetzt) ===

v = ableiten({"garden_meta": {"difficulty": 2}})
pruefe(v["indoor_growing"]["difficulty"] == 2, "difficulty wird uebernommen")

v = ableiten({"garden_meta": {}})
pruefe("difficulty" not in v["indoor_growing"],
       "ohne Angabe wird keine Schwierigkeit erfunden")


# === 3. TOPFEIGNUNG (folgt aus garden_type) ===

# WICHTIG (gefunden 2026-08-02, nachdem die Daten schon geschrieben waren):
# Das Frontend rendert die Zimmerpflanzen-Ansicht bei `suitable === true` und
# greift dann ungeprueft auf light, water_frequency und purpose zu
# (PlantDetail.astro:179ff, IndoorCards.tsx:79ff - `purpose.map` stuerzt ab).
# Ein `suitable: true` ohne diese Felder macht die Seite kaputt.
# Deshalb: ein JA wird hier NIE abgeleitet. Nur das ehrliche NEIN.
v = ableiten({"garden_meta": {"garden_type": ["balcony", "raised_bed"]}})
pruefe("suitable" not in v["indoor_growing"],
       "'balcony' allein ergibt KEIN suitable=true - dem Frontend fehlten die Felder")
pruefe(any("balkon_moeglich" in h for h in v["_hinweis"]),
       "der Hinweis wird stattdessen fuer die Arbeitsliste vermerkt")

v = ableiten({"garden_meta": {"garden_type": ["greenhouse"]}})
pruefe("suitable" not in v["indoor_growing"], "'greenhouse' ebenso wenig")

v = ableiten({"garden_meta": {"garden_type": ["field"]}})
pruefe(v["indoor_growing"]["suitable"] is False,
       "reine Feldpflanze: NICHT fuer den Topf")
pruefe(v["indoor_growing"]["grund"],
       "und die Absage bekommt eine Begruendung")

v = ableiten({"garden_meta": {"garden_type": []}})
pruefe("suitable" not in v["indoor_growing"],
       "ohne Gartentyp keine Aussage ueber Topfeignung")


# === 4. WAS NICHT FOLGT, WIRD NICHT GESCHRIEBEN ===
# Licht, Wasser, Boden, Topfgroesse und Pflegetipps sind Gartenwissen.
# Aus Pflanzabstand und Klimazone folgen sie NICHT. Wer sie hier ableitet,
# erfindet sie - und genau das hat Donum Dei schon einmal die AdSense-
# Zulassung gekostet (damals abgeschrieben, diesmal waere es ausgedacht).

v = ableiten({"garden_meta": {"spacing_cm": 30, "climate_zones": ["6a"],
                              "garden_type": ["balcony"], "difficulty": 1},
              "safety": {"pet_toxic": False}})
ig = v["indoor_growing"]
for feld in ("light", "water_frequency", "soil", "pot_size_cm", "tips", "rooms"):
    pruefe(feld not in ig, f"'{feld}' wird NICHT geraten")


# === 5. HERKUNFT WIRD MITGESCHRIEBEN ===

pruefe(ig["_abgeleitet_aus"], "jede Ableitung nennt ihre Grundlage")
pruefe(any("safety.pet_toxic" in q for q in ig["_abgeleitet_aus"]),
       "und zwar mit dem konkreten Feldnamen")
pruefe(v["_offen"], "was noch fehlt, wird ausdruecklich aufgelistet")
pruefe("light" in v["_offen"], "z.B. der Lichtbedarf")


# === 6. NICHTS ABLEITBAR = KEIN VORSCHLAG ===

v = ableiten({"names": {"de": "Irgendwas"}})
pruefe(not v["indoor_growing"],
       "ohne verwertbare Daten entsteht kein halbgarer Vorschlag")


print()
print(f"{BESTANDEN} von {BESTANDEN} Pruefungen bestanden.")
