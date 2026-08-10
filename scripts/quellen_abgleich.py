# === 1. ZWECK ===
# Fuehrt die drei Quellen zusammen und meldet, wo unsere Haustier-Angabe
# widersprochen wird:
#
#   ASPCA      (scripts/daten/aspca_liste.json)     Hund/Katze, mit Ungiftig-Liste
#   CliniTox   (scripts/daten/clinitox_treffer.json) Tiermedizin Uni Zuerich
#   GIZ Bonn   (scripts/daten/gizbonn_liste.json)    Mensch, nur als zweites Netz
#
# Nutzung:
#   python scripts/quellen_abgleich.py
#   python scripts/quellen_abgleich.py --json datei

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from aspca_abgleich import index_bauen, suchen, einstufung, normalisieren  # noqa: E402

WURZEL = Path(__file__).parent.parent
PFLANZEN = WURZEL / "src" / "data" / "plants"
DATEN = Path(__file__).parent / "daten"

# Grade, die als "giftig" gelten (Bonn und CliniTox schreiben Freitext)
UNGIFTIG_BONN = {"ungiftig"}


def lade(name):
    pfad = DATEN / name
    if not pfad.exists():
        return None
    return json.loads(pfad.read_text(encoding="utf-8"))


def bonn_index(daten):
    """lateinischer Name (normalisiert) -> Eintrag, plus Gattungs-Eintraege."""
    exakt, gattung = {}, {}
    for e in daten["pflanzen"]:
        roh = e["lateinisch"]
        n = normalisieren(roh)
        if not n:
            continue
        exakt.setdefault(n, e)
        woerter = n.split()
        if len(woerter) == 1 or re.search(r"\b(ssp|spp|sp)\.", roh.lower()):
            gattung.setdefault(woerter[0], e)
    return exakt, gattung


def main():
    aspca = lade("aspca_liste.json")
    clinitox = lade("clinitox_treffer.json")
    bonn = lade("gizbonn_liste.json")

    a_exakt, a_gattung = index_bauen(aspca)
    b_exakt, b_gattung = bonn_index(bonn)
    c_map = {z["slug"]: z for z in (clinitox["pflanzen"] if clinitox else [])}

    zeilen = []
    for datei in sorted(PFLANZEN.glob("*.json")):
        p = json.loads(datei.read_text(encoding="utf-8"))
        latein = (p.get("names") or {}).get("latin") or ""
        unser = (p.get("safety") or {}).get("pet_toxic")

        a_eintrag, a_art = suchen(latein, a_exakt, a_gattung)
        a_wert = einstufung(a_eintrag["listen"]) if a_eintrag else "nicht_gelistet"

        n = normalisieren(latein)
        b_eintrag = b_exakt.get(n) or (b_gattung.get(n.split()[0]) if n else None)

        c = c_map.get(p["slug"], {})
        grade = c.get("giftgrade") or {}
        c_giftig = bool(grade) or bool(c.get("pflanzengift_db"))

        zeilen.append({
            "slug": p["slug"],
            "latein": latein,
            "unser_pet_toxic": unser,
            "aspca": a_wert,
            "aspca_art": a_art,
            "clinitox_giftig": c_giftig,
            "clinitox_grade": grade,
            "clinitox_kleintier": c.get("kleintier_monografien") or [],
            "bonn": b_eintrag["giftigkeit"] if b_eintrag else None,
            "bonn_name": b_eintrag["name_de"] if b_eintrag else None,
        })

    # === 2. BERICHT ===
    sicher = [z for z in zeilen if z["unser_pet_toxic"] is False]
    print(f"Pflanzen gesamt: {len(zeilen)}   davon bei uns 'haustiersicher': {len(sicher)}\n")

    print("Abdeckung der Quellen bei den 'sicher'-Angaben:")
    print(f"  ASPCA fuehrt sie als ungiftig : "
          f"{sum(1 for z in sicher if z['aspca'] == 'ungiftig')}")
    print(f"  CliniTox kennt die Pflanze    : "
          f"{sum(1 for z in sicher if z['clinitox_giftig'])}")
    print(f"  Bonn kennt die Pflanze        : "
          f"{sum(1 for z in sicher if z['bonn'])}")

    w_aspca = [z for z in sicher if z["aspca"] == "giftig"]
    w_clini = [z for z in sicher if z["clinitox_giftig"]]
    w_bonn = [z for z in sicher if z["bonn"] and z["bonn"] not in UNGIFTIG_BONN]

    def block(titel, liste, feld):
        print(f"\n--- {titel}: {len(liste)} ---")
        for z in liste:
            print(f"  {z['slug']:30s} {z['latein']:32s} {feld(z)}")

    if w_aspca:
        block("WIDERSPRUCH ASPCA (Hund/Katze)", w_aspca, lambda z: z["aspca_art"])
    if w_clini:
        block("WIDERSPRUCH CliniTox (Tiermedizin)", w_clini,
              lambda z: "; ".join(f'{k}: {v["grad"]}' for k, v in z["clinitox_grade"].items())
                        or "Pflanzengift-Datenbank")
    if w_bonn:
        block("Hinweis GIZ Bonn (gilt fuer Menschen)", w_bonn,
              lambda z: f"{z['bonn']} ({z['bonn_name']})")

    # Gattungs-Verwandtschaft: die ASPCA fuehrt eine ANDERE Art derselben
    # Gattung als giftig (z. B. Primula vulgaris giftig, wir haben Primula
    # veris). Kein Beweis, aber ein Grund zum Nachsehen.
    giftige_gattungen = {}
    for e in aspca["pflanzen"]:
        if einstufung(e["listen"]) != "giftig":
            continue
        for n in (normalisieren(t) for t in re.split(r"[,;]| or ", e["lateinisch"] or "")):
            if n:
                giftige_gattungen.setdefault(n.split()[0], e)
    verwandt = []
    for z in sicher:
        n = normalisieren(z["latein"])
        if not n or z["aspca"] != "nicht_gelistet":
            continue
        treffer = giftige_gattungen.get(n.split()[0])
        if treffer and normalisieren(treffer["lateinisch"]).split()[:2] != n.split()[:2]:
            verwandt.append((z, treffer))
    if verwandt:
        print(f"\n--- ASPCA kennt eine andere Art derselben Gattung als giftig: "
              f"{len(verwandt)} ---")
        for z, e in verwandt:
            print(f"  {z['slug']:30s} {z['latein']:30s} <- {e['name']} ({e['lateinisch']})")

    kleintier = [z for z in sicher if z["clinitox_kleintier"]]
    if kleintier:
        print(f"\n--- CliniTox-Kleintier-Monografien bei 'sicher'-Pflanzen: "
              f"{len(kleintier)} ---")
        for z in kleintier:
            print(f"  {z['slug']:30s} {', '.join(z['clinitox_kleintier'])}")

    if "--json" in sys.argv:
        ziel = Path(sys.argv[sys.argv.index("--json") + 1])
        ziel.write_text(json.dumps(zeilen, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nJSON geschrieben: {ziel}")


if __name__ == "__main__":
    main()
