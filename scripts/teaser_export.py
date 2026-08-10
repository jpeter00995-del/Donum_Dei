# === 1. ZWECK ===
# Listet die Pflanzen auf, deren `teaser` noch aus Wikipedia stammt
# (abgeschnitten mit "...") oder ein Platzhalter ist, und gibt fuer einen
# Stapel die Angaben aus, die zum Neuschreiben noetig sind.
# Nutzung: python scripts/teaser_export.py <stapel-nr> [stapelgroesse]

import json
import glob
import sys

# === 2. KONSTANTEN ===
PLACEHOLDER_MARK = ("folgt", "Wikipedia", "follows")
BATCH_DEFAULT = 20


# === 3. BETROFFENE PFLANZEN FINDEN ===
def betroffene():
    treffer = []
    for pfad in sorted(glob.glob("src/data/plants/*.json")):
        d = json.load(open(pfad, encoding="utf-8"))
        t = d.get("teaser") or {}
        de = (t.get("de") or "").strip()
        en = (t.get("en") or "").strip()
        ist_platzhalter = any(m in de or m in en for m in PLACEHOLDER_MARK)
        ist_abgeschnitten = de.endswith(("...", "…")) or en.endswith(("...", "…"))
        if ist_platzhalter or ist_abgeschnitten:
            treffer.append((pfad, d, "PLATZHALTER" if ist_platzhalter else "ABGESCHNITTEN"))
    return treffer


# === 4. AUSGABE EINES STAPELS ===
def zeige(stapel_nr, groesse):
    alle = betroffene()
    start = stapel_nr * groesse
    teil = alle[start:start + groesse]
    print(f"# STAPEL {stapel_nr} — {len(teil)} von {len(alle)} betroffenen Pflanzen")
    for pfad, d, art in teil:
        slug = d["slug"]
        namen = d.get("names", {})
        fam = d.get("family", {})
        beschr = d.get("description", {})
        print(f"\n--- {slug} [{art}]")
        print(f"NAME_DE: {namen.get('de','')} | NAME_EN: {namen.get('en','')} | LAT: {namen.get('latin','')}")
        print(f"FAMILIE: {fam.get('de','')}")
        print(f"ALT_TEASER_DE: {(d.get('teaser') or {}).get('de','')[:160]}")
        if art == "PLATZHALTER":
            # Ohne echte Beschreibung sind die Anwendungstexte die einzige Grundlage.
            for u in (d.get("uses") or [])[:3]:
                ud = (u.get("description") or {}).get("de", "")
                print(f"ANWENDUNG ({u.get('form','')}): {ud[:260]}")
            sf = ((d.get("safety") or {}).get("warnings") or {}).get("de", "")
            if sf:
                print(f"SICHERHEIT: {sf[:200]}")
        else:
            print(f"BESCHR_DE: {beschr.get('de','')[:520]}")
            print(f"BESCHR_EN: {beschr.get('en','')[:380]}")


# === 5. EINSTIEG ===
if __name__ == "__main__":
    nr = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    gr = int(sys.argv[2]) if len(sys.argv) > 2 else BATCH_DEFAULT
    if nr < 0:
        print(f"BETROFFEN GESAMT: {len(betroffene())}")
    else:
        zeige(nr, gr)
