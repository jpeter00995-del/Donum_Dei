# === 1. ZWECK ===
# Zweite Quelle fuer die Haustier-Angaben: CliniTox / Arznei- und
# Giftpflanzen-Datenbank des Instituts fuer Veterinaerpharmakologie und
# -toxikologie der Universitaet Zuerich (www.vetpharm.uzh.ch).
#
# Warum diese und nicht die Giftinformationszentrale Bonn: Bonn fuehrt
# ausschliesslich Vergiftungen beim MENSCHEN und sagt nichts ueber Hund und
# Katze. CliniTox ist eine tiermedizinische Datenbank und nennt zusaetzlich
# Kleintier-Monografien.
#
# WICHTIG — was diese Quelle kann und was nicht:
#   Sie fuehrt Gift- und Arzneipflanzen. Sie hat KEINE "ungiftig"-Liste.
#   Ein fehlender Eintrag ist deshalb KEIN Beleg fuer Unbedenklichkeit.
#   Der Abgleich kann nur eines: unsere "sicher"-Angaben widerlegen.
#
# Nutzung:
#   python scripts/clinitox_holen.py            (nutzt Cache)
#   python scripts/clinitox_holen.py --neu      (laedt neu, dauert ~10 min)
#
# Ergebnis: scripts/daten/clinitox_treffer.json

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

# === 2. KONSTANTEN ===
HOST = "https://www.vetpharm.uzh.ch"
SUCHE = HOST + "/perl/gplquery.pl"
KOPF = {"User-Agent": "Mozilla/5.0 (Donum-Dei Datenabgleich; nur Lesen)"}
PAUSE_SEK = 0.5

WURZEL = Path(__file__).parent.parent
PFLANZEN = WURZEL / "src" / "data" / "plants"
ZIEL = Path(__file__).parent / "daten" / "clinitox_treffer.json"
CACHE = Path(__file__).parent / "_cache_clinitox"  # nicht im Repo (.gitignore)

BLOCK = re.compile(r"Pdx Field Dokumenttext Begin -->(.*?)<!-- Die Suchfunktion", re.S)
ABSCHNITT = re.compile(r"<H3>(.*?)</H3>(.*?)(?=<H3>|\Z)", re.S)
EINTRAG = re.compile(r'<A HREF="([^"]+)">(.*?)</A>(.*?)(?=<LI>|</UL>)', re.S)
# "Toxikologie / Giftigkeit ● Giftpflanze: stark giftig ++ Verbreitung ..."
# Der Grad steht direkt hinter dem Doppelpunkt; danach beginnt der naechste
# Abschnitt. Ohne Begrenzung zieht der Ausdruck die halbe Seite mit.
GIFTGRAD = re.compile(
    r"Giftpflanze:\s*(.{0,45}?)\s*"
    r"(?:Verbreitung|Beschreibung|Vorkommen|Verwechslung|Giftige|Literatur|$)"
)


# === 3. HILFEN ===
def sauber(text):
    text = re.sub(r"<[^>]+>", " ", text)
    text = (text.replace("&#228;", "ä").replace("&#246;", "ö")
                .replace("&#252;", "ü").replace("&#196;", "Ä")
                .replace("&#214;", "Ö").replace("&#220;", "Ü")
                .replace("&#223;", "ß").replace("&rarr;", "->")
                .replace("&nbsp;", " ").replace("&amp;", "&"))
    return re.sub(r"\s+", " ", text).strip()


def holen(url, daten=None, name=""):
    """Mit Datei-Cache, damit ein zweiter Lauf nichts erneut anfragt."""
    CACHE.mkdir(exist_ok=True)
    schluessel = CACHE / (re.sub(r"[^a-zA-Z0-9]+", "_", name or url)[:120] + ".html")
    if schluessel.exists():
        return schluessel.read_text(encoding="utf-8", errors="replace")
    koerper = urllib.parse.urlencode(daten).encode() if daten else None
    anfrage = urllib.request.Request(url, data=koerper, headers=KOPF)
    with urllib.request.urlopen(anfrage, timeout=60) as antwort:
        html = antwort.read().decode("utf-8", errors="replace")
    schluessel.write_text(html, encoding="utf-8")
    time.sleep(PAUSE_SEK)
    return html


