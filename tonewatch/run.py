#!/usr/bin/env python3
"""Tonewatch: analyse the tone of YOUR OWN outgoing texts, on your Mac, day by day.

Examples
  python run.py --demo                                   # synthetic data, offline mock model
  python run.py --demo --backend ollama --samples 3      # synthetic data, real local LLM
  python run.py --days 14 --backend ollama --model llama3.1:8b --samples 3
  python run.py --days 14 --dry-run                      # show what WOULD be sent, send nothing
  python run.py --days 14 --backend cloud --model <model> --allow-cloud
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from collections import defaultdict
from datetime import datetime, timedelta

from analyze import analyze_day, build_prompt, sample_evenly, save_rows
from features import BEHAVIOR_KEYS, add_baseline, daily_features, drift_flags
from llm import BackendError, MockBackend, OllamaBackend, OpenAICompatBackend
from reader import DEFAULT_DB, load_messages

BANNER = """\
Tonewatch reads ONLY your own outgoing messages (other people's text is never loaded).
Only scores/tags/timestamps are saved; raw message text is discarded after each run."""


def make_backend(args):
    if args.backend == "mock":
        return MockBackend()
    if args.backend == "ollama":
        return OllamaBackend(args.model or "llama3.1:8b", args.ollama_host)
    if not args.allow_cloud:
        sys.exit("Cloud backend sends your message text off this device. Re-run with --allow-cloud to confirm.")
    if not args.model:
        sys.exit("--model is required for the cloud backend.")
    return OpenAICompatBackend(args.model, args.base_url, args.api_key_env)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", default=DEFAULT_DB, help="path to chat.db")
    ap.add_argument("--days", type=int, default=14)
    ap.add_argument("--backend", choices=["mock", "ollama", "cloud"], default=None)
    ap.add_argument("--model", default=None)
    ap.add_argument("--ollama-host", default="http://localhost:11434")
    ap.add_argument("--base-url", default="https://api.openai.com/v1")
    ap.add_argument("--api-key-env", default="OPENAI_API_KEY")
    ap.add_argument("--allow-cloud", action="store_true", help="explicit opt-in to send text to a cloud LLM")
    ap.add_argument("--samples", type=int, default=1, help="model runs per day; >1 measures consistency")
    ap.add_argument("--min-msgs", type=int, default=5, help="skip the LLM on days with fewer messages")
    ap.add_argument("--out-db", default="tone_scores.sqlite")
    ap.add_argument("--out-json", default="scores.json")
    ap.add_argument("--dry-run", action="store_true", help="print the prompt for the latest day; call no model")
    ap.add_argument("--demo", action="store_true", help="use a synthetic chat.db (defaults to the mock model)")
    args = ap.parse_args()

    print(BANNER + "\n")
    if args.demo:
        from demo_db import make_demo_db
        args.db = os.path.join(tempfile.mkdtemp(prefix="tonewatch_demo_"), "chat.db")
        make_demo_db(args.db, days=max(args.days, 14))
        args.backend = args.backend or "mock"
    args.backend = args.backend or "ollama"

    since = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=args.days)
    try:
        msgs = load_messages(args.db, since)
    except (FileNotFoundError, PermissionError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    feats = daily_features(msgs)
    out_by_day = defaultdict(list)
    for m in msgs:
        if m.is_from_me and m.text:
            out_by_day[m.ts.date()].append(m)
    if not out_by_day:
        print("No outgoing text messages found in that window.")
        return 1
    days = sorted(out_by_day)

    if args.dry_run:
        last = days[-1]
        print(f"[dry-run] {len(days)} days, {sum(map(len, out_by_day.values()))} outgoing messages found.")
        print(f"[dry-run] Prompt that WOULD be sent for {last} (nothing was sent):\n")
        print(build_prompt(sample_evenly(sorted(out_by_day[last], key=lambda m: m.ts))))
        return 0

    try:
        backend = make_backend(args)
    except BackendError as e:
        sys.exit(str(e))
    where = "on this device" if backend.is_local else "OFF-DEVICE (cloud)"
    print(f"Model: {backend.name} ({where}); {len(days)} days to analyse.\n")

    rows = []
    for day in days:
        row = {"day": day.isoformat(), **feats.get(day, {})}
        if len(out_by_day[day]) < args.min_msgs:
            row.update(stress_score=None, insufficient=True, dominant_emotions=[], signals=[], evidence_times=[])
        else:
            try:
                row.update(analyze_day(backend, out_by_day[day], samples=args.samples))
            except (BackendError, RuntimeError) as e:
                print(f"error on {day}: {e}", file=sys.stderr)
                return 3
        rows.append(row)

    add_baseline(rows, ["stress_score"] + BEHAVIOR_KEYS)
    for r in rows:
        r["flags"] = drift_flags(r)

    print(f"{'day':<11}{'msgs':>5}{'tone':>7}{'conf':>6}{'z(tone)':>9}  flags")
    for r in rows:
        z = (r.get("z") or {}).get("stress_score")
        tone = "-" if r.get("stress_score") is None else f"{r['stress_score']:.1f}"
        conf = "-" if r.get("confidence") is None else f"{r['confidence']:.2f}"
        print(f"{r['day']:<11}{r.get('n_out', 0):>5}{tone:>7}{conf:>6}{('-' if z is None else f'{z:+.1f}'):>9}  {'; '.join(r['flags'])}")

    save_rows(rows, args.out_db, backend.name)
    with open(args.out_json, "w") as f:
        json.dump(rows, f, indent=2)
    print(f"\nSaved {args.out_db} and {args.out_json} (scores/tags only, no message text).")
    print("Wellness signal, not a diagnosis. If tone is worrying you, talk to someone you trust or a professional.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
