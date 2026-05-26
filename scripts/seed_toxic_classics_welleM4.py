#!/usr/bin/env python3
"""
=== Welle M.4 — Seed 12 toxic classics ===

Adds the 12 most pedagogically important European toxic plants to the
database. Reuses the Wikipedia + Wikimedia Commons fetcher from
scrape_plants.process_plant — same JSON schema, same image-download
pipeline, same license-attribution.

The `warnings` field is hand-written with CAPS "GIFTIG / TOXIC" so the
toxicity migration heuristic (Welle M.3) classifies them as `'toxic'`
automatically when re-run.

Usage:
    python3 scripts/seed_toxic_classics_welleM4.py
"""

# === 1. IMPORTS ===
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_plants import process_plant, DATA_DIR, IMG_DIR  # noqa: E402
import os  # noqa: E402

# === 2. CONFIG ===

# Tuple format (same as scrape_plants.PLANTS):
# (slug, latin, de_wiki_title, en_wiki_title,
#  family_de, family_en, family_latin,
#  default_use_form, default_target, default_int_ext, default_active_months,
#  default_harvest_part_de, default_harvest_part_en,
#  default_warnings_de, default_warnings_en, external_only)

CLASSICS = [
    # 1. Herbstzeitlose — Verwechslung mit BÄRLAUCH (Top-Killer)
    ("colchicum-autumnale", "Colchicum autumnale", "Herbstzeitlose", "Colchicum_autumnale",
     "Zeitlosengewächse", "Autumn-crocus family", "Colchicaceae",
     "tincture", ["caution"], "external", [8, 9, 10],
     "blühende Pflanze / Knolle",
     "flowering plant / corm",
     "EXTREM GIFTIG (Colchicin). VERWECHSLUNGSGEFAHR mit BÄRLAUCH — Blätter sehen sehr ähnlich aus, austretender Geruch beim Zerreiben fehlt aber bei Herbstzeitlose. Schon wenige Gramm können tödlich sein. NIEMALS sammeln oder verzehren — auch nicht homöopathisch ohne ärztliche Aufsicht.",
     "EXTREMELY TOXIC (colchicine). RISK OF CONFUSION with WILD GARLIC — leaves look very similar, but the characteristic garlic smell when crushed is absent. A few grams can be lethal. NEVER collect or consume — not even homeopathically without medical supervision.",
     True),

    # 2. Gefleckter Schierling — Verwechslung mit Petersilie (Sokrates-Gift)
    ("conium-maculatum", "Conium maculatum", "Gefleckter_Schierling", "Conium_maculatum",
     "Doldenblütler", "Carrot family", "Apiaceae",
     "tincture", ["caution"], "external", [6, 7, 8],
     "ganze Pflanze",
     "whole plant",
     "TÖDLICH GIFTIG (Coniin) — historisches „Schierlingsbecher\"-Gift (Sokrates). VERWECHSLUNGSGEFAHR mit Petersilie, Kerbel, Anis. Erkennbar an rot gefleckten Stängeln und mausartigem Geruch beim Zerreiben. NIEMALS verwenden.",
     "FATALLY TOXIC (coniine) — the historical 'hemlock cup' poison (Socrates). RISK OF CONFUSION with parsley, chervil, anise. Recognisable by red-spotted stems and mouse-like smell when crushed. NEVER use.",
     True),

    # 3. Tollkirsche — Beeren-Verwechslung
    ("atropa-belladonna", "Atropa belladonna", "Schwarze_Tollkirsche", "Atropa_belladonna",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "tincture", ["nerves"], "external", [7, 8, 9],
     "Blätter und Wurzeln",
     "leaves and roots",
     "SEHR GIFTIG (Atropin, Scopolamin) — schon 3-4 Beeren können für Kinder tödlich sein. Beeren sehen verlockend kirschartig aus. VERWECHSLUNGSGEFAHR mit Blaubeere, schwarzer Johannisbeere. Historisches Heilmittel, heute nur als geprüftes Fertigpräparat (Atropin in der Augenheilkunde).",
     "VERY TOXIC (atropine, scopolamine) — 3-4 berries can be lethal for children. Berries look temptingly cherry-like. RISK OF CONFUSION with blueberry, blackcurrant. Historical remedy, today only as standardised pharmaceutical (atropine in ophthalmology).",
     True),

    # 4. Blauer Eisenhut — giftigste Pflanze Mitteleuropas
    ("aconitum-napellus", "Aconitum napellus", "Blauer_Eisenhut", "Aconitum_napellus",
     "Hahnenfußgewächse", "Buttercup family", "Ranunculaceae",
     "tincture", ["caution"], "external", [6, 7, 8],
     "ganze Pflanze",
     "whole plant",
     "GIFTIGSTE PFLANZE Mitteleuropas (Aconitin) — Hautkontakt mit Wurzel oder Saft kann zu Vergiftung führen. NIEMALS ohne Handschuhe berühren. Historisch homöopathisch, heute nur unter ärztlicher Aufsicht. Schon 2g Wurzel sind für Erwachsene tödlich.",
     "MOST TOXIC PLANT in Central Europe (aconitine) — skin contact with root or sap can cause poisoning. NEVER touch without gloves. Historically homeopathic, today only under medical supervision. Just 2g of root is lethal for adults.",
     True),

    # 5. Stechapfel — Halluzinogen + giftig
    ("datura-stramonium", "Datura stramonium", "Gemeiner_Stechapfel", "Datura_stramonium",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "tincture", ["caution"], "external", [7, 8, 9],
     "ganze Pflanze, besonders Samen",
     "whole plant, especially seeds",
     "SEHR GIFTIG (Atropin, Scopolamin, Hyoscyamin). Stark halluzinogen — historisch in Schamanen-Riten verwendet, aber häufige tödliche Vergiftungen besonders bei Jugendlichen, die „high\" werden wollen. Samen besonders gefährlich. NIEMALS verwenden.",
     "VERY TOXIC (atropine, scopolamine, hyoscyamine). Strongly hallucinogenic — historically used in shamanic rituals, but frequent fatal poisonings especially among teenagers seeking a 'high'. Seeds particularly dangerous. NEVER use.",
     True),

    # 6. Schwarzes Bilsenkraut — historisch berühmt
    ("hyoscyamus-niger", "Hyoscyamus niger", "Schwarzes_Bilsenkraut", "Hyoscyamus_niger",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "tincture", ["caution"], "external", [6, 7, 8],
     "Blätter und Samen",
     "leaves and seeds",
     "SEHR GIFTIG (Hyoscyamin, Scopolamin) — historisches Hexenkraut und Bier-Würzmittel im Mittelalter („Pilsen\"-Bier). Heute nur als geprüftes Pharma-Produkt (Scopolamin als Reisetabletten). Selbstanwendung lebensgefährlich.",
     "VERY TOXIC (hyoscyamine, scopolamine) — historical 'witches' herb' and medieval beer-flavouring ('Pilsen' beer). Today only as standardised pharmaceutical (scopolamine in motion-sickness pills). Self-use life-threatening.",
     True),

    # 7. Eibe — sehr verbreitet, alle Teile außer Arillus giftig
    ("taxus-baccata", "Taxus baccata", "Europ%C3%A4ische_Eibe", "Taxus_baccata",
     "Eibengewächse", "Yew family", "Taxaceae",
     "tincture", ["caution"], "external", [8, 9, 10],
     "Nadeln, Samen, Rinde",
     "needles, seeds, bark",
     "GIFTIG (Taxin) — Nadeln, Samen und Rinde sind hochgiftig. Nur der rote Samenmantel (Arillus) ist ungiftig, der Samen darin aber GIFTIG. Sehr verbreitet als Zierpflanze in Gärten und Friedhöfen — Kinder und Pferde gefährdet. Modernes Krebsmedikament Paclitaxel wird daraus gewonnen, aber NIEMALS Selbstanwendung.",
     "TOXIC (taxin) — needles, seeds and bark are highly toxic. Only the red seed coat (arillus) is non-toxic, but the seed inside is TOXIC. Very common as ornamental in gardens and cemeteries — children and horses at risk. The modern cancer drug paclitaxel is derived from it, but NEVER self-use.",
     True),

    # 8. Seidelbast — Beeren-Verwechslung
    ("daphne-mezereum", "Daphne mezereum", "Echter_Seidelbast", "Daphne_mezereum",
     "Seidelbastgewächse", "Daphne family", "Thymelaeaceae",
     "tincture", ["caution"], "external", [7, 8, 9],
     "Rinde und Beeren",
     "bark and berries",
     "SEHR GIFTIG (Mezerein, Daphnin) — schon 10-12 rote Beeren können für Erwachsene tödlich sein. Rinde verursacht starke Hautblasen. Beeren sehen verlockend rot aus. NIEMALS sammeln. In Mitteleuropa unter Naturschutz.",
     "VERY TOXIC (mezerein, daphnin) — just 10-12 red berries can be lethal for adults. Bark causes severe skin blisters. Berries look temptingly red. NEVER collect. Protected species in Central Europe.",
     True),

    # 9. Alraune — mythisch + giftig
    ("mandragora-officinarum", "Mandragora officinarum", "Gemeine_Alraune", "Mandragora_officinarum",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "tincture", ["caution"], "external", [4, 5, 6],
     "Wurzel",
     "root",
     "SEHR GIFTIG (Atropin, Scopolamin, Hyoscyamin) — mythische „Hexenwurzel\" und historisches Schmerz/Schlafmittel. Wurzel sieht oft menschenähnlich aus, daher zahlreiche Legenden. Heute nur als historische Heilpflanze von Bedeutung. NIEMALS Selbstanwendung.",
     "VERY TOXIC (atropine, scopolamine, hyoscyamine) — mythical 'witches' root' and historical pain/sleep remedy. The root often appears human-like, hence many legends. Today only of historical significance as medicinal plant. NEVER self-use.",
     True),

    # 10. Osterluzei — historisch Heilpflanze, heute verboten wegen Nephrotoxizität
    ("aristolochia-clematitis", "Aristolochia clematitis", "Gew%C3%B6hnliche_Osterluzei", "Aristolochia_clematitis",
     "Osterluzeigewächse", "Birthwort family", "Aristolochiaceae",
     "tincture", ["caution"], "external", [5, 6, 7],
     "Kraut und Wurzel",
     "herb and root",
     "GIFTIG (Aristolochiasäure) — stark nieren­schädigend und krebs­erregend. Historisches Hebammen­mittel, heute weltweit als Arzneimittel verboten (auch in TCM-Präparaten — Vorsicht bei chinesischen „Schlankheits­tees\"). NIEMALS verwenden.",
     "TOXIC (aristolochic acid) — strongly kidney-damaging and carcinogenic. Historical midwife remedy, today banned worldwide as medicine (also in TCM preparations — caution with Chinese 'slimming teas'). NEVER use.",
     True),

    # 11. Wunderbaum — Ricin
    ("ricinus-communis", "Ricinus communis", "Rizinus", "Ricinus_communis",
     "Wolfsmilchgewächse", "Spurge family", "Euphorbiaceae",
     "tincture", ["caution"], "external", [9, 10],
     "Samen",
     "seeds",
     "EXTREM GIFTIG (Ricin) — eines der stärksten bekannten Pflanzengifte. Schon 1-2 Samen können für Kinder tödlich sein. Das gepresste Rizinusöl ist hingegen ungiftig (Ricin bleibt im Presskuchen). Beliebte Zierpflanze mit auffallend bunten Blättern — Samen wegen attraktivem Aussehen besonders gefährlich für Kinder.",
     "EXTREMELY TOXIC (ricin) — one of the most potent known plant poisons. Just 1-2 seeds can be lethal for children. Pressed castor oil is however non-toxic (ricin remains in the press-cake). Popular ornamental with strikingly colourful leaves — seeds particularly dangerous for children due to attractive appearance.",
     True),

    # 12. Weißer Germer — Verwechslung mit Gelbem Enzian (schon in DB)
    ("veratrum-album", "Veratrum album", "Wei%C3%9Fer_Germer", "Veratrum_album",
     "Germergewächse", "False-hellebore family", "Melanthiaceae",
     "tincture", ["caution"], "external", [7, 8],
     "Wurzel",
     "root",
     "SEHR GIFTIG (Veratrum-Alkaloide) — VERWECHSLUNGSGEFAHR mit GELBEM ENZIAN beim Wurzel-Sammeln für Enzian-Schnaps. Schon Tropfen können Erbrechen und Kreislaufkollaps verursachen. Immer wieder tödliche Vergiftungen in Berg-Regionen. NIEMALS in unbekannten Mengen oder ohne sichere Bestimmung.",
     "VERY TOXIC (Veratrum alkaloids) — RISK OF CONFUSION with YELLOW GENTIAN when collecting roots for gentian schnapps. Even drops can cause vomiting and circulatory collapse. Regular fatal poisonings in mountain regions. NEVER in unknown amounts or without certain identification.",
     True),
]


# === 3. RUN ===
def main() -> int:
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    print(f"Seeding {len(CLASSICS)} toxic classics (parallel, max 6 workers)…")
    results = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(process_plant, p): p[0] for p in CLASSICS}
        for fut in as_completed(futures):
            slug = futures[fut]
            try:
                fut.result()
                print(f"  ✓ {slug}")
                results.append((slug, True))
            except Exception as e:
                print(f"  ✗ {slug}: {e}")
                results.append((slug, False))

    ok = sum(1 for _, s in results if s)
    print(f"\nDone: {ok}/{len(CLASSICS)} succeeded.")
    print("Next: re-run scripts/migrate_toxicity_welleM3.py to auto-classify the new plants.")
    return 0 if ok == len(CLASSICS) else 1


if __name__ == "__main__":
    sys.exit(main())
