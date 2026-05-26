#!/usr/bin/env python3
"""Re-fetch BG occurrences for plants with 0 results (likely rate-limited)."""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

UA = "DonumDei/0.4 (educational, personal use; maikelganske913@gmail.com)"
TODAY = "2026-05-17"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OCC_DIR = os.path.join(PROJECT_ROOT, "src", "data", "occurrences")


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def fetch_bg(taxon_key):
    params = {
        "taxonKey": str(taxon_key),
        "country": "BG",
        "hasCoordinate": "true",
        "hasGeospatialIssue": "false",
        "limit": "300",
    }
    qs = "&".join(f"{k}={urllib.parse.quote(v)}" for k, v in params.items())
    url = f"https://api.gbif.org/v1/occurrence/search?{qs}"
    d = fetch_json(url)
    pts = []
    for r in d.get("results", []):
        lat = r.get("decimalLatitude")
        lng = r.get("decimalLongitude")
        if lat is not None and lng is not None:
            pts.append({"lat": round(lat, 4), "lng": round(lng, 4), "year": r.get("year")})
    return pts, d.get("count", 0)


def main():
    files = sorted(
        os.path.join(OCC_DIR, f)
        for f in os.listdir(OCC_DIR)
        if f.endswith(".json")
    )
    # Plants needing retry: those with 0 BG points OR no bulgaria_points field
    retry = []
    for path in files:
        with open(path) as f:
            d = json.load(f)
        bg = d.get("bulgaria_points", None)
        if bg is None or len(bg) == 0:
            retry.append(path)

    print(f"Retrying {len(retry)} plants (sequential, 0.5s delay)...")
    fixed = 0
    for path in retry:
        with open(path) as f:
            d = json.load(f)
        slug = d["slug"]
        taxon = d.get("taxon_key")
        if not taxon:
            print(f"  - {slug}: no taxon_key")
            continue
        try:
            pts, total = fetch_bg(taxon)
            d["bulgaria_points"] = pts
            d["bulgaria_total_count"] = total
            d["bulgaria_accessed"] = TODAY
            with open(path, "w") as f:
                json.dump(d, f, ensure_ascii=False, indent=2)
            marker = "✓" if len(pts) > 0 else "·"
            print(f"  {marker} {slug}: {len(pts)} BG points")
            if len(pts) > 0:
                fixed += 1
        except Exception as e:
            print(f"  ✗ {slug}: {e}")
        time.sleep(0.5)

    print(f"\nFixed {fixed} plants with BG data on retry.")


if __name__ == "__main__":
    main()
