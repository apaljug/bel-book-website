#!/usr/bin/env python3
"""Log daily snow, temperature and wind for a coordinate from NOAA stations.

Sources (both straight from NOAA):
  * NWS observations API (api.weather.gov): near-real-time station obs, ~7 days
    of history. Used to fill temperature and wind for the most recent days.
  * NCEI GHCN-Daily (ncei.noaa.gov): official daily summaries including snowfall
    and snow depth. Lags by a few days, so recent days are re-fetched each run
    and these values replace the provisional NWS ones.

For every variable the nearest station that actually reports it is used, and
that station + distance is written next to the value. Missing data is left
blank, never zero-filled. Standard-library only.

Example:
    python3 snowtrack.py --lat 39.6403 --lon -106.3742 --name vail
"""
import argparse
import csv
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(HERE, "cache")
USER_AGENT = os.environ.get("SNOWTRACK_UA", "snow-tracker (personal use)")

NWS = "https://api.weather.gov"
NCEI_BASE = "https://www.ncei.noaa.gov"
GHCN_STATIONS = NCEI_BASE + "/pub/data/ghcn/daily/ghcnd-stations.txt"
GHCN_INVENTORY = NCEI_BASE + "/pub/data/ghcn/daily/ghcnd-inventory.txt"
GHCN_DATA = NCEI_BASE + "/access/services/data/v1"

# CSV variable -> GHCN-Daily element (units=standard: F, inches, mph)
GHCN_ELEMENTS = {
    "temp_high_f": "TMAX",
    "temp_low_f": "TMIN",
    "snowfall_in": "SNOW",
    "snow_depth_in": "SNWD",
    "wind_avg_mph": "AWND",
    "wind_peak_mph": "WSF2",
    "precip_in": "PRCP",
}
# Variables that can be filled from NWS observations when GHCN has no value yet
NWS_FILLABLE = ("temp_high_f", "temp_low_f", "wind_avg_mph", "wind_peak_mph")
VARIABLES = list(GHCN_ELEMENTS)
MIN_OBS_PER_DAY = 8  # don't trust an NWS daily high/low built from fewer obs


# ---------------------------------------------------------------- http utils
def log(msg):
    print(msg, file=sys.stderr, flush=True)


