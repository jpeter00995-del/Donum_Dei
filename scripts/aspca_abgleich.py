# === 1. ZWECK ===
# Vergleicht unsere 297 Pflanzen mit der ASPCA-Liste
# (scripts/daten/aspca_liste.json) und meldet:
#   - wo unsere Haustier-Angabe der ASPCA widerspricht
#   - welche Pflanzen die ASPCA gar nicht fuehrt (= ohne Beleg)
#
# Nutzung:
#   python scripts/aspca_abgleich.py                (Bericht)
#   python scripts/aspca_abgleich.py --json datei   (Treffer als JSON)
#
# Der Abgleich laeuft ueber den lateinischen Namen. Die ASPCA schreibt teils
# ungenau ("Lavendula angustifolia") und teils nur die Gattung ("Mentha sp."),
# deshalb drei Stufen: exakt, Tippfehler-tolerant, Gattung.

import difflib
import json
import re
import sys
from pathlib import Path

WURZEL = Path(__file__).parent.parent
PFLANZEN = WURZEL / "src" / "data" / "plants"
ASPCA = Path(__file__).parent / "daten" / "aspca_liste.json"

# === 2. NAMEN AUFBEREITEN ===
GATTUNGS_MARKER = re.compile(r"\b(sp|spp|species|var|cv|hybrid|hybrids|x)\.?\b")


def normalisieren(name):
    name = name.lower()
    name = name.replace("&", " ")
    name = re.sub(r"\([^)]*\)", " ", name)  # Klammern raus
    name = re.sub(r"[^a-z\s]", " ", name)
    name = GATTUNGS_MARKER.sub(" ", name)
    return re.sub(r"\s+", " ", name).strip()


def aspca_namen(eintrag):
    """Ein ASPCA-Eintrag kann mehrere lateinische Namen nennen."""
    roh = eintrag.get("lateinisch") or ""
    teile = re.split(r"[,;]| or ", roh)
    return [normalisieren(t) for t in teile if normalisieren(t)]


def einstufung(listen):
    giftig = "giftig_hund" in listen or "giftig_katze" in listen
    ungiftig = "ungiftig_hund" in listen or "ungiftig_katze" in listen
    if giftig:
        return "giftig"
    if ungiftig:
        return "ungiftig"
    return "unklar"


# === 3. INDEX AUFBAUEN ===
def index_bauen(daten):
    exakt = {}       # "mentha piperita" -> Eintrag
    gattung = {}     # "mentha"          -> Eintrag (nur bei "sp."-Eintraegen)
    for e in daten["pflanzen"]:
        roh = (e.get("lateinisch") or "").lower()
        for n in aspca_namen(e):
            exakt.setdefault(n, e)
            woerter = n.split()
            if len(woerter) == 1 or re.search(r"\b(sp|spp|species)\.", roh):
                gattung.setdefault(woerter[0], e)
    return exakt, gattung


def suchen(latein, exakt, gattung):
    """Liefert (Eintrag, Trefferart) oder (None, 'keiner')."""
    n = normalisieren(latein)
    if not n:
        return None, "keiner"
    if n in exakt:
        return exakt[n], "exakt"

    # Tippfehler-tolerant, aber nur innerhalb derselben Art-Bezeichnung
    art = n.split()[-1] if len(n.split()) > 1 else None
    if art:
        kandidaten = [k for k in exakt if k.endswith(" " + art)]
        treffer = difflib.get_close_matches(n, kandidaten, n=1, cutoff=0.88)
        if treffer:
            return exakt[treffer[0]], "aehnlich"

    g = n.split()[0]
    if g in gattung:
        return gattung[g], "gattung"
    return None, "keiner"


# === 4. HAUPTLAUF ===
def main():
    daten = json.loads(ASPCA.read_text(encoding="utf-8"))
    exakt, gattung = index_bauen(daten)

    zeilen = []
    for datei in sorted(PFLANZEN.glob("*.json")):
        p = json.loads(datei.read_text(encoding="utf-8"))
        latein = (p.get("names") or {}).get("latin") or ""
        eintrag, art = suchen(latein, exakt, gattung)
        unser = (p.get("safety") or {}).get("pet_toxic")
        aspca_wert = einstufung(eintrag["listen"]) if eintrag else "nicht_gelistet"
        zeilen.append(
            {
                "slug": p["slug"],
                "latein": latein,
                "unser_pet_toxic": unser,
                "aspca": aspca_wert,
                "trefferart": art,
                "aspca_slug": eintrag["slug"] if eintrag else None,
                "aspca_name": eintrag["name"] if eintrag else None,
                "aspca_latein": eintrag["lateinisch"] if eintrag else None,
                "aspca_listen": eintrag["listen"] if eintrag else [],
            }
        )

    # --- Bericht ---
    def zaehle(bedingung):
        return [z for z in zeilen if bedingung(z)]

    print(f"Pflanzen gesamt: {len(zeilen)}")
    print(f"ASPCA-Liste:     {len(daten['pflanzen'])} Eintraege "
          f"(abgerufen {daten['abgerufen']})\n")

    for art in ("exakt", "aehnlich", "gattung", "keiner"):
        print(f"  Treffer {art:9s}: {len(zaehle(lambda z, a=art: z['trefferart'] == a))}")

    widerspruch_giftig = zaehle(
        lambda z: z["unser_pet_toxic"] is False and z["aspca"] == "giftig"
    )
    widerspruch_ungiftig = zaehle(
        lambda z: z["unser_pet_toxic"] is True and z["aspca"] == "ungiftig"
    )
    bestaetigt = zaehle(
        lambda z: (z["unser_pet_toxic"] is False and z["aspca"] == "ungiftig")
        or (z["unser_pet_toxic"] is True and z["aspca"] == "giftig")
    )
    ohne_beleg_sicher = zaehle(
        lambda z: z["unser_pet_toxic"] is False and z["aspca"] == "nicht_gelistet"
    )
    fehlend = zaehle(lambda z: z["unser_pet_toxic"] is None)

    print(f"\nBestaetigt durch ASPCA:                 {len(bestaetigt)}")
    print(f"WIDERSPRUCH — wir sicher, ASPCA giftig: {len(widerspruch_giftig)}")
    print(f"Widerspruch — wir giftig, ASPCA nicht:  {len(widerspruch_ungiftig)}")
    print(f"Wir 'sicher', ASPCA fuehrt sie nicht:   {len(ohne_beleg_sicher)}")
    print(f"Ohne Haustier-Angabe bei uns:           {len(fehlend)}")

    if widerspruch_giftig:
        print("\n--- WIDERSPRUCH: bei uns haustiersicher, ASPCA giftig ---")
        for z in widerspruch_giftig:
            print(f"  {z['slug']:32s} {z['latein']:34s} <- {z['aspca_name']} "
                  f"({z['aspca_latein']}, {z['trefferart']})")

    if widerspruch_ungiftig:
        print("\n--- Widerspruch: bei uns giftig, ASPCA ungiftig ---")
        for z in widerspruch_ungiftig:
            print(f"  {z['slug']:32s} {z['latein']:34s} <- {z['aspca_name']} "
                  f"({z['aspca_latein']}, {z['trefferart']})")

    if "--json" in sys.argv:
        ziel = Path(sys.argv[sys.argv.index("--json") + 1])
        ziel.write_text(json.dumps(zeilen, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nJSON geschrieben: {ziel}")


if __name__ == "__main__":
    main()
