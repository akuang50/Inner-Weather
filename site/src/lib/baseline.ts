import { aggregateLanguage } from './language'
import type { DaySnapshot, HealthLog, JournalEntry, LanguageAnalysis } from './types'

const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function mean(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function std(nums: number[]) {
  if (nums.length < 2) return 0
  const m = mean(nums)
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)))
}

function pctChange(current: number, baseline: number) {
  if (!baseline) return 0
  return Math.round(((current - baseline) / baseline) * 100)
}

function formatSleep(h: number) {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

export function healthBaseline(logs: HealthLog[], excludeLatest = true) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const window = excludeLatest && sorted.length > 3 ? sorted.slice(0, -1) : sorted
  const use = window.slice(-14)
  if (!use.length) {
    return {
      sleepHours: 7.1,
      sleepLabel: '7h 06m',
      restingHeartRate: 61,
      activity: 6200,
      n: 0,
    }
  }
  const sleep = mean(use.map((l) => l.sleepHours))
  const hr = mean(use.map((l) => l.restingHr))
  const steps = mean(use.map((l) => l.steps))
  return {
    sleepHours: Math.round(sleep * 10) / 10,
    sleepLabel: formatSleep(sleep),
    restingHeartRate: Math.round(hr),
    activity: Math.round(steps),
    n: use.length,
  }
}

export function latestHealth(logs: HealthLog[]) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.at(-1) ?? null
}

export function bodyDeviation(logs: HealthLog[]) {
  const baseline = healthBaseline(logs)
  const current = latestHealth(logs)
  if (!current) {
    return {
      baseline,
      current: null,
      deltas: { sleepPct: 0, restingHeartRatePct: 0, activityPct: 0 },
      score: 0.2,
    }
  }
  const sleepPct = pctChange(current.sleepHours, baseline.sleepHours)
  const restingHeartRatePct = pctChange(current.restingHr, baseline.restingHeartRate)
  const activityPct = pctChange(current.steps, baseline.activity)

  // Higher score = more anomalous in stressful direction
  const sleepZ = baseline.sleepHours
    ? (baseline.sleepHours - current.sleepHours) / Math.max(0.3, std(logs.map((l) => l.sleepHours)) || 0.5)
    : 0
  const hrZ = baseline.restingHeartRate
    ? (current.restingHr - baseline.restingHeartRate) /
      Math.max(1, std(logs.map((l) => l.restingHr)) || 2)
    : 0
  const stepZ = baseline.activity
    ? (baseline.activity - current.steps) / Math.max(400, std(logs.map((l) => l.steps)) || 800)
    : 0
  const raw = (Math.max(0, sleepZ) + Math.max(0, hrZ) + Math.max(0, stepZ)) / 3
  const score = Math.max(0, Math.min(1, 0.25 + raw * 0.35))

  return {
    baseline,
    current,
    deltas: { sleepPct, restingHeartRatePct, activityPct },
    score,
  }
}

export function languageDeviation(journals: JournalEntry[]) {
  const sorted = [...journals].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const recent = sorted.slice(-4).map((j) => j.analysis)
  const prior = sorted.slice(0, Math.max(0, sorted.length - 4)).map((j) => j.analysis)
  const now = aggregateLanguage(recent.length ? recent : sorted.map((j) => j.analysis))
  const then = aggregateLanguage(prior.length ? prior : recent)

  const urgencyDelta = now.urgency - then.urgency
  const score = Math.max(
    0,
    Math.min(
      1,
      (now.urgency * 0.35 + now.uncertainty * 0.3 + now.overwhelm * 0.2 + now.negativity * 0.15) / 100,
    ),
  )

  return {
    current: now,
    prior: then,
    urgencyDelta,
    score,
    latest: sorted.at(-1) ?? null,
  }
}

export function computeStressScore(
  body: number,
  language: number,
  context: number,
  messaging = 0.2,
) {
  const hasMessaging = messaging > 0.22
  const fused = hasMessaging
    ? body * 0.35 + language * 0.25 + messaging * 0.25 + context * 0.15
    : body * 0.4 + language * 0.4 + context * 0.2
  return Math.round(Math.max(5, Math.min(98, fused * 100)))
}

export function contextScore(topics: { name: string; mentions: number }[]) {
  const top = topics[0]
  if (!top) return 0.15
  return Math.min(1, (top.mentions * 0.18) + 0.15)
}

export function buildDaySeries(
  healthLogs: HealthLog[],
  journals: JournalEntry[],
  days = 7,
  messagingByDay?: Map<string, number>,
): DaySnapshot[] {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const slices: DaySnapshot[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const logsToDate = healthLogs.filter((h) => h.date <= date)
    const journalsToDate = journals.filter((j) => j.timestamp.slice(0, 10) <= date)
    const dayJournals = journals.filter((j) => j.timestamp.slice(0, 10) === date)

    const body = bodyDeviation(logsToDate)
    const lang = languageDeviation(journalsToDate)
    const ctx = contextScore(lang.current.topics)
    const messagingScore = messagingByDay?.get(date) ?? 0.2
    const score = computeStressScore(body.score, lang.score, ctx, messagingScore)
    const coOccurrence =
      body.score >= 0.45 && (lang.score >= 0.45 || messagingScore >= 0.45)
    const latestLog = latestHealth(logsToDate)
    const latestJournal = dayJournals.at(-1) ?? null

    slices.push({
      date,
      dayLabel: DAY[d.getDay()]!,
      score,
      bodyScore: body.score,
      languageScore: lang.score,
      messagingScore,
      contextScore: ctx,
      coOccurrence,
      sleepHours: latestLog?.sleepHours ?? null,
      restingHr: latestLog?.restingHr ?? null,
      steps: latestLog?.steps ?? null,
      language: lang.latest?.analysis ?? (lang.current.urgency ? ({
        urgency: lang.current.urgency,
        negativity: lang.current.negativity,
        uncertainty: lang.current.uncertainty,
        overwhelm: lang.current.overwhelm,
        topics: lang.current.topics.map((t) => ({ name: t.name, weight: t.mentions })),
        themes: [],
      } satisfies LanguageAnalysis) : null),
      transcript: latestJournal?.transcript ?? null,
      topics: lang.current.topics.map((t) => t.name),
    })
  }

  return slices
}

export function sleepLabel(h: number) {
  return formatSleep(h)
}
