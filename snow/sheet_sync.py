#!/usr/bin/env python3
"""Sync the tracker's tables with a Google Sheet (the Apps Script web app in sheets/Code.gs).

    python3 sheet_sync.py pull     # Sheet -> data/*.csv (Sheet wins per value; blanks never erase local values)
    python3 sheet_sync.py push     # data/*.csv -> Sheet (only rows that changed since the last sync)
    python3 sheet_sync.py push --all
    python3 sheet_sync.py status

The Sheet is the source of truth for the daily and hourly data; the CSVs in data/ are a live local copy (backup).
locations.csv and routes.csv stay local config: they are pushed to the 'spots' and 'routes' tabs for reference only.

Config (never commit these): SNOW_SHEET_URL and SNOW_SHEET_TOKEN as environment variables, or the same two
KEY=VALUE lines in a file named .sheet.env next to this script. With --optional, a missing config is not an error.
Standard library only.
"""
import argparse
import csv
import glob
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request

import snowtrack

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
SNAPSHOT = os.path.join(HERE, "cache", "sheet_snapshot.json")
CHUNK = 2500
KEYS = {"daily": ("spot", "date"), "hourly": ("spot", "time"), "spots": ("name",), "routes": ("id",)}


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def config():
    cfg = {"url": os.environ.get("SNOW_SHEET_URL", ""), "token": os.environ.get("SNOW_SHEET_TOKEN", "")}
    path = os.path.join(HERE, ".sheet.env")
    if os.path.exists(path):
        for line in open(path):
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.strip().split("=", 1)
                if k == "SNOW_SHEET_URL" and not cfg["url"]:
                    cfg["url"] = v.strip().strip('"')
                elif k == "SNOW_SHEET_TOKEN" and not cfg["token"]:
                    cfg["token"] = v.strip().strip('"')
    return cfg if cfg["url"] and cfg["token"] else None


def call(cfg, payload, retries=3):
    body = json.dumps(dict(payload, token=cfg["token"])).encode()
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(cfg["url"], data=body, headers={"Content-Type": "text/plain;charset=utf-8"})
            with urllib.request.urlopen(req, timeout=300) as r:      # Apps Script answers POST with a redirect; urllib follows it
                resp = json.loads(r.read())
            if not resp.get("ok"):
                raise RuntimeError(f"Sheet said: {resp.get('error')}")
            return resp
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            last = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Sheet request failed after {retries} tries: {last}")


def norm_cell(v):
    """Comparable text for a cell, so 30 (Sheet number) and '30.0' (CSV text) hash the same."""
    s = "" if v is None else str(v).strip()
    if not s:
        return ""
    try:
        f = float(s)
        if f != f or f in (float("inf"), float("-inf")):
            return s
        return str(int(f)) if f.is_integer() else repr(f)
    except ValueError:
        return s


def row_hash(cols, row):
    return hashlib.sha1("\x1f".join(norm_cell(row.get(c, "")) for c in cols).encode()).hexdigest()[:16]


def key_of(table, row):
    return "|".join(str(row.get(k, "")) for k in KEYS[table])


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def local_tables():
    """-> {table: (columns, [row dict])} from the files on disk."""
    t = {}
    daily, hourly = [], []
    for p in sorted(glob.glob(os.path.join(DATA, "*.csv"))):
        spot = os.path.splitext(os.path.basename(p))[0]
        daily += [dict(r, spot=spot) for r in read_csv(p)]
    for p in sorted(glob.glob(os.path.join(DATA, "hourly", "*.csv"))):
        spot = os.path.splitext(os.path.basename(p))[0]
        hourly += [dict(r, spot=spot) for r in read_csv(p)]
    t["daily"] = (["spot"] + snowtrack.csv_columns(), daily)
    t["hourly"] = (["spot"] + snowtrack.HOURLY_COLS, hourly)
    for name, fn in (("spots", "locations.csv"), ("routes", "routes.csv")):
        p = os.path.join(HERE, fn)
        if os.path.exists(p):
            rows = read_csv(p)
            t[name] = (list(rows[0].keys()) if rows else [], rows)
    return t


