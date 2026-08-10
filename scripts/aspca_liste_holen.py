# === 1. ZWECK ===
# Holt die vollstaendige ASPCA-Pflanzenliste (giftig / ungiftig fuer Hund und
# Katze) und legt sie als JSON ab. Grundlage fuer den Abgleich mit unseren
# eigenen Pflanzendaten (scripts/aspca_abgleich.py).
#
# Warum: Auf der Seite "Ungiftige Pflanzen fuer Katzen und Hunde" stehen
# Pflanzen ohne jeden Beleg. Ein "ungiftig" ohne Quelle ist ein
# Sicherheitsversprechen, das wir nicht halten koennen.
#
# Nutzung:
#   python scripts/aspca_liste_holen.py            (nutzt vorhandenen Cache)
#   python scripts/aspca_liste_holen.py --neu      (laedt neu vom Server)
#
# Ergebnis: scripts/daten/aspca_liste.json

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

# === 2. KONSTANTEN ===
BASIS = "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants"
KOPF = {"User-Agent": "Mozilla/5.0 (Donum-Dei Datenabgleich; nur Lesen)"}
PAUSE_SEK = 0.4
MAX_SEITEN = 60

# Filter der ASPCA-Seite: (Parametername, Wert, Kennung bei uns)
LISTEN = [
    ("field_toxicity_value", "01", "giftig_hund"),
    ("field_toxicity_value", "02", "giftig_katze"),
    ("field_non_toxicity_value", "01", "ungiftig_hund"),
    ("field_non_toxicity_value", "02", "ungiftig_katze"),
]

ZIEL = Path(__file__).parent / "daten" / "aspca_liste.json"

ROW = re.compile(r'<div class="views-row.*?</div>\s*(?=<div class="views-row|\Z)', re.S)
TITEL = re.compile(
    r'views-field-title">.*?<div class="plant-title-name">(.*?)</div>', re.S
)
LATEIN = re.compile(
    r'views-field-title-scientific-name">.*?<div class="plant-title-name">(.*?)</div>',
    re.S,
)
SLUG = re.compile(r'toxic-and-non-toxic-plants/([a-z0-9\-]+)"')


# === 3. HILFSFUNKTIONEN ===
def saubere(text):
    """HTML-Reste und doppelte Leerzeichen entfernen."""
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("&amp;", "&").replace("&#039;", "'").replace("&quot;", '"')
    return re.sub(r"\s+", " ", text).strip()


def seite_holen(param, wert, seite):
    frage = urllib.parse.urlencode({f"{param}[0]": wert, "page": seite})
    anfrage = urllib.request.Request(f"{BASIS}?{frage}", headers=KOPF)
    with urllib.request.urlopen(anfrage, timeout=60) as antwort:
        return antwort.read().decode("utf-8", errors="replace")


def zeilen_lesen(html):
    """Liefert (name, lateinisch, slug) je Treffer der Ergebnisliste."""
    beginn = html.find('<div class="view-content">')
    if beginn == -1:
        return []
    ende = html.find('<div class="item-list">', beginn)
    block = html[beginn : ende if ende > beginn else len(html)]

    treffer = []
    for zeile in ROW.findall(block):
        t = TITEL.search(zeile)
        l = LATEIN.search(zeile)
        s = SLUG.search(zeile)
        if not (t and s):
            continue
        treffer.append(
            {
                "name": saubere(t.group(1)),
                "lateinisch": saubere(l.group(1)) if l else "",
                "slug": s.group(1),
            }
        )
    return treffer


def liste_holen(param, wert, kennung):
    alle = {}
    for seite in range(MAX_SEITEN):
        html = seite_holen(param, wert, seite)
        treffer = zeilen_lesen(html)
        if not treffer:
            break
        vorher = len(alle)
        for e in treffer:
            alle[e["slug"]] = e
        print(f"  {kennung} Seite {seite}: {len(treffer)} Zeilen (gesamt {len(alle)})")
        if len(alle) == vorher:  # keine neuen Eintraege mehr -> Ende
            break
        time.sleep(PAUSE_SEK)
    return alle


# === 4. HAUPTLAUF ===
def main():
    neu = "--neu" in sys.argv
    if ZIEL.exists() and not neu:
        daten = json.loads(ZIEL.read_text(encoding="utf-8"))
        print(f"Cache genutzt: {ZIEL} (abgerufen {daten.get('abgerufen')})")
        print(f"Eintraege: {len(daten['pflanzen'])}")
        return

    ergebnis = {}
    for param, wert, kennung in LISTEN:
        print(f"Lade {kennung} ...")
        for slug, e in liste_holen(param, wert, kennung).items():
            eintrag = ergebnis.setdefault(
                slug,
                {
                    "name": e["name"],
                    "lateinisch": e["lateinisch"],
                    "slug": slug,
                    "listen": [],
                },
            )
            eintrag["listen"].append(kennung)

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(
        json.dumps(
            {
                "quelle": BASIS,
                "abgerufen": time.strftime("%Y-%m-%d"),
                "hinweis": "listen: giftig_hund | giftig_katze | ungiftig_hund | ungiftig_katze",
                "pflanzen": sorted(ergebnis.values(), key=lambda x: x["slug"]),
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    print(f"\nGeschrieben: {ZIEL}")
    print(f"Eintraege gesamt: {len(ergebnis)}")


if __name__ == "__main__":
    main()
