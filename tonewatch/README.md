# Tonewatch: Mac Messages tone pipeline

Reads **your own outgoing texts** from the Messages app on your Mac, rates the *tone* of each day with an LLM, and compares every day to **your own** rolling baseline. Python 3.9+, standard library only (pytest is optional, for tests).

```
chat.db ──► reader.py ──► features.py ──┐            (behavior: volume, length, late-night, reply latency…)
 (read-only,   own text only              ├─► add_baseline() ─► drift_flags() ─► tone_scores.sqlite + scores.json
  incoming =                              │      (robust z vs. your previous 14 days)
  timestamps)  └► analyze.py ─► llm.py ───┘            (tone: Ollama / cloud / mock, validated JSON, N samples)
```

## Setup (macOS)
1. **Full Disk Access**: System Settings → Privacy & Security → Full Disk Access → add your Terminal / iTerm / VS Code, then fully restart it. Without this, macOS blocks `~/Library/Messages/chat.db`.
2. **Local model** (keeps text on your machine):
   ```bash
   brew install ollama && ollama serve &
   ollama pull llama3.1:8b
   ```

## Run
```bash
python run.py --demo                        # synthetic data + offline mock model (no setup needed)
python run.py --days 14 --dry-run           # show exactly what WOULD be sent; sends nothing
python run.py --days 14 --backend ollama --model llama3.1:8b --samples 3
python run.py --days 14 --backend cloud --model <model> --allow-cloud   # opt-in, text leaves device
python -m pytest tests -v
```
`--samples 3` runs the model three times per day. The spread between runs lowers the reported confidence, so an inconsistent model shows up as low confidence instead of a confident wrong number.

## Output (`scores.json` / `tone_scores.sqlite`)
Per day: `stress_score` (0-10), `confidence`, `dominant_emotions`, `signals`, `evidence_times` (clock times of the messages that mattered, never their text), behavior features, `z` (deviation from your own baseline), and plain-English `flags`. This is what your dashboard should read.

### Inner Weather app bridge
The Expo app loads demo scores from `src/data/tonewatchScores.json` via:

- `src/engine/tonewatch.ts` — maps days → messaging signal + contributing factors  
- `src/engine/stress.ts` — fuses messaging with health + journal language  
- `src/state/AppContext.tsx` — exposes `toneDays` / `snapshot.latestTone`

Refresh the demo file after changing the mock pipeline:

```bash
cd tonewatch
python run.py --demo --out-json ../src/data/tonewatchScores.json --out-db /tmp/tone_scores.sqlite
```

To plug in a real run later, call `setToneDays(...)` from app state with the parsed `scores.json` (still scores/tags only — never paste message text into the client).

## Privacy properties (and where they stop)
- **Only outgoing text is loaded.** The SQL returns message text solely for `is_from_me = 1`. Incoming rows are bare timestamps used for reply latency. A test asserts this using a canary string in the incoming rows.
- **Read-only.** The database is opened read-only, or a temp copy is read and deleted.
- **No message text is persisted.** A test checks the saved DB for every message string. Model-written `signals` are also dropped if they echo a long chunk of your text.
- **Redaction before the model sees anything:** emails, URLs, phone/long numbers. Names are *not* redacted.
- **Cloud is opt-in** via `--allow-cloud`. With Ollama nothing leaves the machine.
- The people you text never consented. Your outgoing messages still contain replies to them and mentions of them. Keep it to your own account, demo with teammates who agreed or with `--demo`, and never project real messages.

## Known limits
- **Tone is not stress.** LLMs misread sarcasm and dark humor, and results depend on the model. Report agreement against self-ratings instead of claiming accuracy.
- The baseline is your previous 14 days, so a long stressful stretch gradually becomes "normal". Increase `window` in `add_baseline` if that matters.
- Reply latency uses first reply after an incoming message (≤12h). Group chats are noisy.
- Only Messages (iMessage/SMS via your Mac). WhatsApp, Signal, etc. are not covered.
- `attributedBody` decoding targets the common typedstream layout. Some rare messages may yield no text and are skipped.
- The `mock` backend is a keyword stub for wiring/tests, not a tone model.
- Wellness signal only, not a diagnosis. The tool never gives medical conclusions.

## Files
`reader.py` (chat.db access) · `features.py` (behavior features, baseline) · `llm.py` (backends, prompt, validation) · `analyze.py` (per-day analysis, storage) · `run.py` (CLI) · `demo_db.py` (synthetic chat.db) · `tests/`
