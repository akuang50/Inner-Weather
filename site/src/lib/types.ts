export type HealthLog = {
  id: string
  date: string // YYYY-MM-DD
  sleepHours: number
  restingHr: number
  steps: number
  source: 'manual' | 'seed'
}

export type JournalEntry = {
  id: string
  timestamp: string
  transcript: string
  durationSec: number
  source: 'voice' | 'typed' | 'seed'
  analysis: LanguageAnalysis
  reflection?: string
  analysisSource?: 'grok' | 'local'
}

export type LanguageAnalysis = {
  urgency: number // 0-100
  negativity: number
  uncertainty: number
  overwhelm: number
  topics: { name: string; weight: number }[]
  themes: string[]
}

export type DaySnapshot = {
  date: string
  dayLabel: string
  score: number
  bodyScore: number
  languageScore: number
  messagingScore: number
  contextScore: number
  coOccurrence: boolean
  sleepHours: number | null
  restingHr: number | null
  steps: number | null
  language: LanguageAnalysis | null
  transcript: string | null
  topics: string[]
}

/** One day from Tonewatch scores.json (no message text). */
export type TonewatchDay = {
  day: string
  n_out?: number
  stress_score: number | null
  confidence?: number
  dominant_emotions?: string[]
  signals?: string[]
  insufficient?: boolean
  z?: Record<string, number | null>
  flags?: string[]
}

export type TrackerState = {
  healthLogs: HealthLog[]
  journals: JournalEntry[]
  seeded: boolean
}

export type CoachTone = 'warm' | 'gentle' | 'grounding' | 'encouraging'

export type MessageStressSnapshot = {
  score: number
  urgency: number
  overwhelm: number
  uncertainty: number
  negativity: number
  elevated: boolean
  themes: string[]
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  stress?: MessageStressSnapshot
  coachTone?: CoachTone
}

export type ChatSessionDebrief = {
  summary: string
  stressArc: string
  whatHelped: string[]
  followUp: string
  peakStress: number
  memorySnippet: string
}

export type ChatSessionRecord = {
  id: string
  startedAt: string
  endedAt?: string
  status: 'active' | 'completed'
  messages: ChatMessage[]
  debrief?: ChatSessionDebrief
}

export type ChatStore = {
  sessions: ChatSessionRecord[]
  activeSessionId: string | null
}
