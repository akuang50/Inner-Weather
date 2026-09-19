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
import { analyzeWithGrok, grokConfigured } from '../lib/grok'
import { useAuth } from './AuthProvider'
import { clearTracker, loadTracker, saveTracker, seedTracker } from '../lib/storage'
import {
  demoTonewatchDays,
  latestScoredDay,
  messagingSignalFromDays,
  toneExplainItems,
} from '../lib/tonewatch'
import type { HealthLog, JournalEntry, TonewatchDay } from '../lib/types'

type TrackerContextValue = {
  ready: boolean
  authenticated: boolean
  healthLogs: HealthLog[]
  journals: JournalEntry[]
  toneDays: TonewatchDay[]
  baseline: ReturnType<typeof bodyDeviation>['baseline']
  body: ReturnType<typeof bodyDeviation>
  language: ReturnType<typeof languageDeviation>
  messagingScore: number
  latestTone: TonewatchDay | null
  toneExplain: ReturnType<typeof toneExplainItems>
  daySeries: ReturnType<typeof buildDaySeries>
  stressScore: number
  coOccurrence: boolean
  realEntryCount: number
  grokEnabled: boolean
  addJournal: (
    transcript: string,
    opts?: { source?: 'voice' | 'typed'; durationSec?: number },
  ) => Promise<JournalEntry>
  logHealth: (input: { sleepHours: number; restingHr: number; steps: number }) => void
  resetToSeed: () => void
  clearAll: () => void
  refreshGrokFlag: () => void
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth()
  const [ready, setReady] = useState(false)
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([])
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [grokEnabled, setGrokEnabled] = useState(false)

  useEffect(() => {
    if (!authReady) return
    setGrokEnabled(grokConfigured())
    if (!user) {
      setHealthLogs([])
      setJournals([])
      setReady(true)
      return
    }
    const state = loadTracker(user.id)
    setHealthLogs(state.healthLogs)
    setJournals(state.journals)
    setReady(true)
  }, [authReady, user?.id])

  useEffect(() => {
    if (!ready || !user) return
    saveTracker({ healthLogs, journals, seeded: true }, user.id)
  }, [healthLogs, journals, ready, user?.id])

  const body = useMemo(() => bodyDeviation(healthLogs), [healthLogs])
  const language = useMemo(() => languageDeviation(journals), [journals])
  const toneDays = demoTonewatchDays
  const messagingScore = useMemo(() => messagingSignalFromDays(toneDays), [toneDays])
  const latestTone = useMemo(() => latestScoredDay(toneDays), [toneDays])
  const toneExplain = useMemo(() => toneExplainItems(toneDays), [toneDays])
  const messagingByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of toneDays) {
      if (d.stress_score == null) continue
      const z = d.z?.stress_score
      map.set(d.day, z != null ? Math.max(0, Math.min(1, 0.35 + z / 4)) : d.stress_score / 10)
    }
    return map
  }, [toneDays])
  const daySeries = useMemo(
    () => buildDaySeries(healthLogs, journals, 7, messagingByDay),
    [healthLogs, journals, messagingByDay],
  )
  const ctx = contextScore(language.current.topics)
  const stressScore = computeStressScore(body.score, language.score, ctx, messagingScore)
  const coOccurrence =
    body.score >= 0.45 && (language.score >= 0.45 || messagingScore >= 0.45)
  const realEntryCount =
    journals.filter((j) => j.source !== 'seed').length +
    healthLogs.filter((h) => h.source !== 'seed').length

  const refreshGrokFlag = useCallback(() => setGrokEnabled(grokConfigured()), [])

  const addJournal = useCallback(
    async (transcript: string, opts?: { source?: 'voice' | 'typed'; durationSec?: number }) => {
      if (!user) throw new Error('Sign in to save journal entries.')
      const bodySummary = body.current
        ? `sleep ${body.current.sleepHours}h (${body.deltas.sleepPct}% vs baseline), RHR ${body.current.restingHr} (${body.deltas.restingHeartRatePct}%), steps ${body.current.steps} (${body.deltas.activityPct}%)`
        : undefined
      const recentTopics = language.current.topics.map((t) => t.name)

      const grok = await analyzeWithGrok(transcript, { recentTopics, bodySummary })
      const entry: JournalEntry = {
        id: `j-${Date.now()}`,
        timestamp: new Date().toISOString(),
        transcript: transcript.trim(),
        durationSec: opts?.durationSec ?? Math.max(5, Math.round(transcript.split(/\s+/).length / 2)),
        source: opts?.source ?? 'typed',
        analysis: grok.analysis,
        reflection: grok.reflection,
        analysisSource: grok.source,
      }
      setJournals((prev) => [...prev, entry])
      return entry
    },
    [body, language.current.topics, user],
  )

  const logHealth = useCallback((input: { sleepHours: number; restingHr: number; steps: number }) => {
    if (!user) return
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
  }, [user])

  const resetToSeed = useCallback(() => {
    if (!user) return
    const seeded = seedTracker()
    setHealthLogs(seeded.healthLogs)
    setJournals(seeded.journals)
  }, [user])

  const clearAll = useCallback(() => {
    if (!user) return
    clearTracker(user.id)
    setHealthLogs([])
    setJournals([])
  }, [user])

  const value: TrackerContextValue = {
    ready: ready && authReady,
    authenticated: Boolean(user),
    healthLogs,
    journals,
    toneDays,
    baseline: body.baseline,
    body,
    language,
    messagingScore,
    latestTone,
    toneExplain,
    daySeries,
    stressScore,
    coOccurrence,
    realEntryCount,
    grokEnabled,
    addJournal,
    logHealth,
    resetToSeed,
    clearAll,
    refreshGrokFlag,
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
