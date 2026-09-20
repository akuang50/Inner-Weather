import type { LanguageAnalysis } from './trackerTypes'

const URGENCY =
  /\b(asap|deadline|due|behind|freaking|urgent|immediately|now|hurry|running out|can't wait|pressure)\b/i
const NEGATIVE =
  /\b(hate|awful|terrible|worst|fail|failed|hopeless|miserable|angry|annoyed|sucks|stupid|can't|cannot|never)\b/i
const UNCERTAINTY =
  /\b(don't know|do not know|idk|unsure|maybe|confused|lost|where to start|no idea|uncertain|overwhelmed)\b/i
const OVERWHELM =
  /\b(everything|piling|too much|so much|overwhelmed|drowning|swamped|can't keep up|falling apart)\b/i
const AVOIDANCE =
  /\b(scroll|scrolling|procrastinat|put off|avoid|end up|instead of)\b/i

const TOPIC_RULES: { name: string; re: RegExp }[] = [
  { name: 'Project deadline', re: /\b(deadline|project|due friday|assignment|ship)\b/i },
  { name: 'School', re: /\b(exam|class|school|homework|midterm|finals?|lecture)\b/i },
  { name: 'Work', re: /\b(work|job|boss|meeting|internship|coworker)\b/i },
  { name: 'Sleep', re: /\b(sleep|insomnia|tired|exhausted|rest)\b/i },
  { name: 'Money', re: /\b(money|rent|broke|bills?|tuition)\b/i },
  { name: 'Relationships', re: /\b(friend|partner|family|relationship|roommate)\b/i },
  { name: 'Uncertainty', re: UNCERTAINTY },
  { name: 'Avoidance', re: AVOIDANCE },
]

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function hitRate(text: string, re: RegExp): number {
  const words = Math.max(1, text.trim().split(/\s+/).length)
  const matches = text.match(new RegExp(re.source, 'gi')) ?? []
  return matches.length / words
}

/** Deterministic language feature extraction from real text. */
export function analyzeLanguage(text: string): LanguageAnalysis {
  const t = text.trim()
  if (!t) {
    return {
      urgency: 0,
      negativity: 0,
      uncertainty: 0,
      overwhelm: 0,
      topics: [],
      themes: [],
    }
  }

  const urgency = clamp(
    8 + hitRate(t, URGENCY) * 900 + (URGENCY.test(t) ? 28 : 0) + (t.length < 80 && /!/.test(t) ? 10 : 0),
  )
  const negativity = clamp(5 + hitRate(t, NEGATIVE) * 800 + (NEGATIVE.test(t) ? 22 : 0))
  const uncertainty = clamp(5 + hitRate(t, UNCERTAINTY) * 850 + (UNCERTAINTY.test(t) ? 30 : 0))
  const overwhelm = clamp(5 + hitRate(t, OVERWHELM) * 800 + (OVERWHELM.test(t) ? 28 : 0))

  const topics = TOPIC_RULES.map(({ name, re }) => {
    const m = t.match(new RegExp(re.source, 'gi')) ?? []
    return { name, weight: m.length }
  })
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)

  const themes: string[] = []
  if (urgency >= 40 || topics.some((x) => x.name === 'Project deadline')) themes.push('Deadline pressure')
  if (uncertainty >= 35) themes.push('Uncertainty')
  if (AVOIDANCE.test(t)) themes.push('Avoidance')
  if (overwhelm >= 40) themes.push('Overwhelm')
  if (negativity >= 40) themes.push('Frustration')
  if (!themes.length) themes.push('Neutral check-in')

  return { urgency, negativity, uncertainty, overwhelm, topics, themes: themes.slice(0, 3) }
}

export function aggregateLanguage(analyses: LanguageAnalysis[]) {
  if (!analyses.length) {
    return { urgency: 0, negativity: 0, uncertainty: 0, overwhelm: 0, topics: [] as { name: string; mentions: number }[] }
  }
  const avg = (key: keyof Pick<LanguageAnalysis, 'urgency' | 'negativity' | 'uncertainty' | 'overwhelm'>) =>
    Math.round(analyses.reduce((s, a) => s + a[key], 0) / analyses.length)

  const topicMap = new Map<string, number>()
  for (const a of analyses) {
    for (const t of a.topics) {
      topicMap.set(t.name, (topicMap.get(t.name) ?? 0) + t.weight)
    }
  }
  const topics = [...topicMap.entries()]
    .map(([name, mentions]) => ({ name, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5)

  return {
    urgency: avg('urgency'),
    negativity: avg('negativity'),
    uncertainty: avg('uncertainty'),
    overwhelm: avg('overwhelm'),
    topics,
  }
}
