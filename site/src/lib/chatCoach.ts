import { analyzeLanguage } from './language'
import { completeWithGrok } from './grok'
import type {
  ChatMessage,
  ChatSessionDebrief,
  ChatSessionRecord,
  CoachTone,
  MessageStressSnapshot,
} from './types'

export type TrackerCoachContext = {
  displayName: string
  stressScore: number
  coOccurrence: boolean
  bodySummary: string | null
  baselineSummary: string | null
  recentThemes: string[]
  recentTopics: string[]
  grokEnabled: boolean
}

const COACH_SYSTEM = `You are Inner Weather Coach — a calm wellness companion (not a therapist or doctor).
You monitor language for stress signals and help the user decompress when elevated.

Rules:
- No medical diagnosis or certainty about causes. Use "might", "could", "patterns suggest".
- When stress is elevated, shift to a softer, slower tone (grounding or gentle): shorter sentences, validation first, then one concrete destress step (breath, break, single next action, body check-in).
- Reference the user's tracker context when relevant (sleep, RHR, baselines, past themes) without being creepy.
- Remember prior session snippets when provided — continuity matters.
- Never claim to read minds. Reflect what they said.

Return ONLY valid JSON:
{
  "reply": "string, 2-5 sentences max unless user asked for a list",
  "coachTone": "warm" | "gentle" | "grounding" | "encouraging",
  "stressDetected": boolean,
  "stressScore": 0-100,
  "destressTechniques": ["string", "..."]
}`

const DEBRIEF_SYSTEM = `You debrief a completed coaching chat for Inner Weather (wellness, not clinical).
Return ONLY valid JSON:
{
  "summary": "3-4 sentences on what the user shared and how stress shifted",
  "stressArc": "1-2 sentences on how stress changed during the chat",
  "whatHelped": ["technique or insight", "..."],
  "followUp": "1 sentence gentle suggestion for before next session",
  "memorySnippet": "2 sentences max for future sessions — themes and what helps this user, no private quotes"
}`

export function analyzeMessageStress(text: string): MessageStressSnapshot {
  const a = analyzeLanguage(text)
  const score = Math.max(a.urgency, a.negativity, a.uncertainty, a.overwhelm)
  return {
    score,
    urgency: a.urgency,
    negativity: a.negativity,
    uncertainty: a.uncertainty,
    overwhelm: a.overwhelm,
    elevated: score >= 45,
    themes: a.themes,
  }
}

export function pickCoachTone(stress: MessageStressSnapshot, prevPeak: number): CoachTone {
  if (stress.score >= 65 || (stress.elevated && stress.score >= prevPeak - 5)) return 'grounding'
  if (stress.elevated) return 'gentle'
  if (prevPeak >= 50 && stress.score < 40) return 'encouraging'
  return 'warm'
}

function toneLabel(tone: CoachTone) {
  switch (tone) {
    case 'grounding':
      return 'Grounding — slower pace, breath and body first'
    case 'gentle':
      return 'Gentle — validating, one small step'
    case 'encouraging':
      return 'Encouraging — noticing ease returning'
    default:
      return 'Warm — curious check-in'
  }
}

function buildMemoryBlock(sessions: ChatSessionRecord[]) {
  return sessions
    .filter((s) => s.status === 'completed' && s.debrief?.memorySnippet)
    .slice(-3)
    .map((s) => `- ${s.debrief!.memorySnippet}`)
    .join('\n')
}

function sessionPeak(messages: ChatMessage[]) {
  return messages.reduce((max, m) => Math.max(max, m.stress?.score ?? 0), 0)
}

export async function generateOpeningReply(
  ctx: TrackerCoachContext,
  pastSessions: ChatSessionRecord[],
): Promise<{ message: ChatMessage; source: 'grok' | 'local' }> {
  const memory = buildMemoryBlock(pastSessions)
  const payload = {
    tracker: {
      stressScore: ctx.stressScore,
      coOccurrence: ctx.coOccurrence,
      body: ctx.bodySummary,
      baseline: ctx.baselineSummary,
      themes: ctx.recentThemes,
      topics: ctx.recentTopics,
    },
    pastSessionMemory: memory || null,
    instruction: `Greet ${ctx.displayName} and invite them to share what's on their mind. Mention you can use their tracker context if helpful. One short paragraph.`,
  }

  const grok = await completeWithGrok({
    system: COACH_SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
    json: true,
    temperature: 0.4,
  })

  if (grok) {
    try {
      const parsed = JSON.parse(grok) as { reply?: string; coachTone?: CoachTone }
      return {
        source: 'grok',
        message: {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: parsed.reply?.trim() || localOpening(ctx),
          timestamp: new Date().toISOString(),
          coachTone: parsed.coachTone ?? 'warm',
        },
      }
    } catch {
      /* fall through */
    }
  }

  return {
    source: 'local',
    message: {
      id: `m-${Date.now()}`,
      role: 'assistant',
      content: localOpening(ctx),
      timestamp: new Date().toISOString(),
      coachTone: 'warm',
    },
  }
}

