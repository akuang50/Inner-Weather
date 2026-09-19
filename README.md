# Inner Weather

**Your personal early-warning system for stress.**

Inner Weather (product concept: Stress Monitor) is a HackMIT prototype that detects unusual changes in your physiological and linguistic signals, explains what may be driving them, and helps you act before stress becomes overwhelming.

It compares you to **your own baseline** — not a population average — and connects body signals with language without claiming medical causation.

## Quick start

```bash
cd /Users/amy/mit/mithacks26/Inner-Weather
npm install
npm start
```

Then press `i` for iOS Simulator, `w` for web, or scan the QR code with Expo Go.

Requires Node (this repo pins `nodejs 25.4.0` via `.tool-versions` for asdf).

## Demo path (2–3 min)

1. **Onboarding** → continue with demo health data  
2. **Home** → elevated stress signal + what changed  
3. **Tell me what’s going on** → hold the rant button (uses a demo transcript + local analysis)  
4. **Insight** → themes + cross-modal chain  
5. **Why?** / **Actions** / **Stress Replay**

## Architecture

```text
Mobile UI (Expo)
   ├── Apple Health (demo dataset today)
   ├── Voice rant (expo-av → transcript placeholder)
   └── Journals
            ↓
   Signal pipeline + personal baseline (src/engine/baseline.ts)
            ↓
   Fusion + structured insight (src/engine/stress.ts)
            ↓
   Home · Insight · Replay · Actions
```

| Area | Path |
|------|------|
| Screens | `app/` (expo-router) |
| Types / schema | `src/types.ts` |
| Demo persona (Alex) | `src/data/demoDataset.ts` |
| Baseline + deviations | `src/engine/baseline.ts` |
| Stress index + insights | `src/engine/stress.ts` |
| Theme | `src/theme.ts` |
| Design doc | `DESIGN.md` |

## Product principles (short)

- Personal baseline, not population norms  
- Correlation ≠ causation; communicate uncertainty  
- Reflection, not diagnosis  
- Every insight: what changed, why noticed, what might relate, confidence, next step  
- Privacy by default — minimize what leaves the device

## What’s prototype vs next

**In this MVP**

- Seeded 14-day health + journal demo data  
- Deterministic baseline / stress fusion (experimental weights)  
- Local language heuristics standing in for STT + LLM  
- Signature hold-to-talk rant UI  

**Next for the hackathon**

- Real speech-to-text  
- Structured LLM reasoner (JSON in / JSON out)  
- Live HealthKit reads on device  
- Stronger Stress Replay scrubbing  

## Safety

This is a wellness / self-reflection prototype. It does **not** diagnose conditions, assess clinical risk, or replace professional care.
