# === 1. ZWECK ===
# Zeigt alles, was zum Schreiben einer eigenen Beschreibung noetig ist.
# Nutzung: python scripts/beschr_zeige.py slug1 slug2 ...

import json
import sys

for slug in sys.argv[1:]:
    d = json.load(open(f"src/data/plants/{slug}.json", encoding="utf-8"))
    n = d.get("names", {})
    print(f"\n===== {slug}")
    print(f"NAME_DE: {n.get('de','')} | LAT: {n.get('latin','')} | FAM: {d.get('family',{}).get('de','')}")
    print(f"BESCHR_DE: {(d.get('description',{}).get('de') or '')[:200]}")
    print(f"BESCHR_EN: {(d.get('description',{}).get('en') or '')[:200]}")
    for u in (d.get("uses") or []):
        ud = (u.get("description") or {}).get("de", "")
        print(f"  ANW [{u.get('form','')}/{u.get('plant_part','')}]: {ud[:300]}")
    sf = ((d.get("safety") or {}).get("warnings") or {}).get("de", "")
    print(f"  SICHERHEIT: {sf[:300]}")
    for c in (d.get("constituents") or [])[:5]:
        print(f"  STOFF: {c.get('name','')} — {c.get('percent_range','')}")
    for h in (d.get("harvest") or [])[:2]:
        print(f"  ERNTE: {h.get('plant_part','')} Monate {h.get('best_months','')}")
