/**
 * Bridge Tonewatch scores.json into the premium site tracker (scores/tags only).
 */
import type { TonewatchDay } from './types'
import rawScores from '../data/tonewatchScores.json'

export function alignTonewatchDays(days: TonewatchDay[], endOffsetDays = 1): TonewatchDay[] {
  if (!days.length) return []
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day))
  const last = new Date(`${sorted[sorted.length - 1]!.day}T12:00:00`)
  const target = new Date()
  target.setHours(12, 0, 0, 0)
  target.setDate(target.getDate() - endOffsetDays)
  const delta = Math.round((target.getTime() - last.getTime()) / 86_400_000)

  return sorted.map((row) => {
    const d = new Date(`${row.day}T12:00:00`)
    d.setDate(d.getDate() + delta)
    return { ...row, day: d.toISOString().slice(0, 10) }
  })
}

export const demoTonewatchDays: TonewatchDay[] = alignTonewatchDays(
  rawScores as TonewatchDay[],
  1,
)

export function latestScoredDay(days: TonewatchDay[]): TonewatchDay | null {
  const scored = days
    .filter((d) => d.stress_score != null && !d.insufficient)
    .sort((a, b) => a.day.localeCompare(b.day))
  return scored[scored.length - 1] ?? null
}

/** 0–1 messaging channel from recent Tonewatch days. */
export function messagingSignalFromDays(days: TonewatchDay[]): number {
  const recent = days
    .filter((d) => d.stress_score != null)
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-4)
  if (!recent.length) return 0.2

  const vals = recent.map((d) => {
    const z = d.z?.stress_score
    if (z != null) return clamp01(0.35 + z / 4)
    return clamp01((d.stress_score ?? 0) / 10)
  })
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export function toneExplainItems(days: TonewatchDay[]) {
  const latest = latestScoredDay(days)
  if (!latest || latest.stress_score == null) return []
  const items: { title: string; value: number; detail: string }[] = []
  items.push({
    title: 'Message tone vs your baseline',
    value: Math.min(95, Math.round((latest.stress_score / 10) * 100)),
    detail:
      latest.flags?.[0] ??
      (latest.dominant_emotions?.length
        ? `Tone reads as more ${latest.dominant_emotions.slice(0, 2).join(', ')}`
        : `Tone score ${latest.stress_score}/10`),
  })
  return items
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
