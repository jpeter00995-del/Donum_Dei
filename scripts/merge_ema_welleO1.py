#!/usr/bin/env python3
"""
=== Welle O.1 — Merge EMA HMPC Monograph Data into 5 Pilot Plants ===

Replaces the `uses[]` of 5 pilot plants with structured EMA-derived data,
adds the EMA monograph as a source, and sets new safety fields
(pregnancy/lactation/children/drug_interactions/contraindications).

Data extracted from EMA HMPC Final Monographs by research agent on 2026-05-18.

Usage:
    python3 scripts/merge_ema_welleO1.py
"""

# === 1. IMPORTS ===
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "plants"
TODAY = "2026-05-18"

# === 2. EMA SOURCES (per plant) ===
SOURCES = {
    "echinacea-purpurea": [
        {
            "id": "src_ema_echinacea_radix",
            "type": "monograph",
            "title": "EMA/HMPC/424583/2016 — Echinacea purpurea radix (Final, 30 May 2017)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/echinaceae-purpureae-radix",
            "accessed": TODAY,
        },
        {
            "id": "src_ema_echinacea_herba",
            "type": "monograph",
            "title": "EMA/HMPC/48704/2014 Corr — Echinacea purpurea herba recens (Final, 24 Nov 2015)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/echinaceae-purpureae-herba",
            "accessed": TODAY,
        },
    ],
    "valeriana-officinalis": [
        {
            "id": "src_ema_valeriana_radix",
            "type": "monograph",
            "title": "EMA/HMPC/150848/2015 Corr.1 — Valeriana officinalis radix (Final, 2 Feb 2016)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/valerianae-radix",
            "accessed": TODAY,
        },
    ],
    "mentha-piperita": [
        {
            "id": "src_ema_mentha_folium",
            "type": "monograph",
            "title": "EMA/HMPC/572705/2014 — Mentha × piperita folium (Final Rev.1, 15 Jan 2020)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/menthae-piperitae-folium",
            "accessed": TODAY,
        },
        {
            "id": "src_ema_mentha_aetheroleum",
            "type": "monograph",
            "title": "EMA/HMPC/522410/2013 — Mentha × piperita aetheroleum (Final Rev.1, 15 Jan 2020)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/menthae-piperitae-aetheroleum",
            "accessed": TODAY,
        },
    ],
    "matricaria-chamomilla": [
        {
            "id": "src_ema_matricaria_flos",
            "type": "monograph",
            "title": "EMA/HMPC/55843/2011 — Matricaria recutita flos (Final, 7 Jul 2015)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/matricariae-flos",
            "accessed": TODAY,
        },
    ],
    "salvia-officinalis": [
        {
            "id": "src_ema_salvia_folium",
            "type": "monograph",
            "title": "EMA/HMPC/277152/2015 — Salvia officinalis folium (Final, 20 Sep 2016)",
            "url": "https://www.ema.europa.eu/en/medicines/herbal/salviae-officinalis-folium",
            "accessed": TODAY,
        },
    ],
}

# === 3. USES per plant ===
# (Lightly normalized from research agent output: form mapped to UseForm enum,
#  source_ids added to reference SOURCES above, target normalized to existing
#  target strings used in Symptom-Finder where applicable.)

