"""Simple, transparent snow-depth model for the report.

depth[t] = max(0, depth[t-1] + new_snow[t] - K * degree_days[t])

  new_snow     observed snowfall (in); a missing report counts as 0 and is flagged
  degree_days  max(0, mean(high, low) - 32F), the usual temperature-index melt driver
  K            inches of depth lost per degree-day. Fitted per location from days with
               measured depth and no snowfall; falls back to DEFAULT_K without enough days.

Any day with a measured depth resets the state to the measurement, so the estimate only
ever covers the days NOAA hasn't published yet (GHCN lags ~4 days). It does not know about
snow that fell on days without a snowfall report, and it ignores wind redistribution,
elevation differences between the gauge and the spot, rain, and sublimation.
"""
import math
import re
from datetime import date, timedelta

LAPSE_F_PER_1000FT = 3.5   # standard-atmosphere cooling with height, used to move station temps to the spot's elevation
DEFAULT_K = 0.15
K_MIN, K_MAX = 0.02, 0.5
MIN_FIT_DAYS = 10
FREEZING_F = 32.0


def num(x):
    if x is None or x == "":
        return None
    return float(x)


def station_offset_ft(src):
    """'GHCND:X (3.1mi, +120ft)' -> 120.0 (station elevation minus the spot's), or None."""
    m = re.search(r"([+-][\d,]+)ft\)", src or "")
    return float(m.group(1).replace(",", "")) if m else None


def load_days(rows):
    """CSV dict rows -> one dict per calendar day (gaps filled with empty days)."""
    by = {r["date"]: r for r in rows}
    if not by:
        return []
    first, last = date.fromisoformat(min(by)), date.fromisoformat(max(by))
    days = []
    d = first
    while d <= last:
        r = by.get(d.isoformat(), {})
        hi, lo = num(r.get("temp_high_f")), num(r.get("temp_low_f"))
        hi_raw, lo_raw, adj = hi, lo, 0.0
        off = station_offset_ft(r.get("temp_high_source"))
        if off is not None:                      # station above the spot reads colder than the spot
            adj = round(LAPSE_F_PER_1000FT * off / 1000, 1)
            hi = None if hi is None else hi + adj
            lo = None if lo is None else lo + adj
        days.append({
            "d": d.isoformat(),
            "hi": hi, "lo": lo, "hi_raw": hi_raw, "lo_raw": lo_raw, "t_adj": adj,
            "snow": num(r.get("snowfall_in")),
            "depth": num(r.get("snow_depth_in")),
            "precip": num(r.get("precip_in")),
            "wavg": num(r.get("wind_avg_mph")),
            "wpk": num(r.get("wind_peak_mph")),
            "src": {k[:-7]: r[k] for k in r if k.endswith("_source") and r[k]},
        })
        d += timedelta(days=1)
    return days


def load_hourly(rows, keep_hours=168):
    """data/hourly CSV rows -> one dict per hour (gaps left empty), temps moved to the spot's elevation."""
    from datetime import datetime
    by = {}
    for r in rows:
        temp, off = num(r.get("temp_f")), station_offset_ft(r.get("temp_source"))
        adj = round(LAPSE_F_PER_1000FT * off / 1000, 1) if off is not None else 0.0
        by[r["time"]] = {"t": r["time"], "temp": None if temp is None else round(temp + adj, 1), "temp_raw": temp,
                         "wind": num(r.get("wind_mph")), "gust": num(r.get("gust_mph")),
                         "tsrc": r.get("temp_source", ""), "wsrc": r.get("wind_source", "")}
    if not by:
        return []
    fmt = "%Y-%m-%dT%H:00"
    t, end = datetime.strptime(min(by), fmt), datetime.strptime(max(by), fmt)
    out = []
    while t <= end:
        k = t.strftime(fmt)
        out.append(by.get(k) or {"t": k, "temp": None, "temp_raw": None, "wind": None, "gust": None, "tsrc": "", "wsrc": ""})
        t += timedelta(hours=1)
    return out[-keep_hours:]


