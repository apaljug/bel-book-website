#!/usr/bin/env python3
"""Fetch weather for every spot in locations.csv (uses each spot's elevation to pick stations).

    python3 track_all.py                 # refresh the last 7 days everywhere; spots with no data yet get a year
    python3 track_all.py --new-only      # only spots that have no data/<name>.csv yet
    python3 track_all.py --days 365      # force a longer backfill everywhere
    python3 track_all.py --only NAME     # one spot
Any other arguments (e.g. --radius 80) are passed through to snowtrack.py.
"""
import argparse
import csv
import os
import sys
import traceback

import snowtrack

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--new-only", action="store_true")
    ap.add_argument("--days", type=int)
    ap.add_argument("--only")
    a, passthrough = ap.parse_known_args()
    with open(os.path.join(HERE, "locations.csv"), newline="") as f:
        spots = list(csv.DictReader(f))
    failed = []
    for s in spots:
        if a.only and s["name"] != a.only:
            continue
        has_data = os.path.exists(os.path.join(HERE, "data", s["name"] + ".csv"))
        if a.new_only and has_data:
            continue
        days = a.days or (7 if has_data else 365)
        args = ["--lat", s["lat"], "--lon", s["lon"], "--name", s["name"], "--days", str(days)]
        if s.get("elev_m"):
            args += ["--elev-m", s["elev_m"]]
        print(f"=== {s['name']} ({days} days)", flush=True)
        try:
            snowtrack.main(args + passthrough)
        except Exception as e:
            failed.append(s["name"])
            print(f"FAILED {s['name']}: {e}", file=sys.stderr)
            traceback.print_exc(limit=1)
    if failed:
        print("failed:", ", ".join(failed), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
