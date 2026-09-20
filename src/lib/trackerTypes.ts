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
  contextScore: number
  coOccurrence: boolean
  sleepHours: number | null
  restingHr: number | null
  steps: number | null
  language: LanguageAnalysis | null
  transcript: string | null
  topics: string[]
}

export type TrackerState = {
  healthLogs: HealthLog[]
  journals: JournalEntry[]
  seeded: boolean
}
