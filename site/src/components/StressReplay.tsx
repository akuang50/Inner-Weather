import { useState } from 'react'
import { motion } from 'framer-motion'
import { sleepLabel } from '../lib/baseline'
import { useTracker } from '../state/TrackerProvider'
import { Eyebrow, Reveal, Section } from './ui'

export function StressReplay() {
  const { daySeries } = useTracker()
  const defaultIdx = Math.max(
    0,
    daySeries.reduce((best, s, i, arr) => (s.score > arr[best]!.score ? i : best), 0),
  )
  const [selected, setSelected] = useState(defaultIdx)
  const point = daySeries[selected] ?? daySeries[daySeries.length - 1]

  if (!point) {
    return null
  }

  return (
    <Section id="replay" className="py-24 md:py-32">
      <Reveal>
        <Eyebrow>Stress Replay · your timeline</Eyebrow>
        <h2 className="font-display mt-4 max-w-xl text-4xl tracking-tight md:text-5xl">
          See your week differently.
        </h2>
        <p className="mt-3 max-w-md text-muted">
          Built from your stored health logs and journals — scrub days that actually exist.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12 overflow-x-auto pb-2">
        <div className="relative min-w-[560px] px-2 pt-8 pb-10">
          <div className="absolute top-[52px] right-6 left-6 h-px bg-border" />
          <div className="relative flex justify-between">
            {daySeries.map((p, i) => {
              const on = i === selected
              return (
                <button
                  key={p.date}
                  type="button"
                  onClick={() => setSelected(i)}
                  className="relative flex w-20 flex-col items-center"
                >
                  <span
                    className={`mb-6 text-xs font-semibold tracking-[0.14em] ${
                      on ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {p.dayLabel}
                  </span>
                  <span
                    className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 transition ${
                      p.coOccurrence
                        ? 'border-elevated bg-elevated'
                        : on
                          ? 'border-ink bg-ink'
                          : 'border-ink/30 bg-bg'
                    }`}
                  />
                  {p.coOccurrence && (
                    <span className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-elevated uppercase">
                      Linked
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <motion.div
          key={point.date}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-solid rounded-[28px] p-6 md:p-10"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
                {point.dayLabel} · {point.date}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">Signal {point.score}</p>
            </div>
            <a
              href="#explain"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-bg"
            >
              Explore this moment
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-4">
            <Detail
              label="Sleep"
              value={point.sleepHours != null ? sleepLabel(point.sleepHours) : '—'}
            />
            <Detail label="Resting HR" value={point.restingHr != null ? `${point.restingHr}` : '—'} />
            <Detail
              label="Language urgency"
              value={point.language ? String(point.language.urgency) : '—'}
            />
            <Detail label="Top topic" value={point.topics[0] ?? '—'} />
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Why we noticed
            </p>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-ink">
              {point.coOccurrence
                ? 'Body deviation and language shift co-occurred against your personal baseline.'
                : point.bodyScore > 0.45 || point.languageScore > 0.45
                  ? 'One channel moved; the other hasn’t fully confirmed it yet.'
                  : 'Channels stayed near your normal weather.'}
            </p>
            {point.transcript && (
              <p className="mt-4 text-sm text-muted">“{point.transcript}”</p>
            )}
          </div>
        </motion.div>
      </Reveal>
    </Section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
