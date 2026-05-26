#!/usr/bin/env python3
"""
Donum Dei v0.3 GBIF occurrence scraper.

For each plant JSON in src/data/plants/:
1. Match Latin name to GBIF taxonKey via species/match API
2. Fetch occurrences (limit 300) bounded to Europe (rough bbox)
3. Write coordinates to src/data/occurrences/<slug>.json

Output schema:
{
  "slug": "...",
  "taxon_key": 12345,
  "taxon_name": "Equisetum arvense",
  "occurrence_count": 250,
  "points": [
    {"lat": 50.1, "lng": 8.6, "country": "DE", "year": 2020},
    ...
  ],
  "source": "GBIF.org occurrence download via API",
  "accessed": "2026-05-16"
}
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

UA = "DonumDei/0.3 (educational, personal use; maikelganske913@gmail.com)"
TODAY = "2026-05-17"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANT_DIR = os.path.join(PROJECT_ROOT, "src", "data", "plants")
OCC_DIR = os.path.join(PROJECT_ROOT, "src", "data", "occurrences")

# Rough Europe bounding box (incl. Iceland, Western Russia, Mediterranean):
# lat: 34..72, lng: -25..50
EUROPE_BBOX = {
    "decimalLatitude": "34,72",
    "decimalLongitude": "-25,50",
}

OCCURRENCE_LIMIT = 300


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def match_taxon(latin):
    url = f"https://api.gbif.org/v1/species/match?name={urllib.parse.quote(latin)}"
    try:
        d = fetch_json(url)
        if d.get("matchType") in ("EXACT", "FUZZY") and "usageKey" in d:
            return d["usageKey"], d.get("scientificName", latin)
        return None, None
    except Exception as e:
        print(f"  ! taxon match failed for {latin}: {e}", file=sys.stderr)
        return None, None


def fetch_occurrences(taxon_key):
    params = {
        "taxonKey": str(taxon_key),
        "hasCoordinate": "true",
        "hasGeospatialIssue": "false",
        "limit": str(OCCURRENCE_LIMIT),
        **EUROPE_BBOX,
    }
    qs = "&".join(f"{k}={urllib.parse.quote(v)}" for k, v in params.items())
    url = f"https://api.gbif.org/v1/occurrence/search?{qs}"
    try:
        d = fetch_json(url)
        results = d.get("results", [])
        points = []
        for r in results:
            lat = r.get("decimalLatitude")
            lng = r.get("decimalLongitude")
            if lat is None or lng is None:
                continue
            points.append({
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "country": r.get("countryCode", ""),
                "year": r.get("year"),
            })
        return points, d.get("count", 0)
    except Exception as e:
        print(f"  ! occurrence fetch failed for taxon {taxon_key}: {e}", file=sys.stderr)
        return [], 0


def process_plant(plant_path):
    with open(plant_path) as f:
        plant = json.load(f)
    slug = plant["slug"]
    latin = plant["names"]["latin"]

    # Skip if occurrences already fetched — preserves bulgaria_points etc.
    out_path = os.path.join(OCC_DIR, f"{slug}.json")
    if os.path.exists(out_path):
        return slug, True

    taxon_key, scientific = match_taxon(latin)
    if not taxon_key:
        print(f"  - {slug}: no GBIF taxon match for '{latin}', skipping")
        return slug, False

    points, total_count = fetch_occurrences(taxon_key)

    output = {
        "slug": slug,
        "taxon_key": taxon_key,
        "taxon_name": scientific,
        "total_count_in_europe": total_count,
        "points_sampled": len(points),
        "points": points,
        "source": "GBIF.org occurrence search API",
        "source_url": f"https://www.gbif.org/species/{taxon_key}",
        "accessed": TODAY,
    }

    with open(out_path, "w") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return slug, True


def main():
    os.makedirs(OCC_DIR, exist_ok=True)
    plant_files = sorted(
        os.path.join(PLANT_DIR, f)
        for f in os.listdir(PLANT_DIR)
        if f.endswith(".json")
    )
    print(f"Processing {len(plant_files)} plants...")

    success = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(process_plant, p): p for p in plant_files}
        for fut in as_completed(futures):
            try:
                slug, ok = fut.result()
                marker = "✓" if ok else "-"
                print(f"  {marker} {slug}")
                if ok:
                    success += 1
            except Exception as e:
                print(f"  ✗ {futures[fut]}: {e}")

    print(f"\nDone: {success}/{len(plant_files)} have GBIF occurrence data.")


if __name__ == "__main__":
    main()
