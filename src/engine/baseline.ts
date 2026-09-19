import type { HealthMetric, HealthSignal, MetricDeviation } from '../types';

const METRIC_LABELS: Record<HealthMetric, string> = {
  sleep_hours: 'Sleep',
  resting_hr: 'Resting heart rate',
  hrv: 'Heart-rate variability',
  steps: 'Steps',
  exercise_minutes: 'Exercise',
  respiratory_rate: 'Respiratory rate',
};

/** Metrics where higher values often correlate with worse recovery in our prototype. */
const HIGHER_IS_WORSE: HealthMetric[] = ['resting_hr', 'respiratory_rate'];

export type BaselineStats = {
  metric: HealthMetric;
  mean: number;
  variance: number;
  std: number;
  n: number;
};

export function valuesForMetric(signals: HealthSignal[], metric: HealthMetric): HealthSignal[] {
  return signals
    .filter((s) => s.metric === metric)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Personal baseline from a trailing window, excluding the most recent `excludeRecent` days. */
export function computeBaseline(
  signals: HealthSignal[],
  metric: HealthMetric,
  options: { windowDays?: number; excludeRecent?: number } = {},
): BaselineStats | null {
  const { windowDays = 14, excludeRecent = 1 } = options;
  const series = valuesForMetric(signals, metric);
  if (series.length < 3) return null;

  const usable = series.slice(0, Math.max(0, series.length - excludeRecent));
  const window = usable.slice(-windowDays);
  if (window.length < 3) return null;

  const values = window.map((s) => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / Math.max(1, values.length - 1);
  const std = Math.sqrt(variance);

  return { metric, mean, variance, std, n: values.length };
}

/** Normalized deviation: positive = more “stressed” direction for that metric. */
export function deviationScore(stats: BaselineStats, current: number): number {
  const denom = stats.std > 0.01 ? stats.std : Math.max(Math.abs(stats.mean) * 0.05, 0.01);
  const z = (current - stats.mean) / denom;
  const directed = HIGHER_IS_WORSE.includes(stats.metric) ? z : -z;
  // squash to roughly 0..1 for fusion
  return Math.max(0, Math.min(1.5, (directed + 0.5) / 2));
}

export function metricDeviation(
  signals: HealthSignal[],
  metric: HealthMetric,
): MetricDeviation | null {
  const series = valuesForMetric(signals, metric);
  if (!series.length) return null;
  const current = series[series.length - 1]!.value;
  const baseline = computeBaseline(signals, metric);
  if (!baseline) return null;

  const changePct = baseline.mean === 0 ? 0 : ((current - baseline.mean) / baseline.mean) * 100;
  return {
    metric,
    label: METRIC_LABELS[metric],
    baseline: round(baseline.mean, metric === 'steps' ? 0 : 1),
    current: round(current, metric === 'steps' ? 0 : 1),
    changePct: round(changePct, 0),
    deviationScore: deviationScore(baseline, current),
  };
}

export function physiologicalAggregate(
  signals: HealthSignal[],
  metrics: HealthMetric[] = ['sleep_hours', 'resting_hr', 'hrv', 'steps'],
): { score: number; deviations: MetricDeviation[] } {
  const deviations = metrics
    .map((m) => metricDeviation(signals, m))
    .filter((d): d is MetricDeviation => d != null);

  if (!deviations.length) return { score: 0.3, deviations: [] };

  const avg =
    deviations.reduce((acc, d) => acc + d.deviationScore, 0) / deviations.length;
  return { score: Math.max(0, Math.min(1, avg)), deviations };
}

function round(n: number, places: number): number {
  const p = 10 ** places;
  return Math.round(n * p) / p;
}
