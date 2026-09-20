import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeLanguage } from './language';
import type { HealthLog, JournalEntry, TrackerState } from './trackerTypes';

const KEY = 'stress-monitor-tracker-v1';

function dayOffset(daysAgo: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo: number, hour = 21) {
  const d = new Date();
  d.setHours(hour, 10, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function seedTracker(): TrackerState {
  const healthLogs: HealthLog[] = Array.from({ length: 14 }).map((_, i) => {
    const daysAgo = 13 - i;
    const late = daysAgo <= 3;
    return {
      id: `seed-h-${daysAgo}`,
      date: dayOffset(daysAgo),
      sleepHours: late ? 5.4 + daysAgo * 0.15 : 6.9 + ((i % 3) - 1) * 0.2,
      restingHr: late ? 66 + (3 - daysAgo) : 60 + (i % 3),
      steps: late ? 3800 + daysAgo * 200 : 7000 + (i % 4) * 400,
      source: 'seed' as const,
    };
  });

  const texts = [
    { ago: 10, text: 'Pretty normal day. Classes were fine.' },
    { ago: 7, text: 'Started the project outline. Still early, feeling okay about it.' },
    {
      ago: 4,
      text: "I keep telling myself I'll work on the project tonight but I just end up scrolling. There's so much to do.",
    },
    {
      ago: 2,
      text: "I don't even know where to start. Everything is piling up and the deadline is Friday.",
    },
    {
      ago: 1,
      text: 'Project deadline keeps looping in my head. Slept badly. I have so much to do and I am behind.',
    },
  ];

  const journals: JournalEntry[] = texts.map((t, i) => ({
    id: `seed-j-${i}`,
    timestamp: isoDaysAgo(t.ago),
    transcript: t.text,
    durationSec: 20 + i * 4,
    source: 'seed' as const,
    analysis: analyzeLanguage(t.text),
  }));

  return { healthLogs, journals, seeded: true };
}

export async function loadTracker(): Promise<TrackerState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return seedTracker();
    const parsed = JSON.parse(raw) as TrackerState;
    if (!parsed.healthLogs?.length || !parsed.journals) return seedTracker();
    return parsed;
  } catch {
    return seedTracker();
  }
}

export async function saveTracker(state: TrackerState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function clearTracker() {
  await AsyncStorage.removeItem(KEY);
}