def suchergebnis(latein):
    html = holen(SUCHE, {"KEY": latein, "query": latein}, name="suche_" + latein)
    m = BLOCK.search(html)
    if not m:
        return {}
    ergebnis = {}
    for titel, inhalt in ABSCHNITT.findall(m.group(1)):
        eintraege = []
        for pfad, name, rest in EINTRAG.findall(inhalt):
            eintraege.append(
                {"pfad": pfad.replace("../", "/"), "name": sauber(name),
                 "zusatz": sauber(rest)}
            )
        ergebnis[sauber(titel)] = eintraege
    return ergebnis


def giftgrad(pfad):
    """Liest die Zeile 'Giftpflanze: ...' aus einer _bot.htm-Seite."""
    html = holen(HOST + pfad, name="seite_" + pfad)
    text = sauber(html)
    m = GIFTGRAD.search(text)
    return m.group(1).strip(" .;") if m else None


# === 4. HAUPTLAUF ===
def main():
    if ZIEL.exists() and "--neu" not in sys.argv:
        d = json.loads(ZIEL.read_text(encoding="utf-8"))
        print(f"Cache genutzt: {ZIEL} (abgerufen {d['abgerufen']}), "
              f"{len(d['pflanzen'])} Pflanzen")
        return

    zeilen = []
    dateien = sorted(PFLANZEN.glob("*.json"))
    for nr, datei in enumerate(dateien, 1):
        p = json.loads(datei.read_text(encoding="utf-8"))
        latein = (p.get("names") or {}).get("latin") or ""
        # Gattung + Art reichen; Zusaetze wie "subsp." stoeren die Suche
        kurz = " ".join(re.sub(r"[×x]\s*", "", latein).split()[:2])
        try:
            treffer = suchergebnis(kurz) if kurz else {}
        except Exception as fehler:  # Netzfehler soll den Lauf nicht killen
            print(f"! {p['slug']}: {fehler}")
            continue

        giftdb = [e for k, v in treffer.items() if "Giftpflanzen-Datenbank" in k for e in v]
        pflanzengift = [e for k, v in treffer.items() if "Pflanzengift" in k for e in v]
        kleintier = []
        for k, v in treffer.items():
            if "Toxikologie-Datenbank" in k:
                kleintier += [e["name"] for e in v]

        grade = {}
        for e in giftdb:
            if kurz.split()[0].lower() in e["name"].lower():
                g = giftgrad(e["pfad"])
                if g:
                    grade[e["name"]] = {"grad": g, "url": HOST + e["pfad"]}

        zeilen.append({
            "slug": p["slug"],
            "latein": latein,
            "gesucht": kurz,
            "pet_toxic": (p.get("safety") or {}).get("pet_toxic"),
            "giftpflanzen_db": [e["name"] for e in giftdb],
            "pflanzengift_db": [e["name"] for e in pflanzengift],
            "kleintier_monografien": sorted(set(kleintier)),
            "giftgrade": grade,
        })
        if nr % 25 == 0:
            print(f"  {nr}/{len(dateien)} ...")

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(json.dumps({
        "quelle": SUCHE,
        "quelle_name": "CliniTox / Arznei- und Giftpflanzen-Datenbank, "
                       "Institut fuer Veterinaerpharmakologie und -toxikologie, "
                       "Universitaet Zuerich",
        "abgerufen": time.strftime("%Y-%m-%d"),
        "hinweis": "Keine Ungiftig-Liste. Fehlender Eintrag ist kein Beleg fuer "
                   "Unbedenklichkeit.",
        "pflanzen": zeilen,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nGeschrieben: {ZIEL} ({len(zeilen)} Pflanzen)")


if __name__ == "__main__":
    main()
