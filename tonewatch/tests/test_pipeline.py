import json
import os
import sys
import tempfile
import threading
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from statistics import mean

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from analyze import _leaks, analyze_day, save_rows
from demo_db import INCOMING_CANARY, build_attributed_body, make_demo_db
from features import BEHAVIOR_KEYS, add_baseline, daily_features, drift_flags
from llm import MockBackend, OllamaBackend, parse_result, redact
from reader import apple_to_datetime, decode_attributed_body, load_messages


def _demo(days=14):
    path = os.path.join(tempfile.mkdtemp(), "chat.db")
    make_demo_db(path, days=days)
    since = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days)
    return path, load_messages(path, since)


def test_attributed_body_roundtrip_short_and_long():
    assert decode_attributed_body(build_attributed_body("hello \u2603 world")) == "hello \u2603 world"
    long = "x" * 500
    assert decode_attributed_body(build_attributed_body(long)) == long
    assert decode_attributed_body(None) is None
    assert decode_attributed_body(b"garbage") is None


def test_apple_date_units():
    assert apple_to_datetime(0) is None
    ns = apple_to_datetime(700_000_000 * 1_000_000_000)
    s = apple_to_datetime(700_000_000)
    assert ns == s


def test_incoming_text_never_loaded_and_tapbacks_skipped():
    _, msgs = _demo()
    incoming = [m for m in msgs if not m.is_from_me]
    assert incoming and all(m.text is None for m in incoming)
    assert not any(INCOMING_CANARY in (m.text or "") for m in msgs)
    assert not any("Loved" in (m.text or "") for m in msgs)  # tapback filtered
    outgoing = [m for m in msgs if m.is_from_me]
    assert outgoing and all(m.text for m in outgoing)  # blob-only rows were decoded too


def test_features_and_drift_end_to_end_with_mock():
    _, msgs = _demo()
    feats = daily_features(msgs)
    days = sorted(feats)
    rows = []
    for d in days:
        outgoing = [m for m in msgs if m.is_from_me and m.text and m.ts.date() == d]
        rows.append({"day": d.isoformat(), **feats[d], **analyze_day(MockBackend(), outgoing, samples=2)})
    add_baseline(rows, ["stress_score"] + BEHAVIOR_KEYS)
    for r in rows:
        r["flags"] = drift_flags(r)

    calm, stressed = rows[:-3], rows[-3:]
    assert mean(r["stress_score"] for r in stressed) > mean(r["stress_score"] for r in calm) + 2
    assert all(r["flags"] for r in stressed), "every stressed day should be flagged"
    assert not any(r["flags"] for r in rows[5:-3]), "calm days after warm-up should not be flagged"
    assert all(r["z"]["late_night"] is not None for r in rows[-3:])


def test_saved_db_contains_no_message_text():
    _, msgs = _demo()
    outgoing = [m for m in msgs if m.is_from_me and m.text][:12]
    row = {"day": "2026-01-01", "n_out": 12, **analyze_day(MockBackend(), outgoing)}
    out = os.path.join(tempfile.mkdtemp(), "out.sqlite")
    save_rows([row], out, "mock")
    blob = open(out, "rb").read()
    for m in outgoing:
        assert m.text.encode() not in blob


def test_parse_result_handles_fences_and_rejects_garbage():
    good = '```json\n{"stress_score": 14, "confidence": 0.7, "dominant_emotions": ["Tense"], "signals": ["curt"], "evidence_ids": [1, 99, "2"]}\n```'
    r = parse_result(good, n_msgs=3)
    assert r["stress_score"] == 10 and r["dominant_emotions"] == ["tense"] and r["evidence_ids"] == [1, 2]
    for bad in ["nope", "{}", '{"stress_score": "high", "confidence": 1}', "[1,2]"]:
        with pytest.raises(ValueError):
            parse_result(bad, 3)


def test_redaction_and_leak_guard():
    out = redact("mail me at a.b@c.com or +1 (617) 555-0123, see https://x.io/p")
    assert "@" not in out and "555" not in out and "x.io" not in out
    assert _leaks("cant talk, deadline tonight", ["cant talk, deadline tonight!"])
    assert not _leaks("terse, apologetic replies", ["cant talk, deadline tonight!"])


class _FakeOllama(BaseHTTPRequestHandler):
    calls = 0

    def do_POST(self):
        type(self).calls += 1
        self.rfile.read(int(self.headers["Content-Length"]))
        content = "sorry, here you go" if type(self).calls == 1 else (
            '```json\n{"stress_score": 6.5, "confidence": 0.8, "dominant_emotions": ["tense"], '
            '"signals": ["short replies"], "evidence_ids": [1], "insufficient_evidence": false}\n```')
        body = json.dumps({"message": {"content": content}}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


def test_ollama_backend_retries_on_malformed_json():
    server = HTTPServer(("127.0.0.1", 0), _FakeOllama)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        _, msgs = _demo()
        outgoing = [m for m in msgs if m.is_from_me and m.text][:8]
        backend = OllamaBackend("fake", f"http://127.0.0.1:{server.server_port}")
        res = analyze_day(backend, outgoing, samples=1, retries=2)
        assert res["stress_score"] == 6.5 and _FakeOllama.calls == 2
    finally:
        server.shutdown()


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
