import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  DEMO_USER,
  demoAnalyses,
  demoHealthSignals,
  demoJournals,
} from '../data/demoDataset';
import { analyzeTranscriptLocally, buildInsight, computeStressSnapshot } from '../engine/stress';
import type {
  InsightPayload,
  JournalEntry,
  LanguageAnalysis,
  StressSnapshot,
  UserPreferences,
} from '../types';

type AppState = {
  preferences: UserPreferences;
  journals: JournalEntry[];
  analyses: LanguageAnalysis[];
  snapshot: StressSnapshot;
  latestInsight: InsightPayload | null;
  completeOnboarding: () => void;
  connectHealth: () => void;
  addRant: (transcript: string, durationSec: number) => InsightPayload;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEMO_USER.preferences);
  const [journals, setJournals] = useState(demoJournals);
  const [analyses, setAnalyses] = useState(demoAnalyses);
  const [latestInsight, setLatestInsight] = useState<InsightPayload | null>(null);

  const snapshot = useMemo(
    () => computeStressSnapshot(demoHealthSignals, analyses),
    [analyses],
  );

  const completeOnboarding = useCallback(() => {
    setPreferences((p) => ({ ...p, onboardingComplete: true, healthConnected: true }));
  }, []);

  const connectHealth = useCallback(() => {
    setPreferences((p) => ({ ...p, healthConnected: true }));
  }, []);

  const addRant = useCallback((transcript: string, durationSec: number) => {
    const analysis = analyzeTranscriptLocally(transcript);
    const entry: JournalEntry = {
      id: `j-${Date.now()}`,
      userId: DEMO_USER.id,
      timestamp: new Date().toISOString(),
      transcript,
      durationSec,
      analysisId: analysis.id,
    };
    analysis.journalId = entry.id;

    const nextAnalyses = [...analyses, analysis];
    const snap = computeStressSnapshot(demoHealthSignals, nextAnalyses);
    const insight = buildInsight(snap, transcript);

    setJournals((prev) => [...prev, entry]);
    setAnalyses(nextAnalyses);
    setLatestInsight(insight);
    return insight;
  }, [analyses]);

  const value: AppState = {
    preferences,
    journals,
    analyses,
    snapshot,
    latestInsight,
    completeOnboarding,
    connectHealth,
    addRant,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
