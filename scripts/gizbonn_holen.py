# === 1. ZWECK ===
# Dritte Quelle: Giftpflanzen-Liste der Informationszentrale gegen
# Vergiftungen, Universitaetsklinikum Bonn (www.gizbonn.de).
#
# WICHTIG: Diese Liste betrifft den MENSCHEN, nicht Hund und Katze. Sie kann
# eine Haustier-Angabe nicht belegen. Sie dient als zweites Netz: Wenn eine
# Pflanze, die bei uns als unbedenklich gilt, dort als giftig steht, gehoert
# sie angesehen.
#
# Nutzung:
#   python scripts/gizbonn_holen.py           (nutzt Cache)
#   python scripts/gizbonn_holen.py --neu     (laedt neu)
#
# Ergebnis: scripts/daten/gizbonn_liste.json

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

QUELLE = "https://www.gizbonn.de/giftzentrale-bonn/pflanzen"
KOPF = {"User-Agent": "Mozilla/5.0 (Donum-Dei Datenabgleich; nur Lesen)"}
ZIEL = Path(__file__).parent / "daten" / "gizbonn_liste.json"

ZEILE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
ZELLE = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S)


def sauber(text):
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&")
    return re.sub(r"\s+", " ", text).strip()


def main():
    if ZIEL.exists() and "--neu" not in sys.argv:
        d = json.loads(ZIEL.read_text(encoding="utf-8"))
        print(f"Cache genutzt: {ZIEL} (abgerufen {d['abgerufen']}), "
              f"{len(d['pflanzen'])} Eintraege")
        return

    anfrage = urllib.request.Request(QUELLE, headers=KOPF)
    with urllib.request.urlopen(anfrage, timeout=60) as antwort:
        html = antwort.read().decode("utf-8", errors="replace")

    eintraege = []
    for zeile in ZEILE.findall(html):
        zellen = [sauber(z) for z in ZELLE.findall(zeile)]
        if len(zellen) < 3 or zellen[1].lower().startswith("lateinische"):
            continue
        eintraege.append({
            "name_de": zellen[0],
            "lateinisch": zellen[1],
            "giftigkeit": zellen[2],
        })

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(json.dumps({
        "quelle": QUELLE,
        "quelle_name": "Informationszentrale gegen Vergiftungen, "
                       "Universitaetsklinikum Bonn — Giftpflanzenliste",
        "abgerufen": time.strftime("%Y-%m-%d"),
        "hinweis": "Gilt fuer Menschen, nicht fuer Hund und Katze. Nur "
                   "Giftpflanzen, keine Ungiftig-Liste.",
        "pflanzen": eintraege,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Geschrieben: {ZIEL} ({len(eintraege)} Eintraege)")


if __name__ == "__main__":
    main()
