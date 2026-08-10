# === 1. ZWECK ===
# Traegt die am 2026-08-10 bei der ASPCA nachgeschlagene Haustier-Giftigkeit
# ein: `safety.pet_toxic`, ein Satz im Warntext und die Quelle in `sources[]`.
#
# Hintergrund: Von 286 Pflanzen mit einer Haustier-Einstufung nannten nur 14
# ueberhaupt eine Quelle. Auf der Seite "Ungiftige Pflanzen fuer Katzen und
# Hunde" standen Lavendel, Oregano, Minze, Zitronengras, Petersilie,
# Lorbeer, Zitronenstrauch und zwei Plectranthus-Arten — die ASPCA fuehrt
# sie alle als giftig.
#
# Nutzung: python scripts/aspca_uebernehmen.py [--schreiben]

import json
import sys
from pathlib import Path

ABGERUFEN = "2026-08-10"
BASIS = "https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/"

# === 2. NACHGESCHLAGENE EINSTUFUNGEN ===
# (slug, giftig, aspca-pfad, aspca-name, kurzfassung der Einstufung)
EINTRAEGE = [
    # --- als giftig gefuehrt ---
    ("lavandula-angustifolia", True, "lavender", "Lavender (Lavandula angustifolia)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("origanum-vulgare", True, "oregano", "Oregano (Origanum vulgare hirtum)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("cymbopogon-citratus", True, "lemon-grass", "Lemon Grass (Cymbopogon citratus)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("plectranthus-barbatus", True, "coleus", "Coleus (Coleus ampoinicus)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("plectranthus-caninus", True, "coleus", "Coleus (Coleus ampoinicus)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("mentha-piperita", True, "mint", "Mint (Mentha sp.)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("mentha-spicata", True, "mint", "Mint (Mentha sp.)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("mentha-villosa", True, "mint", "Mint (Mentha sp.)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("petroselinum-crispum", True, "parsley", "Parsley (Petroselinum crispum)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("petroselinum-crispum-tuberosum", True, "parsley", "Parsley (Petroselinum crispum)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("laurus-nobilis", True, "bay-laurel", "Bay Laurel (Laurus nobilis)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("aloysia-citrodora", True, "lemon-verbena", "Lemon Verbena (Aloysia triphylla)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("eucalyptus-globulus", True, "eucalyptus", "Eucalyptus (Eucalyptus species)", "Toxic to Dogs, Toxic to Cats, Toxic to Horses"),
    ("nepeta-cataria", True, "catnip", "Catnip (Nepeta cataria)", "Toxic to Cats"),
    # --- als ungiftig bestaetigt ---
    ("chlorophytum-comosum", False, "spider-plant", "Spider Plant (Chlorophytum comosum)", "Non-Toxic to Dogs, Non-Toxic to Cats"),
    ("nephrolepis-exaltata", False, "boston-fern", "Boston Fern (Nephrolepis exalta bostoniensis)", "Non-Toxic to Dogs, Non-Toxic to Cats"),
    ("dypsis-lutescens", False, "areca-palm", "Areca Palm (Dypsis lutescens)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("phalaenopsis-spp", False, "phalaenopsis-orchid", "Phalaenopsis Orchid (Phalaenopsis sp.)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("ocimum-basilicum", False, "basil", "Basil (Ocimum basilicum)", "Non-Toxic to Dogs, Non-Toxic to Cats"),
    ("rosmarinus-officinalis", False, "rosemary", "Rosemary (Rosmarinus officinalis)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("thymus-vulgaris", False, "thyme", "Thyme (Thymus vulgaris)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("salvia-officinalis", False, "sage", "Sage (Salvia officinalis)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("melissa-officinalis", False, "lemon-balm", "Lemon Balm (Melissa officinalis)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("calendula-officinalis", False, "pot-marigold", "Pot Marigold (Calendula officinalis)", "Non-Toxic to Dogs, Non-Toxic to Cats"),
    ("coriandrum-sativum", False, "cilantro", "Cilantro (Coriandrum sativum)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("anethum-graveolens", False, "dill", "Dill (Anethum graveolens)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("tropaeolum-majus", False, "nasturtium", "Nasturtium (Tropaeolum majus)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
    ("stevia-rebaudiana", False, "stevia", "Stevia (Stevia rebaudiana)", "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses"),
]


# === 3. TEXTBAUSTEINE ===
def satz_de(giftig, einstufung):
    if not giftig:
        return f" ASPCA-Einstufung (abgerufen {ABGERUFEN}): für Hunde und Katzen ungiftig."
    if einstufung == "Toxic to Cats":
        return f" ASPCA-Einstufung (abgerufen {ABGERUFEN}): für Katzen giftig — größere Mengen können Erbrechen und Durchfall auslösen."
    return f" ASPCA-Einstufung (abgerufen {ABGERUFEN}): für Hunde, Katzen und Pferde giftig."


def satz_en(giftig, einstufung):
    if not giftig:
        return f" ASPCA classification (accessed {ABGERUFEN}): non-toxic to dogs and cats."
    if einstufung == "Toxic to Cats":
        return f" ASPCA classification (accessed {ABGERUFEN}): toxic to cats — larger amounts can cause vomiting and diarrhoea."
    return f" ASPCA classification (accessed {ABGERUFEN}): toxic to dogs, cats and horses."


# === 4. LAUF ===
def lauf(schreiben):
    geaendert = 0
    for slug, giftig, pfad, name, einstufung in EINTRAEGE:
        p = Path("src/data/plants") / f"{slug}.json"
        if not p.exists():
            print(f"FEHLT   {slug}")
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        sicherheit = d.setdefault("safety", {})
        alt = sicherheit.get("pet_toxic")
        quell_id = f"src_aspca_{pfad.replace('-', '_')}"

        hat_quelle = any(s.get("id") == quell_id for s in d.get("sources", []))
        aenderung = alt != giftig or not hat_quelle
        print(f"{'*' if aenderung else ' '} {slug:34s} pet_toxic {alt} -> {giftig}   ({einstufung})")
        if not aenderung or not schreiben:
            continue

        sicherheit["pet_toxic"] = giftig
        warnungen = sicherheit.setdefault("warnings", {"de": "", "en": ""})
        if "ASPCA-Einstufung" not in (warnungen.get("de") or ""):
            warnungen["de"] = (warnungen.get("de") or "").rstrip() + satz_de(giftig, einstufung)
        if "ASPCA classification" not in (warnungen.get("en") or ""):
            warnungen["en"] = (warnungen.get("en") or "").rstrip() + satz_en(giftig, einstufung)
        if not hat_quelle:
            d.setdefault("sources", []).append({
                "id": quell_id,
                "type": "monograph",
                "title": f"ASPCA Animal Poison Control — {name}: {einstufung}",
                "url": BASIS + pfad,
                "accessed": ABGERUFEN,
            })
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        geaendert += 1

    print()
    print(f"GESCHRIEBEN — {geaendert} Dateien." if schreiben else "(Vorschau — nichts geschrieben. Mit --schreiben uebernehmen.)")
    return 0


if __name__ == "__main__":
    sys.exit(lauf("--schreiben" in sys.argv))
