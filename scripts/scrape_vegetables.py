#!/usr/bin/env python3
# === 1. ZWECK ===
# Generiert 27+ neue Gemuese-Plant-JSONs fuer Donum Dei v1.0 Welle C.2.
# Holt Wikipedia-Beschreibung (DE+EN) und Wikimedia-Commons-Lead-Bild + Lizenz,
# baut schema-konformes JSON in src/data/plants/<slug>.json und laedt das Bild
# nach public/images/plants/<slug>.jpg. Ueberschreibt KEINE existierenden JSONs.
#
# Die garden_meta-Feldern werden separat ueber scripts/seed_garden_meta.py
# nachgepflegt (idempotent, gleiche Quelle).
#
# Run from project root:
#   python3 scripts/scrape_vegetables.py

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

UA = "DonumDei/1.0 (educational, personal use; maikelganske913@gmail.com)"
TODAY = "2026-05-17"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "src", "data", "plants")
IMG_DIR = os.path.join(PROJECT_ROOT, "public", "images", "plants")

# === 2. GEMUESE-LISTE ===
# Format (gleiches Tupel wie scrape_plants.py):
#   slug, latin, de_wiki_title, en_wiki_title, family_de, family_en, family_latin,
#   default_use_form, default_target, default_int_ext, default_active_months,
#   default_harvest_part_de, default_harvest_part_en,
#   default_warnings_de, default_warnings_en, external_only
VEGETABLES = [
    # Solanaceae
    ("solanum-lycopersicum", "Solanum lycopersicum", "Tomate", "Tomato",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "raw", ["nutrition"], "internal", [7, 8, 9, 10],
     "reife Früchte (Sommer-Herbst)", "ripe fruits (summer-autumn)",
     "Grüne, unreife Früchte enthalten Solanin und sind roh giftig. Blätter und Stängel nicht verzehren.",
     "Green, unripe fruits contain solanine and are toxic raw. Do not eat leaves and stems.",
     False),
    ("solanum-tuberosum", "Solanum tuberosum", "Kartoffel", "Potato",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "raw", ["nutrition", "energy"], "internal", [7, 8, 9, 10],
     "reife Knollen (Sommer-Herbst)", "mature tubers (summer-autumn)",
     "Grüne Stellen und Keime enthalten Solanin — vor Verzehr großzügig entfernen. Knollen immer kochen.",
     "Green spots and sprouts contain solanine — remove generously before eating. Always cook tubers.",
     False),
    ("capsicum-annuum", "Capsicum annuum", "Paprika", "Capsicum_annuum",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "raw", ["nutrition", "vitamin_c"], "internal", [7, 8, 9, 10],
     "reife Früchte", "ripe fruits",
     "Bei empfindlichem Magen scharfe Sorten in Maßen.",
     "Spicy varieties in moderation if you have a sensitive stomach.",
     False),
    ("capsicum-chinense", "Capsicum chinense", "Capsicum_chinense", "Capsicum_chinense",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "spice", ["digestion", "circulation"], "internal", [8, 9, 10],
     "reife Früchte (sehr scharf)", "ripe fruits (very hot)",
     "Capsaicin reizt Schleimhäute stark. Hautkontakt vermeiden, Handschuhe beim Schneiden. Nicht für kleine Kinder.",
     "Capsaicin strongly irritates mucous membranes. Avoid skin contact, wear gloves when cutting. Not for small children.",
     False),
    ("solanum-melongena", "Solanum melongena", "Aubergine", "Eggplant",
     "Nachtschattengewächse", "Nightshade family", "Solanaceae",
     "raw", ["nutrition"], "internal", [7, 8, 9, 10],
     "reife Früchte", "ripe fruits",
     "Roh ungenießbar — immer garen. Enthält wenig Solanin, in üblicher Küchenmenge unbedenklich.",
     "Inedible raw — always cook. Contains low solanine, safe in usual cooking amounts.",
     False),

    # Brassicaceae
    ("brassica-oleracea-capitata-alba", "Brassica oleracea convar. capitata var. alba", "Wei%C3%9Fkohl", "Cabbage",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["digestion", "vitamin_c"], "internal", [8, 9, 10, 11],
     "reife Köpfe (Spätsommer-Herbst)", "mature heads (late summer-autumn)",
     "Bei empfindlichem Darm Blähungen möglich. Vergorener Weißkohl (Sauerkraut) ist besonders verträglich.",
     "May cause bloating in sensitive digestive systems. Fermented cabbage (sauerkraut) is particularly digestible.",
     False),
    ("brassica-oleracea-capitata-rubra", "Brassica oleracea convar. capitata var. rubra", "Rotkohl", "Red_cabbage",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["nutrition", "vitamin_c"], "internal", [8, 9, 10, 11],
     "reife Köpfe (Spätsommer-Herbst)", "mature heads (late summer-autumn)",
     "Bei empfindlichem Darm Blähungen möglich.",
     "May cause bloating in sensitive digestive systems.",
     False),
    ("brassica-oleracea-sabauda", "Brassica oleracea convar. capitata var. sabauda", "Wirsing", "Savoy_cabbage",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["nutrition", "vitamin_c"], "internal", [8, 9, 10, 11, 12],
     "reife Köpfe", "mature heads",
     "Frosthart und winterfest — kann bis in den Winter geerntet werden.",
     "Frost-hardy and winter-resistant — can be harvested into winter.",
     False),
    ("brassica-oleracea-botrytis", "Brassica oleracea var. botrytis", "Blumenkohl", "Cauliflower",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["digestion", "vitamin_c"], "internal", [7, 8, 9, 10],
     "Blütenstand (Sommer-Herbst)", "flower head (summer-autumn)",
     "Bei empfindlichem Darm Blähungen möglich.",
     "May cause bloating in sensitive digestive systems.",
     False),
    ("brassica-oleracea-italica", "Brassica oleracea var. italica", "Brokkoli", "Broccoli",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["nutrition", "vitamin_c"], "internal", [6, 7, 8, 9, 10],
     "Blütenstand", "flower head",
     "Sehr nährstoffreich. Bei Schilddrüsenerkrankungen wegen Goitrogenen in Maßen.",
     "Very nutrient-rich. Moderate intake with thyroid disorders due to goitrogens.",
     False),
    ("brassica-oleracea-gemmifera", "Brassica oleracea var. gemmifera", "Rosenkohl", "Brussels_sprout",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["nutrition", "vitamin_c"], "internal", [10, 11, 12, 1, 2],
     "Sprosse (Spätherbst-Winter)", "sprouts (late autumn-winter)",
     "Frosthart — Geschmack wird durch Frost milder. Bei empfindlichem Darm Blähungen möglich.",
     "Frost-hardy — flavour mellows with frost. May cause bloating in sensitive digestive systems.",
     False),
    ("brassica-oleracea-gongylodes", "Brassica oleracea var. gongylodes", "Kohlrabi", "Kohlrabi",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["nutrition", "vitamin_c"], "internal", [5, 6, 7, 8, 9, 10],
     "Sprossknolle", "swollen stem",
     "Mild und gut verträglich. Junge Blätter ebenfalls essbar.",
     "Mild and well-tolerated. Young leaves are also edible.",
     False),
    ("raphanus-sativus-sativus", "Raphanus sativus var. sativus", "Radieschen", "Radish",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["digestion"], "internal", [4, 5, 6, 7, 8, 9, 10],
     "Knolle (frisch)", "root (fresh)",
     "Senfölhaltig — bei Magen-Darm-Geschwüren in Maßen.",
     "Contains mustard oils — moderate intake with gastrointestinal ulcers.",
     False),
    ("raphanus-sativus-niger", "Raphanus sativus var. niger", "Rettich", "Black_Spanish_radish",
     "Kreuzblütler", "Cabbage family", "Brassicaceae",
     "raw", ["digestion", "respiratory"], "internal", [9, 10, 11],
     "Knolle (Herbst-Winter)", "root (autumn-winter)",
     "Klassisch bei Husten und Gallenbeschwerden. Bei Gallensteinen Arzt befragen.",
     "Classically used for cough and biliary complaints. Consult a physician with gallstones.",
     False),

    # Apiaceae
    ("daucus-carota-sativus", "Daucus carota subsp. sativus", "Karotte", "Carrot",
     "Doldenblütler", "Carrot family", "Apiaceae",
     "raw", ["vision", "nutrition"], "internal", [6, 7, 8, 9, 10, 11],
     "Wurzel (Sommer-Herbst)", "root (summer-autumn)",
     "Sehr gut verträglich. Im Übermaß kann Carotinämie (orange Haut) entstehen — harmlos.",
     "Very well-tolerated. Excess intake may cause carotinemia (orange skin) — harmless.",
     False),
    ("pastinaca-sativa", "Pastinaca sativa", "Pastinak", "Parsnip",
     "Doldenblütler", "Carrot family", "Apiaceae",
     "raw", ["digestion", "nutrition"], "internal", [10, 11, 12, 1, 2],
     "Wurzel (Spätherbst-Winter)", "root (late autumn-winter)",
     "Frosthart und süßer nach Frost. Saft enthält photosensibilisierende Furocumarine — Hautkontakt mit Saft + Sonne meiden.",
     "Frost-hardy and sweeter after frost. Sap contains photosensitising furocoumarins — avoid sap on skin in sunlight.",
     False),
    ("apium-graveolens-rapaceum", "Apium graveolens var. rapaceum", "Knollensellerie", "Celeriac",
     "Doldenblütler", "Carrot family", "Apiaceae",
     "raw", ["digestion"], "internal", [9, 10, 11],
     "Knolle (Herbst)", "tuber (autumn)",
     "Bei Sellerie-Allergie meiden. Frosthart bis -5 °C.",
     "Avoid in case of celery allergy. Frost-hardy down to -5 °C.",
     False),
    ("petroselinum-crispum-tuberosum", "Petroselinum crispum subsp. tuberosum", "Wurzelpetersilie", "Hamburg_parsley",
     "Doldenblütler", "Carrot family", "Apiaceae",
     "raw", ["digestion"], "internal", [9, 10, 11],
     "Wurzel (Herbst)", "root (autumn)",
     "Während Schwangerschaft in Lebensmittel-Mengen unbedenklich, hohe Dosen vermeiden.",
     "Safe in food quantities during pregnancy, avoid high doses.",
     False),

    # Fabaceae
    ("phaseolus-vulgaris-nanus", "Phaseolus vulgaris var. nanus", "Buschbohne", "Bush_bean",
     "Hülsenfrüchtler", "Bean family", "Fabaceae",
     "raw", ["nutrition", "protein"], "internal", [7, 8, 9, 10],
     "Hülsen und Bohnen", "pods and beans",
     "Rohe Bohnen enthalten giftiges Phasin — IMMER mindestens 10 Minuten kochen.",
     "Raw beans contain toxic phasin — ALWAYS cook for at least 10 minutes.",
     False),
    ("phaseolus-vulgaris-vulgaris", "Phaseolus vulgaris var. vulgaris", "Stangenbohne", "Pole_bean",
     "Hülsenfrüchtler", "Bean family", "Fabaceae",
     "raw", ["nutrition", "protein"], "internal", [7, 8, 9, 10],
     "Hülsen und Bohnen", "pods and beans",
     "Rohe Bohnen enthalten giftiges Phasin — IMMER mindestens 10 Minuten kochen.",
     "Raw beans contain toxic phasin — ALWAYS cook for at least 10 minutes.",
     False),
    ("pisum-sativum-sativum", "Pisum sativum subsp. sativum", "Erbse", "Pea",
     "Hülsenfrüchtler", "Bean family", "Fabaceae",
     "raw", ["nutrition", "protein"], "internal", [6, 7, 8],
     "reife oder grüne Samen", "ripe or green seeds",
     "Junge Erbsen roh essbar, ältere kochen. Bei Hülsenfrüchten-Allergie meiden.",
     "Young peas edible raw, cook older ones. Avoid in case of legume allergy.",
     False),
    ("pisum-sativum-saccharatum", "Pisum sativum convar. saccharatum", "Zuckererbse", "Snap_pea",
     "Hülsenfrüchtler", "Bean family", "Fabaceae",
     "raw", ["nutrition"], "internal", [6, 7, 8],
     "ganze Hülsen (jung)", "whole pods (young)",
     "Mit Hülse essbar — jung ernten, sonst werden Fäden hart.",
     "Edible with pod — harvest young, otherwise fibres become tough.",
     False),

    # Asteraceae
    ("lactuca-sativa-capitata", "Lactuca sativa var. capitata", "Kopfsalat", "Butterhead_lettuce",
     "Korbblütler", "Daisy family", "Asteraceae",
     "raw", ["nutrition", "digestion"], "internal", [5, 6, 7, 8, 9, 10],
     "ganze Köpfe", "whole heads",
     "Sehr gut verträglich. Bei Schießen (Bolting) bitter — junge Blätter ernten.",
     "Very well-tolerated. Bitter when bolting — harvest young leaves.",
     False),
    ("lactuca-sativa-crispa", "Lactuca sativa var. crispa", "Pfl%C3%BCcksalat", "Leaf_lettuce",
     "Korbblütler", "Daisy family", "Asteraceae",
     "raw", ["nutrition", "digestion"], "internal", [5, 6, 7, 8, 9, 10],
     "einzelne Blätter (cut-and-come-again)", "individual leaves (cut-and-come-again)",
     "Cut-and-come-again-Methode: aussere Blätter ernten, Pflanze wächst nach.",
     "Cut-and-come-again method: harvest outer leaves, plant regrows.",
     False),

    # Sonstige
    ("allium-cepa", "Allium cepa", "Speisezwiebel", "Onion",
     "Amaryllisgewächse", "Amaryllis family", "Amaryllidaceae",
     "raw", ["digestion", "respiratory"], "internal", [7, 8, 9],
     "Zwiebel (Sommer)", "bulb (summer)",
     "Klassisch bei Erkältung. Roher Saft reizt Augen.",
     "Classically used for colds. Raw juice irritates eyes.",
     False),
    ("allium-porrum", "Allium porrum", "Porree", "Leek",
     "Amaryllisgewächse", "Amaryllis family", "Amaryllidaceae",
     "raw", ["digestion"], "internal", [9, 10, 11, 12, 1, 2],
     "Schaft (Herbst-Winter)", "shaft (autumn-winter)",
     "Frosthart. Verträglicher als Zwiebel, mild im Geschmack.",
     "Frost-hardy. More digestible than onion, mild flavour.",
     False),
    ("spinacia-oleracea", "Spinacia oleracea", "Spinat", "Spinach",
     "Fuchsschwanzgewächse", "Amaranth family", "Amaranthaceae",
     "raw", ["nutrition", "iron"], "internal", [4, 5, 6, 9, 10, 11],
     "Blätter (Frühling/Herbst)", "leaves (spring/autumn)",
     "Enthält Oxalsäure — bei Nierensteinen in Maßen. Nicht mehrfach aufwärmen.",
     "Contains oxalic acid — moderate intake with kidney stones. Do not reheat multiple times.",
     False),
    ("beta-vulgaris-cicla", "Beta vulgaris subsp. vulgaris var. cicla", "Mangold", "Chard",
     "Fuchsschwanzgewächse", "Amaranth family", "Amaranthaceae",
     "raw", ["nutrition", "iron"], "internal", [6, 7, 8, 9, 10, 11],
     "Blätter und Stiele", "leaves and stems",
     "Enthält Oxalsäure — bei Nierensteinen in Maßen. Mehrfach ernten (cut-and-come-again).",
     "Contains oxalic acid — moderate intake with kidney stones. Multiple harvests possible (cut-and-come-again).",
     False),
    ("beta-vulgaris-conditiva", "Beta vulgaris subsp. vulgaris var. conditiva", "Rote_Bete", "Beetroot",
     "Fuchsschwanzgewächse", "Amaranth family", "Amaranthaceae",
     "raw", ["nutrition", "circulation"], "internal", [7, 8, 9, 10, 11],
     "Knolle (Sommer-Herbst)", "root (summer-autumn)",
     "Färbt Urin und Stuhl rot — harmlos. Enthält Oxalsäure — bei Nierensteinen in Maßen.",
     "Stains urine and stool red — harmless. Contains oxalic acid — moderate intake with kidney stones.",
     False),
    ("cucumis-sativus", "Cucumis sativus", "Gurke", "Cucumber",
     "Kürbisgewächse", "Gourd family", "Cucurbitaceae",
     "raw", ["nutrition", "hydration"], "internal", [7, 8, 9, 10],
     "Frische Früchte", "fresh fruits",
     "Sehr gut verträglich. Wildgurken/sehr bittere Früchte enthalten giftige Cucurbitacine — nicht essen.",
     "Very well-tolerated. Wild cucumbers / very bitter fruits contain toxic cucurbitacins — do not eat.",
     False),
    ("zea-mays", "Zea mays", "Mais", "Maize",
     "Süßgräser", "Grass family", "Poaceae",
     "raw", ["nutrition", "energy"], "internal", [8, 9, 10],
     "reife Kolben (Sommer-Herbst)", "ripe cobs (summer-autumn)",
     "Mais-Bart (Cornsilk) traditionell als harntreibender Tee verwendet.",
     "Corn silk traditionally used as a diuretic tea.",
     False),
    ("cucurbita-pepo-zucchini", "Cucurbita pepo subsp. pepo convar. giromontiina", "Zucchini", "Zucchini",
     "Kürbisgewächse", "Gourd family", "Cucurbitaceae",
     "raw", ["nutrition"], "internal", [6, 7, 8, 9, 10],
     "junge Früchte (Sommer)", "young fruits (summer)",
     "Sehr bittere Früchte enthalten giftige Cucurbitacine — Bitterprobe vor Verzehr, bei Bitterkeit wegwerfen.",
     "Very bitter fruits contain toxic cucurbitacins — taste-test before eating; discard if bitter.",
     False),
]


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def fetch_wikipedia_summary(lang, title):
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
    try:
        return fetch_json(url)
    except Exception as e:
        return {"error": str(e), "lang": lang, "title": title}


