# === 1. ZWECK ===
# Meldet alle Adressen aus den gebauten Sitemaps an die Bing Webmaster Tools.
# Anders als Google erlaubt Bing das ausdruecklich per Schnittstelle. Google
# bietet dafuer nichts an — dort bleibt nur der Knopf von Hand, siehe
# docs/GSC_INDEXIERUNG_PLAN.md.
#
# Achtung Kontingent: Die oft genannten 10.000 Adressen am Tag gelten fuer
# etablierte Seiten. donum-dei.pages.dev hatte am 2026-08-31 genau 96 frei.
# Das Skript fragt das Kontingent vorher ab und kappt die Liste — schickt man
# mehr, scheitert der ganze Block statt nur der Ueberhang.
#
# Nutzung:  python scripts/bing_melden.py            (meldet alles)
#           python scripts/bing_melden.py --pruefen  (zeigt nur das Kontingent)
#
# Der Schluessel steht in .env.local (BING_API_KEY) und ist per .gitignore
# vom Repository ausgeschlossen. Er wird hier nie ausgegeben.

import glob
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

# === 2. KONSTANTEN ===
BASIS = "https://ssl.bing.com/webmaster/api.svc/json"
SEITE = "https://donum-dei.pages.dev"
BLOCK = 500  # Adressen je Anfrage


# === 3. SCHLUESSEL LESEN ===
def schluessel():
    pfad = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if not os.path.exists(pfad):
        sys.exit("FEHLT: .env.local mit der Zeile BING_API_KEY=...")
    treffer = re.search(r"BING_API_KEY\s*=\s*(\S+)",
                        open(pfad, encoding="utf-8-sig").read())
    if not treffer:
        sys.exit("FEHLT: Zeile BING_API_KEY in .env.local")
    return treffer.group(1).strip().strip("\"'")


# === 4. AUFRUF ===
def ruf(methode, nutzlast, key, holen=False):
    """holen=True -> GET (Abfragen), sonst POST (Meldungen)."""
    if holen:
        frage = "&".join(f"{k}={urllib.parse.quote(str(v), safe='')}"
                         for k, v in nutzlast.items())
        anfrage = urllib.request.Request(
            f"{BASIS}/{methode}?apikey={key}&{frage}", method="GET")
    else:
        anfrage = urllib.request.Request(
            f"{BASIS}/{methode}?apikey={key}",
            data=json.dumps(nutzlast).encode("utf-8"),
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST")
    try:
        with urllib.request.urlopen(anfrage, timeout=60) as antwort:
            return antwort.status, antwort.read().decode(errors="ignore")
    except urllib.error.HTTPError as fehler:
        return fehler.code, fehler.read().decode(errors="ignore")[:300]


# === 4b. WICHTIGSTE ZUERST ===
# Bing gibt neuen Seiten nur ein kleines Tageskontingent. Deshalb dieselbe
# Reihenfolge wie in docs/GSC_INDEXIERUNG_PLAN.md: erst Einstiegs- und
# Themenseiten (dort haengen die internen Links), dann die Pflanzenseiten.
def sortiert(liste):
    pflicht = ("bildnachweis", "image-credits", "impressum", "imprint",
               "datenschutz", "privacy", "feedback")
    def rang(u):
        if any(x in u for x in pflicht):
            return 2
        return 1 if "/plant/" in u else 0
    return sorted(liste, key=lambda u: (rang(u), len(u)))


# === 5. ADRESSEN AUS DEN SITEMAPS ===
def adressen():
    gefunden = []
    for datei in sorted(glob.glob("dist/sitemap*.xml")):
        gefunden += re.findall(r"<loc>(.*?)</loc>",
                               open(datei, encoding="utf-8").read())
    return sorted({u for u in gefunden if not u.endswith(".xml")})


# === 6. HAUPTLAUF ===
def main():
    key = schluessel()

    code, text = ruf("GetUrlSubmissionQuota", {"siteUrl": SEITE}, key, holen=True)
    frei = None
    treffer = re.search(r'"DailyQuota":(\d+)', text)
    if code == 200 and treffer:
        frei = int(treffer.group(1))
        print(f"Tageskontingent noch frei: {frei} Adressen")
    else:
        print(f"Kontingent-Abfrage: HTTP {code}  {text[:120]}")

    if "--pruefen" in sys.argv:
        return

    liste = sortiert(adressen())
    if not liste:
        sys.exit("Keine Adressen gefunden — erst 'npm run build' laufen lassen.")
    print(f"Adressen aus der Sitemap: {len(liste)}")

    # Bing gibt neuen Seiten nur wenige Meldungen pro Tag. Mehr zu schicken,
    # als frei ist, laesst den ganzen Block scheitern — also vorher kappen.
    if frei is not None and frei < len(liste):
        print(f"Kontingent reicht heute fuer {frei} — der Rest folgt morgen.")
        liste = liste[:frei]

    gemeldet = 0
    for start in range(0, len(liste), BLOCK):
        teil = liste[start:start + BLOCK]
        code, text = ruf("SubmitUrlbatch",
                         {"siteUrl": SEITE, "urlList": teil}, key)
        ok = code == 200
        print(f"Block {start // BLOCK + 1}: {len(teil):4d} Adressen -> "
              f"HTTP {code} {text[:90]}")
        if ok:
            gemeldet += len(teil)

    print(f"Gemeldet: {gemeldet} von {len(liste)}")


if __name__ == "__main__":
    main()
