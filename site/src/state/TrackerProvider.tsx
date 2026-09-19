import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  bodyDeviation,
  buildDaySeries,
  computeStressScore,
  contextScore,
  languageDeviation,
  sleepLabel,
} from '../lib/baseline'
import { analyzeLanguage } from '../lib/language'
import { clearTracker, loadTracker, saveTracker, seedTracker } from '../lib/storage'
import type { HealthLog, JournalEntry } from '../lib/types'

type TrackerContextValue = {
  ready: boolean
  healthLogs: HealthLog[]
  journals: JournalEntry[]
  baseline: ReturnType<typeof bodyDeviation>['baseline']
  body: ReturnType<typeof bodyDeviation>
  language: ReturnType<typeof languageDeviation>
  daySeries: ReturnType<typeof buildDaySeries>
  stressScore: number
  coOccurrence: boolean
  realEntryCount: number
  addJournal: (transcript: string, opts?: { source?: 'voice' | 'typed'; durationSec?: number }) => JournalEntry
  logHealth: (input: { sleepHours: number; restingHr: number; steps: number }) => void
  resetToSeed: () => void
  clearAll: () => void
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([])
  const [journals, setJournals] = useState<JournalEntry[]>([])

  useEffect(() => {
    const state = loadTracker()
    setHealthLogs(state.healthLogs)
    setJournals(state.journals)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveTracker({ healthLogs, journals, seeded: true })
  }, [healthLogs, journals, ready])

  const body = useMemo(() => bodyDeviation(healthLogs), [healthLogs])
  const language = useMemo(() => languageDeviation(journals), [journals])
  const daySeries = useMemo(() => buildDaySeries(healthLogs, journals, 7), [healthLogs, journals])
  const ctx = contextScore(language.current.topics)
  const stressScore = computeStressScore(body.score, language.score, ctx)
  const coOccurrence = body.score >= 0.45 && language.score >= 0.45
  const realEntryCount =
    journals.filter((j) => j.source !== 'seed').length +
    healthLogs.filter((h) => h.source !== 'seed').length

  const addJournal = useCallback(
    (transcript: string, opts?: { source?: 'voice' | 'typed'; durationSec?: number }) => {
      const analysis = analyzeLanguage(transcript)
      const entry: JournalEntry = {
        id: `j-${Date.now()}`,
        timestamp: new Date().toISOString(),
        transcript: transcript.trim(),
        durationSec: opts?.durationSec ?? Math.max(5, Math.round(transcript.split(/\s+/).length / 2)),
        source: opts?.source ?? 'typed',
        analysis,
      }
      setJournals((prev) => [...prev, entry])
      return entry
    },
    [],
  )

  const logHealth = useCallback((input: { sleepHours: number; restingHr: number; steps: number }) => {
    const date = new Date().toISOString().slice(0, 10)
    setHealthLogs((prev) => {
      const withoutToday = prev.filter((h) => h.date !== date)
      return [
        ...withoutToday,
        {
          id: `h-${Date.now()}`,
          date,
          sleepHours: input.sleepHours,
          restingHr: input.restingHr,
          steps: input.steps,
          source: 'manual',
        },
      ]
    })
  }, [])

  const resetToSeed = useCallback(() => {
    const seeded = seedTracker()
    setHealthLogs(seeded.healthLogs)
    setJournals(seeded.journals)
  }, [])

  const clearAll = useCallback(() => {
    clearTracker()
    setHealthLogs([])
    setJournals([])
  }, [])

  const value: TrackerContextValue = {
    ready,
    healthLogs,
    journals,
    baseline: body.baseline,
    body,
    language,
    daySeries,
    stressScore,
    coOccurrence,
    realEntryCount,
    addJournal,
    logHealth,
    resetToSeed,
    clearAll,
  }

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}

export function useTracker() {
  const ctx = useContext(TrackerContext)
  if (!ctx) throw new Error('useTracker must be used within TrackerProvider')
  return ctx
}

export function useSleepLabel(hours: number | null | undefined) {
  if (hours == null) return '—'
  return sleepLabel(hours)
}