USES = {
    "echinacea-purpurea": [
        {
            "form": "tincture",
            "target": ["immune", "respiratory"],
            "internal_external": "internal",
            "plant_part": "aerial_parts",
            "evidence_level": "ema_well_established",
            "preparation": {
                "amount_ml": {"min": 1.5, "max": 4.5},
                "doses_per_day": 3,
                "max_duration_weeks": 1.5,
                "instructions": {
                    "de": "Presssaft (DER 1.5-2.5:1) aus frischem Kraut: Einzeldosis 1.5-4.5 ml, Tagesdosis 6-9 ml, oral. Zur kurzfristigen Vorbeugung und Behandlung von Erkältungen. Therapie bei ersten Anzeichen beginnen. Nicht länger als 10 Tage anwenden.",
                    "en": "Expressed juice (DER 1.5-2.5:1) from fresh herb: single dose 1.5-4.5 ml, daily dose 6-9 ml, oral. For short-term prevention and treatment of common cold. Start at first signs. Do not use for more than 10 days.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Presssaft aus frischem Kraut zur kurzfristigen Erkältungs-Vorbeugung und -Behandlung.",
                "en": "Expressed juice from fresh herb for short-term cold prevention and treatment.",
            },
            "source_ids": ["src_ema_echinacea_herba"],
        },
        {
            "form": "tincture",
            "target": ["immune", "respiratory"],
            "internal_external": "internal",
            "plant_part": "root",
            "evidence_level": "traditional",
            "preparation": {
                "doses_per_day": 9,
                "max_duration_weeks": 1.5,
                "instructions": {
                    "de": "Trockenextrakt aus Wurzel (DER 5.5-7.5:1, Ethanol 45% V/V): 40 mg alle 2 Stunden, Tagesdosis 360 mg. Bei Symptomen >10 Tage Arzt aufsuchen.",
                    "en": "Dry extract from root (DER 5.5-7.5:1, ethanol 45% V/V): 40 mg every 2 hours, daily dose 360 mg. Consult doctor if symptoms persist >10 days.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Trockenextrakt aus der Wurzel zur Linderung von Erkältungs-Symptomen (traditionelle Anwendung).",
                "en": "Dry extract from root for relief of cold symptoms (traditional use).",
            },
            "source_ids": ["src_ema_echinacea_radix"],
        },
        {
            "form": "tincture",
            "target": ["skin"],
            "internal_external": "internal",
            "plant_part": "root",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 0.05, "max": 0.1},
                "doses_per_day": 3,
                "max_duration_weeks": 2,
                "instructions": {
                    "de": "Trockenextrakt aus Wurzel (DER 4:1, Wasser): Erwachsene 50-100 mg Einzeldosis, 150-300 mg Tagesdosis. Bei leichter Akne. Bei Symptomen >2 Wochen Arzt aufsuchen.",
                    "en": "Dry extract from root (DER 4:1, water): adults 50-100 mg single dose, 150-300 mg daily. For mild acne. Consult doctor if symptoms persist >2 weeks.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Innerliche Anwendung der Wurzel zur Linderung von Pickeln und Mitessern bei leichter Akne.",
                "en": "Internal use of root for relief of spots and pimples in mild acne.",
            },
            "source_ids": ["src_ema_echinacea_radix"],
        },
        {
            "form": "salve",
            "target": ["skin"],
            "internal_external": "external",
            "plant_part": "aerial_parts",
            "evidence_level": "traditional",
            "preparation": {
                "doses_per_day": 3,
                "max_duration_weeks": 1,
                "instructions": {
                    "de": "Salbe mit 10-20 g Presssaft / 100 g. Dünn auf betroffene Stelle 2-3x täglich. Bei kleinen oberflächlichen Wunden. Nicht länger als 1 Woche.",
                    "en": "Ointment with 10-20 g expressed juice / 100 g. Apply thinly to affected area 2-3x daily. For small superficial wounds. Do not use longer than 1 week.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Salbe mit Presssaft aus frischem Kraut zur Behandlung kleiner oberflächlicher Wunden.",
                "en": "Ointment with expressed juice from fresh herb for treatment of small superficial wounds.",
            },
            "source_ids": ["src_ema_echinacea_herba"],
        },
    ],
    "valeriana-officinalis": [
        {
            "form": "tincture",
            "target": ["nervous", "sleep"],
            "internal_external": "internal",
            "plant_part": "root",
            "evidence_level": "ema_well_established",
            "preparation": {
                "amount_dry_g": {"min": 0.4, "max": 0.6},
                "doses_per_day": 3,
                "max_duration_weeks": 4,
                "instructions": {
                    "de": "Trockenextrakt (DER 3-7.4:1, Ethanol 40-70% V/V): 400-600 mg Einzeldosis, bei leichter nervlicher Anspannung bis 3x täglich. Bei Schlafstörungen 1/2-1 h vor dem Schlafengehen, ggf. zusätzliche Dosis am Abend. Optimale Wirkung nach 2-4 Wochen.",
                    "en": "Dry extract (DER 3-7.4:1, ethanol 40-70% V/V): 400-600 mg single dose, up to 3x daily for mild nervous tension. For sleep: 1/2-1 h before bedtime, with earlier evening dose if needed. Optimal effect after 2-4 weeks.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Trockenextrakt der Wurzel zur Linderung leichter nervlicher Anspannung und zur Schlafförderung (klinische Evidenz).",
                "en": "Dry extract of root for relief of mild nervous tension and to aid sleep (clinical evidence).",
            },
            "source_ids": ["src_ema_valeriana_radix"],
        },
        {
            "form": "tea",
            "target": ["nervous", "sleep"],
            "internal_external": "internal",
            "plant_part": "root",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 0.3, "max": 3.0},
                "water_ml": 150,
                "doses_per_day": 3,
                "instructions": {
                    "de": "Kräutertee: 0.3-3 g zerkleinerte Wurzel mit 150 ml siedendem Wasser übergießen. Bei Stress bis 3x täglich. Zur Schlafförderung 1/2-1 h vor dem Schlafengehen.",
                    "en": "Herbal tea: 0.3-3 g comminuted root with 150 ml boiling water. Up to 3x daily for mild stress. To aid sleep: 1/2-1 h before bedtime.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Aufguss aus zerkleinerter Wurzel — traditionelle Anwendung zur Beruhigung und Schlafförderung.",
                "en": "Infusion from comminuted root — traditional use for calming and sleep support.",
            },
            "source_ids": ["src_ema_valeriana_radix"],
        },
        {
            "form": "tincture",
            "target": ["nervous", "sleep"],
            "internal_external": "internal",
            "plant_part": "root",
            "evidence_level": "traditional",
            "preparation": {
                "amount_ml": {"min": 4, "max": 8},
                "doses_per_day": 3,
                "instructions": {
                    "de": "Tinktur 1:8 in Ethanol 60% V/V: 4-8 ml Einzeldosis, bis 3x täglich. Bei Schlafstörung 1/2 h vor dem Schlafengehen.",
                    "en": "Tincture 1:8 in ethanol 60% V/V: 4-8 ml single dose, up to 3x daily. For sleep: 1/2 h before bedtime.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Alkoholische Tinktur der Wurzel — traditionelle Schlaf- und Nerven-Anwendung.",
                "en": "Alcoholic tincture of root — traditional sleep and nerve application.",
            },
            "source_ids": ["src_ema_valeriana_radix"],
        },
        {
            "form": "bath",
            "target": ["nervous"],
            "internal_external": "external",
            "plant_part": "root",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 100, "max": 100},
                "doses_per_day": 1,
                "instructions": {
                    "de": "Vollbad: 100 g zerkleinerte Wurzel. Wassertemperatur 34-37 °C, Badedauer 10-20 Minuten. Bis 1 Bad täglich.",
                    "en": "Full bath: 100 g comminuted root. Water 34-37 °C, duration 10-20 minutes. Up to 1 bath daily.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "Nicht empfohlen bei Kindern <12 Jahre", "en": "Not recommended in children <12 years"}},
            "description": {
                "de": "Beruhigendes Bad mit zerkleinerter Baldrianwurzel.",
                "en": "Calming bath with comminuted valerian root.",
            },
            "source_ids": ["src_ema_valeriana_radix"],
        },
    ],
    "mentha-piperita": [
        {
            "form": "tea",
            "target": ["digestion"],
            "internal_external": "internal",
            "plant_part": "leaf",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 1.5, "max": 3.0},
                "water_ml": 150,
                "doses_per_day": 3,
                "max_duration_weeks": 2,
                "instructions": {
                    "de": "Kräutertee: 1.5-3 g zerkleinerte Blätter in 100-150 ml siedendem Wasser, 3x täglich. Bei Dyspepsie und Blähungen. Kinder 4-11 J: 1-2 g, 3x täglich.",
                    "en": "Herbal tea: 1.5-3 g comminuted leaves in 100-150 ml boiling water, 3x daily. For dyspepsia and flatulence. Children 4-11 yrs: 1-2 g, 3x daily.",
                },
            },
            "age_restriction": {"min_age": 4, "note": {"de": "<4 Jahre nicht empfohlen", "en": "<4 years not recommended"}},
            "description": {
                "de": "Aufguss aus Pfefferminzblättern zur Linderung von Verdauungsbeschwerden.",
                "en": "Infusion of peppermint leaves for relief of digestive disorders.",
            },
            "source_ids": ["src_ema_mentha_folium"],
        },
        {
            "form": "essential_oil",
            "target": ["digestion"],
            "internal_external": "internal",
            "plant_part": "leaf",
            "evidence_level": "ema_well_established",
            "preparation": {
                "amount_ml": {"min": 0.2, "max": 0.4},
                "doses_per_day": 3,
                "max_duration_weeks": 12,
                "instructions": {
                    "de": "Pfefferminzöl in magensaftresistenten Kapseln: 0.2-0.4 ml Einzeldosis, Tagesdosis 0.6-1.2 ml. Kinder 8-11 J: 0.2 ml 3x täglich. 30 min vor Mahlzeiten, unzerkaut schlucken. Besonders bei Reizdarm (IBS).",
                    "en": "Peppermint oil in gastro-resistant capsules: 0.2-0.4 ml single dose, daily 0.6-1.2 ml. Children 8-11 yrs: 0.2 ml 3x daily. Swallow whole, 30 min before meals. Especially for IBS.",
                },
            },
            "age_restriction": {"min_age": 8, "note": {"de": "<2 Jahre kontraindiziert (Apnoe-Risiko); <8 J nicht empfohlen", "en": "<2 years contraindicated (apnoea risk); <8 yrs not recommended"}},
            "description": {
                "de": "Pfefferminzöl in magensaftresistenten Kapseln zur Linderung von Reizdarm-Beschwerden (klinische Evidenz).",
                "en": "Peppermint oil in gastro-resistant capsules for relief of IBS symptoms (clinical evidence).",
            },
            "source_ids": ["src_ema_mentha_aetheroleum"],
        },
        {
            "form": "essential_oil",
            "target": ["nervous"],
            "internal_external": "external",
            "plant_part": "leaf",
            "evidence_level": "ema_well_established",
            "preparation": {
                "doses_per_day": 1,
                "instructions": {
                    "de": "10% Pfefferminzöl in Ethanol auf Stirn und Schläfen einreiben. Eine Anwendung, ggf. nach 15 min zweimal wiederholbar. Bei leichten Spannungskopfschmerzen.",
                    "en": "10% peppermint oil in ethanol — rub on forehead and temples. One application, may repeat twice at 15-min intervals. For mild tension-type headache.",
                },
            },
            "age_restriction": {"min_age": 18, "note": {"de": "<18 Jahre nicht empfohlen", "en": "<18 years not recommended"}},
            "description": {
                "de": "Äußerliche Anwendung von 10% Pfefferminzöl auf Stirn/Schläfen bei leichten Spannungskopfschmerzen.",
                "en": "External application of 10% peppermint oil on forehead/temples for mild tension headache.",
            },
            "source_ids": ["src_ema_mentha_aetheroleum"],
        },
        {
            "form": "inhalation",
            "target": ["respiratory"],
            "internal_external": "external",
            "plant_part": "leaf",
            "evidence_level": "traditional",
            "preparation": {
                "amount_ml": {"min": 0.08, "max": 0.16},
                "doses_per_day": 3,
                "max_duration_weeks": 2,
                "instructions": {
                    "de": "Inhalation von 0.08-0.16 ml ätherischem Öl, bis 3x täglich. Bei Erkältungssymptomen.",
                    "en": "Inhalation of 0.08-0.16 ml essential oil, up to 3x daily. For cold symptoms.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "<2 Jahre kontraindiziert; 2-11 J nicht empfohlen", "en": "<2 years contraindicated; 2-11 yrs not recommended"}},
            "description": {
                "de": "Dampfinhalation mit Pfefferminzöl zur Linderung von Erkältungs- und Husten-Symptomen.",
                "en": "Steam inhalation with peppermint oil for relief of cold and cough symptoms.",
            },
            "source_ids": ["src_ema_mentha_aetheroleum"],
        },
    ],
    "matricaria-chamomilla": [
        {
            "form": "tea",
            "target": ["digestion"],
            "internal_external": "internal",
            "plant_part": "flower",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 1.5, "max": 4.0},
                "water_ml": 150,
                "doses_per_day": 4,
                "max_duration_weeks": 1,
                "instructions": {
                    "de": "Kräutertee: 1.5-4 g zerkleinerte Blüten in 150 ml siedendem Wasser, 3-4x täglich. Kinder 6-12 J: 1.5-3 g; 2-6 J: 1-1.5 g; 6 Monate-2 J: 0.5-1 g (2-4x täglich). Bei leichten Magen-Darm-Beschwerden.",
                    "en": "Herbal tea: 1.5-4 g comminuted flowers in 150 ml boiling water, 3-4x daily. Children 6-12 yrs: 1.5-3 g; 2-6 yrs: 1-1.5 g; 6mo-2 yrs: 0.5-1 g (2-4x daily). For minor GI complaints.",
                },
            },
            "age_restriction": {"min_age": 0.5, "note": {"de": "Tee ab 6 Monaten (allg. Ernährungsgründe)", "en": "Tea from 6 months (general nutrition considerations)"}},
            "description": {
                "de": "Kamillenblüten-Tee zur Linderung leichter Magen-Darm-Beschwerden wie Blähungen und Krämpfe.",
                "en": "Chamomile flower tea for relief of minor GI complaints such as bloating and spasms.",
            },
            "source_ids": ["src_ema_matricaria_flos"],
        },
        {
            "form": "inhalation",
            "target": ["respiratory"],
            "internal_external": "external",
            "plant_part": "flower",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 3, "max": 10},
                "water_ml": 100,
                "doses_per_day": 2,
                "instructions": {
                    "de": "Dampfinhalation: 3-10 g zerkleinerte Blüten in 100 ml heißem Wasser, mehrmals täglich. Kinder 6-12 J: 2-5 g, 1-2x täglich. Bei Erkältungssymptomen.",
                    "en": "Steam inhalation: 3-10 g comminuted flowers in 100 ml hot water, several times daily. Children 6-12 yrs: 2-5 g, 1-2x daily. For cold symptoms.",
                },
            },
            "age_restriction": {"min_age": 6, "note": {"de": "Dampfinhalation <6 Jahre nicht etabliert", "en": "Steam inhalation <6 years not established"}},
            "description": {
                "de": "Dampfinhalation mit Kamillenblüten zur Linderung von Erkältungssymptomen.",
                "en": "Steam inhalation with chamomile flowers for relief of cold symptoms.",
            },
            "source_ids": ["src_ema_matricaria_flos"],
        },
        {
            "form": "gargle",
            "target": ["mouth_throat"],
            "internal_external": "external",
            "plant_part": "flower",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 1, "max": 5},
                "water_ml": 100,
                "doses_per_day": 4,
                "max_duration_weeks": 1,
                "instructions": {
                    "de": "Gurgeln/Spülung: Aufguss von 1-5 g zerkleinerten Blüten in 100 ml Wasser, mehrmals täglich. Bei kleinen Geschwüren und Entzündungen in Mund und Rachen.",
                    "en": "Gargling/rinse: infusion of 1-5 g comminuted flowers in 100 ml water, several times daily. For minor ulcers and inflammations of mouth and throat.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "<12 Jahre meist nicht etabliert", "en": "<12 years mostly not established"}},
            "description": {
                "de": "Wässriger Aufguss aus Kamillenblüten zum Gurgeln bei Mund- und Rachenentzündungen.",
                "en": "Aqueous chamomile infusion for gargling in mouth and throat inflammations.",
            },
            "source_ids": ["src_ema_matricaria_flos"],
        },
        {
            "form": "bath",
            "target": ["skin"],
            "internal_external": "external",
            "plant_part": "flower",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 3, "max": 10},
                "water_ml": 100,
                "doses_per_day": 2,
                "max_duration_weeks": 1,
                "instructions": {
                    "de": "Kompressen/Sitzbäder: 3-10 g zerkleinerte Blüten in 100 ml Wasser, mehrmals täglich. Bei leichten Hautentzündungen (Sonnenbrand), oberflächlichen Wunden, kleinen Furunkeln.",
                    "en": "Compresses/sitz baths: 3-10 g comminuted flowers in 100 ml water, several times daily. For minor skin inflammation (sunburn), superficial wounds, small boils.",
                },
            },
            "age_restriction": {"min_age": 12, "note": {"de": "<12 Jahre nicht etabliert", "en": "<12 years not established"}},
            "description": {
                "de": "Äußerliche Anwendung als Kompresse oder Sitzbad bei leichten Hautentzündungen.",
                "en": "External use as compress or sitz bath for minor skin inflammations.",
            },
            "source_ids": ["src_ema_matricaria_flos"],
        },
    ],
    "salvia-officinalis": [
        {
            "form": "tea",
            "target": ["digestion"],
            "internal_external": "internal",
            "plant_part": "leaf",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 1, "max": 2},
                "water_ml": 150,
                "doses_per_day": 3,
                "max_duration_weeks": 2,
                "instructions": {
                    "de": "Kräutertee: 1-2 g zerkleinerte Blätter in 150 ml siedendem Wasser, 3x täglich. Bei leichten dyspeptischen Beschwerden wie Sodbrennen und Blähungen.",
                    "en": "Herbal tea: 1-2 g comminuted leaves in 150 ml boiling water, 3x daily. For mild dyspeptic complaints such as heartburn and bloating.",
                },
            },
            "age_restriction": {"min_age": 18, "note": {"de": "<18 Jahre nicht empfohlen", "en": "<18 years not recommended"}},
            "description": {
                "de": "Aufguss aus Salbeiblättern zur Linderung leichter Verdauungsbeschwerden.",
                "en": "Infusion of sage leaves for relief of mild digestive complaints.",
            },
            "source_ids": ["src_ema_salvia_folium"],
        },
        {
            "form": "tea",
            "target": ["other"],
            "internal_external": "internal",
            "plant_part": "leaf",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 2, "max": 2},
                "water_ml": 150,
                "doses_per_day": 3,
                "instructions": {
                    "de": "Tee: 2 g zerkleinerte Blätter in 150 ml siedendem Wasser, 3x täglich. Bei Nachtschweiß 1.5 ml Flüssigextrakt 1 h vor dem Schlafengehen. Bei keiner Besserung nach 6 Wochen Arzt aufsuchen.",
                    "en": "Tea: 2 g comminuted leaves in 150 ml boiling water, 3x daily. For night sweat: 1.5 ml liquid extract 1 h before bedtime. Consult doctor if no improvement after 6 weeks.",
                },
            },
            "age_restriction": {"min_age": 18, "note": {"de": "<18 Jahre nicht empfohlen", "en": "<18 years not recommended"}},
            "description": {
                "de": "Aufguss aus Salbeiblättern zur Linderung von übermäßigem Schwitzen.",
                "en": "Infusion of sage leaves for relief of excessive sweating.",
            },
            "source_ids": ["src_ema_salvia_folium"],
        },
        {
            "form": "gargle",
            "target": ["mouth_throat"],
            "internal_external": "external",
            "plant_part": "leaf",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 2.5, "max": 2.5},
                "water_ml": 100,
                "doses_per_day": 3,
                "max_duration_weeks": 1,
                "instructions": {
                    "de": "Gurgeln: Aufguss von 2.5 g zerkleinerten Blättern in 100 ml siedendem Wasser, warm 3x täglich gurgeln. Bei Beschwerden >1 Woche Arzt aufsuchen.",
                    "en": "Gargling: infusion of 2.5 g comminuted leaves in 100 ml boiling water, gargle warm 3x daily. Consult doctor if symptoms persist >1 week.",
                },
            },
            "age_restriction": {"min_age": 18, "note": {"de": "<18 Jahre nicht empfohlen", "en": "<18 years not recommended"}},
            "description": {
                "de": "Aufguss zum Gurgeln bei Entzündungen in Mund und Rachen.",
                "en": "Infusion for gargling in mouth and throat inflammations.",
            },
            "source_ids": ["src_ema_salvia_folium"],
        },
        {
            "form": "compress",
            "target": ["skin"],
            "internal_external": "external",
            "plant_part": "leaf",
            "evidence_level": "traditional",
            "preparation": {
                "amount_dry_g": {"min": 2.5, "max": 2.5},
                "water_ml": 100,
                "doses_per_day": 4,
                "max_duration_weeks": 2,
                "instructions": {
                    "de": "Aufguss von 2.5 g zerkleinerten Blättern in 100 ml Wasser, auf betroffene Hautstelle 2-4x täglich auftragen. Bei leichten Hautentzündungen.",
                    "en": "Infusion of 2.5 g comminuted leaves in 100 ml water, apply to affected skin 2-4x daily. For minor skin inflammations.",
                },
            },
            "age_restriction": {"min_age": 18, "note": {"de": "<18 Jahre nicht empfohlen", "en": "<18 years not recommended"}},
            "description": {
                "de": "Feuchter Umschlag mit Salbei-Aufguss bei leichten Hautentzündungen.",
                "en": "Moist compress with sage infusion for minor skin inflammations.",
            },
            "source_ids": ["src_ema_salvia_folium"],
        },
    ],
}

