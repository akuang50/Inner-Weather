import { physiologicalAggregate, valuesForMetric } from './baseline';
import { languageFeatures } from './stress';
import type { HealthSignal, JournalEntry, LanguageAnalysis } from '../types';

export type DaySlice = {
  date: string;
  label: string; // MON, TUE, ...
  score: number;
  bodyScore: number;
  languageScore: number;
  contextScore: number;
  sleepHours: number | null;
  restingHr: number | null;
  journalSnippet: string | null;
  topics: string[];
  urgency: number;
  coOccurrence: boolean;
  narrative: {
    body: string;
    language: string;
    context: string;
    fusion: string;
  };
};

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return DAY_LABELS[d.getDay()] ?? isoDate.slice(5);
}

function scoreFromParts(body: number, language: number, context: number): number {
  return Math.round(Math.max(5, Math.min(98, (body * 0.4 + language * 0.4 + context * 0.2) * 100)));
}

/** Build a day-by-day multimodal series from raw health + journals (the novel core). */
export function buildDaySeries(
  health: HealthSignal[],
  journals: JournalEntry[],
  analyses: LanguageAnalysis[],
  days = 7,
): DaySlice[] {
  const sleep = valuesForMetric(health, 'sleep_hours');
  if (!sleep.length) return [];

  const end = sleep[sleep.length - 1]!.timestamp;
  const endDate = new Date(`${end}T12:00:00`);
  const analysisByJournal = new Map(analyses.map((a) => [a.journalId, a]));

  const slices: DaySlice[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const date = d.toISOString().slice(0, 10);

    // Health up to this day (inclusive) for progressive baseline
    const healthToDate = health.filter((s) => s.timestamp <= date);
    const phys = physiologicalAggregate(healthToDate);

    const dayJournals = journals.filter((j) => j.timestamp.slice(0, 10) === date);
    const analysesToDate = journals
      .filter((j) => j.timestamp.slice(0, 10) <= date)
      .map((j) => analysisByJournal.get(j.analysisId ?? '')!)
      .filter(Boolean);
    const lang = languageFeatures(analysesToDate);

    const languageScore = Math.min(
      1,
      lang.urgency * 0.35 + lang.uncertainty * 0.25 + lang.overwhelm * 0.25 + lang.negative * 0.15,
    );
    const topTopic = lang.topics[0];
    const contextScore = topTopic ? Math.min(1, (topTopic.weight * topTopic.count) / 4) : 0.15;
    const bodyScore = phys.score;
    const score = scoreFromParts(bodyScore, languageScore, contextScore);

    const sleepSig = valuesForMetric(healthToDate, 'sleep_hours').at(-1);
    const hrSig = valuesForMetric(healthToDate, 'resting_hr').at(-1);
    const sleepDev = phys.deviations.find((x) => x.metric === 'sleep_hours');
    const hrDev = phys.deviations.find((x) => x.metric === 'resting_hr');

    const bodyHot = bodyScore >= 0.45;
    const langHot = languageScore >= 0.45;
    const coOccurrence = bodyHot && langHot;

    const snippet = dayJournals.at(-1)?.transcript ?? null;
    const dayAnalysis = dayJournals
      .map((j) => analysisByJournal.get(j.analysisId ?? ''))
      .filter(Boolean);
    const topics = [...new Set(dayAnalysis.flatMap((a) => a!.topics.map((t) => t.topic)))];

    slices.push({
      date,
      label: dayLabel(date),
      score,
      bodyScore,
      languageScore,
      contextScore,
      sleepHours: sleepSig?.value ?? null,
      restingHr: hrSig?.value ?? null,
      journalSnippet: snippet,
      topics,
      urgency: lang.urgency,
      coOccurrence,
      narrative: {
        body: sleepDev
          ? `Sleep ${sleepDev.changePct}% vs your baseline (${sleepDev.baseline}h → ${sleepDev.current}h).${
              hrDev ? ` Resting HR ${hrDev.changePct > 0 ? '+' : ''}${hrDev.changePct}%.` : ''
            }`
          : 'Body signals near your personal baseline.',
        language: langHot
          ? `Urgency/overwhelm language is elevated vs your earlier entries (${Math.round(languageScore * 100)}).`
          : 'Writing tone is close to your recent linguistic baseline.',
        context: topTopic
          ? `Recurring theme: “${topTopic.topic}” (${topTopic.count}× recently).`
          : 'No strong recurring stressor theme yet.',
        fusion: coOccurrence
          ? 'Body deviation and language shift are co-occurring — a personal anomaly, not a diagnosis.'
          : bodyHot || langHot
            ? 'One channel moved; the other has not confirmed it yet.'
            : 'Channels agree: today looks like your normal weather.',
      },
    });
  }

  return slices;
}

export function liveFusionPreview(
  health: HealthSignal[],
  priorAnalyses: LanguageAnalysis[],
  draftText: string,
  analyze: (text: string) => LanguageAnalysis,
) {
  const draft = draftText.trim()
    ? analyze(draftText)
    : null;
  const analyses = draft ? [...priorAnalyses, draft] : priorAnalyses;
  const phys = physiologicalAggregate(health);
  const lang = languageFeatures(analyses);
  const languageScore = Math.min(
    1,
    lang.urgency * 0.35 + lang.uncertainty * 0.25 + lang.overwhelm * 0.25 + lang.negative * 0.15,
  );
  const topTopic = lang.topics[0];
  const contextScore = topTopic ? Math.min(1, (topTopic.weight * topTopic.count) / 4) : 0.15;
  const bodyScore = phys.score;
  const score = scoreFromParts(bodyScore, languageScore, contextScore);
  const coOccurrence = bodyScore >= 0.45 && languageScore >= 0.45;

  return {
    score,
    bodyScore,
    languageScore,
    contextScore,
    coOccurrence,
    topics: lang.topics.slice(0, 3),
    emotional: draft?.emotionalSignals ?? [],
    urgency: lang.urgency,
    uncertainty: lang.uncertainty,
    overwhelm: lang.overwhelm,
    deviations: phys.deviations,
    draft,
  };
}
