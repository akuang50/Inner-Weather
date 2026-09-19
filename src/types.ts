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

/** One day from Tonewatch `scores.json` (no message text — scores/tags only). */
export type TonewatchDay = {
  day: string;
  n_out?: number;
  mean_len?: number;
  late_night?: number;
  excl_rate?: number;
  caps_rate?: number;
  median_latency_min?: number | null;
  stress_score: number | null;
  score_spread?: number;
  confidence?: number;
  dominant_emotions?: string[];
  signals?: string[];
  evidence_times?: string[];
  insufficient?: boolean;
  samples_ok?: number;
  z?: Record<string, number | null>;
  flags?: string[];
};

export type StressSnapshot = {
  timestamp: string;
  score: number;
  baselineScore: number;
  change: number;
  confidence: number;
  physiologicalSignal: number;
  languageSignal: number;
  /** 0–1 tone signal from Tonewatch (outgoing message tone vs personal baseline). */
  messagingSignal: number;
  contextSignal: number;
  contributingFactors: string[];
  primaryTheme: string | null;
  uncertainty: string;
  metricDeviations: MetricDeviation[];
  languageChangePct: number;
  /** Percent change narrative for message-tone vs a calm personal baseline. */
  messagingChangePct: number;
  weekScores: number[];
  /** Most recent Tonewatch day with a score (for UI). */
  latestTone: TonewatchDay | null;
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