# === 4. SAFETY-MERGE per plant ===
SAFETY = {
    "echinacea-purpurea": {
        "pregnancy": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen außer auf ärztlichen Rat", "en": "Safety not established; use not recommended unless advised by doctor"}},
        "lactation": {"status": "caution", "note": {"de": "Nicht empfohlen; nicht auf Brust stillender Frauen anwenden", "en": "Not recommended; do not apply to breast of breastfeeding women"}},
        "children": {"status": "contraindicated", "note": {"de": "<12 Jahre nicht empfohlen (unzureichende Daten)", "en": "<12 years not recommended (insufficient data)"}},
        "drug_interactions": [
            {"drug_class": "Immunsuppressiva", "mechanism": {"de": "Echinacea stimuliert das Immunsystem — mögliche Abschwächung immunsuppressiver Therapien", "en": "Echinacea stimulates the immune system — possible weakening of immunosuppressive therapy"}, "severity": "caution"}
        ],
        "contraindications": [
            {"de": "Überempfindlichkeit gegen Asteraceae (Korbblütler)", "en": "Hypersensitivity to Asteraceae (Compositae)"},
            {"de": "Progressive systemische Erkrankungen, Autoimmunerkrankungen, Immundefizienz", "en": "Progressive systemic disorders, autoimmune diseases, immunodeficiency"},
        ],
        "max_continuous_use_weeks": 1.5,
    },
    "valeriana-officinalis": {
        "pregnancy": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen", "en": "Safety not established; use not recommended"}},
        "lactation": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen", "en": "Safety not established; use not recommended"}},
        "children": {"status": "contraindicated", "note": {"de": "<12 Jahre nicht empfohlen (mangelnde Daten)", "en": "<12 years not recommended (lack of data)"}},
        "drug_interactions": [
            {"drug_class": "Andere Sedativa / Benzodiazepine", "mechanism": {"de": "Theoretisch additive sedierende Wirkung möglich (Tier- und Einzelfallberichte)", "en": "Theoretically additive sedative effects possible (animal and case reports)"}, "severity": "caution"}
        ],
        "contraindications": [
            {"de": "Überempfindlichkeit gegen Baldrian", "en": "Hypersensitivity to valerian"},
            {"de": "Badezusatz: offene Wunden, akute Hautkrankheiten, hohes Fieber, schwere Infektionen, Herzinsuffizienz", "en": "Bath: open wounds, acute skin disease, high fever, severe infections, cardiac insufficiency"},
        ],
        "max_continuous_use_weeks": 4,
    },
    "mentha-piperita": {
        "pregnancy": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen", "en": "Safety not established; use not recommended"}},
        "lactation": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen", "en": "Safety not established; use not recommended"}},
        "children": {"status": "caution", "note": {"de": "Blatt: <4 J nicht empfohlen. Öl: <2 J kontraindiziert (Apnoe/Laryngospasmus durch Menthol); bei Krampfanfall-Anamnese kontraindiziert", "en": "Leaf: <4 yrs not recommended. Oil: <2 yrs contraindicated (apnoea/laryngospasm from menthol); seizure history contraindicated"}},
        "drug_interactions": [
            {"drug_class": "Antazida, H2-Blocker, Protonenpumpenhemmer", "mechanism": {"de": "Gleichzeitige Einnahme mit magensaftresistenten Pfefferminzöl-Kapseln kann den Überzug vorzeitig auflösen — vermeiden", "en": "Concomitant use with gastro-resistant peppermint oil capsules may cause premature dissolution of enteric coating — avoid"}, "severity": "avoid"}
        ],
        "contraindications": [
            {"de": "Überempfindlichkeit gegen Pfefferminze oder Menthol", "en": "Hypersensitivity to peppermint or menthol"},
            {"de": "Pfefferminzöl oral: Lebererkrankungen, Cholangitis, Achlorhydrie, Gallensteine, andere Gallenwegserkrankungen", "en": "Peppermint oil oral: liver disease, cholangitis, achlorhydria, gallstones, other biliary disorders"},
            {"de": "Pfefferminzblätter bei Reflux/Sodbrennen/Hiatushernie meiden", "en": "Avoid peppermint leaf in reflux/heartburn/hiatal hernia"},
        ],
    },
    "matricaria-chamomilla": {
        "pregnancy": {"status": "safe", "note": {"de": "Tee aus zerkleinerter Droge: etabliert. Andere Zubereitungen: nicht etabliert", "en": "Tea from comminuted herbal substance: established. Other preparations: not established"}},
        "lactation": {"status": "safe", "note": {"de": "Tee aus zerkleinerter Droge: etabliert. Bei kutaner Anwendung Brustwarzen vor dem Stillen reinigen (Sensibilisierungs-Vermeidung)", "en": "Tea from comminuted herbal substance: established. For cutaneous use, clean nipples before nursing (sensitisation prevention)"}},
        "children": {"status": "caution", "note": {"de": "Variabel je Zubereitung und Indikation — siehe pro Zubereitung", "en": "Variable by preparation and indication"}},
        "drug_interactions": [
            {"drug_class": "CYP450-Substrate (orale Langzeit-Hochdosis)", "mechanism": {"de": "Bei Nierentransplantation und Langzeit-Hochdosis-Anwendung wurden CYP450-Interaktionen berichtet", "en": "CYP450-based interactions reported in renal transplant patients on long-term high-dose use"}, "severity": "caution"}
        ],
        "contraindications": [
            {"de": "Überempfindlichkeit gegen Asteraceae (Korbblütler)", "en": "Hypersensitivity to Asteraceae (Compositae)"},
            {"de": "Vollbäder: offene Wunden, akute Hautkrankheiten, hohes Fieber, schwere Infektionen, Herzinsuffizienz", "en": "Full baths: open wounds, acute skin disease, high fever, severe infections, cardiac insufficiency"},
        ],
    },
    "salvia-officinalis": {
        "pregnancy": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen", "en": "Safety not established; use not recommended"}},
        "lactation": {"status": "caution", "note": {"de": "Sicherheit nicht etabliert; Anwendung nicht empfohlen", "en": "Safety not established; use not recommended"}},
        "children": {"status": "contraindicated", "note": {"de": "<18 Jahre nicht empfohlen (unzureichende Daten). Thujon ist neurotoxisch.", "en": "<18 years not recommended (insufficient data). Thujone is neurotoxic."}},
        "drug_interactions": [],
        "contraindications": [
            {"de": "Überempfindlichkeit gegen Salbei", "en": "Hypersensitivity to sage"},
            {"de": "Vorsicht: Thujon ist neurotoxisch. Chemotypen mit niedrigem Thujon-Gehalt sind vorzuziehen. Tägliche Thujon-Exposition <6 mg.", "en": "Caution: Thujone is neurotoxic. Low-thujone chemotypes preferred. Daily thujone <6 mg."},
        ],
    },
}


# === 5. MERGE LOGIC ===
def merge_plant(slug: str) -> None:
    path = DATA / f"{slug}.json"
    d = json.load(open(path))

    # 5.1 Add EMA sources (dedupe by id)
    existing_source_ids = {s["id"] for s in d.get("sources", [])}
    for src in SOURCES[slug]:
        if src["id"] not in existing_source_ids:
            d["sources"].append(src)

    # 5.2 Replace uses[] with EMA-derived uses
    d["uses"] = USES[slug]

    # 5.3 Merge safety fields
    safety_patch = SAFETY[slug]
    for key, val in safety_patch.items():
        d["safety"][key] = val

    # 5.4 Write back
    json.dump(d, open(path, "w"), ensure_ascii=False, indent=2)
    print(f"  ✓ {slug}: {len(USES[slug])} uses, {len(SOURCES[slug])} EMA sources, safety extended")


def main() -> int:
    print(f"Merging EMA HMPC data into {len(USES)} pilot plants…")
    for slug in USES.keys():
        merge_plant(slug)
    print("\n✓ Done. Run vitest + build to verify.")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
