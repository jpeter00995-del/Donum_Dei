#!/usr/bin/env python3
# === 1. ZWECK ===
# Single source of truth for garden_meta backfill on existing herbs/garden plants
# and freshly-seeded vegetables. Idempotent: re-running rewrites garden_meta from
# the GARDEN_META dict below; everything else in the plant JSON stays untouched.
#
# (Single-Source-of-Truth fuer das garden_meta-Backfill auf den bestehenden
# Kraeuter-/Garten-Pflanzen sowie den neu gesaeten Gemuesen. Idempotent.)
#
# Run from project root:
#   python3 scripts/seed_garden_meta.py
#
# Sources (eigene Kuration):
# - Helga und Margarete Langerhorst, "Mein gesunder Naturgarten"
# - Gertrud Franck, "Gesunder Garten durch Mischkultur" (1980)
# - klassische Bauernregeln (DACH/SEE) und Aussaatkalender
# - Wikipedia DE/EN factsheets (botanische Standardwerte)

import json
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "src", "data", "plants")

# === 2. KLIMA-ZONEN-PRESETS (DACH + SEE / Suedost-Europa) ===
# (Klimazonen-Presets fuer mitteleuropaeische und suedost-europaeische Gaerten.)
ZONES_HARDY = ["5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b"]
ZONES_TEMPERATE = ["6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b"]
ZONES_WARM = ["7a", "7b", "8a", "8b", "9a", "9b"]
ZONES_MEDITERRANEAN = ["8a", "8b", "9a", "9b"]
ZONES_FROST_TENDER = ["7b", "8a", "8b", "9a", "9b"]  # Greenhouse-erweiterbar

