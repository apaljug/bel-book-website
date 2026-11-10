#!/usr/bin/env python3
"""Build report.html (one tab per location) from data/*.csv + locations.csv.

    python3 build_report.py            # writes report.html next to this script
    python3 build_report.py --open     # ...and opens it in the default browser

The page is a single self-contained file (no network needed to view it).
"""
import argparse
import csv
import json
import math
import os
import subprocess
import sys
from datetime import datetime

import snowmodel

HERE = os.path.dirname(os.path.abspath(__file__))
SAN_DIEGO = (32.7157, -117.1611)
STATE_NAMES = {"CA": "California", "CO": "Colorado", "WY": "Wyoming", "ID": "Idaho", "": "Other"}


def miles_between(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(x))


def load_spot(here, name):
    path = os.path.join(here, "data", name + ".csv")
    if not os.path.exists(path):
        return None
    with open(path, newline="") as g:
        days = snowmodel.load_days(list(csv.DictReader(g)))
    hourly = []
    hpath = os.path.join(here, "data", "hourly", name + ".csv")
    if os.path.exists(hpath):
        with open(hpath, newline="") as g:
            hourly = snowmodel.load_hourly(list(csv.DictReader(g)))
    return (days, snowmodel.run(days), hourly) if days else None


def build(here=HERE, out_path=None):
    """Places = hand-added spots in locations.csv (original site). Routes = routes.csv entries with a base + summit spot."""
    with open(os.path.join(here, "locations.csv"), newline="") as f:
        loc_rows = list(csv.DictReader(f))
    spots, places = {}, []
    for loc in loc_rows:
        got = load_spot(here, loc["name"])
        if not got:
            print(f"skip {loc['name']}: no data/{loc['name']}.csv yet (run track_all.py)", file=sys.stderr)
            continue
        days, summary, hourly = got
        elev = loc.get("elev_m") or ""
        spots[loc["name"]] = {
            "name": loc["name"], "label": loc["name"].replace("_", " ").title(), "note": loc.get("note", ""),
            "lat": float(loc["lat"]), "lon": float(loc["lon"]), "elev_ft": round(float(elev) * 3.28084) if elev else None,
            "days": days, "summary": summary, "hourly": hourly}
        if not loc.get("route"):
            places.append(spots[loc["name"]])

    routes = []
    routes_csv = os.path.join(here, "routes.csv")
    if os.path.exists(routes_csv):
        with open(routes_csv, newline="") as f:
            for r in csv.DictReader(f):
                if r["include"].lower() != "yes" or r["status"] != "ok":
                    continue
                if r["base_spot"] not in spots or r["top_spot"] not in spots:
                    print(f"skip route {r['id']}: spot data missing", file=sys.stderr)
                    continue
                state = r.get("state", "")
                routes.append({
                    "id": r["id"], "name": r["name"], "date": r["date"], "source": r["source"],
                    "state": state, "zone": r.get("zone", ""),
                    "group": "California (south to north from San Diego)" if state == "CA" else STATE_NAMES.get(state, state or "Other"),
                    "distance_km": float(r["distance_km"]) if r["distance_km"] else None,
                    "gain_m": float(r["gain_m"]) if r["gain_m"] else None,
                    "span_km": float(r["span_km"]) if r["span_km"] else None,
                    "base": r["base_spot"], "top": r["top_spot"]})
    # California first, south to north; every other state after it, nearest to San Diego first
    def route_order(r):
        b = spots[r["base"]]
        if r["state"] == "CA":
            return (0, b["lat"], 0.0)
        return (1, miles_between(SAN_DIEGO, (b["lat"], b["lon"])), b["lat"])
    routes.sort(key=route_order)
    if not places and not routes:
        sys.exit("no location data found; run run_all.sh first")
    used = {n for r in routes for n in (r["base"], r["top"])}
    payload = {"generated": datetime.now().strftime("%b %-d, %Y %-I:%M %p"), "locations": places, "routes": routes,
               "spots": {n: spots[n] for n in used}}
    with open(os.path.join(here, "report_template.html")) as f:
        html = f.read()
    blob = json.dumps(payload, separators=(",", ":")).replace("</", "<\\/")
    out = out_path or os.path.join(here, "report.html")
    with open(out, "w") as f:
        f.write(html.replace("/*__DATA__*/null", blob, 1))
    return out, places, routes, spots


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--open", action="store_true", help="open the report in the default browser")
    ap.add_argument("--out", help="write the page here instead of report.html (e.g. index.html for a website)")
    a = ap.parse_args()
    out, places, routes, spots = build(out_path=os.path.abspath(a.out) if a.out else None)
    print(f"{len(places)} place(s), {len(routes)} route(s)")
    for l in places:
        s = l["summary"]
        print(f"  {l['label']:<18} est {s['now']:>5.1f} in  ({s['mode']}, last measured {s['last_obs_date']}, k={s['k']}{'' if s['k_fitted'] else ' default'})")
    for r in routes:
        t, b = spots[r["top"]]["summary"], spots[r["base"]]["summary"]
        print(f"  {r['name'][:40]:<40} summit {t['now']:>5.1f} in | base {b['now']:>5.1f} in")
    print("wrote", out)
    if a.open:
        subprocess.run(["open", out])


if __name__ == "__main__":
    main()
