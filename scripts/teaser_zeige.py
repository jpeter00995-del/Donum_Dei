# === 1. ZWECK ===
# Zeigt Name, alten Teaser und Beschreibung fuer eine Liste von Slugs.
# Nutzung: python scripts/teaser_zeige.py slug1 slug2 ...

import json
import sys

for slug in sys.argv[1:]:
    d = json.load(open(f"src/data/plants/{slug}.json", encoding="utf-8"))
    n = d.get("names", {})
    b = d.get("description", {})
    t = d.get("teaser", {})
    print(f"\n--- {slug}")
    print(f"NAME_DE: {n.get('de','')} | NAME_EN: {n.get('en','')} | LAT: {n.get('latin','')}")
    print(f"ALT_TEASER_DE: {t.get('de','')[:150]}")
    print(f"ALT_TEASER_EN: {t.get('en','')[:150]}")
    print(f"BESCHR_DE: {(b.get('de') or '')[:430]}")