# === 3. GARDEN_META PRO SLUG ===
# Schema:
#   slug: {
#     climate_zones: [...],
#     sowing_window: {indoor?, outdoor_direct?, transplant?: {start_month, end_month}},
#     harvest_window: {start_month, end_month},
#     days_to_harvest: int,
#     spacing_cm: int,
#     garden_type: [...],
#     difficulty: 1 | 2 | 3,
#   }
#
# Hinweis: Jahres-Wrap bei harvest_window oder sowing_window ist erlaubt
# (z.B. immergruene mediterrane Kraeuter: start_month=1, end_month=12).
GARDEN_META = {
    # === 3a. Bestehende Kraeuter (Phase C.1 Backfill — 37 Pflanzen) ===
    "achillea-millefolium": {
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "outdoor_direct": {"start_month": 4, "end_month": 6},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 30,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "allium-sativum": {  # Knoblauch
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 10, "end_month": 11},
        },
        "harvest_window": {"start_month": 6, "end_month": 8},
        "days_to_harvest": 240,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "allium-ursinum": {  # Baerlauch
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 9, "end_month": 11},
            "transplant": {"start_month": 3, "end_month": 4},
        },
        "harvest_window": {"start_month": 3, "end_month": 5},
        "days_to_harvest": 180,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "anethum-graveolens": {  # Dill
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 7},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 60,
        "spacing_cm": 20,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "apium-graveolens": {  # Sellerie (allgemein)
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 3},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 9, "end_month": 11},
        "days_to_harvest": 180,
        "spacing_cm": 40,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "artemisia-dracunculus": {  # Estragon
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "transplant": {"start_month": 4, "end_month": 5},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 120,
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed"],
        "difficulty": 2,
    },
    "borago-officinalis": {  # Borretsch
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 60,
        "spacing_cm": 30,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "calendula-officinalis": {  # Ringelblume
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 6},
            "indoor": {"start_month": 3, "end_month": 4},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 70,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "carum-carvi": {  # Kuemmel
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 8},
        "days_to_harvest": 120,
        "spacing_cm": 25,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "coriandrum-sativum": {  # Koriander
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 7},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 60,
        "spacing_cm": 15,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "cucurbita-pepo": {  # Gartenkuerbis / Zucchini-Verwandter
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 4, "end_month": 5},
            "outdoor_direct": {"start_month": 5, "end_month": 6},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 90,
        "spacing_cm": 100,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "eruca-sativa": {  # Rucola
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 9},
        },
        "harvest_window": {"start_month": 4, "end_month": 10},
        "days_to_harvest": 35,
        "spacing_cm": 10,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "foeniculum-vulgare": {  # Fenchel
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 6},
            "indoor": {"start_month": 3, "end_month": 4},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 90,
        "spacing_cm": 30,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "fragaria-vesca": {  # Walderdbeere
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 1, "end_month": 3},
            "transplant": {"start_month": 4, "end_month": 5},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 150,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "hyssopus-officinalis": {  # Ysop
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 100,
        "spacing_cm": 30,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "laurus-nobilis": {  # Lorbeer
        "climate_zones": ZONES_MEDITERRANEAN,
        "sowing_window": {
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 1, "end_month": 12},  # immergruen
        "days_to_harvest": 365,
        "spacing_cm": 120,
        "garden_type": ["raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "lavandula-angustifolia": {  # Lavendel
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 8},
        "days_to_harvest": 365,  # 1. Jahr Aufbau, 2. Jahr Vollernte
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 2,
    },
    "levisticum-officinale": {  # Liebstoeckel
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 5},
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 5, "end_month": 9},
        "days_to_harvest": 180,
        "spacing_cm": 60,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "matricaria-chamomilla": {  # Kamille
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 5},
        },
        "harvest_window": {"start_month": 6, "end_month": 8},
        "days_to_harvest": 70,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "mentha-piperita": {  # Pfefferminze
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed"],
        "difficulty": 1,
    },
    "mentha-spicata": {  # Gruene Minze
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed"],
        "difficulty": 1,
    },
    "mentha-villosa": {  # Mojito-Minze
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed"],
        "difficulty": 1,
    },
    "nepeta-cataria": {  # Katzenminze
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "outdoor_direct": {"start_month": 4, "end_month": 6},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "ocimum-basilicum": {  # Basilikum
        "climate_zones": ZONES_FROST_TENDER,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 1,
    },
    "ocimum-tenuiflorum": {  # Tulsi
        "climate_zones": ZONES_FROST_TENDER,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 75,
        "spacing_cm": 30,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "origanum-vulgare": {  # Oregano / Dost
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "petroselinum-crispum": {  # Petersilie
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 7},
            "indoor": {"start_month": 2, "end_month": 3},
        },
        "harvest_window": {"start_month": 6, "end_month": 11},
        "days_to_harvest": 80,
        "spacing_cm": 15,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "pimpinella-anisum": {  # Anis
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 5},
        },
        "harvest_window": {"start_month": 8, "end_month": 9},
        "days_to_harvest": 120,
        "spacing_cm": 25,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "rosmarinus-officinalis": {  # Rosmarin
        "climate_zones": ZONES_MEDITERRANEAN,
        "sowing_window": {
            "transplant": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 1, "end_month": 12},  # immergruen
        "days_to_harvest": 365,
        "spacing_cm": 60,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "salvia-officinalis": {  # Salbei
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 1, "end_month": 12},  # immergruen mit Wrap
        "days_to_harvest": 240,
        "spacing_cm": 40,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "satureja-hortensis": {  # Bohnenkraut
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 9},
        "days_to_harvest": 70,
        "spacing_cm": 20,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "tagetes-patula": {  # Studentenblume
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "outdoor_direct": {"start_month": 5, "end_month": 6},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "tanacetum-parthenium": {  # Mutterkraut
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 9},
        "days_to_harvest": 90,
        "spacing_cm": 30,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "thymus-vulgaris": {  # Thymian
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 1, "end_month": 12},  # immergruen
        "days_to_harvest": 180,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "trigonella-foenum-graecum": {  # Bockshornklee
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 9},
        "days_to_harvest": 100,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "tropaeolum-majus": {  # Kapuzinerkresse
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 6},
            "indoor": {"start_month": 3, "end_month": 4},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 30,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "urtica-dioica": {  # Brennessel
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 5},
            "transplant": {"start_month": 4, "end_month": 5},
        },
        "harvest_window": {"start_month": 4, "end_month": 9},
        "days_to_harvest": 60,
        "spacing_cm": 30,
        "garden_type": ["field"],
        "difficulty": 1,
    },

    # === 3b. Neue Gemuese (Phase C.2 — 27 Pflanzen) ===
    # Solanaceae
    "solanum-lycopersicum": {  # Tomate
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 90,
        "spacing_cm": 60,
        "garden_type": ["balcony", "raised_bed", "field", "greenhouse"],
        "difficulty": 2,
    },
    "solanum-tuberosum": {  # Kartoffel
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 5},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 110,
        "spacing_cm": 35,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "capsicum-annuum": {  # Paprika
        "climate_zones": ZONES_FROST_TENDER,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 3},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 120,
        "spacing_cm": 50,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "capsicum-chinense": {  # Chilli (Habanero-Verwandte)
        "climate_zones": ZONES_FROST_TENDER,
        "sowing_window": {
            "indoor": {"start_month": 1, "end_month": 3},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 8, "end_month": 10},
        "days_to_harvest": 150,
        "spacing_cm": 50,
        "garden_type": ["balcony", "raised_bed", "greenhouse"],
        "difficulty": 3,
    },
    "solanum-melongena": {  # Aubergine
        "climate_zones": ZONES_FROST_TENDER,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 3},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 130,
        "spacing_cm": 60,
        "garden_type": ["raised_bed", "greenhouse"],
        "difficulty": 3,
    },
    # Brassicaceae
    "brassica-oleracea-capitata-alba": {  # Weisskohl
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 8, "end_month": 11},
        "days_to_harvest": 130,
        "spacing_cm": 50,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "brassica-oleracea-capitata-rubra": {  # Rotkohl
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 8, "end_month": 11},
        "days_to_harvest": 140,
        "spacing_cm": 50,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "brassica-oleracea-sabauda": {  # Wirsing
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 5},
            "transplant": {"start_month": 5, "end_month": 7},
        },
        "harvest_window": {"start_month": 8, "end_month": 12},
        "days_to_harvest": 120,
        "spacing_cm": 50,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "brassica-oleracea-botrytis": {  # Blumenkohl
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 5},
            "transplant": {"start_month": 5, "end_month": 7},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 110,
        "spacing_cm": 50,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "brassica-oleracea-italica": {  # Brokkoli
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 5},
            "transplant": {"start_month": 5, "end_month": 7},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 90,
        "spacing_cm": 45,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "brassica-oleracea-gemmifera": {  # Rosenkohl
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 10, "end_month": 2},  # Wrap
        "days_to_harvest": 180,
        "spacing_cm": 60,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "brassica-oleracea-gongylodes": {  # Kohlrabi
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 4},
            "outdoor_direct": {"start_month": 4, "end_month": 7},
            "transplant": {"start_month": 4, "end_month": 7},
        },
        "harvest_window": {"start_month": 5, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "raphanus-sativus-sativus": {  # Radieschen
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 9},
        },
        "harvest_window": {"start_month": 4, "end_month": 10},
        "days_to_harvest": 30,
        "spacing_cm": 5,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "raphanus-sativus-niger": {  # Rettich (schwarzer Winterrettich)
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 6, "end_month": 8},
        },
        "harvest_window": {"start_month": 9, "end_month": 11},
        "days_to_harvest": 90,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    # Apiaceae
    "daucus-carota-sativus": {  # Karotte
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 7},
        },
        "harvest_window": {"start_month": 6, "end_month": 11},
        "days_to_harvest": 90,
        "spacing_cm": 5,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "pastinaca-sativa": {  # Pastinake
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 5},
        },
        "harvest_window": {"start_month": 10, "end_month": 2},  # Wrap
        "days_to_harvest": 180,
        "spacing_cm": 10,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "apium-graveolens-rapaceum": {  # Knollensellerie
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 3},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 9, "end_month": 11},
        "days_to_harvest": 180,
        "spacing_cm": 40,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "petroselinum-crispum-tuberosum": {  # Petersilienwurzel
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 5},
        },
        "harvest_window": {"start_month": 9, "end_month": 11},
        "days_to_harvest": 180,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    # Fabaceae
    "phaseolus-vulgaris-nanus": {  # Buschbohne
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 5, "end_month": 7},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "phaseolus-vulgaris-vulgaris": {  # Stangenbohne
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 70,
        "spacing_cm": 25,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "pisum-sativum-sativum": {  # Erbse (Schalerbse)
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 5},
        },
        "harvest_window": {"start_month": 6, "end_month": 8},
        "days_to_harvest": 80,
        "spacing_cm": 5,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "pisum-sativum-saccharatum": {  # Zuckererbse
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 5},
        },
        "harvest_window": {"start_month": 6, "end_month": 8},
        "days_to_harvest": 70,
        "spacing_cm": 5,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    # Asteraceae
    "lactuca-sativa-capitata": {  # Kopfsalat
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 4},
            "outdoor_direct": {"start_month": 4, "end_month": 8},
            "transplant": {"start_month": 4, "end_month": 8},
        },
        "harvest_window": {"start_month": 5, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "lactuca-sativa-crispa": {  # Pflueck-/Lollo-Salat
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 9},
            "indoor": {"start_month": 2, "end_month": 3},
        },
        "harvest_window": {"start_month": 5, "end_month": 10},
        "days_to_harvest": 45,
        "spacing_cm": 20,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    # Sonstige
    "allium-cepa": {  # Zwiebel
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 4},
            "transplant": {"start_month": 3, "end_month": 4},
        },
        "harvest_window": {"start_month": 7, "end_month": 9},
        "days_to_harvest": 120,
        "spacing_cm": 10,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "allium-porrum": {  # Lauch / Porree
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "indoor": {"start_month": 2, "end_month": 3},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 9, "end_month": 2},  # Wrap
        "days_to_harvest": 150,
        "spacing_cm": 15,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 2,
    },
    "spinacia-oleracea": {  # Spinat
        "climate_zones": ZONES_HARDY,
        "sowing_window": {
            "outdoor_direct": {"start_month": 3, "end_month": 9},
        },
        "harvest_window": {"start_month": 4, "end_month": 11},
        "days_to_harvest": 50,
        "spacing_cm": 10,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "beta-vulgaris-cicla": {  # Mangold
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 7},
        },
        "harvest_window": {"start_month": 6, "end_month": 11},
        "days_to_harvest": 60,
        "spacing_cm": 25,
        "garden_type": ["balcony", "raised_bed", "field"],
        "difficulty": 1,
    },
    "beta-vulgaris-conditiva": {  # Rote Bete
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 4, "end_month": 7},
        },
        "harvest_window": {"start_month": 7, "end_month": 11},
        "days_to_harvest": 90,
        "spacing_cm": 10,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
    "cucumis-sativus": {  # Gurke
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 4, "end_month": 5},
            "outdoor_direct": {"start_month": 5, "end_month": 6},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 7, "end_month": 10},
        "days_to_harvest": 70,
        "spacing_cm": 40,
        "garden_type": ["raised_bed", "greenhouse"],
        "difficulty": 2,
    },
    "zea-mays": {  # Mais
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "outdoor_direct": {"start_month": 5, "end_month": 6},
            "indoor": {"start_month": 4, "end_month": 5},
        },
        "harvest_window": {"start_month": 8, "end_month": 10},
        "days_to_harvest": 100,
        "spacing_cm": 30,
        "garden_type": ["field"],
        "difficulty": 1,
    },
    "cucurbita-pepo-zucchini": {  # Zucchini
        "climate_zones": ZONES_TEMPERATE,
        "sowing_window": {
            "indoor": {"start_month": 4, "end_month": 5},
            "outdoor_direct": {"start_month": 5, "end_month": 6},
            "transplant": {"start_month": 5, "end_month": 6},
        },
        "harvest_window": {"start_month": 6, "end_month": 10},
        "days_to_harvest": 60,
        "spacing_cm": 80,
        "garden_type": ["raised_bed", "field"],
        "difficulty": 1,
    },
}


# === 4. APPLY ===
def apply_garden_meta():
    updated = 0
    skipped = 0
    missing = []
    for slug, gm in GARDEN_META.items():
        path = os.path.join(DATA_DIR, f"{slug}.json")
        if not os.path.exists(path):
            missing.append(slug)
            continue
        with open(path, "r", encoding="utf-8") as f:
            plant = json.load(f)
        plant["garden_meta"] = gm
        with open(path, "w", encoding="utf-8") as f:
            json.dump(plant, f, ensure_ascii=False, indent=2)
            f.write("\n")
        updated += 1
    return updated, skipped, missing


def main():
    if not os.path.isdir(DATA_DIR):
        print(f"ERROR: data dir {DATA_DIR} not found", file=sys.stderr)
        sys.exit(1)
    updated, skipped, missing = apply_garden_meta()
    print(f"Updated garden_meta in {updated} plant JSONs.")
    if missing:
        print(f"Missing ({len(missing)}) — slugs without plant JSON (skipped):")
        for s in missing:
            print(f"  - {s}")


if __name__ == "__main__":
    main()
