#!/bin/sh
# Sheet-backed run: pull from the Google Sheet, fetch fresh NOAA data, push changes back, rebuild the page.
# If the Sheet isn't configured (no SNOW_SHEET_URL / SNOW_SHEET_TOKEN), the pull and push steps are skipped and this
# behaves like the old local-only run. Set OUT=index.html to name the page (the website build does this).
# Usage: ./sync_run.sh [track_all.py args]
cd "$(dirname "$0")" || exit 1
status=0
python3 sheet_sync.py pull --optional || status=1
python3 track_all.py "$@" || status=1
python3 sheet_sync.py push --optional || status=1
if [ -n "$OUT" ]; then python3 build_report.py --out "$OUT" || status=1; else python3 build_report.py || status=1; fi
exit $status
