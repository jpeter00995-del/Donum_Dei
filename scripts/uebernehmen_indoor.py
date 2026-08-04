#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vorschlaege uebernehmen — der kontrollierte Schreibweg (Stufe 2).

`ableiten_indoor.py` erzeugt Vorschlaege, aendert aber nie eine Pflanzendatei.
Diese Datei ist der einzige Weg, wie ein Vorschlag in den echten Datenbestand
kommt - und sie ist bewusst misstrauisch gebaut:

  - Standard ist VORSCHAU. Ohne `--uebernehmen` wird nichts geschrieben.
  - Vor dem ersten Schreibvorgang entsteht ein vollstaendiges Backup (P10).
  - Ein vorhandener `indoor_growing`-Block wird NIEMALS ueberschrieben,
    auch nicht teilweise. Handarbeit hat immer Vorrang.
  - Passt der `_slug` des Vorschlags nicht zur Pflanze, wird abgelehnt.
  - Verwaltungsfelder des Vorschlags (`_offen`, `_slug`, `_name`,
    `_quelldatei`) landen NICHT in der Pflanzendatei.
  - `_abgeleitet_aus` bleibt dagegen erhalten: ohne die Herkunft waere
    spaeter nicht mehr nachvollziehbar, worauf eine Angabe beruht.

Start:
    python3 scripts/uebernehmen_indoor.py                # Vorschau
    python3 scripts/uebernehmen_indoor.py --uebernehmen  # wirklich schreiben
