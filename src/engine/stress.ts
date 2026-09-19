import { physiologicalAggregate } from './baseline';
import {
  latestScoredDay,
  messagingChangePct,
  messagingSignalFromDays,
  toneContributingFactors,
} from './tonewatch';
import type {
  HealthSignal,
  InsightPayload,
  LanguageAnalysis,
  StressSnapshot,
  TonewatchDay,
} from '../types';

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function languageFeatures(analyses: LanguageAnalysis[]): {
  urgency: number;
  uncertainty: number;
  overwhelm: number;
  negative: number;
  topics: { topic: string; weight: number; count: number }[];
} {
  if (!analyses.length) {
    return { urgency: 0.2, uncertainty: 0.2, overwhelm: 0.2, negative: 0.2, topics: [] };
  }

  const recent = analyses.slice(-4);
  const prior = analyses.slice(0, Math.max(0, analyses.length - 4));

  const urgency = mean(recent.map((a) => a.urgency));
  const uncertainty = mean(recent.map((a) => a.uncertainty));
  const overwhelm = mean(recent.map((a) => a.overwhelm));
  const negative = mean(recent.map((a) => Math.max(0, -a.sentiment)));

  const topicMap = new Map<string, { weight: number; count: number }>();
  for (const a of recent) {
    for (const t of a.topics) {
      const prev = topicMap.get(t.topic) ?? { weight: 0, count: 0 };
      topicMap.set(t.topic, {
        weight: prev.weight + t.weight,
        count: prev.count + 1,
      });
    }
  }

  const topics = [...topicMap.entries()]
    .map(([topic, v]) => ({ topic, weight: v.weight / v.count, count: v.count }))
    .sort((a, b) => b.weight * b.count - a.weight * a.count);

  // bump language score if recent > prior baseline
  if (prior.length >= 2) {
    const priorUrgency = mean(prior.map((a) => a.urgency));
    const delta = Math.max(0, urgency - priorUrgency);
    return {
      urgency: Math.min(1, urgency + delta * 0.3),
      uncertainty,
      overwhelm,
      negative,
      topics,
    };
  }

  return { urgency, uncertainty, overwhelm, negative, topics };
}

/**
 * Prototype Stress Signal Index (0–100).
 * Explicitly experimental weights — not a medical model.
 *
 * Channels: physiology + journal language + Tonewatch messaging tone + context topics.
 */
export function computeStressSnapshot(
  health: HealthSignal[],
  analyses: LanguageAnalysis[],
  toneDays: TonewatchDay[] = [],
  now = new Date().toISOString(),
): StressSnapshot {
  const phys = physiologicalAggregate(health);
  const lang = languageFeatures(analyses);

  const languageSignal = Math.min(
    1,
    lang.urgency * 0.35 + lang.uncertainty * 0.25 + lang.overwhelm * 0.25 + lang.negative * 0.15,
  );

  const messagingSignal = messagingSignalFromDays(toneDays);
  const latestTone = latestScoredDay(toneDays);

  const topTopic = lang.topics[0];
  const contextSignal = topTopic ? Math.min(1, (topTopic.weight * topTopic.count) / 4) : 0.2;

  // Experimental fusion weights for hackathon prototype
  const hasMessaging = toneDays.some((d) => d.stress_score != null);
  const fused = hasMessaging
    ? phys.score * 0.35 + languageSignal * 0.25 + messagingSignal * 0.25 + contextSignal * 0.15
    : phys.score * 0.4 + languageSignal * 0.4 + contextSignal * 0.2;

  const score = Math.round(Math.max(5, Math.min(98, fused * 100)));
  const baselineScore = 47; // demo "recent normal" for narrative; refined later
  const change = score - baselineScore;

  const languageChangePct = Math.round((languageSignal - 0.25) * 100);
  const msgChangePct = messagingChangePct(toneDays);

  const contributingFactors: string[] = [];
  for (const d of phys.deviations) {
    if (Math.abs(d.changePct) >= 8) {
      const dir = d.changePct > 0 ? 'increased' : 'decreased';
      contributingFactors.push(`${d.label} ${dir} ${Math.abs(d.changePct)}% vs your baseline`);
    }
  }
  if (languageSignal > 0.45) {
    contributingFactors.push('Recent writing shows more urgency and overwhelm language');
  }
  if (topTopic && topTopic.count >= 2) {
    contributingFactors.push(
      `You mentioned “${topTopic.topic}” in ${topTopic.count} of your recent entries`,
    );
  }
  contributingFactors.push(...toneContributingFactors(toneDays));

  const confidence = Math.min(
    0.95,
    0.55 +
      phys.deviations.length * 0.05 +
      Math.min(analyses.length, 6) * 0.03 +
      (hasMessaging ? 0.04 : 0),
  );

  // Week sparkline: prefer Tonewatch daily tone (×10) when present, else synthetic.
  const weekScores = weekScoresFromTone(toneDays, score);

  return {
    timestamp: now,
    score,
    baselineScore,
    change,
    confidence,
    physiologicalSignal: phys.score,
    languageSignal,
    messagingSignal,
    contextSignal,
    contributingFactors,
    primaryTheme: topTopic?.topic ?? latestTone?.dominant_emotions?.[0] ?? null,
    uncertainty:
      'These signals may be related but do not establish causation. This is a pattern, not a diagnosis.',
    metricDeviations: phys.deviations,
    languageChangePct,
    messagingChangePct: msgChangePct,
    weekScores,
    latestTone,
  };
}

