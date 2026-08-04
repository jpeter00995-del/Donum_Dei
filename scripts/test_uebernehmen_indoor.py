#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Selbsttest fuer uebernehmen_indoor.py.

Start:
    python3 scripts/test_uebernehmen_indoor.py

Hier wird echter Datenbestand veraendert - deshalb pruefen die wichtigsten
Tests nicht, ob etwas passiert, sondern ob das RICHTIGE NICHT passiert:
nichts ueberschreiben, nichts anfassen ausser dem einen Feld, ohne Backup
gar nicht erst anfangen (P10).
"""

import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from uebernehmen_indoor import uebernehmen, aenderungen_finden

BESTANDEN = 0


def pruefe(bedingung, name):
    global BESTANDEN
    if not bedingung:
        raise AssertionError("DURCHGEFALLEN: " + name)
    BESTANDEN += 1
    print("ok: " + name)


def baue_umgebung():
    """Frischer Wegwerf-Datenbestand fuer jeden Testblock."""
    temp = Path(tempfile.mkdtemp(prefix="uebernahme_test_"))
    plants = temp / "plants"
    vorschlaege = temp / "vorschlaege"
    sicherung = temp / "backups"
    plants.mkdir()
    vorschlaege.mkdir()

    (plants / "lavendel.json").write_text(json.dumps({
        "slug": "lavendel", "names": {"de": "Lavendel"},
        "description": {"de": "Ein Halbstrauch."},
        "safety": {"pet_toxic": False},
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    # Diese hat schon einen Block - er darf NIE ueberschrieben werden.
    (plants / "aerva.json").write_text(json.dumps({
        "slug": "aerva", "names": {"de": "Aerva"},
        "indoor_growing": {"suitable": True, "light": "direct_sun",
                           "tips": {"de": ["Von Hand geschrieben."]}},
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    (vorschlaege / "lavendel.json").write_text(json.dumps({
        "indoor_growing": {"pet_safe": True, "difficulty": 1,
                           "_abgeleitet_aus": ["safety.pet_toxic"]},
        "_offen": ["light", "tips"], "_slug": "lavendel",
    }, ensure_ascii=False), encoding="utf-8")

    (vorschlaege / "aerva.json").write_text(json.dumps({
        "indoor_growing": {"pet_safe": False, "_abgeleitet_aus": ["x"]},
        "_offen": [], "_slug": "aerva",
    }, ensure_ascii=False), encoding="utf-8")

    return plants, vorschlaege, sicherung


# === 1. VORSCHAU AENDERT NICHTS ===

plants, vorschlaege, sicherung = baue_umgebung()
vorher = (plants / "lavendel.json").read_text(encoding="utf-8")

bericht = uebernehmen(plants, vorschlaege, sicherung, schreiben=False)
pruefe((plants / "lavendel.json").read_text(encoding="utf-8") == vorher,
       "Vorschau laesst die Datei Byte fuer Byte unveraendert")
pruefe(not sicherung.exists(), "und legt auch kein Backup an")
pruefe(bericht["uebernommen"] == 1, "sie zaehlt aber richtig mit")
pruefe(bericht["uebersprungen_hat_schon"] == 1,
       "und erkennt, dass Aerva schon einen Block hat")


# === 2. UEBERNAHME SCHREIBT - ABER NUR DAS EINE FELD ===

bericht = uebernehmen(plants, vorschlaege, sicherung, schreiben=True)
lav = json.loads((plants / "lavendel.json").read_text(encoding="utf-8"))

pruefe(lav["indoor_growing"]["pet_safe"] is True, "der Vorschlag ist drin")
pruefe(lav["indoor_growing"]["difficulty"] == 1, "vollstaendig")
pruefe(lav["indoor_growing"]["_abgeleitet_aus"] == ["safety.pet_toxic"],
       "die Herkunft bleibt in der Datei - sonst ist es spaeter nicht belegbar")
pruefe(lav["names"]["de"] == "Lavendel", "der Name ist unveraendert")
pruefe(lav["description"]["de"] == "Ein Halbstrauch.", "die Beschreibung auch")
pruefe(lav["safety"]["pet_toxic"] is False, "und der Sicherheitsblock")
pruefe(list(lav)[0] == "slug", "die Feldreihenfolge bleibt erhalten")


# === 3. WAS NIE PASSIEREN DARF ===

aerva = json.loads((plants / "aerva.json").read_text(encoding="utf-8"))
pruefe(aerva["indoor_growing"]["light"] == "direct_sun",
       "ein vorhandener Block wird NICHT ueberschrieben")
pruefe(aerva["indoor_growing"]["tips"]["de"] == ["Von Hand geschrieben."],
       "handgeschriebene Tipps bleiben unangetastet")
pruefe("pet_safe" not in aerva["indoor_growing"],
       "auch nicht teilweise ergaenzt - alles oder nichts")

pruefe("_offen" not in lav,
       "die Arbeitsliste '_offen' landet NICHT in der Pflanzendatei")
pruefe("_slug" not in lav, "die Verwaltungsfelder des Vorschlags ebenfalls nicht")


# === 4. BACKUP IST PFLICHT (P10) ===

pruefe(sicherung.exists(), "vor dem Schreiben entsteht ein Backup")
sicherungen = list(sicherung.glob("*.tar.gz"))
pruefe(len(sicherungen) == 1, "genau eines, mit Zeitstempel im Namen")
pruefe(sicherungen[0].stat().st_size > 0, "und es ist nicht leer")


# === 5. FALSCH ZUGEORDNETER VORSCHLAG WIRD ABGELEHNT ===

plants, vorschlaege, sicherung = baue_umgebung()
(vorschlaege / "lavendel.json").write_text(json.dumps({
    "indoor_growing": {"pet_safe": True}, "_slug": "ganz-andere-pflanze",
}, ensure_ascii=False), encoding="utf-8")

bericht = uebernehmen(plants, vorschlaege, sicherung, schreiben=True)
lav = json.loads((plants / "lavendel.json").read_text(encoding="utf-8"))
pruefe("indoor_growing" not in lav,
       "ein Vorschlag mit fremdem slug wird NICHT eingebaut")
pruefe(bericht["abgelehnt"] == 1, "und als abgelehnt gemeldet")


# === 6. LEERER VORSCHLAG WIRD IGNORIERT ===

plants, vorschlaege, sicherung = baue_umgebung()
(vorschlaege / "lavendel.json").write_text(json.dumps({
    "indoor_growing": {}, "_slug": "lavendel"}, ensure_ascii=False),
    encoding="utf-8")
bericht = uebernehmen(plants, vorschlaege, sicherung, schreiben=True)
lav = json.loads((plants / "lavendel.json").read_text(encoding="utf-8"))
pruefe("indoor_growing" not in lav, "ein leerer Vorschlag schreibt nichts")


# === 7. DIE VORSCHAU ZEIGT, WAS KOMMT ===

plants, vorschlaege, sicherung = baue_umgebung()
liste = aenderungen_finden(plants, vorschlaege)
namen = [x["datei"] for x in liste if x["status"] == "uebernehmen"]
pruefe("lavendel.json" in namen, "die Vorschau nennt die betroffene Datei")
pruefe(any(x["status"] == "hat_schon" for x in liste),
       "und die uebersprungene ebenfalls, mit Grund")


print()
print(f"{BESTANDEN} von {BESTANDEN} Pruefungen bestanden.")
