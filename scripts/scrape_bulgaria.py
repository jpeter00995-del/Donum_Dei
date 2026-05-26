#!/usr/bin/env python3
"""
Donum Dei — Bulgaria-specific occurrence scraper.

For each plant with an existing occurrence file, fetches Bulgaria-only
(country=BG) GBIF occurrences and merges them into the same JSON as
`bulgaria_points`.
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

UA = "DonumDei/0.4 (educational, personal use; maikelganske913@gmail.com)"
TODAY = "2026-05-16"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OCC_DIR = os.path.join(PROJECT_ROOT, "src", "data", "occurrences")

BG_LIMIT = 300


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def fetch_bg_occurrences(taxon_key):
    params = {
        "taxonKey": str(taxon_key),
        "country": "BG",
        "hasCoordinate": "true",
        "hasGeospatialIssue": "false",
        "limit": str(BG_LIMIT),
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
                "year": r.get("year"),
            })
        return points, d.get("count", 0)
    except Exception as e:
        print(f"  ! BG fetch failed for taxon {taxon_key}: {e}", file=sys.stderr)
        return [], 0


def process_file(occ_path):
    with open(occ_path) as f:
        data = json.load(f)
    slug = data["slug"]
    taxon_key = data.get("taxon_key")
    if not taxon_key:
        return slug, False, 0

    points, total = fetch_bg_occurrences(taxon_key)
    data["bulgaria_points"] = points
    data["bulgaria_total_count"] = total
    data["bulgaria_accessed"] = TODAY

    with open(occ_path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return slug, True, len(points)


def main():
    if not os.path.isdir(OCC_DIR):
        print(f"Occurrences dir not found: {OCC_DIR}", file=sys.stderr)
        sys.exit(1)

    files = sorted(
        os.path.join(OCC_DIR, f)
        for f in os.listdir(OCC_DIR)
        if f.endswith(".json")
    )
    print(f"Processing {len(files)} occurrence files for Bulgaria data...")

    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(process_file, p): p for p in files}
        bg_count_total = 0
        with_data = 0
        for fut in as_completed(futures):
            try:
                slug, ok, n = fut.result()
                if ok:
                    bg_count_total += n
                    if n > 0:
                        with_data += 1
                    print(f"  {'✓' if n > 0 else '·'} {slug}: {n} BG points")
                else:
                    print(f"  - {slug}: no taxon_key, skipped")
            except Exception as e:
                print(f"  ✗ error: {e}")

    print(f"\nDone: {with_data}/{len(files)} plants have BG occurrences. Total {bg_count_total} BG points.")


if __name__ == "__main__":
    main()
