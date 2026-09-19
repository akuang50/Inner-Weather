import type { LanguageAnalysis } from './types'
import { analyzeLanguage } from './language'

const KEY_STORAGE = 'stress-monitor-xai-key'
const MODEL =
  (import.meta.env.VITE_XAI_MODEL as string | undefined)?.trim() || 'grok-3-mini'

export function getXaiApiKey(): string | null {
  const fromEnv = import.meta.env.VITE_XAI_API_KEY as string | undefined
  if (fromEnv?.trim()) return fromEnv.trim()
  try {
    return localStorage.getItem(KEY_STORAGE)?.trim() || null
  } catch {
    return null
  }
}

export function setXaiApiKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key.trim())
}

export function clearXaiApiKey() {
  localStorage.removeItem(KEY_STORAGE)
}

export function grokConfigured() {
  return !!getXaiApiKey()
}

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function completeWithGrok(params: {
  system: string
  messages: ChatCompletionMessage[]
  temperature?: number
  json?: boolean
}): Promise<string | null> {
  const key = getXaiApiKey()
  if (!key) return null

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: params.temperature ?? 0.5,
      ...(params.json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: params.system }, ...params.messages],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Grok API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return data.choices?.[0]?.message?.content?.trim() ?? null
}

type GrokAnalysisResult = {
  analysis: LanguageAnalysis
  reflection: string
  strongest: string
  source: 'grok' | 'local'
}

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
Focus on change and stressors the person named. Prefer themes like Deadline pressure, Uncertainty, Avoidance, Overwhelm, Fatigue.
Never claim clinical conditions.`

export async function analyzeWithGrok(
  transcript: string,
  extras?: { recentTopics?: string[]; bodySummary?: string },
): Promise<GrokAnalysisResult> {
  const key = getXaiApiKey()
  if (!key) {
    const analysis = analyzeLanguage(transcript)
    return {
      analysis,
      reflection: defaultReflection(analysis),
      strongest: pickStrongest(analysis),
      source: 'local',
    }
  }

  try {
    const userPayload = {
      transcript,
      recentTopics: extras?.recentTopics ?? [],
      bodySummary: extras?.bodySummary ?? null,
    }

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
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Grok API ${res.status}: ${errText.slice(0, 200)}`)
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const raw = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(raw) as {
      urgency?: number
      negativity?: number
      uncertainty?: number
      overwhelm?: number
      topics?: { name: string; weight: number }[]
      themes?: string[]
      strongest?: string
      reflection?: string
    }

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
    }

    if (!analysis.themes.length) {
      analysis.themes = analyzeLanguage(transcript).themes
    }

    return {
      analysis,
      reflection: parsed.reflection?.trim() || defaultReflection(analysis),
      strongest: parsed.strongest || pickStrongest(analysis),
      source: 'grok',
    }
  } catch (e) {
    console.warn('Grok analysis failed, falling back to local', e)
    const analysis = analyzeLanguage(transcript)
    return {
      analysis,
      reflection: defaultReflection(analysis),
      strongest: pickStrongest(analysis),
      source: 'local',
    }
  }
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)))
}

function pickStrongest(a: LanguageAnalysis) {
  const ranking = [
    { name: 'urgency', v: a.urgency },
    { name: 'uncertainty', v: a.uncertainty },
    { name: 'overwhelm', v: a.overwhelm },
    { name: 'negativity', v: a.negativity },
  ].sort((x, y) => y.v - x.v)
  return ranking[0]?.name ?? 'uncertainty'
}

function defaultReflection(a: LanguageAnalysis) {
  if (a.uncertainty >= a.urgency && a.uncertainty >= 35) {
    return "You don't seem stuck on everything — you seem stuck on where to start. Want three concrete next steps?"
  }
  if (a.urgency >= 40) {
    return "There's a lot of urgency in what you said. Naming one finishable next action can lower the pressure."
  }
  return 'Thanks for sharing. These signals are patterns to reflect on — not a diagnosis.'
}
