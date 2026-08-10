# === 1. ZWECK ===
# Zaehlt Pflanzen, deren lange Beschreibung noch nach Wikipedia aussieht
# oder auffaellig kurz ist. Nur Bericht, aendert nichts.

import json
import glob
import os
import re

# === 2. MUSTER ===
MUSTER = [
    r"ist eine Pflanzenart", r"ist eine Sortengruppe", r"ist eine Gem[uü]sepflanze",
    r"ist eine Variante", r"ist eine Kulturform", r"bezeichnet:",
    r"genannt, ist eine", r"siehe Wikipedia", r"folgt —",
    r"is a species of", r"is a biennial", r"comprising several cultivars",
    r"is the taproot", r"is an annual herb in the", r"is a cultivar of",
]

# === 3. LAUF ===
wiki, kurz = [], []
for pfad in sorted(glob.glob("src/data/plants/*.json")):
    d = json.load(open(pfad, encoding="utf-8"))
    besch = d.get("description") or {}
    de, en = besch.get("de") or "", besch.get("en") or ""
    name = os.path.basename(pfad)
    if any(re.search(m, de, re.I) or re.search(m, en, re.I) for m in MUSTER):
        wiki.append(name)
    elif len(de) < 400:
        kurz.append((len(de), name))

print(f"Beschreibungen mit Wikipedia-Muster: {len(wiki)}")
for x in wiki:
    print("   " + x)
print()
print(f"sehr kurze Beschreibungen (<400 Zeichen, ohne Muster): {len(kurz)}")
for laenge, name in sorted(kurz):
    print(f"   {laenge}  {name}")
