# === 1. ZWECK ===
# Misst, wie viel sichtbarer Text tatsaechlich auf jeder gebauten Seite steht,
# gruppiert nach Seitentyp. Grundlage fuer die Frage, ob Google die Seite zu
# Recht als "minderwertige Inhalte" einstuft.
# Nutzung: python scripts/textmenge.py

import re
import glob
import os
from collections import defaultdict


def sichtbarer_text(pfad):
    h = open(pfad, encoding="utf-8", errors="ignore").read()
    m = re.search(r"<main.*?</main>", h, re.S) or re.search(r"<body.*?</body>", h, re.S)
    t = m.group(0) if m else h
    t = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    t = re.sub(r"<style.*?</style>", "", t, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return len(re.sub(r"\s+", " ", t).strip())


def typ(rel):
    if "/plant/" in rel:
        return "Pflanzen-Detailseiten"
    if "heilpflanzen-gegen" in rel or "plants-for" in rel:
        return "Symptomseiten"
    if "heilpflanzen-ernten" in rel or "harvest-calendar" in rel:
        return "Ernte-Monatsseiten"
    if rel in ("de", "en"):
        return "Startseiten"
    return "sonstige Seiten"


gruppen = defaultdict(list)
for p in glob.glob("dist/**/index.html", recursive=True):
    rel = os.path.relpath(p, "dist").replace(os.sep, "/").replace("/index.html", "")
    gruppen[typ(rel)].append((sichtbarer_text(p), rel))

print(f"{'Seitentyp':26s} {'Anzahl':>7s} {'Median':>8s} {'Min':>7s} {'Max':>8s}")
for k, v in sorted(gruppen.items(), key=lambda x: -len(x[1])):
    laengen = sorted(x[0] for x in v)
    n = len(laengen)
    print(f"{k:26s} {n:7d} {laengen[n // 2]:8d} {laengen[0]:7d} {laengen[-1]:8d}")

alle = [x for v in gruppen.values() for x in v]
print()
print("Seiten unter 1500 Zeichen sichtbarem Text:", sum(1 for c, _ in alle if c < 1500), "von", len(alle))
print("Seiten unter 2500 Zeichen:", sum(1 for c, _ in alle if c < 2500))
print()
print("Die zehn duennsten Seiten:")
for c, r in sorted(alle)[:10]:
    print(f"  {c:6d}  /{r}/")
