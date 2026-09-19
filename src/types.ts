export type HealthMetric =
  | 'sleep_hours'
  | 'resting_hr'
  | 'hrv'
  | 'steps'
  | 'exercise_minutes'
  | 'respiratory_rate';

export type HealthSignal = {
  userId: string;
  metric: HealthMetric;
  timestamp: string; // ISO date (day)
  value: number;
  source: 'apple_health' | 'demo';
};

export type JournalEntry = {
  id: string;
  userId: string;
  timestamp: string;
  transcript: string;
  durationSec: number;
  analysisId?: string;
};

export type LanguageAnalysis = {
  id: string;
  journalId: string;
  sentiment: number; // -1..1
  urgency: number; // 0..1
  uncertainty: number; // 0..1
  overwhelm: number; // 0..1
  emotionalSignals: string[];
  topics: { topic: string; weight: number }[];
  confidence: number;
};

export type MetricDeviation = {
  metric: HealthMetric;
  label: string;
  baseline: number;
  current: number;
  changePct: number;
  deviationScore: number;
};

export type StressSnapshot = {
  timestamp: string;
  score: number;
  baselineScore: number;
  change: number;
  confidence: number;
  physiologicalSignal: number;
  languageSignal: number;
  contextSignal: number;
  contributingFactors: string[];
  primaryTheme: string | null;
  uncertainty: string;
  metricDeviations: MetricDeviation[];
  languageChangePct: number;
  weekScores: number[];
};

export type InsightPayload = {
  stressSignal: number;
  confidence: number;
  primaryTheme: string;
  supportingSignals: string[];
  uncertainty: string;
  recommendedAction: 'reflection' | 'unpack' | 'breathe' | 'plan';
  heardThemes: string[];
};

export type ActionOption = {
  id: string;
  duration: string;
  title: string;
  body: string;
};

export type UserPreferences = {
  name: string;
  healthConnected: boolean;
  onboardingComplete: boolean;
  sharedMetrics: HealthMetric[];
};
