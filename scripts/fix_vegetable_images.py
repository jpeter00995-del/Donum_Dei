#!/usr/bin/env python3
# === 1. ZWECK ===
# Repariert die 3 neuen Gemuese-Plant-JSONs, bei denen scrape_vegetables.py
# kein Bild + Lizenz-Metadata bekam (leeres source_url -> Validator-Fehler).
# Idempotent: ueberschreibt nur image-Block.
#
# Run: python3 scripts/fix_vegetable_images.py

import json
import os
import re
import sys
import urllib.parse
import urllib.request

UA = "DonumDei/1.0 (educational; maikelganske913@gmail.com)"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "src", "data", "plants")
IMG_DIR = os.path.join(PROJECT_ROOT, "public", "images", "plants")

# === 2. FIX-MAPPING ===
# slug -> (commons_filename, fallback_wikipedia_lang, fallback_wikipedia_title)
# commons_filename ist der File:-Name auf Commons (ohne "File:" prefix).
FIXES = {
    "allium-porrum": {
        "wiki_lang": "en",
        "wiki_title": "Leek",
    },
    "brassica-oleracea-capitata-rubra": {
        "wiki_lang": "en",
        "wiki_title": "Red_cabbage",
    },
    "daucus-carota-sativus": {
        "wiki_lang": "en",
        "wiki_title": "Carrot",
    },
}


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def fetch_summary(lang, title):
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
    return fetch_json(url)


def commons_meta(filename):
    encoded = urllib.parse.quote(filename)
    url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&format=json"
        f"&titles=File:{encoded}&prop=imageinfo&iiprop=extmetadata|url"
    )
    return fetch_json(url)


def parse_commons(resp):
    pages = resp.get("query", {}).get("pages", {})
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


def download_image(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        with open(dest, "wb") as f:
            f.write(r.read())


def main():
    for slug, cfg in FIXES.items():
        path = os.path.join(DATA_DIR, f"{slug}.json")
        if not os.path.exists(path):
            print(f"  ✗ {slug}: JSON missing")
            continue
        try:
            summary = fetch_summary(cfg["wiki_lang"], cfg["wiki_title"])
            img_src = summary.get("originalimage", {}).get("source")
            if not img_src:
                print(f"  ✗ {slug}: no lead image at {cfg['wiki_lang']}/{cfg['wiki_title']}")
                continue
            # Strip URL parameters
            clean_url = img_src.split("?")[0]
            filename = urllib.parse.unquote(clean_url.rsplit("/", 1)[-1])
            # When URL contains /thumb/, the actual file is one level up;
            # commons API only knows the original filename.
            if "/thumb/" in clean_url:
                # Pattern: .../commons/thumb/X/YY/<file>/<size>-<file> -> <file>
                # Take the path segment that contains the original file basename.
                parts = clean_url.split("/")
                thumb_idx = parts.index("thumb")
                # original filename is the segment after the X/YY hash dirs
                if len(parts) > thumb_idx + 4:
                    filename = urllib.parse.unquote(parts[thumb_idx + 3])
            meta = parse_commons(commons_meta(filename))
            local_img = f"{slug}.jpg"
            dest = os.path.join(IMG_DIR, local_img)
            try:
                download_image(clean_url, dest)
            except Exception as e:
                print(f"  ! download warn for {slug}: {e}")

            with open(path, "r", encoding="utf-8") as f:
                plant = json.load(f)
            plant["image"]["filename"] = local_img
            plant["image"]["license"] = meta["license"] or "Unknown"
            plant["image"]["author"] = meta["author"] or "Unknown"
            plant["image"]["source_url"] = meta["url"] or f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(filename)}"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(plant, f, ensure_ascii=False, indent=2)
                f.write("\n")
            print(f"  ✓ {slug}: lic={plant['image']['license']} author={plant['image']['author'][:40]} url={plant['image']['source_url'][:60]}")
        except Exception as e:
            print(f"  ✗ {slug}: {e}")


if __name__ == "__main__":
    main()
