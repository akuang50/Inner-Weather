# Stress Monitor — Design Document (v1.0)

HackMIT product design for **Inner Weather**. Full narrative lives here; implementation follows the MVP in §26.

## One-liner

A private AI that detects unusual changes in physiological and linguistic signals, explains what may be driving them, and helps you take action before stress becomes overwhelming.

## Core insight

Wellness apps show metrics. Journals show reflections. Stress Monitor asks: **what’s changing in you right now, and what might explain it?** — against a **personal baseline**, not a population norm.

## Principles

1. **Personal, not population-based**
2. **Correlation is not causation** — never present inference as medical fact
3. **Reflection, not diagnosis**
4. **Explain the signal** — what / why / related / confidence / next
5. **Privacy by default**

## Target user

Students and young professionals under academic/work pressure (persona: Alex, 21 — exams, deadline, poor sleep, “I’m just tired”).

## Core journey

Onboarding (<2 min) → Home (“How am I doing today?”) → Voice rant (“Tell me what’s going on”) → Insight → Why? → Actions → (stretch) Stress Replay

## Stress score

Internal **Stress Signal Index** = unusualness vs personal baseline (prototype fusion of physiological + language + context). Not a medical measurement; weights are experimental and labeled as such.

## Technical thesis

> A personal multimodal anomaly detector for human stress: body + words + context → baseline → anomaly → explanation → action.

Do **not** delegate baselines/time-series to the LLM. Use deterministic code for baselines; LLM for structured interpretation of evidence.

## MVP must-haves

1. Personal baseline (simulated or real metrics)  
2. Health integration (demo or HealthKit)  
3. Voice journal (record → transcribe → analyze)  
4. LLM / structured analysis  
5. Stress timeline  
6. Cross-modal insight  
7. Beautiful, calm UI  

## Visual direction

Calm + futuristic + human. Palette: bg `#F7F8FA`, primary `#15171A`, stress `#FF6B6B`, calm `#5BC8A4`, insight `#5B6CFF`, muted `#9AA0A6`. Signature interaction: large hold-to-talk circle.

## Demo script (2–3 min)

Baseline week → inject rising stress → insight connecting sleep/HR + deadline language → voice rant → cross-modal animation → “Help me unpack this” → three next steps.

## Safety guardrails

Avoid diagnosing or catastrophizing. Prefer “signals differ from your baseline.” Separate flow for concerning journal content without claiming clinical risk assessment.

---

Implementation map: see `README.md`. Engine entry points: `src/engine/baseline.ts`, `src/engine/stress.ts`.