def fetch_commons_metadata(filename):
    encoded = urllib.parse.quote(filename)
    url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&format=json"
        f"&titles=File:{encoded}&prop=imageinfo&iiprop=extmetadata|url"
    )
    try:
        return fetch_json(url)
    except Exception as e:
        return {"error": str(e)}


def extract_image_url(summary):
    if "originalimage" in summary:
        return summary["originalimage"]["source"]
    return None


def extract_filename_from_url(url):
    if not url:
        return None
    url = url.split("?")[0]
    fname = url.rsplit("/", 1)[-1]
    return urllib.parse.unquote(fname)


def parse_commons_meta(commons_response):
    pages = commons_response.get("query", {}).get("pages", {})
    for _, page in pages.items():
        ii = page.get("imageinfo", [{}])[0]
        em = ii.get("extmetadata", {})
        artist_raw = em.get("Artist", {}).get("value", "Unknown")
        artist = re.sub("<[^>]+>", "", artist_raw).strip()
        if artist == "Unknown authorUnknown author":
            artist = "Unknown"
        lic = em.get("LicenseShortName", {}).get("value", "Unknown")
        descurl = ii.get("descriptionurl", "")
        return {"author": artist[:120], "license": lic, "url": descurl}
    return {"author": "Unknown", "license": "Unknown", "url": ""}