def load_snapshot():
    try:
        return json.load(open(SNAPSHOT))
    except (OSError, ValueError):
        return {}


def save_snapshot(snap):
    os.makedirs(os.path.dirname(SNAPSHOT), exist_ok=True)
    json.dump(snap, open(SNAPSHOT, "w"))


def push(cfg, force=False):
    snap, sent = load_snapshot(), {}
    for table, (cols, rows) in local_tables().items():
        seen = snap.setdefault(table, {})
        todo = [r for r in rows if force or seen.get(key_of(table, r)) != row_hash(cols, r)]
        for i in range(0, len(todo), CHUNK):
            chunk = todo[i:i + CHUNK]
            resp = call(cfg, {"action": "upsert", "table": table, "columns": cols,
                              "rows": [[("" if r.get(c) is None else r.get(c)) for c in cols] for r in chunk]})
            for r in chunk:
                seen[key_of(table, r)] = row_hash(cols, r)
            save_snapshot(snap)
            log(f"  {table}: sent {len(chunk)} (added {resp.get('added')}, updated {resp.get('updated')}, sheet total {resp.get('total')})")
        sent[table] = len(todo)
    save_snapshot(snap)
    return sent


def sheet_value(v):
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return "" if v is None else str(v)


def pull(cfg):
    snap, counts = load_snapshot(), {}
    for table, outcols, outdir in (("daily", ["date"] + [c for c in snowtrack.csv_columns() if c != "date"], DATA),
                                   ("hourly", snowtrack.HOURLY_COLS, os.path.join(DATA, "hourly"))):
        resp = call(cfg, {"action": "read", "table": table})
        cols = resp["columns"]
        if not resp["rows"]:
            counts[table] = 0
            continue
        defn = ["spot"] + (snowtrack.csv_columns() if table == "daily" else snowtrack.HOURLY_COLS)
        by_spot, seen = {}, snap.setdefault(table, {})
        for raw in resp["rows"]:
            row = {c: sheet_value(v) for c, v in zip(cols, raw)}
            by_spot.setdefault(row.get("spot", ""), []).append(row)
            seen[key_of(table, row)] = row_hash(defn, row)
        keycol = KEYS[table][1]
        for spot, rows in by_spot.items():
            if not spot:
                continue
            path = os.path.join(outdir, spot + ".csv")
            merged = {r[keycol]: r for r in (read_csv(path) if os.path.exists(path) else [])}
            for r in rows:
                cur = merged.setdefault(r[keycol], {keycol: r[keycol]})
                cur.update({c: v for c, v in r.items() if c != "spot" and v != ""})      # a blank never erases a local value
            os.makedirs(outdir, exist_ok=True)
            tmp = path + ".tmp"
            with open(tmp, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=outcols, extrasaction="ignore", lineterminator="\n")
                w.writeheader()
                for k in sorted(merged):
                    w.writerow(merged[k])
            os.replace(tmp, path)
        counts[table] = sum(len(v) for v in by_spot.values())
    save_snapshot(snap)
    return counts


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["pull", "push", "status"])
    ap.add_argument("--all", action="store_true", help="push every row, not just changed ones")
    ap.add_argument("--optional", action="store_true", help="exit quietly if the Sheet is not configured")
    a = ap.parse_args()
    cfg = config()
    if not cfg:
        if a.optional:
            log("Sheet not configured (set SNOW_SHEET_URL and SNOW_SHEET_TOKEN); skipping.")
            return
        sys.exit("Sheet not configured: set SNOW_SHEET_URL and SNOW_SHEET_TOKEN (or create .sheet.env).")
    if a.command == "pull":
        print("pulled rows:", pull(cfg))
    elif a.command == "push":
        print("pushed rows:", push(cfg, a.all))
    else:
        loc = {t: len(r) for t, (_, r) in local_tables().items()}
        sheet = {t: len(call(cfg, {"action": "read", "table": t})["rows"]) for t in ("daily", "hourly")}
        print("local rows:", loc, "| sheet rows:", sheet)


if __name__ == "__main__":
    main()
