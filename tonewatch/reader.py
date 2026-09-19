"""Read the *user's own* outgoing messages from macOS Messages (chat.db).

Privacy by construction:
  * The SQL itself returns text/attributedBody ONLY for rows where is_from_me = 1.
    Other people's message content is never loaded into Python.
  * Incoming rows are kept as bare timestamps (used only for reply-latency).
  * The database is opened read-only (or a temp copy is read), never modified.

Requires Full Disk Access for the app running Python (Terminal, iTerm, VS Code...).
"""
from __future__ import annotations

import shutil
import sqlite3
import tempfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Optional

APPLE_EPOCH = 978_307_200  # 2001-01-01 in unix seconds
DEFAULT_DB = "~/Library/Messages/chat.db"
_OBJ_REPLACEMENT = "\ufffc"  # placeholder Apple inserts where an attachment sits


@dataclass
class Msg:
    rowid: int
    ts: datetime  # local, naive
    is_from_me: bool
    chat_id: int
    text: Optional[str] = None  # ONLY ever set for outgoing messages


def apple_to_datetime(raw: int) -> Optional[datetime]:
    """chat.db stores seconds (old macOS) or nanoseconds (High Sierra+) since 2001."""
    if not raw:
        return None
    secs = raw / 1e9 if abs(raw) > 1e11 else raw
    return datetime.fromtimestamp(secs + APPLE_EPOCH)


def decode_attributed_body(blob: Optional[bytes]) -> Optional[str]:
    """Recover text from the `attributedBody` typedstream blob.

    Newer macOS versions often leave `message.text` NULL and keep the string only here.
    Layout: ... 'NSString' 0x01 0x94 0x84 0x01 '+' <length> <utf-8 bytes> ...
    Length is 1 byte if < 0x80, else 0x81 + 2-byte LE, or 0x82 + 4-byte LE.
    """
    if not blob:
        return None
    blob = bytes(blob)
    i = blob.find(b"NSString")
    if i < 0:
        return None
    p = i + len(b"NSString") + 5  # skip the 5-byte class preamble
    if p >= len(blob):
        return None
    n = blob[p]
    p += 1
    if n == 0x81:
        n = int.from_bytes(blob[p:p + 2], "little")
        p += 2
    elif n == 0x82:
        n = int.from_bytes(blob[p:p + 4], "little")
        p += 4
    elif n >= 0x80:
        return None
    return blob[p:p + n].decode("utf-8", errors="replace")


def _clean(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    text = text.replace(_OBJ_REPLACEMENT, "").strip()
    return text or None


def _open(db_path: str):
    path = Path(db_path).expanduser()
    if not path.exists():
        raise FileNotFoundError(f"No Messages database at {path}")
    try:
        con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        con.execute("SELECT 1 FROM message LIMIT 1")
        return con, None
    except sqlite3.Error:
        pass
    # Fallback: read a temp copy (handles WAL/locking quirks).
    tmp = tempfile.mkdtemp(prefix="tonewatch_")
    try:
        for suffix in ("", "-wal", "-shm"):
            src = Path(str(path) + suffix)
            if src.exists():
                shutil.copy2(src, Path(tmp) / ("chat.db" + suffix))
        return sqlite3.connect(Path(tmp) / "chat.db"), tmp
    except PermissionError as e:
        shutil.rmtree(tmp, ignore_errors=True)
        raise PermissionError(
            "macOS blocked access to chat.db. Grant Full Disk Access to your terminal/IDE: "
            "System Settings > Privacy & Security > Full Disk Access, then restart it."
        ) from e


def load_messages(db_path: str, since: datetime) -> List[Msg]:
    con, tmp = _open(db_path)
    try:
        cols = {r[1] for r in con.execute("PRAGMA table_info(message)")}
        row = con.execute("SELECT MAX(date) FROM message").fetchone()
        unit = 1_000_000_000 if row and row[0] and row[0] > 1e11 else 1
        cutoff = int((since.timestamp() - APPLE_EPOCH) * unit)

        where = ["m.date >= ?"]
        if "associated_message_type" in cols:  # skip tapback reactions
            where.append("COALESCE(m.associated_message_type, 0) = 0")
        if "item_type" in cols:  # skip group renames / system rows
            where.append("COALESCE(m.item_type, 0) = 0")
        body = "CASE WHEN m.is_from_me = 1 THEN m.attributedBody END" if "attributedBody" in cols else "NULL"

        sql = f"""
            SELECT m.ROWID, m.date, m.is_from_me, COALESCE(cmj.chat_id, 0),
                   CASE WHEN m.is_from_me = 1 THEN m.text END,
                   {body}
            FROM message m
            LEFT JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
            WHERE {' AND '.join(where)}
            ORDER BY m.date
        """
        out: List[Msg] = []
        for rowid, raw_date, from_me, chat_id, text, attr in con.execute(sql, (cutoff,)):
            ts = apple_to_datetime(raw_date)
            if ts is None:
                continue
            if from_me:
                text = _clean(text) or _clean(decode_attributed_body(attr))
                out.append(Msg(rowid, ts, True, chat_id, text))
            else:
                out.append(Msg(rowid, ts, False, chat_id, None))
        return out
    finally:
        con.close()
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
