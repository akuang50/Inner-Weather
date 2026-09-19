"""Cheap, LLM-free daily features + a personal rolling baseline (robust z-scores)."""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from statistics import mean, median
from typing import Dict, List, Optional

from reader import Msg

LATE_START, LATE_END = 0, 5  # messages sent 00:00-04:59 count as "late night"

BEHAVIOR_KEYS = ["n_out", "mean_len", "late_night", "excl_rate", "caps_rate", "median_latency_min"]

# Minimum scale per key so a very steady baseline doesn't make tiny changes look huge.
SCALE_FLOOR = {
    "stress_score": 0.75, "n_out": 2.0, "mean_len": 5.0, "late_night": 1.0,
    "excl_rate": 0.05, "caps_rate": 0.05, "median_latency_min": 2.0,
}


def daily_features(msgs: List[Msg]) -> Dict[date, dict]:
    """Per-day features from the user's outgoing text + bare timestamps of replies."""
    by_chat: Dict[int, List[Msg]] = defaultdict(list)
    for m in msgs:
        by_chat[m.chat_id].append(m)

    latencies: Dict[date, List[float]] = defaultdict(list)
    for chat_msgs in by_chat.values():
        chat_msgs.sort(key=lambda m: m.ts)
        last_in = None
        for m in chat_msgs:
            if not m.is_from_me:
                last_in = m.ts
            elif last_in is not None:  # first reply after an incoming message
                minutes = (m.ts - last_in).total_seconds() / 60
                if 0 <= minutes <= 720:
                    latencies[m.ts.date()].append(minutes)
                last_in = None

    out_by_day: Dict[date, List[Msg]] = defaultdict(list)
    for m in msgs:
        if m.is_from_me and m.text:
            out_by_day[m.ts.date()].append(m)

    feats: Dict[date, dict] = {}
    for day, ms in out_by_day.items():
        texts = [m.text for m in ms]

        def shouty(t: str) -> bool:
            letters = [c for c in t if c.isalpha()]
            return len(letters) >= 4 and sum(c.isupper() for c in letters) / len(letters) > 0.6

        lat = latencies.get(day)
        feats[day] = {
            "n_out": len(ms),
            "mean_len": round(mean(len(t) for t in texts), 2),
            "late_night": sum(LATE_START <= m.ts.hour < LATE_END for m in ms),
            "excl_rate": round(sum("!" in t for t in texts) / len(texts), 3),
            "caps_rate": round(sum(shouty(t) for t in texts) / len(texts), 3),
            "median_latency_min": round(median(lat), 2) if lat else None,
        }
    return feats


def _robust_z(x: float, prior: List[float], floor: float) -> float:
    med = median(prior)
    mad = median(abs(v - med) for v in prior)
    scale = max(1.4826 * mad, 0.15 * abs(med), floor)
    return (x - med) / scale


def add_baseline(rows: List[dict], keys: List[str], window: int = 14, min_days: int = 5) -> None:
    """Adds row['z'][key]: how far each day sits from the person's OWN previous `window` days.

    `rows` must be chronological. Days before `min_days` of history get z = None.
    """
    for i, row in enumerate(rows):
        row["z"] = {}
        for key in keys:
            x = row.get(key)
            prior = [r[key] for r in rows[max(0, i - window):i] if r.get(key) is not None]
            if x is None or len(prior) < min_days:
                row["z"][key] = None
            else:
                row["z"][key] = round(_robust_z(x, prior, SCALE_FLOOR.get(key, 1.0)), 2)


def drift_flags(row: dict) -> List[str]:
    """Plain-English reasons a day looks different from the person's own normal."""
    z = row.get("z", {})
    flags: List[str] = []
    tone = z.get("stress_score")
    if tone is not None and tone >= 1.5 and not row.get("insufficient"):
        flags.append("tone drifting tense vs. own baseline")
    moved = [k for k in BEHAVIOR_KEYS if z.get(k) is not None and abs(z[k]) >= 2.0]
    if len(moved) >= 2:
        flags.append("texting behavior shifted: " + ", ".join(moved))
    return flags