def first_paragraph(text):
    if not text:
        return ""
    text = text.strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    out = " ".join(sentences[:3])
    if len(out) > 600:
        out = out[:597] + "..."
    return out


def teaser_from_description(desc, max_len=120):
    if not desc:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", desc.strip())
    out = sentences[0] if sentences else ""
    if len(out) > max_len:
        out = out[: max_len - 3] + "..."
    return out


def download_image(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        with open(dest, "wb") as f:
            f.write(r.read())


def process_vegetable(plant_tuple):
    (slug, latin, de_title, en_title, fam_de, fam_en, fam_lat,
     def_form, def_target, def_intext, def_months,
     def_harvest_de, def_harvest_en,
     def_warn_de, def_warn_en, ext_only) = plant_tuple

    out_path = os.path.join(DATA_DIR, f"{slug}.json")
    if os.path.exists(out_path):
        return f"{slug} (skip-existing)"

    de_sum = fetch_wikipedia_summary("de", de_title)
    en_sum = fetch_wikipedia_summary("en", en_title)

    img_url = extract_image_url(de_sum) or extract_image_url(en_sum)
    img_fname = extract_filename_from_url(img_url) if img_url else None

    image_meta = {"author": "Unknown", "license": "Unknown", "url": ""}
    if img_fname:
        try:
            commons = fetch_commons_metadata(img_fname)
            image_meta = parse_commons_meta(commons)
        except Exception:
            pass

    local_img_name = f"{slug}.jpg"
    img_ok = False
    if img_url:
        dest = os.path.join(IMG_DIR, local_img_name)
        try:
            clean_url = img_url.split("?")[0]
            download_image(clean_url, dest)
            img_ok = True
        except Exception as e:
            print(f"  ! image download failed for {slug}: {e}", file=sys.stderr)

    raw_name_de = de_sum.get("displaytitle", de_title) if "error" not in de_sum else de_title
    raw_name_en = en_sum.get("displaytitle", en_title) if "error" not in en_sum else en_title
    name_de = re.sub("<[^>]+>", "", urllib.parse.unquote(raw_name_de))
    name_en = re.sub("<[^>]+>", "", urllib.parse.unquote(raw_name_en))

    extract_de = de_sum.get("extract", "") if "error" not in de_sum else ""
    extract_en = en_sum.get("extract", "") if "error" not in en_sum else ""

    desc_de = first_paragraph(extract_de) or f"Beschreibung für {name_de} folgt — siehe Wikipedia-Artikel."
    desc_en = first_paragraph(extract_en) or f"Description for {name_en} pending — see Wikipedia article."

    teaser_de = teaser_from_description(desc_de) or f"{name_de} — siehe Detailseite."
    teaser_en = teaser_from_description(desc_en) or f"{name_en} — see detail page."

    de_url = de_sum.get("content_urls", {}).get("desktop", {}).get("page",
            f"https://de.wikipedia.org/wiki/{de_title}") if "error" not in de_sum else \
            f"https://de.wikipedia.org/wiki/{de_title}"
    en_url = en_sum.get("content_urls", {}).get("desktop", {}).get("page",
            f"https://en.wikipedia.org/wiki/{en_title}") if "error" not in en_sum else \
            f"https://en.wikipedia.org/wiki/{en_title}"

    plant_json = {
        "slug": slug,
        "names": {"de": name_de, "en": name_en, "latin": latin},
        "family": {"de": fam_de, "en": fam_en, "latin": fam_lat},
        "description": {"de": desc_de, "en": desc_en},
        "teaser": {"de": teaser_de, "en": teaser_en},
        "uses": [{
            "form": def_form,
            "target": def_target,
            "internal_external": def_intext,
            "description": {
                "de": "Klassische Küchen-Verwendung — siehe Wikipedia-Artikel und klassische Garten-Literatur.",
                "en": "Classic culinary use — see Wikipedia article and classical garden literature."
            },
            "source_ids": ["src_1", "src_2"]
        }],
        "season": {
            "active_months": def_months,
            "harvest_part": {"de": def_harvest_de, "en": def_harvest_en}
        },
        "safety": {
            "warnings": {"de": def_warn_de, "en": def_warn_en},
            "external_only": ext_only
        },
        "classical_quotes": [],
        "sources": [
            {"id": "src_1", "type": "wikipedia", "title": f"{name_de} (Wikipedia DE)",
             "url": de_url, "accessed": TODAY},
            {"id": "src_2", "type": "wikipedia", "title": f"{name_en} (Wikipedia EN)",
             "url": en_url, "accessed": TODAY},
        ],
        "image": {
            "filename": local_img_name if img_ok else "placeholder.jpg",
            "alt": {"de": f"Foto von {name_de}", "en": f"Photo of {name_en}"},
            "license": image_meta["license"] or "Unknown",
            "author": image_meta["author"] or "Unknown",
            "source_url": image_meta["url"] or ""
        }
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(plant_json, f, ensure_ascii=False, indent=2)

    return f"{slug} (ok, img={'yes' if img_ok else 'NO'})"


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    print(f"Processing {len(VEGETABLES)} vegetables in parallel (max 4 workers)...")
    results = []
    # 4 workers + per-call timeout = polite to Wikipedia/Commons.
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(process_vegetable, p): p[0] for p in VEGETABLES}
        for fut in as_completed(futures):
            slug = futures[fut]
            try:
                msg = fut.result()
                print(f"  ✓ {msg}")
                results.append((slug, True))
            except Exception as e:
                print(f"  ✗ {slug}: {e}")
                results.append((slug, False))

    ok = sum(1 for _, s in results if s)
    print(f"\nDone: {ok}/{len(VEGETABLES)} succeeded.")


if __name__ == "__main__":
    main()
