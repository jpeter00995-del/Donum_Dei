#!/usr/bin/env python3
"""
Donum Dei v0.8 indoor_growing seeder.

Populates `indoor_growing` field on each plant JSON listed below.
Idempotent: re-running updates the field cleanly.
"""

import json
import os

# === 1. KONSTANTEN ===
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "src", "data", "plants")

# Schema:
# slug: {
#   "suitable": bool,
#   "purpose": [enum],
#   "rooms": [enum],
#   "light": enum,
#   "water_frequency": enum,
#   "difficulty": 1|2|3,
#   "pet_safe": bool,
#   "soil": {"de": str, "en": str},        # optional
#   "pot_size_cm": int,                    # optional
#   "tips": {"de": [str], "en": [str]}     # optional
# }

# === 2. INDOOR-DATEN ===
INDOOR_DATA = {
    # === 12 new heilen/küche ===
    "aloe-vera": {
        "suitable": True,
        "purpose": ["medicinal", "edible", "air_purifying", "night_oxygen"],
        "rooms": ["kitchen", "living_room", "bedroom"],
        "light": "direct_sun",
        "water_frequency": "sparse",
        "difficulty": 1,
        "pet_safe": False,
        "soil": {"de": "Kakteen-/Sukkulentenerde, sandig", "en": "Cactus/succulent soil, sandy"},
        "pot_size_cm": 18,
        "tips": {
            "de": [
                "Lieber zu wenig gießen als zu viel — Staunässe tötet Aloe schnell.",
                "Im Winter heller Standort und kaum gießen (alle 4-6 Wochen).",
                "Älteste Blätter ernten — schräg abschneiden, Schnittfläche heilt von selbst."
            ],
            "en": [
                "Under-water rather than over-water — waterlogging kills aloe quickly.",
                "In winter: bright spot, water only every 4-6 weeks.",
                "Harvest oldest leaves first — cut at an angle, the wound heals on its own."
            ]
        }
    },
    "cymbopogon-citratus": {
        "suitable": True,
        "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"],
        "light": "direct_sun",
        "water_frequency": "every_few_days",
        "difficulty": 2,
        "pet_safe": True,
        "soil": {"de": "Standard-Kräutererde", "en": "Standard herb compost"},
        "pot_size_cm": 25,
        "tips": {
            "de": [
                "Braucht VIEL Sonne — sonst werden Halme dünn und aromaarm.",
                "Im Topf nicht winterhart — bei <10°C ins Haus.",
                "Stengel knapp über der Wurzel abschneiden, der Strauch treibt wieder aus."
            ],
            "en": [
                "Needs LOTS of sun — otherwise stalks get thin and lose aroma.",
                "In a pot it's not frost-hardy — move indoors below 10 °C.",
                "Cut stalks just above the root, the clump regrows."
            ]
        }
    },
    "stevia-rebaudiana": {
        "suitable": True,
        "purpose": ["edible"],
        "rooms": ["kitchen", "living_room", "balcony"],
        "light": "bright_indirect",
        "water_frequency": "every_few_days",
        "difficulty": 2,
        "pet_safe": True,
        "soil": {"de": "Locker, humusreich, leicht sauer", "en": "Loose, humus-rich, slightly acidic"},
        "pot_size_cm": 20,
        "tips": {
            "de": [
                "Nicht austrocknen lassen — Stevia wird schnell hängend bei Wassermangel.",
                "Vor der Blüte sind die Blätter am süßesten — dann ernten.",
                "Im Winter heller, kühler Standort (~12-15°C), wenig Wasser."
            ],
            "en": [
                "Don't let it dry out — stevia wilts quickly when thirsty.",
                "Leaves are sweetest just before flowering — harvest then.",
                "In winter: bright, cool spot (~12-15 °C), little water."
            ]
        }
    },
    "aloysia-citrodora": {
        "suitable": True,
        "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "living_room", "balcony"],
        "light": "direct_sun",
        "water_frequency": "every_few_days",
        "difficulty": 2,
        "pet_safe": True,
        "soil": {"de": "Kräutererde mit guter Drainage", "en": "Herb compost with good drainage"},
        "pot_size_cm": 25,
        "tips": {
            "de": [
                "Im Winter wirft sie alle Blätter ab — keine Panik, das ist normal.",
                "Winter hell und kühl (5-10°C), kaum gießen — sonst Wurzelfäule.",
                "Im Frühjahr stark zurückschneiden für buschigen Wuchs."
            ],
            "en": [
                "Drops all leaves in winter — don't panic, that's normal.",
                "Winter: bright and cool (5-10 °C), barely water — otherwise root rot.",
                "Cut back hard in spring for bushy growth."
            ]
        }
    },
    "plectranthus-barbatus": {
        "suitable": True, "purpose": ["medicinal"],
        "rooms": ["living_room", "balcony"], "light": "bright_indirect", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Sehr robust — verzeiht Pflegefehler.", "Stecklinge wurzeln einfach im Wasserglas."],
                 "en": ["Very robust — forgives care mistakes.", "Cuttings root easily in a glass of water."]}
    },
    "ocimum-tenuiflorum": {
        "suitable": True, "purpose": ["medicinal", "edible"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Lockere Kräutererde", "en": "Loose herb compost"}, "pot_size_cm": 18,
        "tips": {"de": ["Wie normales Basilikum, aber etwas robuster.", "Regelmäßig Spitzen ernten für buschigen Wuchs.", "Mag morgens Wasser, nachmittags Sonne."],
                 "en": ["Like regular basil but a bit more robust.", "Regularly harvest tips for bushy growth.", "Likes morning water, afternoon sun."]}
    },
    "mentha-villosa": {
        "suitable": True, "purpose": ["edible"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Feuchte Kräutererde", "en": "Moist herb compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Im eigenen Topf halten — wuchert sonst andere Kräuter weg.", "Vor dem Blühen ernten für intensivstes Aroma.", "Stecklinge wurzeln in 1-2 Wochen im Wasserglas."],
                 "en": ["Keep in its own pot — otherwise crowds out other herbs.", "Harvest before flowering for strongest aroma.", "Cuttings root in 1-2 weeks in a water glass."]}
    },
    "pelargonium-odoratissimum": {
        "suitable": True, "purpose": ["edible", "medicinal", "pest_repelling"],
        "rooms": ["living_room", "balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Geranien-Erde mit Drainage", "en": "Geranium compost with drainage"}, "pot_size_cm": 18,
        "tips": {"de": ["Apfelduft beim Berühren — gut auf Fensterbank.", "Im Winter kühl (5-12°C) und sehr wenig Wasser.", "Frische Blätter im Salat oder als Tee."],
                 "en": ["Apple scent when touched — great on the windowsill.", "Winter: cool (5-12 °C) and very little water.", "Fresh leaves in salads or as tea."]}
    },
    "aerva-lanata": {
        "suitable": True, "purpose": ["medicinal"],
        "rooms": ["living_room", "balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Sandige Erde mit Drainage", "en": "Sandy soil with drainage"}, "pot_size_cm": 20,
        "tips": {"de": ["Liebt Wärme — unter 15°C ins Haus.", "Nicht überdüngen — wächst auch auf armen Böden.", "Blätter und Kraut für Tee verwenden."],
                 "en": ["Loves warmth — bring indoors below 15 °C.", "Don't over-fertilise — grows even on poor soils.", "Use leaves and herb for tea."]}
    },
    "salvia-elegans": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Kräutererde mit Drainage", "en": "Standard herb compost with drainage"}, "pot_size_cm": 25,
        "tips": {"de": ["Im Sommer auf Balkon, im Winter ins Haus (nicht winterhart).", "Rote Blüten anziehend für Bienen.", "Im Frühjahr zurückschneiden für kompakten Wuchs."],
                 "en": ["Summer on balcony, winter indoors (not hardy).", "Red flowers attract bees.", "Cut back in spring for compact growth."]}
    },
    "houttuynia-cordata": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "bathroom"], "light": "partial_shade", "water_frequency": "daily",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Feucht bis nass, lehmig", "en": "Moist to wet, loamy"}, "pot_size_cm": 20,
        "tips": {"de": ["Braucht IMMER feuchte Erde — Untersetzer mit Wasser.", "Wuchert stark — im Topf halten, nicht in den Garten setzen.", "Aroma stark (\"Fischminze\") — gut für asiatische Küche."],
                 "en": ["Needs CONSTANTLY moist soil — saucer with water.", "Spreads aggressively — keep in pot, don't plant in garden.", "Strong flavour (\"fish mint\") — good for Asian cooking."]}
    },
    "eruca-sativa": {
        "suitable": True, "purpose": ["edible"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Anzuchterde", "en": "Standard seed compost"}, "pot_size_cm": 15,
        "tips": {"de": ["Schießt schnell in Blüte bei Wärme/Trockenheit — gleichmäßig gießen.", "Halbschatten ist besser als knallige Sonne — bleibt länger zart.", "Alle 2-3 Wochen neu aussäen für ständige Ernte."],
                 "en": ["Bolts quickly in heat/drought — water evenly.", "Partial shade is better than full sun — stays tender longer.", "Sow new pots every 2-3 weeks for continuous harvest."]}
    },
    # === 8 new luftreiniger ===
    "chlorophytum-comosum": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room", "bedroom", "bathroom"], "light": "bright_indirect", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Die einzige klassische Luftreiniger-Pflanze, die für Katzen unbedenklich ist.", "Ableger einfach abschneiden und in Wasser bewurzeln lassen.", "Braune Blattspitzen = zu viel Fluorid im Wasser — mit Regenwasser oder abgestandenem Wasser gießen."],
                 "en": ["The only classic air-purifier safe around cats.", "Cut off plantlets and root them in water.", "Brown leaf tips = too much fluoride in water — use rainwater or stale tap water."]}
    },
    "dracaena-trifasciata": {
        "suitable": True, "purpose": ["air_purifying", "night_oxygen", "ornamental"],
        "rooms": ["bedroom", "living_room", "bathroom"], "light": "low_light", "water_frequency": "sparse",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Kakteen-/Sukkulentenerde", "en": "Cactus/succulent soil"}, "pot_size_cm": 18,
        "tips": {"de": ["Sehr genügsam — verträgt wochenlanges Vergessen-Werden.", "CAM-Photosynthese: gibt nachts Sauerstoff ab, ideal fürs Schlafzimmer.", "GIFTIG für Katzen/Hunde — außer Reichweite halten."],
                 "en": ["Extremely undemanding — survives weeks of neglect.", "CAM photosynthesis: releases oxygen at night, ideal for bedroom.", "TOXIC for cats/dogs — keep out of reach."]}
    },
    "spathiphyllum-wallisii": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room", "bathroom", "bedroom"], "light": "low_light", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Lockere Blumenerde", "en": "Loose potting compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Hängende Blätter = Durst — sofort gießen, erholt sich in Stunden.", "Blüht zuverlässig auch im Halbschatten.", "GIFTIG bei Verzehr — Maulreizung."],
                 "en": ["Droopy leaves = thirsty — water immediately, recovers in hours.", "Blooms reliably even in partial shade.", "TOXIC if eaten — mouth irritation."]}
    },
    "epipremnum-aureum": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room", "bathroom", "bedroom"], "light": "low_light", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 18,
        "tips": {"de": ["Praktisch unkaputtbar — auch im Bad-Halbschatten.", "Ranken können bis 2m lang werden — als Hängepflanze oder an Stab leiten.", "Stecklinge wurzeln in Wasserglas in 2-3 Wochen."],
                 "en": ["Practically indestructible — fine in low-light bathrooms.", "Vines can reach 2m — grow as hanging plant or on a pole.", "Cuttings root in a water glass in 2-3 weeks."]}
    },
    "ficus-elastica": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room"], "light": "bright_indirect", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Standard-Blumenerde, durchlässig", "en": "Standard compost, well-draining"}, "pot_size_cm": 25,
        "tips": {"de": ["Blätter regelmäßig abstauben — sonst leidet die Photosynthese.", "Drehen für gleichmäßigen Wuchs, nicht ständig umstellen.", "Milchsaft beim Schneiden — Hände waschen."],
                 "en": ["Dust leaves regularly — otherwise photosynthesis suffers.", "Rotate for even growth, don't constantly relocate.", "Milky sap when cut — wash hands."]}
    },
    "dracaena-fragrans": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room"], "light": "bright_indirect", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 25,
        "tips": {"de": ["Sehr langlebig — wird oft jahrzehntealt.", "Wenig gießen im Winter (alle 2-3 Wochen).", "Braune Blattspitzen normal bei trockener Heizungsluft."],
                 "en": ["Very long-lived — often reaches decades old.", "Water sparingly in winter (every 2-3 weeks).", "Brown leaf tips are normal in dry heating air."]}
    },
    "aglaonema-commutatum": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room", "bedroom"], "light": "low_light", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Verträgt sehr dunkle Ecken — eine der dunkelst-tolerantesten Pflanzen.", "Mag warme Räume (>18°C), zugfrei.", "Bunte Sorten brauchen mehr Licht als grüne."],
                 "en": ["Tolerates very dark corners — one of the most shade-tolerant houseplants.", "Likes warm rooms (>18 °C), no draughts.", "Variegated cultivars need more light than green ones."]}
    },
    "zamioculcas-zamiifolia": {
        "suitable": True, "purpose": ["air_purifying", "ornamental"],
        "rooms": ["living_room", "bedroom", "bathroom"], "light": "low_light", "water_frequency": "sparse",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Kakteen-/Sukkulentenerde", "en": "Cactus/succulent soil"}, "pot_size_cm": 20,
        "tips": {"de": ["Speichert Wasser in den Rhizomen — alle 3-4 Wochen gießen reicht.", "Verträgt fast jede Lichtsituation.", "Wächst langsam — keine Panik, wenn lange nichts passiert."],
                 "en": ["Stores water in rhizomes — watering every 3-4 weeks is enough.", "Tolerates almost any light.", "Grows slowly — don't worry if nothing happens for a while."]}
    },
    # === 4 new mücken-/insekten-abwehr ===
    "pelargonium-citrosum": {
        "suitable": True, "purpose": ["pest_repelling", "ornamental"],
        "rooms": ["balcony", "kitchen"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Geranien-Erde", "en": "Geranium compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Wirkung am stärksten beim Berühren oder Zerreiben der Blätter.", "Auf Balkontisch oder Sitzplatz stellen für Mückenschutz beim Essen.", "Im Winter hell und kühl (5-12°C)."],
                 "en": ["Effect is strongest when leaves are touched or crushed.", "Place on balcony table or seating area for dining mosquito repellent.", "Winter: bright and cool (5-12 °C)."]}
    },
    "nepeta-cataria": {
        "suitable": True, "purpose": ["pest_repelling", "medicinal"],
        "rooms": ["balcony", "kitchen"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Kräutererde", "en": "Standard herb compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Falls Katze im Haus: lieber außer Reichweite — sonst wird sie zerwühlt.", "Auf Balkon ein natürlicher Mückenschutz.", "Tee aus den Blüten/Blättern wirkt beruhigend."],
                 "en": ["If cats live with you: keep out of reach — otherwise gets shredded.", "Natural mosquito repellent on balcony.", "Tea from flowers/leaves has calming effect."]}
    },
    "tagetes-patula": {
        "suitable": True, "purpose": ["pest_repelling", "ornamental"],
        "rooms": ["balcony", "kitchen"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 18,
        "tips": {"de": ["Klassiker für Tomaten-Begleitpflanzung — hält Nematoden fern.", "Verblühtes regelmäßig entfernen für lange Blüte.", "Selbstaussäend — Samen sammeln oder wachsen lassen."],
                 "en": ["Classic companion plant for tomatoes — repels nematodes.", "Deadhead regularly for long flowering.", "Self-seeding — collect seeds or let it spread."]}
    },
    "plectranthus-caninus": {
        "suitable": True, "purpose": ["pest_repelling", "ornamental"],
        "rooms": ["balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Standard-Blumenerde mit Drainage", "en": "Standard compost with drainage"}, "pot_size_cm": 20,
        "tips": {"de": ["Geruch nur beim Berühren spürbar — also platzieren wo Katzen vorbeilaufen.", "Nicht winterhart — ins Haus oder als einjährig behandeln.", "Wirkung gegen Katzen/Hunde wissenschaftlich umstritten."],
                 "en": ["Smell only triggers on contact — place where cats walk past.", "Not frost-hardy — bring inside or treat as annual.", "Repellent effect on cats/dogs scientifically debated."]}
    },
    # === 3 new luftbefeuchter ===
    "dypsis-lutescens": {
        "suitable": True, "purpose": ["humidifying", "air_purifying", "ornamental"],
        "rooms": ["living_room", "bedroom"], "light": "bright_indirect", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Palmenerde, durchlässig", "en": "Palm compost, well-draining"}, "pot_size_cm": 30,
        "tips": {"de": ["Eine der wirkungsvollsten Pflanzen zur Luftbefeuchtung.", "Mag warme, helle Räume — keine direkte Mittagssonne.", "Braune Blattspitzen = zu trockene Luft oder zu kalkhaltiges Wasser."],
                 "en": ["One of the most effective plants for humidifying air.", "Likes warm, bright rooms — no direct midday sun.", "Brown tips = too dry air or too hard water."]}
    },
    "nephrolepis-exaltata": {
        "suitable": True, "purpose": ["humidifying", "air_purifying", "ornamental"],
        "rooms": ["bathroom", "living_room", "bedroom"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Humusreiche Erde, feucht", "en": "Humus-rich soil, moist"}, "pot_size_cm": 22,
        "tips": {"de": ["Liebt das Bad — hohe Luftfeuchte und indirektes Licht.", "Niemals austrocknen lassen — dann werden Wedel sofort braun.", "Regelmäßig besprühen, vor allem im Winter."],
                 "en": ["Loves the bathroom — high humidity and indirect light.", "Never let it dry out — fronds turn brown immediately.", "Mist regularly, especially in winter."]}
    },
    "cyperus-alternifolius": {
        "suitable": True, "purpose": ["humidifying", "air_purifying"],
        "rooms": ["bathroom", "living_room", "kitchen"], "light": "bright_indirect", "water_frequency": "daily",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Lehmig, dauerhaft nass", "en": "Loamy, permanently wet"}, "pot_size_cm": 20,
        "tips": {"de": ["IMMER mit Wasser im Untersetzer halten — der einzige Houseplant der das mag.", "Hohe Luftfeuchtigkeit ringsum — guter Befeuchter.", "Im Winter heller Standort, weniger Temperatur, weiterhin nass halten."],
                 "en": ["ALWAYS keep saucer filled with water — the only houseplant that likes that.", "High humidity around it — good humidifier.", "Winter: bright spot, cooler, but still keep wet."]}
    },
    # === 1 new nacht-sauerstoff ===
    "phalaenopsis-spp": {
        "suitable": True, "purpose": ["night_oxygen", "ornamental"],
        "rooms": ["bedroom", "living_room"], "light": "bright_indirect", "water_frequency": "weekly",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Orchideen-Substrat (Rindenmischung)", "en": "Orchid substrate (bark mix)"}, "pot_size_cm": 15,
        "tips": {"de": ["Im transparenten Topf halten — Wurzeln photosynthetisieren mit.", "Wöchentlich 5 Min tauchen statt täglich gießen.", "CAM-Pflanze: produziert nachts O₂, ideal fürs Schlafzimmer.", "Nach Blüte den Stiel über 2. Knoten kürzen — neue Blüte möglich."],
                 "en": ["Keep in transparent pot — roots photosynthesise too.", "Dunk in water for 5 min weekly instead of daily watering.", "CAM plant: produces O₂ at night, ideal for bedroom.", "After flowering: cut stem above 2nd node — re-flowering possible."]}
    },
    # === 18 retrofits of existing plants ===
    "ocimum-basilicum": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Kräutererde, locker", "en": "Herb compost, loose"}, "pot_size_cm": 18,
        "tips": {"de": ["Supermarkt-Basilikum ist meistens überpflanzt — beim Umtopfen in 3 Töpfe teilen.", "Spitzen ernten, NIE einzelne Blätter zupfen — Pflanze wird buschig.", "Morgens gießen, nie auf die Blätter."],
                 "en": ["Supermarket basil is usually overplanted — split into 3 pots when repotting.", "Harvest tips, NEVER individual leaves — plant becomes bushy.", "Water in the morning, never on leaves."]}
    },
    "mentha-piperita": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Feuchte Kräutererde", "en": "Moist herb compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Im eigenen Topf — wuchert sonst.", "Halbschatten besser als knallige Sonne.", "Im Frühjahr Wurzelstock teilen für neue Pflanzen."],
                 "en": ["In its own pot — otherwise spreads.", "Partial shade better than full sun.", "Divide root in spring for new plants."]}
    },
    "mentha-spicata": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Feuchte Kräutererde", "en": "Moist herb compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Milder als Pfefferminze — gut für Tee und Mojito.", "In eigenem Topf halten.", "Stecklinge im Wasserglas wurzeln einfach."],
                 "en": ["Milder than peppermint — good for tea and mojito.", "Keep in own pot.", "Cuttings root easily in water glass."]}
    },
    "melissa-officinalis": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Kräutererde", "en": "Standard herb compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Halbschatten ist ideal — pralle Sonne lässt Blätter gelb werden.", "Vor der Blüte ist das Aroma am stärksten.", "Im Topf nur 2-3 Jahre — dann teilen oder neu aussäen."],
                 "en": ["Partial shade ideal — full sun yellows leaves.", "Aroma strongest before flowering.", "In pot only 2-3 years — then divide or re-sow."]}
    },
    "thymus-vulgaris": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Sandig, mager, mit Drainage", "en": "Sandy, lean, with drainage"}, "pot_size_cm": 15,
        "tips": {"de": ["Mag Trockenheit — eher zu wenig als zu viel gießen.", "Pralle Sonne gewünscht — Mittelmeer-Pflanze.", "Im Frühjahr leicht zurückschneiden für kompakten Wuchs."],
                 "en": ["Likes drought — under-water rather than over.", "Full sun preferred — Mediterranean plant.", "Light pruning in spring for compact growth."]}
    },
    "rosmarinus-officinalis": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Sandig-lehmig mit guter Drainage", "en": "Sandy-loamy with good drainage"}, "pot_size_cm": 22,
        "tips": {"de": ["Im Winter hell und kühl (5-10°C) — keine Heizungsluft.", "Wenig gießen — Wurzelfäule ist häufigster Killer.", "Bei <-10°C unbedingt rein, ist nicht winterhart bei uns."],
                 "en": ["Winter: bright and cool (5-10 °C) — no heated room.", "Water sparingly — root rot is the most common killer.", "Below -10 °C bring indoors, not hardy in our climate."]}
    },
    "salvia-officinalis": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Sandig mit Drainage", "en": "Sandy with drainage"}, "pot_size_cm": 20,
        "tips": {"de": ["Sehr robust — verträgt Trockenheit, Hitze, magere Erde.", "Pralle Sonne perfekt — sonst werden Blätter weich.", "Alle 3-4 Jahre erneuern, alte Pflanzen werden holzig."],
                 "en": ["Very robust — tolerates drought, heat, poor soil.", "Full sun perfect — otherwise leaves go soft.", "Replace every 3-4 years, old plants get woody."]}
    },
    "origanum-vulgare": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Kräutererde, durchlässig", "en": "Standard herb compost, well-draining"}, "pot_size_cm": 18,
        "tips": {"de": ["Sonniger Standort macht Aroma intensiver.", "Vor der Blüte schmecken die Blätter am besten.", "Mag eher trocken als nass."],
                 "en": ["Sunny spot intensifies aroma.", "Leaves taste best before flowering.", "Prefers dry over wet."]}
    },
    "petroselinum-crispum": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Humusreich, feucht", "en": "Humus-rich, moist"}, "pot_size_cm": 18,
        "tips": {"de": ["Keimt langsam (3-4 Wochen) — Geduld haben oder vorgezogene Pflanzen kaufen.", "Stiele am Boden ernten, nicht oben abzupfen.", "Im 2. Jahr Blüte → Pflanze altert, neu aussäen."],
                 "en": ["Slow to germinate (3-4 weeks) — be patient or buy pregrown.", "Harvest stalks at base, don't pluck from top.", "Flowers in 2nd year → plant ages, re-sow."]}
    },
    "coriandrum-sativum": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "partial_shade", "water_frequency": "every_few_days",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Locker, humusreich", "en": "Loose, humus-rich"}, "pot_size_cm": 18,
        "tips": {"de": ["Schießt schnell in Blüte bei Hitze — alle 2-3 Wochen neu aussäen.", "Direkt vor Ort aussäen — verträgt kein Umpflanzen.", "Blätter (Cilantro) UND Samen (Koriander-Gewürz) verwendbar."],
                 "en": ["Bolts quickly in heat — sow new every 2-3 weeks.", "Sow in place — doesn't tolerate transplanting.", "Both leaves (cilantro) AND seeds (coriander spice) usable."]}
    },
    "anethum-graveolens": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Lockere Kräutererde", "en": "Loose herb compost"}, "pot_size_cm": 18,
        "tips": {"de": ["Direkt aussäen — verträgt kein Umpflanzen.", "Hohe Pflanze — tiefer Topf nötig.", "Frische Blätter für Salate, Samen als Gewürz."],
                 "en": ["Sow directly — doesn't transplant well.", "Tall plant — needs deep pot.", "Fresh leaves for salads, seeds as spice."]}
    },
    "satureja-hortensis": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "balcony"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Kräutererde", "en": "Standard herb compost"}, "pot_size_cm": 15,
        "tips": {"de": ["Sonnig, eher trocken — wie alle mediterranen Kräuter.", "Klassischer Begleiter für Bohnen-Gerichte.", "Vor Frost ernten — einjährig."],
                 "en": ["Sunny, fairly dry — like all Mediterranean herbs.", "Classic companion for bean dishes.", "Harvest before frost — annual."]}
    },
    "laurus-nobilis": {
        "suitable": True, "purpose": ["edible", "medicinal"],
        "rooms": ["kitchen", "living_room", "balcony"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Kübelpflanzenerde mit Drainage", "en": "Container compost with drainage"}, "pot_size_cm": 30,
        "tips": {"de": ["Im Winter hell und kühl (5-10°C) — keine Heizungsluft.", "Bedingt winterhart — bei <-5°C ins Haus.", "Wächst langsam — junge Pflanzen brauchen Geduld."],
                 "en": ["Winter: bright and cool (5-10 °C) — no heated room.", "Marginally hardy — bring indoors below -5 °C.", "Slow-growing — young plants need patience."]}
    },
    "calendula-officinalis": {
        "suitable": True, "purpose": ["medicinal", "edible"],
        "rooms": ["balcony"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 20,
        "tips": {"de": ["Selbstaussäend — Samen sammeln oder wachsen lassen.", "Regelmäßig Verblühtes entfernen für lange Blüte.", "Blüten essbar (Salat) oder für Salben-Ansatz."],
                 "en": ["Self-seeding — collect seeds or let it spread.", "Deadhead regularly for long flowering.", "Flowers edible (salads) or for salve infusion."]}
    },
    "tropaeolum-majus": {
        "suitable": True, "purpose": ["medicinal", "edible"],
        "rooms": ["balcony", "kitchen"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Magerer Boden — sonst nur Blätter, keine Blüten", "en": "Lean soil — otherwise only leaves, no flowers"}, "pot_size_cm": 25,
        "tips": {"de": ["Nicht düngen — zu nährstoffreich = viele Blätter, wenig Blüten.", "Blüten und Blätter pfeffrig-würzig im Salat.", "Selbstaussäend — Samen sind Kapern-Ersatz."],
                 "en": ["Don't fertilise — too rich = many leaves, few flowers.", "Flowers and leaves peppery-spicy in salad.", "Self-seeding — seeds are caper substitute."]}
    },
    "pelargonium-graveolens": {
        "suitable": True, "purpose": ["medicinal", "pest_repelling", "ornamental"],
        "rooms": ["balcony", "living_room"], "light": "direct_sun", "water_frequency": "every_few_days",
        "difficulty": 1, "pet_safe": True,
        "soil": {"de": "Geranien-Erde mit Drainage", "en": "Geranium compost with drainage"}, "pot_size_cm": 20,
        "tips": {"de": ["Duft beim Berühren — Mücken meiden Geruch.", "Im Winter hell und kühl (5-12°C).", "Frische Blätter für Tee oder ätherisches Öl."],
                 "en": ["Scent when touched — mosquitoes avoid the smell.", "Winter: bright and cool (5-12 °C).", "Fresh leaves for tea or essential oil."]}
    },
    "hedera-helix": {
        "suitable": True, "purpose": ["medicinal", "air_purifying", "ornamental"],
        "rooms": ["living_room", "bathroom", "bedroom"], "light": "partial_shade", "water_frequency": "weekly",
        "difficulty": 1, "pet_safe": False,
        "soil": {"de": "Standard-Blumenerde", "en": "Standard potting compost"}, "pot_size_cm": 18,
        "tips": {"de": ["Robuste Hängepflanze — auch in dunkleren Ecken.", "Regelmäßig zurückschneiden für buschigen Wuchs.", "GIFTIG bei Verzehr (Beeren!) — von Kindern/Tieren fernhalten."],
                 "en": ["Robust hanging plant — also in darker corners.", "Cut back regularly for bushy growth.", "TOXIC if eaten (berries!) — keep away from children/pets."]}
    },
    "lavandula-angustifolia": {
        "suitable": True, "purpose": ["medicinal", "pest_repelling"],
        "rooms": ["balcony", "bedroom"], "light": "direct_sun", "water_frequency": "weekly",
        "difficulty": 2, "pet_safe": True,
        "soil": {"de": "Sandig-lehmig, kalkhaltig, mit Drainage", "en": "Sandy-loamy, calcareous, with drainage"}, "pot_size_cm": 25,
        "tips": {"de": ["Mediterran — viel Sonne, wenig Wasser, gute Drainage Pflicht.", "Im Topf nicht ideal — Wurzeln wollen tiefe Erde. Großer Kübel.", "Getrocknete Blüten im Schlafzimmer wirken beruhigend + Motten-Schutz."],
                 "en": ["Mediterranean — lots of sun, little water, good drainage essential.", "Not ideal in pots — roots want deep soil. Large container.", "Dried flowers in bedroom calming + moth deterrent."]}
    },
}


# === 3. HAUPTFUNKTION ===
def main():
    print(f"Seeding indoor_growing for {len(INDOOR_DATA)} plants...")
    ok, missing = 0, []
    for slug, ig in INDOOR_DATA.items():
        path = os.path.join(DATA_DIR, f"{slug}.json")
        if not os.path.exists(path):
            missing.append(slug)
            continue
        with open(path) as f:
            plant = json.load(f)
        plant["indoor_growing"] = ig
        with open(path, "w") as f:
            json.dump(plant, f, ensure_ascii=False, indent=2)
        print(f"  ✓ {slug}")
        ok += 1
    print(f"\nDone: {ok}/{len(INDOOR_DATA)} succeeded.")
    if missing:
        print(f"MISSING (need to scrape first): {missing}")


if __name__ == "__main__":
    main()
