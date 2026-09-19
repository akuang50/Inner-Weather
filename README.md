# Inner Weather
<<<<<<< HEAD

**Your personal early-warning system for stress.**

Inner Weather (product concept: Stress Monitor) is a HackMIT prototype that detects unusual changes in your physiological and linguistic signals, explains what may be driving them, and helps you act before stress becomes overwhelming.

It compares you to **your own baseline** — not a population average — and connects body signals with language without claiming medical causation.

## Quick start

```bash
cd /Users/amy/mit/mithacks26/Inner-Weather
npm install
npm run web
```

Then open [http://localhost:8081](http://localhost:8081) (or press `i` for iOS / scan with Expo Go).

Requires Node (this repo pins `nodejs 25.4.0` via `.tool-versions` for asdf).

### Live site on GitHub Pages

After you enable Pages (one-time) and push to `main`, the app deploys automatically:

**https://akuang50.github.io/Inner-Weather/**

1. Repo → **Settings** → **Pages**
2. Under **Build and deployment**, set Source to **GitHub Actions**
3. Push to `main` (or run the **Deploy GitHub Pages** workflow manually)

Local static build:

```bash
npm run export:web
```

Output lands in `dist/`.

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
=======
>>>>>>> 16561bb377a5c9c60ecc368b3ab4de2e88a37a43