def http_get(url, retries=3, timeout=60):
    last = None
    for attempt in range(retries):
        log(f"  GET {url[:110]}" + (f" (retry {attempt})" if attempt else ""))
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/geo+json, */*"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code not in (429, 500, 502, 503, 504):
                raise
        except urllib.error.URLError as e:
            last = e
        time.sleep(2 ** attempt)
    raise RuntimeError(f"GET failed after {retries} tries: {url}: {last}")


def get_json(url):
    return json.loads(http_get(url))


def cached_download(url, name, max_age_days=30):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = os.path.join(CACHE_DIR, name)
    if os.path.exists(path) and time.time() - os.path.getmtime(path) < max_age_days * 86400:
        return path
    tmp = path + ".part"
    log(f"  downloading {name} (one-time, cached for {max_age_days} days)...")
    last = None
    for attempt in range(3):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            # timeout is per socket operation, so a stalled server fails in 30s instead of hanging
            with urllib.request.urlopen(req, timeout=30) as resp, open(tmp, "wb") as f:
                total = int(resp.headers.get("Content-Length") or 0)
                got = 0
                while chunk := resp.read(1 << 20):
                    f.write(chunk)
                    got += len(chunk)
                    log(f"    {got / 1e6:.0f}/{total / 1e6:.0f} MB" if total else f"    {got / 1e6:.0f} MB")
            break
        except Exception as e:
            last = e
            log(f"  download attempt {attempt + 1} failed: {e}")
            time.sleep(2 ** attempt)
    else:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise RuntimeError(f"download of {url} failed: {last}") from last
    log(f"  saved {name}: {os.path.getsize(tmp) / 1e6:.1f} MB")
    os.replace(tmp, path)
    return path


def miles_between(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(a))


FT_PER_M = 3.28084
ELEV_FT_PER_MILE = 300   # ranking rule of thumb: 1 mile away counts the same as 300 ft of elevation difference


def rank_score(dist_mi, station_elev_m, spot_elev_m):
    """Lower is better. Plain distance unless both elevations are known."""
    if station_elev_m is None or spot_elev_m is None:
        return dist_mi
    return dist_mi + abs(station_elev_m - spot_elev_m) * FT_PER_M / ELEV_FT_PER_MILE


def where(dist_mi, station_elev_m, spot_elev_m):
    """'3.1mi' or '3.1mi, +120ft' (station elevation minus the spot's)."""
    if station_elev_m is None or spot_elev_m is None:
        return f"{dist_mi:.1f}mi"
    return f"{dist_mi:.1f}mi, {(station_elev_m - spot_elev_m) * FT_PER_M:+,.0f}ft"


# ------------------------------------------------------------------- GHCN-D
def find_ghcn_stations(lat, lon, radius_mi, max_stations, elev_m=None):
    """Nearest GHCN-Daily stations still active this year, with the elements each reports."""
    stations = {}
    with open(cached_download(GHCN_STATIONS, "ghcnd-stations.txt")) as f:
        for line in f:
            slat, slon = float(line[12:20]), float(line[21:30])
            if abs(slat - lat) > radius_mi / 50 + 1:  # cheap prefilter (~69 mi/deg lat)
                continue
            d = miles_between(lat, lon, slat, slon)
            if d <= radius_mi:
                try:
                    selev = float(line[31:37])
                except ValueError:
                    selev = -999.9
                selev = None if selev <= -999 else selev
                stations[line[0:11]] = {"id": line[0:11], "name": line[41:71].strip(), "dist": d, "elev_m": selev,
                                        "score": rank_score(d, selev, elev_m), "elements": set()}
    this_year = date.today().year
    with open(cached_download(GHCN_INVENTORY, "ghcnd-inventory.txt")) as f:
        for line in f:
            sid = line[0:11]
            if sid in stations and int(line[41:45]) >= this_year - 1:
                stations[sid]["elements"].add(line[31:35].strip())
    wanted = set(GHCN_ELEMENTS.values())
    active = [s for s in stations.values() if s["elements"] & wanted]
    active.sort(key=lambda s: s["score"])
    # Keep nearest stations overall plus nearest few that report snow, so a snow
    # gauge slightly farther away isn't crowded out by temperature-only stations.
    keep = {s["id"]: s for s in active[:max_stations]}
    for s in [s for s in active if s["elements"] & {"SNOW", "SNWD"}][:max_stations]:
        keep[s["id"]] = s
    return sorted(keep.values(), key=lambda s: s["score"])


def fetch_ghcn(stations, start, end, elev_m=None):
    """-> {date_str: {var: (value, 'GHCND:ID (x.xmi)')}} choosing nearest station per variable."""
    if not stations:
        return {}
    q = urllib.parse.urlencode({
        "dataset": "daily-summaries",
        "stations": ",".join(s["id"] for s in stations),
        "dataTypes": ",".join(GHCN_ELEMENTS.values()),
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "units": "standard",
        "format": "json",
    })
    raw = http_get(GHCN_DATA + "?" + q)
    rows = json.loads(raw) if raw.strip() else []
    return merge_ghcn_rows(rows, stations, elev_m)


def merge_ghcn_rows(rows, stations, elev_m=None):
    info = {s["id"]: s for s in stations}
    best = {}  # (date, var) -> (dist, value, src)
    for r in rows:
        sid = r.get("STATION")
        if sid not in info:
            continue
        for var, element in GHCN_ELEMENTS.items():
            v = r.get(element)
            if v in (None, ""):
                continue
            try:
                v = float(v)
            except ValueError:
                continue
            key = (r["DATE"], var)
            st = info[sid]
            score = rank_score(st["dist"], st.get("elev_m"), elev_m)
            if key not in best or score < best[key][0]:
                best[key] = (score, v, f"GHCND:{sid} ({where(st['dist'], st.get('elev_m'), elev_m)})")
    out = {}
    for (d, var), (_, v, src) in best.items():
        out.setdefault(d, {})[var] = (v, src)
    return out


# ---------------------------------------------------------------------- NWS
def nws_context(lat, lon, n_stations, elev_m=None):
    pt = get_json(f"{NWS}/points/{lat:.4f},{lon:.4f}")["properties"]
    limit = max(n_stations, 15) if elev_m is not None else n_stations   # look wider so a better-elevation station can win
    stns = get_json(pt["observationStations"] + f"?limit={limit}")["features"]
    out = []
    for f in stns:
        slon, slat = f["geometry"]["coordinates"][:2]
        selev = ((f["properties"].get("elevation") or {}).get("value"))
        d = miles_between(lat, lon, slat, slon)
        out.append({"id": f["properties"]["stationIdentifier"], "dist": d, "elev_m": selev,
                    "score": rank_score(d, selev, elev_m), "label": where(d, selev, elev_m)})
    out.sort(key=lambda s: s["score"])
    return pt["timeZone"], out[:n_stations]


def fetch_nws_obs(station_id, start_utc, end_utc):
    q = urllib.parse.urlencode({"start": start_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                "end": end_utc.strftime("%Y-%m-%dT%H:%M:%SZ"), "limit": 500})
    url = f"{NWS}/stations/{station_id}/observations?{q}"
    obs = []
    for _ in range(10):  # follow pagination
        data = get_json(url)
        obs.extend(f["properties"] for f in data.get("features", []))
        url = (data.get("pagination") or {}).get("next")
        if not url:
            break
    return obs


def _val(prop, key):
    v = (prop.get(key) or {}).get("value")
    return None if v is None else float(v)


def summarize_nws(obs, tz, station_id, label):
    """Obs list -> {date_str: {var: (value, src)}} (local calendar days)."""
    days = {}
    for o in obs:
        ts = datetime.fromisoformat(o["timestamp"].replace("Z", "+00:00")).astimezone(tz)
        d = days.setdefault(ts.date().isoformat(), {"t": [], "w": [], "g": []})
        t, w, g = _val(o, "temperature"), _val(o, "windSpeed"), _val(o, "windGust")
        if t is not None:
            d["t"].append(t * 9 / 5 + 32)            # degC -> F
        if w is not None:
            d["w"].append(w * 0.621371)              # km/h -> mph
        if g is not None:
            d["g"].append(g * 0.621371)
    src = f"NWS:{station_id} ({label})"
    out = {}
    for day, d in days.items():
        row = {}
        if len(d["t"]) >= MIN_OBS_PER_DAY:
            row["temp_high_f"] = (round(max(d["t"]), 1), src)
            row["temp_low_f"] = (round(min(d["t"]), 1), src)
        if len(d["w"]) >= MIN_OBS_PER_DAY:
            row["wind_avg_mph"] = (round(sum(d["w"]) / len(d["w"]), 1), src)
            peak = max(d["w"] + d["g"])
            row["wind_peak_mph"] = (round(peak, 1), src)
        if row:
            out[day] = row
    return out


HOURLY_COLS = ["time", "temp_f", "temp_source", "wind_mph", "gust_mph", "wind_source"]
HOURLY_KEEP_DAYS = 30
MIN_HOURS_FOR_STATION = 6   # a station must report at least this many hours to be used for hourly temp or wind


def hourly_from_obs(obs, tz):
    """Obs list -> {local 'YYYY-MM-DDTHH:00': {temp_f, wind_mph, gust_mph}} (mean temp/wind, max gust per hour)."""
    buckets = {}
    for o in obs:
        ts = datetime.fromisoformat(o["timestamp"].replace("Z", "+00:00")).astimezone(tz)
        b = buckets.setdefault(ts.strftime("%Y-%m-%dT%H:00"), {"t": [], "w": [], "g": []})
        t, w, g = _val(o, "temperature"), _val(o, "windSpeed"), _val(o, "windGust")
        if t is not None:
            b["t"].append(t * 9 / 5 + 32)
        if w is not None:
            b["w"].append(w * 0.621371)
        if g is not None:
            b["g"].append(g * 0.621371)
    out = {}
    for hour, b in buckets.items():
        row = {}
        if b["t"]:
            row["temp_f"] = round(sum(b["t"]) / len(b["t"]), 1)
        if b["w"] or b["g"]:
            row["wind_mph"] = round(sum(b["w"]) / len(b["w"]), 1) if b["w"] else None
            row["gust_mph"] = round(max(b["g"] + b["w"]), 1)
        out[hour] = row
    return out


def pick_hourly(per_station):
    """per_station: [(label_src, hourly_dict)] nearest first -> {hour: row}; one station for temp, one for wind."""
    temp = next(((src, h) for src, h in per_station if sum(1 for r in h.values() if "temp_f" in r) >= MIN_HOURS_FOR_STATION), None)
    wind = next(((src, h) for src, h in per_station if sum(1 for r in h.values() if r.get("gust_mph") is not None) >= MIN_HOURS_FOR_STATION), None)
    rows = {}
    if temp:
        for hour, r in temp[1].items():
            if "temp_f" in r:
                rows.setdefault(hour, {})["temp_f"], rows[hour]["temp_source"] = r["temp_f"], temp[0]
    if wind:
        for hour, r in wind[1].items():
            if r.get("gust_mph") is not None:
                d = rows.setdefault(hour, {})
                d["wind_mph"], d["gust_mph"], d["wind_source"] = r.get("wind_mph"), r["gust_mph"], wind[0]
    return rows


def write_hourly(path, rows):
    """Merge new hourly rows into path (keyed by time), keep the last HOURLY_KEEP_DAYS days. -> row count."""
    existing = {}
    if os.path.exists(path):
        with open(path, newline="") as f:
            existing = {r["time"]: r for r in csv.DictReader(f)}
    for hour, r in rows.items():
        cur = existing.setdefault(hour, {"time": hour})
        cur.update({k: ("" if v is None else v) for k, v in r.items()})
    keep = sorted(existing)[-HOURLY_KEEP_DAYS * 24:]
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HOURLY_COLS, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        for k in keep:
            w.writerow(existing[k])
    os.replace(tmp, path)
    return len(keep)


# ------------------------------------------------------------------ CSV I/O
def csv_columns():
    cols = ["date", "location", "lat", "lon"]
    for v in VARIABLES:
        cols += [v, v.rsplit("_", 1)[0] + "_source"]
    return cols + ["updated_utc"]


def source_col(var):
    return var.rsplit("_", 1)[0] + "_source"


def upsert(path, name, lat, lon, new_by_day):
    cols = csv_columns()
    rows = {}
    if os.path.exists(path):
        with open(path, newline="") as f:
            for r in csv.DictReader(f):
                rows[r["date"]] = r
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for day, vals in new_by_day.items():
        r = rows.setdefault(day, {"date": day})
        r.update({"location": name, "lat": lat, "lon": lon})
        for var, (v, src) in vals.items():
            r[var], r[source_col(var)] = v, src   # new non-blank value wins; blanks keep old
        r["updated_utc"] = now
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        for day in sorted(rows):
            w.writerow(rows[day])
    os.replace(tmp, path)
    return len(rows)


# --------------------------------------------------------------------- main
def combine(ghcn, nws_days):
    """GHCN wins; NWS fills only variables GHCN doesn't have for that day."""
    out = {d: dict(v) for d, v in ghcn.items()}
    for day, vals in nws_days.items():
        for var, item in vals.items():
            if var in NWS_FILLABLE:
                out.setdefault(day, {}).setdefault(var, item)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lon", type=float, required=True)
    ap.add_argument("--name", default="spot", help="label written to the CSV")
    ap.add_argument("--out", help="CSV path (default: data/<name>.csv next to this script)")
    ap.add_argument("--days", type=int, default=7, help="how many days back to (re)fetch, default 7")
    ap.add_argument("--radius", type=float, default=50, help="GHCN station search radius in miles, default 50")
    ap.add_argument("--stations", type=int, default=5, help="how many nearby stations per source, default 5")
    ap.add_argument("--elev-m", type=float, help="elevation of the spot in meters; stations at a similar elevation are preferred")
    a = ap.parse_args(argv)
    out_path = a.out or os.path.join(HERE, "data", f"{a.name}.csv")

    tzname, nws_stations = nws_context(a.lat, a.lon, a.stations, a.elev_m)
    tz = ZoneInfo(tzname)
    today = datetime.now(tz).date()
    start = today - timedelta(days=a.days)
    print(f"{a.name}: tz={tzname}, NWS stations: " + ", ".join(f"{s['id']} {s['label']}" for s in nws_stations))

    try:
        ghcn_stations = find_ghcn_stations(a.lat, a.lon, a.radius, a.stations, a.elev_m)
        print("GHCN stations: " + (", ".join(f"{s['id']} {s['name']} {where(s['dist'], s['elev_m'], a.elev_m)}" for s in ghcn_stations) or "none in radius"))
        ghcn = fetch_ghcn(ghcn_stations, start, today, a.elev_m)
    except Exception as e:  # NCEI unreachable: still save the NWS temp/wind data
        log(f"  WARN: GHCN-Daily unavailable, snow and official daily values will be blank this run: {e}")
        ghcn = {}

    end_utc = datetime.now(timezone.utc)
    start_utc = max(end_utc - timedelta(days=a.days + 1), end_utc - timedelta(days=7))  # API keeps ~7 days
    nws_days, hourly = merge_nws_nearest(tz, nws_stations, start_utc, end_utc)

    n = upsert(out_path, a.name, a.lat, a.lon, combine(ghcn, nws_days))
    if hourly:
        hrs = write_hourly(os.path.join(os.path.dirname(os.path.abspath(out_path)), "hourly", os.path.basename(out_path)), hourly)
        print(f"wrote hourly ({hrs} hours kept)")
    print(f"wrote {out_path} ({n} days total)")


def merge_nws_nearest(tz, nws_stations, start_utc, end_utc):
    """-> (daily {date: {var: (value, src)}}, hourly {hour: row}) from the nearest stations that report each thing."""
    out, per_station = {}, []
    for s in nws_stations:                          # nearest first; first value per var wins
        try:
            obs = fetch_nws_obs(s["id"], start_utc, end_utc)
            days = summarize_nws(obs, tz, s["id"], s["label"])
            per_station.append((f"NWS:{s['id']} ({s['label']})", hourly_from_obs(obs, tz)))
        except Exception as e:
            print(f"  warn: NWS {s['id']}: {e}", file=sys.stderr)
            continue
        for day, vals in days.items():
            for var, item in vals.items():
                out.setdefault(day, {}).setdefault(var, item)
    return out, pick_hourly(per_station)


if __name__ == "__main__":
    main()
