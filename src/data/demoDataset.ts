import type { HealthMetric, HealthSignal, JournalEntry, LanguageAnalysis } from '../types';

const USER_ID = 'alex';

/** Demo persona: quiet early week → rising stress into Friday project deadline. */
function dayOffset(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function signal(metric: HealthMetric, daysAgo: number, value: number): HealthSignal {
  return {
    userId: USER_ID,
    metric,
    timestamp: dayOffset(daysAgo),
    value,
    source: 'demo',
  };
}

/** 14 days of health: days 13–4 ~baseline, then sleep/HR degrade. */
export const demoHealthSignals: HealthSignal[] = [
  // Sleep hours (baseline ~7.2)
  ...[7.1, 7.4, 7.0, 7.3, 7.2, 6.9, 7.5, 7.1, 7.0, 6.8, 6.2, 5.8, 5.5, 5.4].map((v, i) =>
    signal('sleep_hours', 13 - i, v),
  ),
  // Resting HR (baseline ~61)
  ...[60, 61, 59, 62, 61, 60, 62, 61, 63, 64, 66, 67, 68, 68].map((v, i) =>
    signal('resting_hr', 13 - i, v),
  ),
  // HRV ms (baseline ~52) — lower is often worse recovery
  ...[54, 51, 53, 52, 50, 55, 52, 49, 48, 45, 42, 40, 39, 38].map((v, i) =>
    signal('hrv', 13 - i, v),
  ),
  // Steps
  ...[8200, 9100, 7800, 8500, 8700, 7600, 9200, 8000, 7400, 6100, 5200, 4800, 4100, 3900].map(
    (v, i) => signal('steps', 13 - i, v),
  ),
];

export const demoJournals: JournalEntry[] = [
  {
    id: 'j1',
    userId: USER_ID,
    timestamp: `${dayOffset(10)}T21:00:00.000Z`,
    transcript: 'Pretty normal day. Classes were fine. Might go for a walk later.',
    durationSec: 18,
    analysisId: 'a1',
  },
  {
    id: 'j2',
    userId: USER_ID,
    timestamp: `${dayOffset(7)}T20:30:00.000Z`,
    transcript: 'Started the project outline. Still early, feeling okay about it.',
    durationSec: 22,
    analysisId: 'a2',
  },
  {
    id: 'j3',
    userId: USER_ID,
    timestamp: `${dayOffset(4)}T22:10:00.000Z`,
    transcript:
      "I keep telling myself I'll work on the project tonight but I just end up scrolling. There's so much to do.",
    durationSec: 35,
    analysisId: 'a3',
  },
  {
    id: 'j4',
    userId: USER_ID,
    timestamp: `${dayOffset(2)}T23:05:00.000Z`,
    transcript:
      "I don't even know where to start. Everything is piling up and the deadline is Friday.",
    durationSec: 40,
    analysisId: 'a4',
  },
  {
    id: 'j5',
    userId: USER_ID,
    timestamp: `${dayOffset(1)}T22:40:00.000Z`,
    transcript:
      'Project deadline keeps looping in my head. Slept badly. I have so much to do and I am behind.',
    durationSec: 38,
    analysisId: 'a5',
  },
  {
    id: 'j6',
    userId: USER_ID,
    timestamp: `${dayOffset(0)}T09:15:00.000Z`,
    transcript:
      "I'm honestly freaking out about this project. I keep saying I'll start and then I don't. I don't know where to begin.",
    durationSec: 42,
    analysisId: 'a6',
  },
];

export const demoAnalyses: LanguageAnalysis[] = [
  {
    id: 'a1',
    journalId: 'j1',
    sentiment: 0.2,
    urgency: 0.1,
    uncertainty: 0.15,
    overwhelm: 0.1,
    emotionalSignals: ['neutral', 'calm'],
    topics: [{ topic: 'school', weight: 0.3 }],
    confidence: 0.7,
  },
  {
    id: 'a2',
    journalId: 'j2',
    sentiment: 0.15,
    urgency: 0.2,
    uncertainty: 0.2,
    overwhelm: 0.15,
    emotionalSignals: ['focus'],
    topics: [
      { topic: 'project deadline', weight: 0.4 },
      { topic: 'school', weight: 0.35 },
    ],
    confidence: 0.72,
  },
  {
    id: 'a3',
    journalId: 'j3',
    sentiment: -0.35,
    urgency: 0.45,
    uncertainty: 0.4,
    overwhelm: 0.5,
    emotionalSignals: ['avoidance', 'overwhelm'],
    topics: [
      { topic: 'project deadline', weight: 0.7 },
      { topic: 'avoidance', weight: 0.55 },
    ],
    confidence: 0.8,
  },
  {
    id: 'a4',
    journalId: 'j4',
    sentiment: -0.5,
    urgency: 0.65,
    uncertainty: 0.7,
    overwhelm: 0.72,
    emotionalSignals: ['uncertainty', 'overwhelm', 'urgency'],
    topics: [
      { topic: 'project deadline', weight: 0.85 },
      { topic: 'school', weight: 0.4 },
    ],
    confidence: 0.84,
  },
  {
    id: 'a5',
    journalId: 'j5',
    sentiment: -0.55,
    urgency: 0.75,
    uncertainty: 0.55,
    overwhelm: 0.7,
    emotionalSignals: ['urgency', 'anxiety-like language'],
    topics: [
      { topic: 'project deadline', weight: 0.9 },
      { topic: 'sleep', weight: 0.35 },
    ],
    confidence: 0.86,
  },
  {
    id: 'a6',
    journalId: 'j6',
    sentiment: -0.6,
    urgency: 0.8,
    uncertainty: 0.78,
    overwhelm: 0.8,
    emotionalSignals: ['overwhelm', 'uncertainty', 'urgency'],
    topics: [
      { topic: 'project deadline', weight: 0.95 },
      { topic: 'avoidance', weight: 0.6 },
    ],
    confidence: 0.88,
  },
];

export const DEMO_USER = {
  id: USER_ID,
  name: 'Alex',
  preferences: {
    name: 'Alex',
    healthConnected: true,
    onboardingComplete: false,
    sharedMetrics: ['sleep_hours', 'resting_hr', 'hrv', 'steps'] as HealthMetric[],
  },
};