"""

# === 1. IMPORTE + PFADE ===

import argparse
import json
import tarfile
from datetime import datetime
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parent.parent
PLANTS = ROOT / "src" / "data" / "plants"
VORSCHLAEGE = ROOT / "_vorschlaege" / "indoor_growing"
SICHERUNG = ROOT / "_backups" / "plants"

# Diese Felder gehoeren zum Vorschlag, nicht in die Pflanzendatei.
VERWALTUNG = ("_offen", "_slug", "_name", "_quelldatei")


# === 2. WAS WUERDE PASSIEREN? ===

def aenderungen_finden(plants: Path, vorschlaege: Path) -> List[dict]:
    """
    Geht alle Vorschlaege durch und sagt fuer jeden, was mit ihm geschieht.
    Aendert nichts. Das ist die Grundlage der Vorschau UND der Uebernahme -
    damit beide garantiert dasselbe tun.
    """
    ergebnis = []
    for vdatei in sorted(vorschlaege.glob("*.json")):
        eintrag = {"datei": vdatei.name, "status": "", "grund": "",
                   "felder": []}
        ziel = plants / vdatei.name

        if not ziel.exists():
            eintrag.update(status="abgelehnt", grund="Pflanzendatei fehlt")
            ergebnis.append(eintrag)
            continue

        try:
            vorschlag = json.loads(vdatei.read_text(encoding="utf-8"))
            pflanze = json.loads(ziel.read_text(encoding="utf-8"))
        except (OSError, ValueError) as e:
            eintrag.update(status="abgelehnt", grund=f"nicht lesbar: {e}")
            ergebnis.append(eintrag)
            continue

        neu = vorschlag.get("indoor_growing") or {}
        if not neu:
            eintrag.update(status="leer", grund="Vorschlag enthaelt nichts")
            ergebnis.append(eintrag)
            continue

        # Gehoert der Vorschlag wirklich zu dieser Pflanze?
        erwartet = vorschlag.get("_slug")
        tatsaechlich = pflanze.get("slug") or ziel.stem
        if erwartet and erwartet != tatsaechlich:
            eintrag.update(status="abgelehnt",
                           grund=f"slug passt nicht: Vorschlag '{erwartet}' "
                                 f"vs. Pflanze '{tatsaechlich}'")
            ergebnis.append(eintrag)
            continue

        if pflanze.get("indoor_growing"):
            eintrag.update(status="hat_schon",
                           grund="vorhandener Block bleibt unangetastet")
            ergebnis.append(eintrag)
            continue

        eintrag.update(status="uebernehmen",
                       felder=[k for k in neu if not k.startswith("_")],
                       name=(pflanze.get("names") or {}).get("de", ""))
        ergebnis.append(eintrag)

    return ergebnis


# === 3. BACKUP (P10 - vor jeder Aenderung) ===

def backup_anlegen(plants: Path, sicherung: Path) -> Path:
    """Kompletter Pflanzenordner als tar.gz mit Zeitstempel."""
    sicherung.mkdir(parents=True, exist_ok=True)
    stempel = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    ziel = sicherung / f"plants_{stempel}_pre_indoor.tar.gz"
    with tarfile.open(ziel, "w:gz") as archiv:
        archiv.add(plants, arcname="plants")
    return ziel


# === 4. UEBERNEHMEN ===

def uebernehmen(plants: Path, vorschlaege: Path, sicherung: Path,
                schreiben: bool = False) -> dict:
    """
    Rueckgabe: Zahlen fuer den Bericht. `schreiben=False` ist Vorschau.
    """
    plan = aenderungen_finden(plants, vorschlaege)
    zahlen = {"uebernommen": 0, "uebersprungen_hat_schon": 0,
              "abgelehnt": 0, "leer": 0, "backup": None}

    for e in plan:
        if e["status"] == "hat_schon":
            zahlen["uebersprungen_hat_schon"] += 1
        elif e["status"] == "abgelehnt":
            zahlen["abgelehnt"] += 1
        elif e["status"] == "leer":
            zahlen["leer"] += 1
        elif e["status"] == "uebernehmen":
            zahlen["uebernommen"] += 1

    if not schreiben or zahlen["uebernommen"] == 0:
        return zahlen

    # Erst sichern, dann anfassen. Nie umgekehrt.
    zahlen["backup"] = backup_anlegen(plants, sicherung)

    for e in plan:
        if e["status"] != "uebernehmen":
            continue
        vdatei = vorschlaege / e["datei"]
        ziel = plants / e["datei"]
        vorschlag = json.loads(vdatei.read_text(encoding="utf-8"))
        pflanze = json.loads(ziel.read_text(encoding="utf-8"))

        neu = {k: v for k, v in (vorschlag.get("indoor_growing") or {}).items()
               if k not in VERWALTUNG}
        pflanze["indoor_growing"] = neu

        # Atomar ersetzen: eine halb geschriebene Pflanzendatei waere
        # schlimmer als gar keine Aenderung.
        vorlaeufig = ziel.with_suffix(".json.tmp")
        vorlaeufig.write_text(
            json.dumps(pflanze, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8")
        vorlaeufig.replace(ziel)

    return zahlen


# === 5. START ===

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--uebernehmen", action="store_true",
                   help="wirklich schreiben (sonst nur Vorschau)")
    p.add_argument("--zeigen", type=int, default=5,
                   help="wie viele Beispiele auflisten (Standard 5)")
    args = p.parse_args()

    plan = aenderungen_finden(PLANTS, VORSCHLAEGE)
    z = uebernehmen(PLANTS, VORSCHLAEGE, SICHERUNG,
                    schreiben=args.uebernehmen)

    print("=" * 62)
    print("Vorschlaege uebernehmen — indoor_growing")
    print("=" * 62)
    print(f"wird uebernommen              : {z['uebernommen']}")
    print(f"hat schon einen Block         : {z['uebersprungen_hat_schon']}")
    print(f"leerer Vorschlag              : {z['leer']}")
    print(f"abgelehnt                     : {z['abgelehnt']}")

    beispiele = [e for e in plan if e["status"] == "uebernehmen"][:args.zeigen]
    if beispiele:
        print()
        print("Beispiele:")
        for e in beispiele:
            print(f"  {e.get('name') or e['datei']:<28} "
                  f"+ {', '.join(e['felder'])}")

    abgelehnt = [e for e in plan if e["status"] == "abgelehnt"]
    if abgelehnt:
        print()
        print("Abgelehnt:")
        for e in abgelehnt[:args.zeigen]:
            print(f"  {e['datei']}: {e['grund']}")

    print()
    if args.uebernehmen:
        print(f"Backup: {z['backup']}")
        print("Geschrieben. Zum Zurueckdrehen das Backup entpacken.")
    else:
        print("VORSCHAU - es wurde nichts geaendert.")
        print("Mit --uebernehmen wirklich schreiben (Backup laeuft automatisch).")


if __name__ == "__main__":
    main()