function localOpening(ctx: TrackerCoachContext) {
  const hint =
    ctx.stressScore >= 45
      ? 'Your signals look a bit elevated versus your baseline — we can go at your pace.'
      : 'We can use your sleep and journal patterns if that helps.'
  return `Hey ${ctx.displayName}. This is a private check-in space. What's weighing on you right now? ${hint}`
}

export async function generateCoachReply(input: {
  userText: string
  stress: MessageStressSnapshot
  tone: CoachTone
  ctx: TrackerCoachContext
  session: ChatSessionRecord
  pastSessions: ChatSessionRecord[]
}): Promise<{ message: ChatMessage; source: 'grok' | 'local' }> {
  const history = input.session.messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const payload = {
    userMessage: input.userText,
    stressSignals: input.stress,
    requestedTone: input.tone,
    toneGuide: toneLabel(input.tone),
    tracker: {
      stressScore: input.ctx.stressScore,
      coOccurrence: input.ctx.coOccurrence,
      body: input.ctx.bodySummary,
      baseline: input.ctx.baselineSummary,
      themes: input.ctx.recentThemes,
    },
    pastSessionMemory: buildMemoryBlock(input.pastSessions) || null,
    sessionPeakStress: sessionPeak(input.session.messages),
  }

  const grok = await completeWithGrok({
    system: COACH_SYSTEM,
    messages: [
      ...history,
      { role: 'user', content: JSON.stringify(payload) },
    ],
    json: true,
    temperature: input.stress.elevated ? 0.35 : 0.55,
  })

  if (grok) {
    try {
      const parsed = JSON.parse(grok) as {
        reply?: string
        coachTone?: CoachTone
        stressScore?: number
      }
      return {
        source: 'grok',
        message: {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: parsed.reply?.trim() || localReply(input),
          timestamp: new Date().toISOString(),
          coachTone: parsed.coachTone ?? input.tone,
        },
      }
    } catch {
      /* local fallback */
    }
  }

  return {
    source: 'local',
    message: {
      id: `m-${Date.now()}`,
      role: 'assistant',
      content: localReply(input),
      timestamp: new Date().toISOString(),
      coachTone: input.tone,
    },
  }
}

function localReply(input: {
  userText: string
  stress: MessageStressSnapshot
  tone: CoachTone
  ctx: TrackerCoachContext
}) {
  const { stress, tone, ctx } = input
  const theme = stress.themes[0] ?? 'what you shared'
  const bodyBit = ctx.bodySummary ? ` Given ${ctx.bodySummary.split(',')[0]},` : ''

  if (tone === 'grounding') {
    return `I hear the pressure around ${theme.toLowerCase()}.${bodyBit} Let's slow down for a moment: inhale four counts, hold two, exhale six — twice. When you're ready, name one thing that would feel 5% easier, not perfect.`
  }
  if (tone === 'gentle') {
    return `That sounds like a lot — ${theme.toLowerCase()} is showing up strongly.${bodyBit} You don't have to solve everything tonight. What's one kind thing you could do for yourself in the next ten minutes?`
  }
  if (tone === 'encouraging') {
    return `Your words feel a bit lighter than a few messages ago. That shift matters. What do you think helped — even a little?`
  }
  return `Thanks for saying that out loud.${bodyBit} Tell me more about ${theme.toLowerCase()} — what part feels most stuck right now?`
}