def degree_days(day):
    if day["hi"] is None or day["lo"] is None:
        return None
    return max(0.0, (day["hi"] + day["lo"]) / 2 - FREEZING_F)


def step(prev_depth, day, k):
    return max(0.0, prev_depth + (day["snow"] or 0.0) - k * (degree_days(day) or 0.0))


def fit_k(days):
    """Least-squares melt rate through the origin, from consecutive measured, snow-free, thawing days."""
    num_, den, n = 0.0, 0.0, 0
    for prev, cur in zip(days, days[1:]):
        dd = degree_days(cur)
        if (prev["depth"] is None or cur["depth"] is None or prev["depth"] < 0.5
                or cur["snow"] is None or cur["snow"] > 0 or not dd):
            continue
        num_ += (prev["depth"] - cur["depth"]) * dd
        den += dd * dd
        n += 1
    if n >= MIN_FIT_DAYS and den > 0:
        return min(K_MAX, max(K_MIN, num_ / den)), n
    return DEFAULT_K, n


def hindcast(days, k):
    """One-day-ahead error vs. 'tomorrow = today' on days where snow was on the ground."""
    model_err, naive_err = [], []
    for prev, cur in zip(days, days[1:]):
        if prev["depth"] is None or cur["depth"] is None or (prev["depth"] == 0 and cur["depth"] == 0):
            continue
        model_err.append(abs(step(prev["depth"], cur, k) - cur["depth"]))
        naive_err.append(abs(prev["depth"] - cur["depth"]))
    if not model_err:
        return None
    return {"n": len(model_err), "mae": sum(model_err) / len(model_err), "naive_mae": sum(naive_err) / len(naive_err)}


def run(days):
    """Annotate days with est / lo_b / hi_b / kind; return the summary dict."""
    k, k_n = fit_k(days)
    score = hindcast(days, k)
    has_gauge = any(d["depth"] is not None for d in days)
    state, last_obs_i = 0.0, None
    unknown_snow_since_obs = 0
    cold_unknown = 0
    for i, d in enumerate(days):
        if d["depth"] is not None:
            state, last_obs_i = d["depth"], i
            unknown_snow_since_obs = cold_unknown = 0
            d.update(est=state, lo_b=state, hi_b=state, kind="observed")
            continue
        state = step(state, d, k)
        if d["snow"] is None:
            unknown_snow_since_obs += 1
            tmean = None if d["hi"] is None or d["lo"] is None else (d["hi"] + d["lo"]) / 2
            if tmean is not None and tmean <= 34:
                cold_unknown += 1
        since = i - last_obs_i if last_obs_i is not None else i + 1
        err = max(1.0, (score["mae"] if score else 1.0)) * math.sqrt(since)
        d.update(est=round(state, 1), lo_b=round(max(0.0, state - err), 1), hi_b=round(state + err, 1),
                 kind="estimated" if has_gauge else "accumulated")
    last = days[-1] if days else None
    obs = [d for d in days if d["depth"] is not None]
    return {
        "mode": "gauge" if has_gauge else "accumulation",
        "now": last["est"] if last else None,
        "now_lo": last["lo_b"] if last else None,
        "now_hi": last["hi_b"] if last else None,
        "last_obs_date": obs[-1]["d"] if obs else None,
        "last_obs_depth": obs[-1]["depth"] if obs else None,
        "last_obs_src": obs[-1]["src"].get("snow_depth") if obs else None,
        "days_since_obs": (len(days) - 1 - last_obs_i) if last_obs_i is not None else None,
        "unknown_snow_days": unknown_snow_since_obs,
        "cold_unknown_days": cold_unknown,
        "k": round(k, 3), "k_days": k_n, "k_fitted": k_n >= MIN_FIT_DAYS,
        "score": score,
    }
