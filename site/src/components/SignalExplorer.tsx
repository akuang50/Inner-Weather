import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stressData, type SignalTab } from '../data/stressData'
import { Bar, Eyebrow, Reveal, Section } from './ui'

const tabs: { id: SignalTab; title: string; blurb: string }[] = [
  { id: 'body', title: 'Body', blurb: 'What your physiology is doing.' },
  { id: 'words', title: 'Words', blurb: 'How the way you communicate is changing.' },
  { id: 'context', title: 'Context', blurb: "What's happening in your life." },
]

export function SignalExplorer() {
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
        <Eyebrow>Something changed</Eyebrow>
        <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
          Stress isn’t one signal.
        </h2>
        <p className="mt-3 text-2xl text-muted md:text-3xl">It’s a pattern.</p>
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

      <div className="mt-6 overflow-hidden rounded-[28px] border border-border bg-white p-6 md:p-10">
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
          <CrossModalInsight />
        </Reveal>
      )}

      {!linked && (
        <p className="mt-8 text-sm text-muted">
          Explore all three channels — then we’ll connect them.
        </p>
      )}
    </Section>
  )
}

function BodyPanel() {
  const { current, baseline, deltas } = stressData
  return (
    <div>
      <Eyebrow>Your body</Eyebrow>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <Metric
          label="Resting heart rate"
          value={`${current.restingHeartRate} bpm`}
          delta={`↑ ${deltas.restingHeartRatePct}% from baseline`}
          bar={70}
        />
        <Metric
          label="Sleep"
          value={current.sleepLabel}
          delta={`↓ ${Math.abs(deltas.sleepPct)}% from baseline`}
          bar={55}
          tone="changing"
        />
        <Metric
          label="Activity"
          value={`${current.activity.toLocaleString()} steps`}
          delta={`↓ ${Math.abs(deltas.activityPct)}% from baseline`}
          bar={48}
          tone="changing"
        />
      </div>
      <p className="mt-8 max-w-lg text-sm leading-relaxed text-muted">
        Baseline for you: {baseline.sleepLabel} sleep · {baseline.restingHeartRate} bpm ·{' '}
        {baseline.activity.toLocaleString()} steps/day. These signals are different from your recent
        pattern — not a diagnosis.
      </p>
    </div>
  )
}

function WordsPanel() {
  const { language, topics } = stressData
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-5">
        <Eyebrow>Your words</Eyebrow>
        <LangRow label="Urgency" value={language.urgency} />
        <LangRow label="Negative language" value={language.negativity} />
        <LangRow label="Uncertainty" value={language.uncertainty} />
      </div>
      <div>
        <Eyebrow>Recurring themes</Eyebrow>
        <ul className="mt-6 space-y-4">
          {topics.map((t) => (
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
  return (
    <div>
      <Eyebrow>Your context</Eyebrow>
      <p className="mt-2 text-sm text-muted">This week</p>
      <ul className="mt-6 space-y-4">
        {stressData.context.map((c) => (
          <li
            key={c.label}
            className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3"
          >
            <span className="font-medium">{c.label}</span>
            <span className="text-muted">{c.when}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 max-w-md text-base leading-relaxed text-ink">
        Your journal mentioned your project deadline{' '}
        <span className="font-semibold">{stressData.topics[0]!.mentions} times</span> this week.
        That’s context — not proof of cause.
      </p>
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
        <span className="font-medium text-elevated">+{value}%</span>
      </div>
      <Bar value={value + 20} tone="elevated" />
    </div>
  )
}

function CrossModalInsight() {
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
          <p className="text-3xl font-semibold tracking-tight md:text-4xl">Something changed.</p>
          <ul className="mt-6 space-y-3 text-white/75">
            <li>Your sleep decreased.</li>
            <li>Your physiological signals shifted.</li>
            <li>Your language became more urgent.</li>
            <li>You repeatedly mentioned your deadline.</li>
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
