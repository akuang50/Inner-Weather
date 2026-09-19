/**
 * Bridge Tonewatch (Python → scores.json) into Inner Weather's TypeScript types.
 * Tonewatch never ships raw message text — only scores, tags, times, and flags.
 */
import type { LanguageAnalysis, TonewatchDay } from '../types';

/** Shift demo Tonewatch days so the last scored day aligns near "yesterday". */
export function alignTonewatchDays(days: TonewatchDay[], endOffsetDays = 1): TonewatchDay[] {
  if (!days.length) return [];
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
  const last = parseDay(sorted[sorted.length - 1].day);
  const target = new Date();
  target.setHours(12, 0, 0, 0);
  target.setDate(target.getDate() - endOffsetDays);
  const delta = Math.round((target.getTime() - last.getTime()) / 86_400_000);

  return sorted.map((row) => ({
    ...row,
    day: shiftDay(row.day, delta),
  }));
}

export function latestScoredDay(days: TonewatchDay[]): TonewatchDay | null {
  const scored = days
    .filter((d) => d.stress_score != null && !d.insufficient)
    .sort((a, b) => a.day.localeCompare(b.day));
  return scored[scored.length - 1] ?? null;
}

/** Map a Tonewatch day onto the journal LanguageAnalysis shape used by fusion. */
export function toneDayToLanguageAnalysis(day: TonewatchDay): LanguageAnalysis | null {
  if (day.stress_score == null) return null;
  const t = day.stress_score / 10; // 0–1
  const emotions = day.dominant_emotions ?? [];
  const topics = (day.signals ?? []).slice(0, 3).map((signal, i) => ({
    topic: signal.toLowerCase(),
    weight: Math.max(0.35, 0.9 - i * 0.15),
  }));

  // Prefer baseline drift when available; otherwise use absolute tone.
  const zTone = day.z?.stress_score;
  const elevated = zTone != null ? Math.max(0, Math.min(1.5, zTone)) / 1.5 : t;

  return {
    id: `tone-${day.day}`,
    journalId: `tone-day-${day.day}`,
    sentiment: -(t * 0.9),
    urgency: clamp01(0.15 + elevated * 0.7),
    uncertainty: clamp01(0.2 + (emotions.includes('overwhelmed') ? 0.35 : 0) + t * 0.25),
    overwhelm: clamp01(0.1 + t * 0.75),
    emotionalSignals: emotions.length ? emotions : t > 0.55 ? ['tense'] : ['calm'],
    topics: topics.length
      ? topics
      : [{ topic: t > 0.55 ? 'tense messaging' : 'calm messaging', weight: 0.5 }],
    confidence: day.confidence ?? 0.5,
  };
}

/** Convert Tonewatch days into LanguageAnalysis rows (chronological). */
export function toneDaysToAnalyses(days: TonewatchDay[]): LanguageAnalysis[] {
  return days
    .slice()
    .sort((a, b) => a.day.localeCompare(b.day))
    .map(toneDayToLanguageAnalysis)
    .filter((a): a is LanguageAnalysis => a != null);
}

/** 0–1 messaging channel from recent Tonewatch days (prefers baseline z). */
export function messagingSignalFromDays(days: TonewatchDay[]): number {
  const recent = days
    .filter((d) => d.stress_score != null)
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-4);
  if (!recent.length) return 0.2;

  const vals = recent.map((d) => {
    const z = d.z?.stress_score;
    if (z != null) return clamp01(0.35 + z / 4);
    return clamp01((d.stress_score ?? 0) / 10);
  });
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function messagingChangePct(days: TonewatchDay[]): number {
  const signal = messagingSignalFromDays(days);
  return Math.round((signal - 0.25) * 100);
}

/** Plain-English factors already computed by Tonewatch `drift_flags`. */
export function toneContributingFactors(days: TonewatchDay[]): string[] {
  const latest = latestScoredDay(days);
  if (!latest) return [];
  const out: string[] = [];
  for (const flag of latest.flags ?? []) {
    out.push(capitalize(flag));
  }
  if (latest.stress_score != null && latest.stress_score >= 6) {
    const emotions = (latest.dominant_emotions ?? []).slice(0, 2).join(', ');
    if (emotions) {
      out.push(`Recent outgoing texts read as more ${emotions}`);
    }
  }
  for (const signal of (latest.signals ?? []).slice(0, 2)) {
    out.push(`Message tone pattern: ${signal}`);
  }
  // de-dupe while preserving order
  return [...new Set(out)].slice(0, 4);
}

function parseDay(iso: string): Date {
  const d = new Date(`${iso}T12:00:00`);
  return d;
}

function shiftDay(iso: string, deltaDays: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