export async function generateSessionDebrief(input: {
  session: ChatSessionRecord
  ctx: TrackerCoachContext
}): Promise<ChatSessionDebrief> {
  const peak = sessionPeak(input.session.messages)
  const transcript = input.session.messages
    .map((m) => `${m.role}: ${m.content}${m.stress ? ` [stress ${m.stress.score}]` : ''}`)
    .join('\n')

  const grok = await completeWithGrok({
    system: DEBRIEF_SYSTEM,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          transcript,
          peakStress: peak,
          trackerStressScore: input.ctx.stressScore,
          displayName: input.ctx.displayName,
        }),
      },
    ],
    json: true,
    temperature: 0.3,
  })

  if (grok) {
    try {
      const parsed = JSON.parse(grok) as ChatSessionDebrief & { memorySnippet?: string }
      return {
        summary: parsed.summary?.trim() || localDebriefSummary(input.session, peak),
        stressArc: parsed.stressArc?.trim() || localStressArc(input.session.messages),
        whatHelped: (parsed.whatHelped ?? []).slice(0, 4).map(String),
        followUp: parsed.followUp?.trim() || 'Before we talk again, notice one moment of ease today.',
        peakStress: peak,
        memorySnippet:
          parsed.memorySnippet?.trim() ||
          `User discussed ${analyzeMessageStress(input.session.messages.find((m) => m.role === 'user')?.content ?? '').themes[0] ?? 'stress'}; prefers ${peak >= 50 ? 'grounding' : 'warm'} tone when elevated.`,
      }
    } catch {
      /* local */
    }
  }

  return {
    summary: localDebriefSummary(input.session, peak),
    stressArc: localStressArc(input.session.messages),
    whatHelped: localWhatHelped(input.session),
    followUp: 'Take one slow breath before your next task — no performance required.',
    peakStress: peak,
    memorySnippet: `Stress peaked around ${peak}/100; themes included ${collectThemes(input.session).join(', ') || 'general check-in'}.`,
  }
}

function collectThemes(session: ChatSessionRecord) {
  const set = new Set<string>()
  for (const m of session.messages) {
    m.stress?.themes.forEach((t) => set.add(t))
  }
  return [...set].slice(0, 3)
}

function localDebriefSummary(session: ChatSessionRecord, peak: number) {
  const userMsgs = session.messages.filter((m) => m.role === 'user').length
  return `You shared ${userMsgs} messages in this session. Stress language peaked around ${peak}/100. This is reflection data — not a diagnosis — but it captures what was heavy and what eased.`
}

function localStressArc(messages: ChatMessage[]) {
  const userStress = messages.filter((m) => m.role === 'user' && m.stress).map((m) => m.stress!.score)
  if (userStress.length < 2) return 'Stress signals were brief — enough for a quick check-in.'
  const first = userStress[0]
  const last = userStress[userStress.length - 1]
  if (last < first - 10) return 'Language softened toward the end — a small downshift.'
  if (last > first + 10) return 'Pressure built as the conversation went on — worth resting before acting.'
  return 'Stress stayed fairly steady — naming it may still help.'
}

function localWhatHelped(session: ChatSessionRecord) {
  const tones = session.messages.filter((m) => m.role === 'assistant').map((m) => m.coachTone)
  const out: string[] = []
  if (tones.includes('grounding')) out.push('Slow breathing and shorter replies')
  if (tones.includes('gentle')) out.push('Validation before problem-solving')
  if (!out.length) out.push('Talking it through out loud')
  return out
}

export function buildTrackerCoachContext(input: {
  displayName: string
  stressScore: number
  coOccurrence: boolean
  body: {
    current: { sleepHours: number; restingHr: number; steps: number } | null
    deltas: { sleepPct: number; restingHeartRatePct: number; activityPct: number }
  }
  baseline: {
    sleepHours: number
    restingHeartRate: number
    activity: number
  }
  journals: { analysis: { themes: string[] } }[]
  languageTopics: { name: string }[]
  grokEnabled: boolean
}): TrackerCoachContext {
  const current = input.body.current
  const bodySummary = current
    ? `sleep ${current.sleepHours}h (${input.body.deltas.sleepPct}% vs baseline), RHR ${current.restingHr} (${input.body.deltas.restingHeartRatePct}%), steps ${current.steps}`
    : null
  const baselineSummary = input.baseline
    ? `typical sleep ${input.baseline.sleepHours}h, RHR ${input.baseline.restingHeartRate}, steps ${input.baseline.activity}`
    : null
  const recentThemes = input.journals
    .slice(-5)
    .flatMap((j) => j.analysis.themes)
    .slice(0, 6)
  return {
    displayName: input.displayName,
    stressScore: input.stressScore,
    coOccurrence: input.coOccurrence,
    bodySummary,
    baselineSummary,
    recentThemes,
    recentTopics: input.languageTopics.map((t) => t.name).slice(0, 5),
    grokEnabled: input.grokEnabled,
  }
}
