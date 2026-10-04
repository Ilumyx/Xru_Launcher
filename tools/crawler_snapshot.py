#!/usr/bin/env python3
"""Read-only snapshot of the XRU Crawler state for the UI mockup.

Reads (never writes) XRU_Data/crawler_{image,video}_state + depots and writes
data/crawler_snapshot.js (+ small thumbnails in data/crawler_thumbs/, gitignored).
Does not run the crawler, does not touch any crawler file.

Usage:  python3 tools/crawler_snapshot.py [--data-root PATH] [--no-thumbs]
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import glob
import hashlib
import json
import os
import re
import sqlite3
import subprocess
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "data" / "crawler_snapshot.js"
THUMBS = REPO / "data" / "crawler_thumbs"
LANES = ("image", "video")
LOCAL_TZ = dt.timezone(dt.timedelta(hours=7))
DAYS = 45            # daily chart window
THUMBS_PER_SOURCE = 8
RUNS_KEPT = 24


def source_key(lane: str, adapter: str, locator: str) -> str:
    return f"crawler-{lane}-source-v1:" + hashlib.sha256(f"{adapter}\0{locator}".encode()).hexdigest()


def parse_ts(s: str | None) -> dt.datetime | None:
    if not s:
        return None
    s = s.strip().replace(" ", "T")
    try:
        t = dt.datetime.fromisoformat(s)
    except ValueError:
        return None
    if t.tzinfo is None:          # sqlite datetime('now') is UTC
        t = t.replace(tzinfo=dt.timezone.utc)
    return t.astimezone(LOCAL_TZ)


def iso(t: dt.datetime | None) -> str | None:
    return t.strftime("%Y-%m-%dT%H:%M") if t else None


def err_code(msg: str) -> str:
    m = re.match(r"\s*(ERR_[A-Z_]+)", msg or "")
    if m:
        return m.group(1)
    if "Download failed" in (msg or ""):
        return "DOWNLOAD_FAILED"
    return "UNKNOWN"


def err_short(msg: str) -> str:
    first = (msg or "").strip().splitlines()[0] if msg else ""
    first = re.sub(r"https?://\S+", lambda m: urlparse(m.group(0)).netloc + "/…", first)
    first = re.sub(r"^(ERR_[A-Z_]+): \1: ", r"\1: ", first)
    first = re.sub(r"(: null)+$", "", first)
    m = re.search(r"yt-dlp version \(([\d.]+)\) is older than (\d+) days", msg or "")
    if m:
        first += f" · yt-dlp {m.group(1)} cũ hơn {m.group(2)} ngày"
    return first[:160]


def host(url: str) -> str:
    return urlparse(url).netloc.replace("www.", "").replace("m.facebook.com", "facebook.com")


def thumb(src: Path, out: Path, is_video: bool, duration: float | None) -> bool:
    if out.exists():
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-loglevel", "error", "-y"]
    if is_video:
        cmd += ["-ss", str(min(2.0, max(0.0, (duration or 2) / 3)))]
    cmd += ["-i", str(src), "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "70", str(out)]
    try:
        subprocess.run(cmd, check=True, timeout=60, capture_output=True)
        return out.exists()
    except (subprocess.SubprocessError, OSError):
        return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-root", type=Path, default=REPO.parent / "XRU_Data")
    ap.add_argument("--no-thumbs", action="store_true")
    args = ap.parse_args()
    root: Path = args.data_root
    now = dt.datetime.now(LOCAL_TZ)

    sources: dict[str, dict] = {}            # merged by name
    key_to: dict[str, tuple[str, str]] = {}  # source_key -> (name, lane)
    url_to_key: dict[str, str] = {}          # item url -> source_key
    days = collections.defaultdict(lambda: {"image": 0, "video": 0})
    totals = collections.Counter()
    latest_assets: dict[tuple[str, str], list] = collections.defaultdict(list)

    for lane in LANES:
        state = root / f"crawler_{lane}_state"
        depot = root / f"crawler_{lane}_depot"
        reg = json.loads((state / "source_registry.json").read_text())["sources"]
        for s in reg:
            k = source_key(lane, s["adapter"], s["locator"])
            key_to[k] = (s["name"], lane)
            m = sources.setdefault(s["name"], {"name": s["name"], "adapter": s["adapter"], "lanes": {}})
            m["lanes"][lane] = {
                "locator": s["locator"], "host": host(s["locator"]), "active": bool(s.get("active")),
                "tier": s.get("tier"), "description": (s.get("description") or "").strip(),
                "po_note": s.get("po_note"), "blocked_at": s.get("blocked_at"),
                "review_after": s.get("review_after"), "blocked_reason": s.get("blocked_reason"),
                "assets": 0, "bytes": 0, "first": None, "last": None, "pending": 0, "retired": 0,
                "days": collections.Counter(),
            }

        db = sqlite3.connect(f"file:{state / f'crawler_{lane}_assets.db'}?mode=ro", uri=True)
        published = {(k, u) for k, u in db.execute("select source_key, source_url from published_sources")}
        cols = [r[1] for r in db.execute("pragma table_info(source_inventory)")]
        has_retired = "retired_at" in cols
        q = "select source_key, source_url" + (", retired_at" if has_retired else ", null") + " from source_inventory"
        for k, u, retired in db.execute(q):
            url_to_key[u] = k
            if k not in key_to:
                continue
            L = sources[key_to[k][0]]["lanes"][lane]
            if retired:
                L["retired"] += 1
            elif (k, u) not in published:
                L["pending"] += 1
        for k, u in published:
            url_to_key.setdefault(u, k)

        for xru_id, k, u, path, pub in db.execute(
                "select xru_id, source_key, source_url, published_path, published_at from assets"):
            t = parse_ts(pub)
            f = depot / path
            size = f.stat().st_size if f.exists() else 0
            totals[f"{lane}_assets"] += 1
            totals[f"{lane}_bytes"] += size
            if t:
                days[t.date().isoformat()][lane] += 1
            if k not in key_to:
                totals[f"{lane}_orphans"] += 1
                continue
            name = key_to[k][0]
            L = sources[name]["lanes"][lane]
            L["assets"] += 1
            L["bytes"] += size
            if t:
                L["days"][t.date().isoformat()] += 1
                L["first"] = min(filter(None, [L["first"], t]))
                L["last"] = max(filter(None, [L["last"], t]))
            latest_assets[(name, lane)].append((t or now, xru_id, f))
        db.close()

    # ---- Runs (receipts) ----
    runs = []
    failures = []   # (when, lane, url, code, short, run_id)
    for lane in LANES:
        published_urls = set()
        db = sqlite3.connect(f"file:{root / f'crawler_{lane}_state' / f'crawler_{lane}_assets.db'}?mode=ro", uri=True)
        published_urls = {u for (u,) in db.execute("select source_url from published_sources")}
        db.close()
        for p in sorted(glob.glob(str(root / f"crawler_{lane}_state" / "receipts" / "*.json"))):
            try:
                r = json.loads(Path(p).read_text())
            except (OSError, ValueError):
                continue
            st, en = parse_ts(r.get("started_at")), parse_ts(r.get("finished_at"))
            items = r.get("items") or []
            counts = collections.Counter(i.get("status") for i in items)
            names = collections.Counter()
            for i in items:
                k = url_to_key.get(i.get("url", ""))
                if k in key_to:
                    names[key_to[k][0]] += 1
                if i.get("status") == "failed":
                    failures.append({
                        "at": iso(st), "lane": lane, "run": r.get("request_id"),
                        "source": key_to[k][0] if k in key_to else None,
                        "code": err_code(i.get("error", "")), "msg": err_short(i.get("error", "")),
                        "resolved": i.get("url") in published_urls,
                    })
            runs.append({
                "id": r.get("request_id"), "lane": lane, "mode": r.get("mode"),
                "start": iso(st), "secs": int((en - st).total_seconds()) if st and en else None,
                "published": counts.get("published", 0), "duplicate": counts.get("duplicate", 0),
                "failed": counts.get("failed", 0), "discovered": counts.get("discovered", 0),
                "empty": counts.get("empty", 0), "sources": [n for n, _ in names.most_common(3)],
            })
    runs.sort(key=lambda r: r["start"] or "")

    # Group failures by code
    groups: dict[str, dict] = {}
    for f in failures:
        g = groups.setdefault(f["code"], {"code": f["code"], "n": 0, "open": 0, "last": None,
                                           "lanes": set(), "sources": collections.Counter(), "msg": f["msg"]})
        g["n"] += 1
        g["open"] += 0 if f["resolved"] else 1
        g["lanes"].add(f["lane"])
        if f["source"]:
            g["sources"][f["source"]] += 1
        if (f["at"] or "") >= (g["last"] or ""):
            g["last"], g["msg"] = f["at"], f["msg"]
    errors = sorted(({**g, "lanes": sorted(g["lanes"]), "sources": [n for n, _ in g["sources"].most_common(3)]}
                     for g in groups.values()), key=lambda g: (-g["open"], -g["n"]))

    # ---- Thumbnails ----
    if not args.no_thumbs:
        for (name, lane), lst in latest_assets.items():
            lst.sort(key=lambda x: x[0], reverse=True)
            picked = []
            for t, xru_id, f in lst[: THUMBS_PER_SOURCE * 2]:
                if len(picked) >= THUMBS_PER_SOURCE or not f.exists():
                    continue
                info = {}
                for ip in f.parent.glob("*.info.json"):
                    try:
                        info = json.loads(ip.read_text())
                    except (OSError, ValueError):
                        pass
                    break
                out = THUMBS / f"{xru_id}.webp"
                if thumb(f, out, lane == "video", info.get("duration")):
                    picked.append({
                        "id": xru_id, "lane": lane, "at": iso(t),
                        "title": (info.get("title") or info.get("caption") or "")[:90],
                        "w": info.get("width"), "h": info.get("height"),
                        "dur": round(info["duration"], 1) if info.get("duration") else None,
                        "src": f"data/crawler_thumbs/{xru_id}.webp",
                    })
            sources[name]["lanes"][lane]["thumbs"] = picked

    # ---- Finalise sources ----
    start = (now - dt.timedelta(days=DAYS - 1)).date()
    window = [(start + dt.timedelta(days=i)).isoformat() for i in range(DAYS)]
    out_sources = []
    for s in sources.values():
        lanes = s["lanes"]
        for L in lanes.values():
            L["spark"] = [L["days"].get(d, 0) for d in window]
            L["days_total"] = sum(L["days"].values())
            del L["days"]
            L["first"], L["last"] = iso(L["first"]), iso(L["last"])
        blocked = [L for L in lanes.values() if L.get("blocked_at")]
        active = any(L["active"] for L in lanes.values())
        s["status"] = "on" if active else ("quarantine" if blocked else "off")
        s["tier"] = next((L["tier"] for L in lanes.values() if L.get("tier")), None)
        s["assets"] = sum(L["assets"] for L in lanes.values())
        s["bytes"] = sum(L["bytes"] for L in lanes.values())
        s["pending"] = sum(L["pending"] for L in lanes.values())
        s["last"] = max(filter(None, (L["last"] for L in lanes.values())), default=None)
        s["host"] = next(iter(lanes.values()))["host"]
        s["errors_open"] = sum(1 for f in failures if f["source"] == s["name"] and not f["resolved"])
        per = {}
        for f in failures:
            if f["source"] != s["name"]:
                continue
            g = per.setdefault(f["code"], {"code": f["code"], "n": 0, "open": 0, "last": None, "msg": f["msg"], "lane": f["lane"]})
            g["n"] += 1
            g["open"] += 0 if f["resolved"] else 1
            if (f["at"] or "") >= (g["last"] or ""):
                g["last"], g["msg"] = f["at"], f["msg"]
        s["errors"] = sorted(per.values(), key=lambda g: (-g["open"], -g["n"]))
        s["review_after"] = min(filter(None, (L.get("review_after") for L in lanes.values())), default=None)
        out_sources.append(s)
    out_sources.sort(key=lambda s: (-s["assets"], s["name"]))

    # Daily chart: from the first crawl day (or window start) to today
    first_day = min(days) if days else start.isoformat()
    d0 = min(dt.date.fromisoformat(first_day), start)
    chart = []
    d = d0
    while d <= now.date():
        k = d.isoformat()
        chart.append({"d": k, "image": days[k]["image"] if k in days else 0, "video": days[k]["video"] if k in days else 0})
        d += dt.timedelta(days=1)

    snap = {
        "taken_at": now.strftime("%Y-%m-%dT%H:%M"),
        "totals": {
            "images": totals["image_assets"], "videos": totals["video_assets"],
            "image_bytes": totals["image_bytes"], "video_bytes": totals["video_bytes"],
            "orphans": totals["image_orphans"] + totals["video_orphans"],
            "sources": len(out_sources), "active": sum(s["status"] == "on" for s in out_sources),
            "quarantine": sum(s["status"] == "quarantine" for s in out_sources),
            "pending": sum(s["pending"] for s in out_sources),
            "errors_open": sum(g["open"] for g in errors), "errors_total": sum(g["n"] for g in errors),
            "registrations": sum(len(s["lanes"]) for s in out_sources),
        },
        "chart": chart,
        "runs": runs[-RUNS_KEPT:][::-1],
        "runs_total": len(runs),
        "errors": errors,
        "sources": out_sources,
    }
    OUT.write_text("// Generated by tools/crawler_snapshot.py — do not edit by hand.\nwindow.CRAWLER_SNAPSHOT = "
                   + json.dumps(snap, ensure_ascii=False, separators=(",", ":")) + ";\n")
    t = snap["totals"]
    print(f"sources {t['sources']} ({t['active']} on) · images {t['images']} · videos {t['videos']} · "
          f"pending {t['pending']} · errors open {t['errors_open']}/{t['errors_total']} · orphans {t['orphans']}")
    print(f"wrote {OUT} {OUT.stat().st_size // 1024} KB · thumbs {len(list(THUMBS.glob('*.webp'))) if THUMBS.exists() else 0}")


if __name__ == "__main__":
    main()
