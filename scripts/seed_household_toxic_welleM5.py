#!/usr/bin/env python3
"""
=== Welle M.5 — Seed 20 household toxic classics ===

Adds the 20 most common toxic plants found IN and AROUND European homes:
  - 10 Garten/Hecke (Goldregen, Buchs, Liguster, Pfaffenhütchen, Stechpalme,
                     Lorbeerkirsche, Rhododendron, Thuja, Robinie, Schneebeere)
  - 3  Frühlingszwiebeln (Tulpe, Narzisse, Hyazinthe)
  - 3  Topf/Kübel (Oleander, Engelstrompete, Alpenveilchen)
  - 4  Zimmerpflanzen (Dieffenbachia, Philodendron, Weihnachtsstern, Amaryllis)

Reuses scrape_plants.process_plant — same JSON schema, same image download,
same license attribution. Warnings hand-written with CAPS "GIFTIG/TOXIC" so
migrate_toxicity_welleM3.py auto-classifies them on re-run.

Usage:
    python3 scripts/seed_household_toxic_welleM5.py
    python3 scripts/migrate_toxicity_welleM3.py    # auto-classify the new entries
"""

# === 1. IMPORTS ===
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_plants import process_plant, DATA_DIR, IMG_DIR  # noqa: E402

# === 2. CONFIG ===
# Tuple format (same as scrape_plants.PLANTS):
# (slug, latin, de_wiki_title, en_wiki_title,
#  family_de, family_en, family_latin,
#  default_use_form, default_target, default_int_ext, default_active_months,
#  default_harvest_part_de, default_harvest_part_en,
#  default_warnings_de, default_warnings_en, external_only)

