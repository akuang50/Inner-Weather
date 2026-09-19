"""Build a synthetic chat.db (Apple's schema) so the pipeline can be tested without real messages.

Contains a calm stretch followed by a stressed final 3 days. Half of outgoing messages have
text=NULL with the string only in `attributedBody`, like newer macOS. Incoming rows carry a
canary string so tests can prove incoming content is never loaded.
"""
from __future__ import annotations

import random
import sqlite3
from datetime import datetime, timedelta

from reader import APPLE_EPOCH

INCOMING_CANARY = "INCOMING-CANARY-DO-NOT-READ"

CALM = ["sounds good, see you at 7!", "haha yeah lets grab lunch tomorrow", "thanks for sending that, looks great",
        "omg that's hilarious", "on my way, want anything?", "yes! I'd love to come", "no worries at all, take your time",
        "just finished the gym, feeling good", "lets do saturday, I'm free all day", "that movie was so fun"]
STRESSED = ["cant talk, deadline tonight", "sorry sorry, drowning in work", "ugh whatever fine", "haven't slept, cant do this",
            "not now.", "sorry I'm so behind on everything", "i'm exhausted, no time", "fine.", "stress is insane rn",
            "sorry can't make it, panic mode"]


def build_attributed_body(text: str) -> bytes:
    raw = text.encode("utf-8")
    length = bytes([len(raw)]) if len(raw) < 0x80 else b"\x81" + len(raw).to_bytes(2, "little")
    return (b"\x04\x0bstreamtyped\x81\xe8\x03\x84\x01@\x84\x84\x84\x12NSAttributedString\x00\x84\x84\x08NSObject\x00\x85"
            b"\x92\x84\x84\x84\x08NSString\x01\x94\x84\x01+" + length + raw + b"\x86\x84\x02iI\x01")


def _ns(dt: datetime) -> int:
    return int((dt.timestamp() - APPLE_EPOCH) * 1_000_000_000)


def make_demo_db(path: str, days: int = 14, seed: int = 7) -> None:
    rng = random.Random(seed)
    con = sqlite3.connect(path)
    con.executescript("""
        CREATE TABLE message (ROWID INTEGER PRIMARY KEY AUTOINCREMENT, guid TEXT, text TEXT, attributedBody BLOB,
            date INTEGER, is_from_me INTEGER, associated_message_type INTEGER DEFAULT 0, item_type INTEGER DEFAULT 0);
        CREATE TABLE chat (ROWID INTEGER PRIMARY KEY);
        CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER);
        INSERT INTO chat (ROWID) VALUES (1), (2);
    """)

    def add(dt, from_me, text=None, chat=1, tapback=0, use_blob=False):
        cur = con.execute(
            "INSERT INTO message (guid, text, attributedBody, date, is_from_me, associated_message_type) VALUES (?,?,?,?,?,?)",
            ("g", None if use_blob else text, build_attributed_body(text) if (use_blob and text) else None,
             _ns(dt), int(from_me), tapback))
        con.execute("INSERT INTO chat_message_join VALUES (?,?)", (chat, cur.lastrowid))

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    for d in range(days, 0, -1):
        day = today - timedelta(days=d)
        stressed = d <= 3
        n = rng.randint(6, 9) if stressed else rng.randint(12, 18)
        for _ in range(n):
            hour = rng.choice([1, 2, 3, 9, 14, 23]) if stressed and rng.random() < 0.5 else rng.randint(9, 22)
            when = day + timedelta(hours=hour, minutes=rng.randint(0, 59))
            lag = rng.randint(30, 300) if stressed else rng.randint(1, 10)
            chat = rng.choice([1, 2])
            add(when - timedelta(minutes=lag), False, INCOMING_CANARY, chat)
            add(when, True, rng.choice(STRESSED if stressed else CALM), chat, use_blob=rng.random() < 0.5)
        add(day + timedelta(hours=12), True, "Loved \u201cthat\u201d", 1, tapback=2000)  # tapback: must be ignored
    con.commit()
    con.close()
