# Inner Weather

**Your personal early-warning system for stress.**

Inner Weather (product concept: **Stress Monitor**) detects unusual changes in your physiological and linguistic signals against *your* baseline, explains what may be driving them, and helps you act before stress becomes overwhelming.

It never claims medical causation. Reflection, not diagnosis.

## Landing site

```bash
cd site
npm install
npm run dev
```

GitHub Pages: **https://akuang50.github.io/Inner-Weather/**  
(Pages source should be the `gh-pages` branch.)

Live tracking on the site: health logs + journals persist in `localStorage`, baselines recompute from your history, optional Grok/xAI analysis (key stays in the browser — never commit it).

## Mobile app (Expo)

```bash
npm install
npx expo start
```

Then scan the QR with Expo Go (iOS/Android), or press `w` for web.

| Tab | What it does |
|-----|----------------|
| **Home** | Live fused stress signal vs your baseline |
| **Talk** | Type a rant → local heuristics or Grok analysis, saved on device |
| **Track** | Log sleep / RHR / steps + optional xAI key (SecureStore) |
| **Replay** | Scrub the week built from *your* stored entries |

Onboarding and tracker data persist via AsyncStorage. Optional Grok key uses `expo-secure-store` on native (localStorage on web).

```bash
npm run typecheck
```

## Architecture

```text
Web (site/)                        Mobile (Expo app/)
  Vite + React + Tailwind            expo-router tabs
  TrackerProvider                    AppContext
  localStorage                       AsyncStorage + SecureStore
           \                          /
            shared idea: personal baseline fusion
            body deviation × language deviation × context
```

| Area | Path |
|------|------|
| Landing | `site/` |
| Mobile screens | `app/(tabs)/` |
| Shared tracker logic (mobile) | `src/lib/` |
| Theme | `src/theme.ts` / `site` Tailwind tokens |
| Design doc | `DESIGN.md` |

## Product principles

- Personal baseline, not population norms  
- Correlation ≠ causation; show uncertainty  
- Reflection, not diagnosis  
- Privacy by default — minimize what leaves the device  

## Safety

This is a wellness / self-reflection prototype. It does **not** diagnose conditions, assess clinical risk, or replace professional care.
