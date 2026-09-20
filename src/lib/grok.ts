import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { LanguageAnalysis } from './trackerTypes';
import { analyzeLanguage } from './language';

const KEY_STORAGE = 'stress-monitor-xai-key';
const MODEL = process.env.EXPO_PUBLIC_XAI_MODEL?.trim() || 'grok-3-mini';

async function readKey(): Promise<string | null> {
  const fromEnv = process.env.EXPO_PUBLIC_XAI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(KEY_STORAGE)?.trim() || null;
    }
    return (await SecureStore.getItemAsync(KEY_STORAGE))?.trim() || null;
  } catch {
    return null;
  }
}

export async function getXaiApiKey() {
  return readKey();
}

export async function setXaiApiKey(key: string) {
  const v = key.trim();
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(KEY_STORAGE, v);
    return;
  }
  await SecureStore.setItemAsync(KEY_STORAGE, v);
}

export async function clearXaiApiKey() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(KEY_STORAGE);
    return;
  }
  await SecureStore.deleteItemAsync(KEY_STORAGE);
}

export async function grokConfigured() {
  return !!(await readKey());
}

type GrokAnalysisResult = {
  analysis: LanguageAnalysis;
  reflection: string;
  strongest: string;
  source: 'grok' | 'local';
};

const SYSTEM = `You are the language intelligence layer for Stress Monitor, a wellness reflection tool (not a medical product).
Given a journal/voice transcript, return ONLY valid JSON with this shape:
{
  "urgency": 0-100,
  "negativity": 0-100,
  "uncertainty": 0-100,
  "overwhelm": 0-100,
  "topics": [{"name": string, "weight": number}],
  "themes": [string, string, string],
  "strongest": "urgency" | "uncertainty" | "overwhelm" | "negativity",
  "reflection": "2 short sentences. Empathetic, no diagnosis, no causation claims."
}
Never claim clinical conditions.`;

export async function analyzeWithGrok(
  transcript: string,
  extras?: { recentTopics?: string[]; bodySummary?: string },
): Promise<GrokAnalysisResult> {
  const key = await readKey();
  if (!key) {
    const analysis = analyzeLanguage(transcript);
    return {
      analysis,
      reflection: defaultReflection(analysis),
      strongest: pickStrongest(analysis),
      source: 'local',
    };
  }

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: JSON.stringify({
              transcript,
              recentTopics: extras?.recentTopics ?? [],
              bodySummary: extras?.bodySummary ?? null,
            }),
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Grok API ${res.status}`);

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as {
      urgency?: number;
      negativity?: number;
      uncertainty?: number;
      overwhelm?: number;
      topics?: { name: string; weight: number }[];
      themes?: string[];
      strongest?: string;
      reflection?: string;
    };

    const analysis: LanguageAnalysis = {
      urgency: clamp(parsed.urgency ?? 0),
      negativity: clamp(parsed.negativity ?? 0),
      uncertainty: clamp(parsed.uncertainty ?? 0),
      overwhelm: clamp(parsed.overwhelm ?? 0),
      topics: (parsed.topics ?? []).slice(0, 5).map((t) => ({
        name: String(t.name),
        weight: Number(t.weight) || 1,
      })),
      themes: (parsed.themes ?? []).slice(0, 3).map(String),
    };
    if (!analysis.themes.length) analysis.themes = analyzeLanguage(transcript).themes;

    return {
      analysis,
      reflection: parsed.reflection?.trim() || defaultReflection(analysis),
      strongest: parsed.strongest || pickStrongest(analysis),
      source: 'grok',
    };
  } catch {
    const analysis = analyzeLanguage(transcript);
    return {
      analysis,
      reflection: defaultReflection(analysis),
      strongest: pickStrongest(analysis),
      source: 'local',
    };
  }
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

function pickStrongest(a: LanguageAnalysis) {
  return (
    [
      { name: 'urgency', v: a.urgency },
      { name: 'uncertainty', v: a.uncertainty },
      { name: 'overwhelm', v: a.overwhelm },
      { name: 'negativity', v: a.negativity },
    ].sort((x, y) => y.v - x.v)[0]?.name ?? 'uncertainty'
  );
}

function defaultReflection(a: LanguageAnalysis) {
  if (a.uncertainty >= a.urgency && a.uncertainty >= 35) {
    return "You don't seem stuck on everything — you seem stuck on where to start.";
  }
  if (a.urgency >= 40) {
    return "There's a lot of urgency in what you said. Name one finishable next action.";
  }
  return 'Thanks for sharing. These are patterns to reflect on — not a diagnosis.';
}
