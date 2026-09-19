"""Per-day tone analysis + output-only storage (raw message text is never persisted)."""
from __future__ import annotations

import json
import sqlite3
from collections import Counter
from datetime import datetime
from statistics import median
from typing import List

from llm import SYSTEM_PROMPT, parse_result, redact
from reader import Msg

MAX_MSGS_PER_BATCH = 80
MAX_CHARS_PER_MSG = 300


def sample_evenly(msgs: List[Msg], cap: int = MAX_MSGS_PER_BATCH) -> List[Msg]:
    if len(msgs) <= cap:
        return msgs
    step = len(msgs) / cap
    return [msgs[int(i * step)] for i in range(cap)]


def build_prompt(batch: List[Msg]) -> str:
    lines = [f"[{i}] {m.ts:%H:%M} {redact(m.text)[:MAX_CHARS_PER_MSG]}" for i, m in enumerate(batch, 1)]
    return "Messages:\n" + "\n".join(lines)


def _leaks(signal: str, texts: List[str]) -> bool:
    """True if a model-written 'signal' echoes a long chunk of the user's real text."""
    s = signal.lower()
    return len(s) >= 12 and any(s in t.lower() for t in texts)


def analyze_day(backend, msgs: List[Msg], samples: int = 1, retries: int = 2) -> dict:
    """Runs the model `samples` times on one day's outgoing messages and aggregates."""
    batch = sample_evenly(sorted(msgs, key=lambda m: m.ts))
    user = build_prompt(batch)
    results, last_err = [], None
    for _ in range(samples):
        for _attempt in range(retries + 1):
            try:
                results.append(parse_result(backend.complete(SYSTEM_PROMPT, user), len(batch)))
                break
            except ValueError as e:  # malformed output -> retry; backend/network errors propagate
                last_err = e
    if not results:
        raise RuntimeError(f"model never returned valid JSON ({last_err})")

    scores = [r["stress_score"] for r in results]
    spread = max(scores) - min(scores)
    conf = median(r["confidence"] for r in results) * (1 - min(spread, 4.0) / 4.0)
    emotions = [e for e, _ in Counter(e for r in results for e in r["dominant_emotions"]).most_common(4)]
    texts = [m.text for m in batch]
    first = results[0]
    return {
        "stress_score": round(median(scores), 2),
        "score_spread": round(spread, 2),
        "confidence": round(conf, 2),
        "dominant_emotions": emotions,
        "signals": [s for s in first["signals"] if not _leaks(s, texts)],
        "evidence_times": sorted({f"{batch[i - 1].ts:%H:%M}" for i in first["evidence_ids"]}),
        "insufficient": sum(r["insufficient_evidence"] for r in results) > len(results) / 2,
        "samples_ok": len(results),
    }


SCHEMA = """
CREATE TABLE IF NOT EXISTS daily (
    day TEXT PRIMARY KEY, n_out INTEGER, stress_score REAL, score_spread REAL, confidence REAL,
    emotions TEXT, signals TEXT, evidence_times TEXT, insufficient INTEGER,
    features TEXT, z TEXT, flags TEXT, model TEXT, updated_at TEXT
)"""


def save_rows(rows: List[dict], db_path: str, model_name: str) -> None:
    """Persist derived numbers only: scores, tags, times, features. No message text."""
    con = sqlite3.connect(db_path)
    con.execute(SCHEMA)
    now = datetime.now().isoformat(timespec="seconds")
    for r in rows:
        feats = {k: r.get(k) for k in ("n_out", "mean_len", "late_night", "excl_rate", "caps_rate", "median_latency_min")}
        con.execute(
            "INSERT OR REPLACE INTO daily VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (r["day"], r.get("n_out"), r.get("stress_score"), r.get("score_spread"), r.get("confidence"),
             json.dumps(r.get("dominant_emotions", [])), json.dumps(r.get("signals", [])),
             json.dumps(r.get("evidence_times", [])), int(bool(r.get("insufficient"))),
             json.dumps(feats), json.dumps(r.get("z", {})), json.dumps(r.get("flags", [])), model_name, now),
        )
    con.commit()
    con.close()