function weekScoresFromTone(toneDays: TonewatchDay[], fallbackScore: number): number[] {
  const scored = toneDays
    .filter((d) => d.stress_score != null)
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-7);
  if (scored.length >= 4) {
    const mapped = scored.map((d) => Math.round(((d.stress_score as number) / 10) * 100));
    while (mapped.length < 7) mapped.unshift(mapped[0] ?? 40);
    mapped[mapped.length - 1] = fallbackScore;
    return mapped.slice(-7);
  }
  return [42, 44, 48, 55, 63, 71, fallbackScore];
}

/** Structured “LLM” insight — deterministic prototype for demo; swap for real LLM later. */
export function buildInsight(
  snapshot: StressSnapshot,
  latestTranscript?: string,
): InsightPayload {
  const theme = snapshot.primaryTheme ?? 'rising pressure';
  const supporting = snapshot.contributingFactors.slice(0, 4);

  const heardThemes = extractThemesFromText(latestTranscript ?? '');
  const toneEmotions = (snapshot.latestTone?.dominant_emotions ?? [])
    .slice(0, 2)
    .map((e) => e.charAt(0).toUpperCase() + e.slice(1));

  const fallbackThemes =
    toneEmotions.length > 0
      ? [...toneEmotions, 'Rising pressure from texts + body signals'].slice(0, 3)
      : ['Deadline pressure', 'Avoidance', 'Uncertainty about where to start'];

  return {
    stressSignal: snapshot.score,
    confidence: snapshot.confidence,
    primaryTheme: theme,
    supportingSignals: supporting.length
      ? supporting
      : ['Signals differ from your recent personal baseline'],
    uncertainty: snapshot.uncertainty,
    recommendedAction: theme.includes('deadline') ? 'plan' : 'unpack',
    heardThemes: heardThemes.length ? heardThemes : fallbackThemes,
  };
}

function extractThemesFromText(text: string): string[] {
  const t = text.toLowerCase();
  const themes: string[] = [];
  if (/deadline|due|project|friday/.test(t)) themes.push('Deadline pressure');
  if (/scroll|start|begin|avoid|end up/.test(t)) themes.push('Avoidance');
  if (/don't know|where to|uncertain|freaking/.test(t)) themes.push('Uncertainty about where to start');
  if (/tired|sleep|behind/.test(t)) themes.push('Fatigue');
  return themes.slice(0, 3);
}

export function analyzeTranscriptLocally(transcript: string): LanguageAnalysis {
  const t = transcript.toLowerCase();
  const urgency = clamp01(
    (/so much|deadline|behind|asap|now|freaking/.test(t) ? 0.55 : 0.2) +
      (t.split(/\s+/).length < 40 ? 0.1 : 0),
  );
  const uncertainty = clamp01(/don't know|where to|maybe|idk|uncertain/.test(t) ? 0.7 : 0.25);
  const overwhelm = clamp01(/piling|everything|overwhelmed|so much|behind/.test(t) ? 0.75 : 0.25);
  const negative = /freaking|behind|don't|can't|worst/.test(t) ? 0.55 : 0.2;

  const topics: { topic: string; weight: number }[] = [];
  if (/deadline|project|due/.test(t)) topics.push({ topic: 'project deadline', weight: 0.9 });
  if (/school|exam|class/.test(t)) topics.push({ topic: 'school', weight: 0.5 });
  if (/scroll|start|begin/.test(t)) topics.push({ topic: 'avoidance', weight: 0.55 });

  return {
    id: `local-${Date.now()}`,
    journalId: `local-j-${Date.now()}`,
    sentiment: -negative,
    urgency,
    uncertainty,
    overwhelm,
    emotionalSignals: [
      overwhelm > 0.5 ? 'overwhelm' : 'neutral',
      urgency > 0.5 ? 'urgency' : '',
      uncertainty > 0.5 ? 'uncertainty' : '',
    ].filter(Boolean),
    topics,
    confidence: 0.74,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function actionOptionsForTheme(theme: string) {
  const deadline = /deadline|project/.test(theme.toLowerCase());
  return [
    {
      id: 'two-min',
      duration: '2 MINUTES',
      title: deadline ? 'Write the single task you’re avoiding.' : 'Name what feels heaviest.',
      body: 'One sentence. No fixing yet.',
    },
    {
      id: 'ten-min',
      duration: '10 MINUTES',
      title: deadline
        ? 'Turn your project into three concrete next actions.'
        : 'Break today into three small next steps.',
      body: 'Tiny and finishable beats perfect.',
    },
    {
      id: 'reset',
      duration: 'RESET',
      title: 'Take a short guided breathing break.',
      body: 'Ninety seconds to interrupt the spiral.',
    },
    {
      id: 'listen',
      duration: 'JUST LISTEN',
      title: 'Keep talking. I’ll help you unpack it.',
      body: 'No forms. No mood sliders.',
    },
  ];
}
