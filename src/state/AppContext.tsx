import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  bodyDeviation,
  buildDaySeries,
  computeStressScore,
  contextScore,
  languageDeviation,
  sleepLabel,
} from '../lib/baseline';
import { analyzeWithGrok, clearXaiApiKey, getXaiApiKey, grokConfigured, setXaiApiKey } from '../lib/grok';
import { clearTracker, loadTracker, saveTracker, seedTracker } from '../lib/storage';
import type { HealthLog, JournalEntry } from '../lib/trackerTypes';

const ONBOARDING_KEY = 'stress-monitor-onboarding-v1';

type TrackerContextValue = {
  ready: boolean;
  onboardingComplete: boolean;
  healthLogs: HealthLog[];
  journals: JournalEntry[];
  baseline: ReturnType<typeof bodyDeviation>['baseline'];
  body: ReturnType<typeof bodyDeviation>;
  language: ReturnType<typeof languageDeviation>;
  daySeries: ReturnType<typeof buildDaySeries>;
  stressScore: number;
  coOccurrence: boolean;
  realEntryCount: number;
  grokEnabled: boolean;
  latestReflection: string | null;
  completeOnboarding: () => void;
  addJournal: (
    transcript: string,
    opts?: { source?: 'voice' | 'typed'; durationSec?: number },
  ) => Promise<JournalEntry>;
  logHealth: (input: { sleepHours: number; restingHr: number; steps: number }) => void;
  resetToSeed: () => void;
  clearAll: () => void;
  saveGrokKey: (key: string) => Promise<void>;
  removeGrokKey: () => Promise<void>;
  refreshGrokFlag: () => Promise<void>;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [grokEnabled, setGrokEnabled] = useState(false);
  const [latestReflection, setLatestReflection] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [state, onboarded] = await Promise.all([
        loadTracker(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      setHealthLogs(state.healthLogs);
      setJournals(state.journals);
      setOnboardingComplete(onboarded === '1');
      setGrokEnabled(await grokConfigured());
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveTracker({ healthLogs, journals, seeded: true });
  }, [healthLogs, journals, ready]);

  const body = useMemo(() => bodyDeviation(healthLogs), [healthLogs]);
  const language = useMemo(() => languageDeviation(journals), [journals]);
  const daySeries = useMemo(() => buildDaySeries(healthLogs, journals, 7), [healthLogs, journals]);
  const ctx = contextScore(language.current.topics);
  const stressScore = computeStressScore(body.score, language.score, ctx);
  const coOccurrence = body.score >= 0.45 && language.score >= 0.45;
  const realEntryCount =
    journals.filter((j) => j.source !== 'seed').length +
    healthLogs.filter((h) => h.source !== 'seed').length;

  const refreshGrokFlag = useCallback(async () => {
    setGrokEnabled(await grokConfigured());
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    void AsyncStorage.setItem(ONBOARDING_KEY, '1');
  }, []);

  const addJournal = useCallback(
    async (transcript: string, opts?: { source?: 'voice' | 'typed'; durationSec?: number }) => {
      const bodySummary = body.current
        ? `sleep ${body.current.sleepHours}h (${body.deltas.sleepPct}% vs baseline), RHR ${body.current.restingHr} (${body.deltas.restingHeartRatePct}%), steps ${body.current.steps}`
        : undefined;
      const grok = await analyzeWithGrok(transcript, {
        recentTopics: language.current.topics.map((t) => t.name),
        bodySummary,
      });
      const entry: JournalEntry = {
        id: `j-${Date.now()}`,
        timestamp: new Date().toISOString(),
        transcript: transcript.trim(),
        durationSec: opts?.durationSec ?? Math.max(5, Math.round(transcript.split(/\s+/).length / 2)),
        source: opts?.source ?? 'typed',
        analysis: grok.analysis,
        reflection: grok.reflection,
        analysisSource: grok.source,
      };
      setJournals((prev) => [...prev, entry]);
      setLatestReflection(grok.reflection);
      return entry;
    },
    [body, language.current.topics],
  );

  const logHealth = useCallback((input: { sleepHours: number; restingHr: number; steps: number }) => {
    const date = new Date().toISOString().slice(0, 10);
    setHealthLogs((prev) => [
      ...prev.filter((h) => h.date !== date),
      {
        id: `h-${Date.now()}`,
        date,
        sleepHours: input.sleepHours,
        restingHr: input.restingHr,
        steps: input.steps,
        source: 'manual',
      },
    ]);
  }, []);

  const resetToSeed = useCallback(() => {
    const seeded = seedTracker();
    setHealthLogs(seeded.healthLogs);
    setJournals(seeded.journals);
  }, []);

  const clearAll = useCallback(async () => {
    await clearTracker();
    setHealthLogs([]);
    setJournals([]);
  }, []);

  const saveGrokKey = useCallback(async (key: string) => {
    await setXaiApiKey(key);
    await refreshGrokFlag();
  }, [refreshGrokFlag]);

  const removeGrokKey = useCallback(async () => {
    await clearXaiApiKey();
    await refreshGrokFlag();
  }, [refreshGrokFlag]);

  const value: TrackerContextValue = {
    ready,
    onboardingComplete,
    healthLogs,
    journals,
    baseline: body.baseline,
    body,
    language,
    daySeries,
    stressScore,
    coOccurrence,
    realEntryCount,
    grokEnabled,
    latestReflection,
    completeOnboarding,
    addJournal,
    logHealth,
    resetToSeed,
    clearAll,
    saveGrokKey,
    removeGrokKey,
    refreshGrokFlag,
  };

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useApp(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function formatSleep(hours: number | null | undefined) {
  if (hours == null) return '—';
  return sleepLabel(hours);
}

// keep getXaiApiKey available for track screen prefill
export { getXaiApiKey };
