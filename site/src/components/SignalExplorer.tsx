import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SignalTab } from '../data/stressData'
import { sleepLabel } from '../lib/baseline'
import { useTracker } from '../state/TrackerProvider'
import { Bar, Eyebrow, Reveal, Section } from './ui'

const tabs: { id: SignalTab; title: string; blurb: string }[] = [
  { id: 'body', title: 'Body', blurb: 'What your physiology is doing.' },
  { id: 'words', title: 'Words', blurb: 'How the way you communicate is changing.' },
  { id: 'context', title: 'Context', blurb: "What's recurring in your life language." },
]

export function SignalExplorer() {
  const { body, language, coOccurrence, stressScore } = useTracker()
  const [active, setActive] = useState<SignalTab>('body')
  const [seen, setSeen] = useState<Record<SignalTab, boolean>>({
    body: true,
    words: false,
    context: false,
  })
  const linked = seen.body && seen.words && seen.context

  return (
    <Section id="signals" className="py-24 md:py-32">
      <Reveal>
        <Eyebrow>Something changed · live signals</Eyebrow>
        <h2 className="font-display mt-4 max-w-xl text-4xl tracking-tight md:text-5xl">
          Stress isn’t one signal.
        </h2>
        <p className="mt-3 text-2xl text-muted md:text-3xl">It’s a pattern.</p>
        <p className="mt-3 text-sm text-muted">
          Current fused stress signal: <span className="font-semibold text-ink">{stressScore}</span>
          {coOccurrence ? ' · body + language co-occurring' : ''}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {tabs.map((tab, i) => {
          const on = active === tab.id
          return (
            <Reveal key={tab.id} delay={i * 0.08}>
              <button
                type="button"
                onClick={() => {
                  setActive(tab.id)
                  setSeen((s) => ({ ...s, [tab.id]: true }))
                }}
                className={`w-full rounded-[24px] border p-6 text-left transition ${
                  on
                    ? 'border-ink bg-ink text-white'
                    : 'border-border bg-white hover:border-ink/20'
                }`}
              >
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase opacity-60">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{tab.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${on ? 'text-white/70' : 'text-muted'}`}>
                  {tab.blurb}
                </p>
              </button>
            </Reveal>
          )
        })}
      </div>

      <div className="mt-6 overflow-hidden surface-solid rounded-[28px] p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {active === 'body' && <BodyPanel />}
            {active === 'words' && <WordsPanel />}
            {active === 'context' && <ContextPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {linked && (
        <Reveal className="mt-10">
          <CrossModalInsight
            coOccurrence={coOccurrence}
            deltas={body.deltas}
            language={language.current}
          />
        </Reveal>
      )}

      {!linked && (
        <p className="mt-8 text-sm text-muted">
          Explore all three channels — then we’ll connect them from your tracked data.
        </p>
      )}
    </Section>
  )
}

function BodyPanel() {
  const { body } = useTracker()
  const { baseline, current, deltas } = body
  if (!current) {
    return <p className="text-muted">Log a health day below to start tracking body signals.</p>
  }
  return (
    <div>
      <Eyebrow>Your body</Eyebrow>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <Metric
          label="Resting heart rate"
          value={`${current.restingHr} bpm`}
          delta={`${deltas.restingHeartRatePct >= 0 ? '↑' : '↓'} ${Math.abs(deltas.restingHeartRatePct)}% from baseline`}
          bar={Math.min(95, 40 + Math.abs(deltas.restingHeartRatePct) * 2)}
        />
        <Metric
          label="Sleep"
          value={sleepLabel(current.sleepHours)}
          delta={`${deltas.sleepPct >= 0 ? '↑' : '↓'} ${Math.abs(deltas.sleepPct)}% from baseline`}
          bar={Math.min(95, 40 + Math.abs(deltas.sleepPct) * 2)}
          tone="changing"
        />
        <Metric
          label="Activity"
          value={`${current.steps.toLocaleString()} steps`}
          delta={`${deltas.activityPct >= 0 ? '↑' : '↓'} ${Math.abs(deltas.activityPct)}% from baseline`}
          bar={Math.min(95, 40 + Math.abs(deltas.activityPct) * 1.5)}
          tone="changing"
        />
      </div>
      <p className="mt-8 max-w-lg text-sm leading-relaxed text-muted">
        Your baseline ({baseline.n} days): {baseline.sleepLabel} sleep · {baseline.restingHeartRate}{' '}
        bpm · {baseline.activity.toLocaleString()} steps/day. These are differences from{' '}
        <em>your</em> pattern — not a diagnosis.
      </p>
    </div>
  )
}

function WordsPanel() {
  const { language } = useTracker()
  const { current, urgencyDelta } = language
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-5">
        <Eyebrow>Your words</Eyebrow>
        <p className="text-sm text-muted">
          From your journal history
          {urgencyDelta !== 0 && (
            <>
              {' '}
              · urgency {urgencyDelta > 0 ? '+' : ''}
              {urgencyDelta} vs earlier entries
            </>
          )}
        </p>
        <LangRow label="Urgency" value={current.urgency} />
        <LangRow label="Negative language" value={current.negativity} />
        <LangRow label="Uncertainty" value={current.uncertainty} />
      </div>
      <div>
        <Eyebrow>Recurring themes</Eyebrow>
        <ul className="mt-6 space-y-4">
          {current.topics.length === 0 && (
            <li className="text-sm text-muted">Add a voice rant or text entry to extract topics.</li>
          )}
          {current.topics.map((t) => (
            <li key={t.name} className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-medium tracking-tight uppercase">{t.name}</span>
              <span className="text-muted">{t.mentions}×</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ContextPanel() {
  const { language, journals } = useTracker()
  const top = language.current.topics[0]
  const recent = [...journals].reverse().slice(0, 3)
  return (
    <div>
      <Eyebrow>Your context</Eyebrow>
      <p className="mt-2 text-sm text-muted">Extracted from what you’ve said — not a calendar scrape.</p>
      <ul className="mt-6 space-y-4">
        {language.current.topics.slice(0, 3).map((c) => (
          <li
            key={c.name}
            className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3"
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-muted">{c.mentions} mentions</span>
          </li>
        ))}
      </ul>
      {top ? (
        <p className="mt-8 max-w-md text-base leading-relaxed text-ink">
          Your journals mention <span className="font-semibold">{top.name}</span>{' '}
          <span className="font-semibold">{top.mentions} times</span> recently. That’s contextual
          evidence — not proof of cause.
        </p>
      ) : (
        <p className="mt-8 text-muted">No recurring topics yet.</p>
      )}
      {recent[0] && (
        <p className="mt-4 text-sm text-muted line-clamp-2">
          Latest: “{recent[0].transcript}”
        </p>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  delta,
  bar,
  tone = 'elevated',
}: {
  label: string
  value: string
  delta: string
  bar: number
  tone?: 'elevated' | 'changing' | 'calm'
}) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-elevated">{delta}</p>
      <div className="mt-4">
        <Bar value={bar} tone={tone} />
      </div>
    </div>
  )
}

function LangRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium text-elevated">{value}</span>
      </div>
      <Bar value={value} tone="elevated" />
    </div>
  )
}

function CrossModalInsight({
  coOccurrence,
  deltas,
  language,
}: {
  coOccurrence: boolean
  deltas: { sleepPct: number; restingHeartRatePct: number; activityPct: number }
  language: { urgency: number; topics: { name: string; mentions: number }[] }
}) {
  return (
    <div className="rounded-[28px] border border-border bg-ink p-8 text-white md:p-10">
      <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div className="font-mono text-sm leading-7 text-white/70">
          <p>BODY</p>
          <p className="pl-2">│</p>
          <p className="pl-2">├──────────┐</p>
          <p>WORDS ──────┤</p>
          <p className="pl-14">▼</p>
          <p className="pl-10 text-white">PATTERN</p>
          <p className="pl-14">▼</p>
          <p className="pl-10 text-ai">INSIGHT</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tracking-tight md:text-4xl">
            {coOccurrence ? 'Something changed.' : 'Watching for co-occurrence.'}
          </p>
          <ul className="mt-6 space-y-3 text-white/75">
            <li>
              Sleep {deltas.sleepPct >= 0 ? 'increased' : 'decreased'} {Math.abs(deltas.sleepPct)}% vs
              your baseline.
            </li>
            <li>
              Resting HR {deltas.restingHeartRatePct >= 0 ? 'up' : 'down'}{' '}
              {Math.abs(deltas.restingHeartRatePct)}%.
            </li>
            <li>Language urgency is at {language.urgency}.</li>
            {language.topics[0] && (
              <li>
                You repeatedly mentioned {language.topics[0].name.toLowerCase()} (
                {language.topics[0].mentions}×).
              </li>
            )}
          </ul>
          <a
            href="#voice"
            className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-ink"
          >
            Tell me what’s going on
          </a>
        </div>
      </div>
    </div>
  )
}