HOUSEHOLD_TOXIC = [
    # === A. GARTEN / HECKE (10) ===

    # 1. Goldregen — gelbe Trauben, häufigste Kinder-Vergiftung im Vorgarten
    ("laburnum-anagyroides", "Laburnum anagyroides",
     "Gew%C3%B6hnlicher_Goldregen", "Laburnum_anagyroides",
     "Hülsenfrüchtler", "Legume family", "Fabaceae",
     "tincture", ["caution"], "external", [5, 6],
     "alle Pflanzenteile, besonders Samen",
     "all plant parts, especially seeds",
     "SEHR GIFTIG (Cytisin) — alle Pflanzenteile, besonders die erbsenähnlichen Samen. Häufigste schwere Pflanzenvergiftung bei Kindern in Mitteleuropa. Schon 3-4 Samen können bei Kindern zu schweren Vergiftungen führen. Beliebter Zierstrauch in Vorgärten — Kinder kauen die hübschen Samenhülsen. NIEMALS verzehren.",
     "VERY TOXIC (cytisine) — all plant parts, especially the pea-like seeds. The most common severe plant poisoning of children in Central Europe. Just 3-4 seeds can cause severe poisoning in children. Popular ornamental shrub in front gardens — children chew the pretty seed pods. NEVER consume.",
     True),

    # 2. Buchsbaum — Standard-Heckenpflanze, Alkaloide
    ("buxus-sempervirens", "Buxus sempervirens",
     "Gew%C3%B6hnlicher_Buchsbaum", "Buxus_sempervirens",
     "Buchsbaumgewächse", "Box family", "Buxaceae",
     "tincture", ["caution"], "external", [4, 5, 6, 7, 8, 9],
     "Blätter und Rinde",
     "leaves and bark",
     "GIFTIG (Buxin, Cyclobuxin) — alle Pflanzenteile, besonders Blätter und Rinde. Standard-Heckenpflanze in europäischen Gärten und Friedhöfen. Verursacht Erbrechen, Krämpfe, Atemlähmung. Auch für Hunde, Katzen, Pferde toxisch. Tee-Aufgüsse aus Buchsblättern sind GEFÄHRLICH — historische Volksmedizin überholt.",
     "TOXIC (buxine, cyclobuxine) — all plant parts, especially leaves and bark. Standard hedge plant in European gardens and cemeteries. Causes vomiting, seizures, respiratory paralysis. Also toxic for dogs, cats, horses. Tea infusions from box leaves are DANGEROUS — historical folk medicine is outdated.",
     True),

    # 3. Liguster — Standard-Hecke, schwarze Beeren
    ("ligustrum-vulgare", "Ligustrum vulgare",
     "Gew%C3%B6hnlicher_Liguster", "Ligustrum_vulgare",
     "Ölbaumgewächse", "Olive family", "Oleaceae",
     "tincture", ["caution"], "external", [6, 7, 8, 9, 10],
     "Beeren und Blätter",
     "berries and leaves",
     "GIFTIG (Ligustrin) — schwarze Beeren und Blätter. Sehr verbreitete Heckenpflanze in europäischen Gärten. Beeren werden manchmal von Kindern verzehrt — schon 6-10 Beeren verursachen Erbrechen, Durchfall, Kreislaufstörungen. Auch für Pferde, Hunde, Katzen toxisch. NICHT mit essbarem Aronia oder Holunder verwechseln.",
     "TOXIC (ligustrin) — black berries and leaves. Very common hedge plant in European gardens. Berries are sometimes consumed by children — just 6-10 berries cause vomiting, diarrhoea, circulatory problems. Also toxic for horses, dogs, cats. Do NOT confuse with edible aronia or elderberry.",
     True),

    # 4. Pfaffenhütchen — rosa-orange Früchte, extrem auffällig
    ("euonymus-europaeus", "Euonymus europaeus",
     "Gew%C3%B6hnlicher_Spindelstrauch", "Euonymus_europaeus",
     "Spindelbaumgewächse", "Spindle family", "Celastraceae",
     "tincture", ["caution"], "external", [9, 10],
     "Früchte und Samen",
     "fruits and seeds",
     "SEHR GIFTIG (Evonin, Evobiosid) — auffällig rosa-orange „Pfaffenhütchen\"-Früchte und Samen. Wirkung tritt erst 12-15 Stunden nach Verzehr ein — daher oft zu spät erkannt. Schon 30-40 Samen sind für Erwachsene potenziell tödlich. Sehr verbreiteter Zierstrauch in Hecken und Parks — Kinder fasziniert von den bunten Früchten.",
     "VERY TOXIC (evonine, evobioside) — strikingly pink-orange 'spindle' fruits and seeds. Symptoms appear only 12-15 hours after consumption — often recognised too late. Just 30-40 seeds are potentially lethal for adults. Very common ornamental shrub in hedges and parks — children fascinated by the colourful fruits.",
     True),

    # 5. Stechpalme — rote Beeren, Weihnachtsdeko
    ("ilex-aquifolium", "Ilex aquifolium",
     "Gew%C3%B6hnliche_Stechpalme", "Ilex_aquifolium",
     "Stechpalmengewächse", "Holly family", "Aquifoliaceae",
     "tincture", ["caution"], "external", [9, 10, 11, 12],
     "rote Beeren",
     "red berries",
     "GIFTIG (Ilicin, Saponine) — rote Beeren. Klassische Weihnachtsdekoration im Haus — Kinder und Haustiere gefährdet. Schon 5-10 Beeren verursachen heftiges Erbrechen, Durchfall, Schläfrigkeit bei Kindern. Bei Hunden und Katzen ebenfalls toxisch. Die stachligen Blätter sind weniger gefährlich, aber ungenießbar.",
     "TOXIC (ilicin, saponins) — red berries. Classic Christmas decoration indoors — children and pets at risk. Just 5-10 berries cause severe vomiting, diarrhoea, drowsiness in children. Also toxic for dogs and cats. The spiny leaves are less dangerous but inedible.",
     True),

    # 6. Lorbeerkirsche / Kirschlorbeer — Blausäure, sehr verbreitete Hecke
    ("prunus-laurocerasus", "Prunus laurocerasus",
     "Lorbeerkirsche", "Prunus_laurocerasus",
     "Rosengewächse", "Rose family", "Rosaceae",
     "tincture", ["caution"], "external", [8, 9, 10],
     "Blätter und Samen",
     "leaves and seeds",
     "GIFTIG (cyanogene Glykoside, Blausäure) — Blätter und Samen. Eine der häufigsten Heckenpflanzen Mitteleuropas. Das Fruchtfleisch der schwarzen Beeren ist relativ harmlos, aber die Samen darin enthalten Blausäure. Beim Häckseln der Hecke entstehen giftige Blausäure-Dämpfe — daher NICHT in den Kompost, nur frisch häckseln im Freien.",
     "TOXIC (cyanogenic glycosides, hydrocyanic acid) — leaves and seeds. One of the most common hedge plants in Central Europe. The flesh of the black berries is relatively harmless, but the seeds within contain cyanide. Shredding the hedge releases toxic cyanide fumes — therefore do NOT compost, only shred fresh outdoors.",
     True),

    # 7. Rhododendron — Standard-Vorgarten, Grayanotoxine
    ("rhododendron-ponticum", "Rhododendron ponticum",
     "Pontischer_Rhododendron", "Rhododendron_ponticum",
     "Heidekrautgewächse", "Heath family", "Ericaceae",
     "tincture", ["caution"], "external", [5, 6, 7],
     "Blätter und Blüten, auch der Nektar/Honig",
     "leaves and flowers, also nectar/honey",
     "GIFTIG (Grayanotoxine, Andromedotoxin) — alle Pflanzenteile, auch Pollen und Nektar. Schon wenige Gramm Blätter können schwere Vergiftungen verursachen (Erbrechen, niedriger Blutdruck, Herzrhythmusstörungen). Sogar der Honig aus Rhododendron-Pollen („tollkirschartiger Honig\") ist toxisch — historisch bekannt seit der Antike („Honig-Krieg\"). Sehr verbreitet als Zierstrauch in Vorgärten.",
     "TOXIC (grayanotoxins, andromedotoxin) — all plant parts, including pollen and nectar. Just a few grams of leaves can cause severe poisoning (vomiting, low blood pressure, cardiac arrhythmia). Even honey made from rhododendron pollen ('mad honey') is toxic — historically known since antiquity ('honey war'). Very common ornamental shrub in front gardens.",
     True),

    # 8. Thuja / Lebensbaum — Standard-Sichtschutz, Thujon
    ("thuja-occidentalis", "Thuja occidentalis",
     "Abendl%C3%A4ndischer_Lebensbaum", "Thuja_occidentalis",
     "Zypressengewächse", "Cypress family", "Cupressaceae",
     "tincture", ["caution"], "external", [5, 6, 7, 8, 9],
     "Zweige und Öl",
     "twigs and oil",
     "GIFTIG (Thujon) — ätherisches Öl und Zweige. Standard-Sichtschutz-Hecke in europäischen Gärten. Thujon ist nerventoxisch und krampfauslösend. Hautkontakt mit dem Öl kann Reizungen verursachen, innere Anwendung lebensgefährlich. Beim Heckenschnitt Handschuhe tragen. Historische homöopathische Anwendung nur unter ärztlicher Aufsicht.",
     "TOXIC (thujone) — essential oil and twigs. Standard privacy hedge in European gardens. Thujone is neurotoxic and seizure-inducing. Skin contact with the oil can cause irritation, internal use is life-threatening. Wear gloves when trimming the hedge. Historical homeopathic use only under medical supervision.",
     True),

    # 9. Robinie — Stadtbaum, Rinde + Samen toxisch
    ("robinia-pseudoacacia", "Robinia pseudoacacia",
     "Gew%C3%B6hnliche_Robinie", "Robinia_pseudoacacia",
     "Hülsenfrüchtler", "Legume family", "Fabaceae",
     "tincture", ["caution"], "external", [5, 6],
     "Rinde, Samen, Blätter",
     "bark, seeds, leaves",
     "GIFTIG (Robin, Phasin) — Rinde, Samen und Blätter. Sehr verbreiteter Stadt- und Parkbaum, oft als „falsche Akazie\" bezeichnet. Die weißen Blüten sind essbar (für Sirup, Pancakes), aber Rinde und Samenhülsen sind toxisch — besonders für Pferde, die Rinde abnagen. Kinder kauen manchmal die Hülsen — sollten unterbunden werden.",
     "TOXIC (robin, phasin) — bark, seeds and leaves. Very common urban and park tree, often called 'false acacia'. The white flowers are edible (for syrup, pancakes), but bark and seed pods are toxic — particularly for horses gnawing the bark. Children sometimes chew the pods — should be stopped.",
     True),

    # 10. Schneebeere — weiße „Knallerbsen", Kinderfaszination
    ("symphoricarpos-albus", "Symphoricarpos albus",
     "Gew%C3%B6hnliche_Schneebeere", "Symphoricarpos_albus",
     "Geißblattgewächse", "Honeysuckle family", "Caprifoliaceae",
     "tincture", ["caution"], "external", [9, 10, 11],
     "weiße Beeren",
     "white berries",
     "GIFTIG (Saponine, Chelidonin-ähnliche Alkaloide) — die auffälligen weißen Beeren. Sehr verbreitete Garten- und Parkhecke. Kinder lieben es, die Beeren zum „Knallen\" auf den Boden zu werfen („Knallerbsen\") — beim Verzehr Erbrechen, Durchfall, Kreislaufkollaps möglich. Schon 3-4 Beeren können bei Kleinkindern Symptome auslösen.",
     "TOXIC (saponins, chelidonine-like alkaloids) — the striking white berries. Very common garden and park hedge. Children love throwing the berries on the ground to make them 'pop' ('snowberries') — consumption causes vomiting, diarrhoea, possible circulatory collapse. Just 3-4 berries can trigger symptoms in small children.",
     True),

    # === B. FRÜHLINGS-ZWIEBELBLUMEN (3) ===

    # 11. Tulpe — Zwiebel + Vase im Haus
    ("tulipa-gesneriana", "Tulipa gesneriana",
     "Garten-Tulpe", "Tulipa_gesneriana",
     "Liliengewächse", "Lily family", "Liliaceae",
     "tincture", ["caution"], "external", [4, 5],
     "Zwiebel",
     "bulb",
     "GIFTIG (Tulipalin A und B, Tuliposide) — vor allem die Zwiebel. Bei Hautkontakt klassische „Tulpenfinger\" (allergisches Ekzem bei Floristen). Verzehr der Zwiebel verursacht Erbrechen, Durchfall, Atemnot — historisch verwechselt mit Speisezwiebeln im Hunger-Winter 1944/45 in den Niederlanden, mit zahlreichen Vergiftungen. Auch für Hunde und Katzen toxisch.",
     "TOXIC (tulipalin A and B, tuliposides) — especially the bulb. Skin contact causes classic 'tulip fingers' (allergic eczema in florists). Consuming the bulb causes vomiting, diarrhoea, shortness of breath — historically confused with onions during the 1944/45 Dutch hunger winter, causing numerous poisonings. Also toxic for dogs and cats.",
     True),

    # 12. Narzisse / Osterglocke — Zwiebel + Vase im Haus
    ("narcissus-pseudonarcissus", "Narcissus pseudonarcissus",
     "Gelbe_Narzisse", "Narcissus_pseudonarcissus",
     "Amaryllisgewächse", "Amaryllis family", "Amaryllidaceae",
     "tincture", ["caution"], "external", [3, 4],
     "Zwiebel und Blüte",
     "bulb and flower",
     "GIFTIG (Lycorin, Narcissin) — alle Pflanzenteile, besonders die Zwiebel. Klassische Osterblume — Zwiebeln wurden historisch mit Küchenzwiebeln verwechselt. Verzehr verursacht Erbrechen, Durchfall, Krämpfe. Auch der Saft kann bei Hautkontakt Reizungen auslösen (Floristen-Ekzem). In Vase NICHT mit anderen Schnittblumen kombinieren — Narzissensaft schädigt diese.",
     "TOXIC (lycorine, narcissin) — all plant parts, especially the bulb. Classic Easter flower — bulbs historically confused with kitchen onions. Consumption causes vomiting, diarrhoea, seizures. The sap can also cause skin irritation (florist's eczema). In a vase, do NOT combine with other cut flowers — narcissus sap damages them.",
     True),

    # 13. Hyazinthe — Topf im Haus + Garten
    ("hyacinthus-orientalis", "Hyacinthus orientalis",
     "Gartenhyazinthe", "Hyacinthus_orientalis",
     "Spargelgewächse", "Asparagus family", "Asparagaceae",
     "tincture", ["caution"], "external", [3, 4],
     "Zwiebel",
     "bulb",
     "GIFTIG (Oxalat-Kristalle, Lycorin-ähnliche Alkaloide) — vor allem die Zwiebel. Verbreitete Topf- und Gartenpflanze. Hautkontakt mit der Zwiebel verursacht Juckreiz und Hautausschlag. Verzehr führt zu Erbrechen, Bauchkrämpfen, Durchfall. Auch für Hunde und Katzen toxisch — besonders gefährlich, weil Zwiebeln im Topf für Tiere zugänglich sind.",
     "TOXIC (oxalate crystals, lycorine-like alkaloids) — especially the bulb. Common pot and garden plant. Skin contact with the bulb causes itching and rash. Consumption leads to vomiting, abdominal cramps, diarrhoea. Also toxic for dogs and cats — particularly dangerous because bulbs in pots are accessible to animals.",
     True),

    # === C. TOPF / KÜBEL (3) ===

    # 14. Oleander — Mittelmeer-Kübelpflanze
    ("nerium-oleander", "Nerium oleander",
     "Oleander", "Nerium_oleander",
     "Hundsgiftgewächse", "Dogbane family", "Apocynaceae",
     "tincture", ["caution"], "external", [6, 7, 8, 9],
     "alle Pflanzenteile",
     "all plant parts",
     "SEHR GIFTIG (Oleandrin, herzwirksame Glykoside) — alle Pflanzenteile, sogar das Wasser einer Vase mit Oleanderzweigen. Sehr verbreitete Kübelpflanze auf Balkon und Terrasse. Schon ein einzelnes Blatt kann für Kinder tödlich sein. NIEMALS Zweige zum Aufspießen von Grillgut verwenden — Geschichten von tödlichen Picknick-Vergiftungen sind dokumentiert. Auch für Pferde, Hunde, Katzen extrem toxisch.",
     "VERY TOXIC (oleandrin, cardiac glycosides) — all plant parts, even the water of a vase containing oleander twigs. Very common potted plant on balconies and terraces. Just a single leaf can be lethal for children. NEVER use twigs as skewers for grilled food — stories of fatal picnic poisonings are documented. Also extremely toxic for horses, dogs, cats.",
     True),

    # 15. Engelstrompete — Tropen-Kübel, halluzinogen + tödlich
    ("brugmansia-arborea", "Brugmansia arborea",
     "Brugmansia", "Brugmansia",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "tincture", ["caution"], "external", [6, 7, 8, 9, 10],
     "alle Pflanzenteile, besonders Blüten und Samen",
     "all plant parts, especially flowers and seeds",
     "EXTREM GIFTIG (Scopolamin, Atropin, Hyoscyamin) — alle Pflanzenteile, besonders die großen Trompeten-Blüten und Samen. Beliebte Kübelpflanze für Balkon und Wintergarten. Stark halluzinogen — Jugendliche versuchen sich am „Trip\" und enden regelmäßig auf der Intensivstation oder tot. Schon der Duft in geschlossenen Räumen kann Symptome auslösen. NIEMALS im Schlafzimmer aufstellen.",
     "EXTREMELY TOXIC (scopolamine, atropine, hyoscyamine) — all plant parts, especially the large trumpet-shaped flowers and seeds. Popular pot plant for balconies and conservatories. Strongly hallucinogenic — teenagers attempt a 'trip' and regularly end up in intensive care or dead. Even the scent in enclosed rooms can trigger symptoms. NEVER place in a bedroom.",
     True),

    # 16. Alpenveilchen — Standard-Wintergeschenk im Topf
    ("cyclamen-persicum", "Cyclamen persicum",
     "Zimmer-Alpenveilchen", "Cyclamen_persicum",
     "Primelgewächse", "Primrose family", "Primulaceae",
     "tincture", ["caution"], "external", [10, 11, 12, 1, 2, 3],
     "Knolle",
     "tuber",
     "GIFTIG (Cyclamin, Triterpensaponine) — vor allem die Knolle. Sehr verbreitete Zimmer- und Geschenkpflanze im Winter. Verzehr verursacht Erbrechen, Durchfall, Krämpfe, in schweren Fällen Herzstillstand. Besonders gefährlich für Haustiere (Hunde, Katzen, Meerschweinchen), die Topfpflanzen anknabbern. Die Blüten sind weniger giftig als die Knolle, sollten aber auch nicht verzehrt werden.",
     "TOXIC (cyclamin, triterpene saponins) — especially the tuber. Very common indoor and gift plant in winter. Consumption causes vomiting, diarrhoea, seizures, in severe cases cardiac arrest. Particularly dangerous for pets (dogs, cats, guinea pigs) who nibble pot plants. The flowers are less toxic than the tuber, but should also not be consumed.",
     True),

    # === D. ZIMMERPFLANZEN (4) ===

    # 17. Dieffenbachia — klassische Büro-Pflanze, Calciumoxalat
    ("dieffenbachia-seguine", "Dieffenbachia seguine",
     "Dieffenbachien", "Dieffenbachia",
     "Aronstabgewächse", "Arum family", "Araceae",
     "tincture", ["caution"], "external", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
     "alle Pflanzenteile, besonders der Saft",
     "all plant parts, especially the sap",
     "GIFTIG (Calciumoxalat-Kristalle, proteolytische Enzyme) — der Pflanzensaft brennt und ätzt Schleimhäute. Sehr verbreitete Büro- und Wohnzimmerpflanze. Beim Kauen an einem Blatt schwellen Zunge und Rachen sofort an („dumb cane\" = stumm-machendes Rohr) — kann bei Kleinkindern und Haustieren zum Erstickungstod führen. Beim Beschneiden Handschuhe tragen.",
     "TOXIC (calcium oxalate crystals, proteolytic enzymes) — the plant sap burns and corrodes mucous membranes. Very common office and living-room plant. Chewing a leaf causes immediate swelling of tongue and throat ('dumb cane') — can lead to suffocation in small children and pets. Wear gloves when pruning.",
     True),

    # 18. Philodendron — überall im Wohnzimmer
    ("philodendron-hederaceum", "Philodendron hederaceum",
     "Philodendron", "Philodendron",
     "Aronstabgewächse", "Arum family", "Araceae",
     "tincture", ["caution"], "external", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
     "alle Pflanzenteile",
     "all plant parts",
     "GIFTIG (Calciumoxalat-Kristalle) — alle Pflanzenteile. Eine der häufigsten Zimmerpflanzen weltweit. Kauen verursacht starkes Brennen im Mund, Anschwellen der Zunge, Schluckbeschwerden. Bei Kindern und Haustieren (besonders Katzen, die gerne an Blättern knabbern) regelmäßige Vergiftungsfälle. Hängende Triebe sind für Katzen besonders verlockend — hoch aufhängen.",
     "TOXIC (calcium oxalate crystals) — all plant parts. One of the most common houseplants worldwide. Chewing causes severe burning in the mouth, swelling of the tongue, difficulty swallowing. Regular poisonings of children and pets (especially cats, who like to nibble leaves). Trailing vines are particularly tempting for cats — hang high up.",
     True),

    # 19. Weihnachtsstern — jeder hat einen zu Weihnachten
    ("euphorbia-pulcherrima", "Euphorbia pulcherrima",
     "Weihnachtsstern_(Pflanze)", "Poinsettia",
     "Wolfsmilchgewächse", "Spurge family", "Euphorbiaceae",
     "tincture", ["caution"], "external", [11, 12, 1],
     "Milchsaft",
     "milky sap",
     "GIFTIG (Wolfsmilchsaft, Phorbolester) — der weiße Milchsaft, der bei Verletzung austritt. Reizt Haut und Schleimhäute, kann allergische Reaktionen auslösen. In den Augen verursacht der Saft schmerzhafte Bindehautentzündung. Klassisches Weihnachtsgeschenk — daher in der Adventszeit erhöhte Vergiftungsfälle bei Kindern und Haustieren. Beim Abknicken alter Blätter Handschuhe.",
     "TOXIC (spurge sap, phorbol esters) — the white milky sap that leaks when damaged. Irritates skin and mucous membranes, can trigger allergic reactions. In the eyes, the sap causes painful conjunctivitis. Classic Christmas gift — therefore increased poisoning cases of children and pets during Advent. Wear gloves when removing old leaves.",
     True),

    # 20. Amaryllis / Ritterstern — Standard-Wintergeschenk im Topf
    ("hippeastrum-vittatum", "Hippeastrum vittatum",
     "Ritterstern_(Gattung)", "Hippeastrum",
     "Amaryllisgewächse", "Amaryllis family", "Amaryllidaceae",
     "tincture", ["caution"], "external", [11, 12, 1, 2, 3],
     "Zwiebel",
     "bulb",
     "GIFTIG (Lycorin und verwandte Alkaloide) — vor allem die Zwiebel. Sehr verbreitete Weihnachts- und Winter-Geschenkpflanze. Verzehr verursacht starkes Erbrechen, Durchfall, niedrigen Blutdruck. Besonders für Katzen extrem gefährlich (Nierenversagen möglich). Die hübschen großen Blüten und Knospen werden manchmal von Kindern und Tieren angeknabbert — Topf außer Reichweite stellen.",
     "TOXIC (lycorine and related alkaloids) — especially the bulb. Very common Christmas and winter gift plant. Consumption causes severe vomiting, diarrhoea, low blood pressure. Particularly dangerous for cats (possible kidney failure). The pretty large flowers and buds are sometimes nibbled by children and animals — keep pot out of reach.",
     True),
]


# === 3. RUN ===
def main() -> int:
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    print(f"Seeding {len(HOUSEHOLD_TOXIC)} household toxic classics (parallel, max 6 workers)…")
    results = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(process_plant, p): p[0] for p in HOUSEHOLD_TOXIC}
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
    print(f"\nDone: {ok}/{len(HOUSEHOLD_TOXIC)} succeeded.")
    print("Next: re-run scripts/migrate_toxicity_welleM3.py to auto-classify the new plants.")
    return 0 if ok == len(HOUSEHOLD_TOXIC) else 1


if __name__ == "__main__":
    sys.exit(main())
