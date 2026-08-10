# === 1. ZWECK ===
# Prueft im gebauten Stand (dist/) alle internen Verweise und Bild-Adressen.
# Findet tote Links und fehlende Bilder, bevor ein Besucher oder Google sie
# findet. Laeuft ohne Browser und ohne Server.
#
# Nutzung (nach `npm run build`):
#   python scripts/link_check.py
import re
import os
import glob
from pathlib import Path
from urllib.parse import unquote

DIST = str(Path(__file__).parent.parent / "dist")

seiten = glob.glob(os.path.join(DIST, "**", "*.html"), recursive=True)
print("HTML-Seiten:", len(seiten))


def existiert(pfad):
    p = os.path.join(DIST, pfad.lstrip("/").replace("/", os.sep))
    return (
        os.path.isfile(p)
        or os.path.isfile(os.path.join(p, "index.html"))
        or os.path.isfile(p.rstrip(os.sep) + ".html")
    )


tote_links, tote_bilder = {}, {}
for s in seiten:
    h = open(s, encoding="utf-8", errors="replace").read()
    quelle = os.path.relpath(s, DIST).replace(os.sep, "/")
    for href in re.findall(r'<a [^>]*href="(/[^"#?]*)"', h):
        ziel = unquote(href)
        if not existiert(ziel):
            tote_links.setdefault(ziel, set()).add(quelle)
    for src in re.findall(r'<img [^>]*src="(/[^"?]*)"', h):
        ziel = unquote(src)
        if not existiert(ziel):
            tote_bilder.setdefault(ziel, set()).add(quelle)

print("\nTote interne Verweise:", len(tote_links))
for z, von in sorted(tote_links.items())[:20]:
    print(f"  {z:52s} <- {len(von):4d} Seiten, z.B. {sorted(von)[0]}")

print("\nFehlende Bilder:", len(tote_bilder))
for z, von in sorted(tote_bilder.items())[:20]:
    print(f"  {z:52s} <- {len(von):4d} Seiten, z.B. {sorted(von)[0]}")
