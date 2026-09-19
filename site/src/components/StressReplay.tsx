import { useState } from 'react'
import { motion } from 'framer-motion'
import { stressData } from '../data/stressData'
import { Eyebrow, Reveal, Section } from './ui'

export function StressReplay() {
  const [activeId, setActiveId] = useState<string>(
    stressData.replay.find((p) => p.spike)?.id ?? stressData.replay[0]!.id,
  )
  const point = stressData.replay.find((p) => p.id === activeId) ?? stressData.replay[0]!

  return (
    <Section id="replay" className="py-24 md:py-32">
      <Reveal>
        <Eyebrow>Stress Replay</Eyebrow>
        <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
          See your week differently.
        </h2>
        <p className="mt-3 max-w-md text-muted">
          Replay the moments when your signals changed.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12 overflow-x-auto pb-2">
        <div className="relative min-w-[560px] px-2 pt-8 pb-10">
          <div className="absolute top-[52px] right-6 left-6 h-px bg-border" />
          <div className="relative flex justify-between">
            {stressData.replay.map((p) => {
              const on = p.id === activeId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className="relative flex w-20 flex-col items-center"
                >
                  <span
                    className={`mb-6 text-xs font-semibold tracking-[0.14em] ${
                      on ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {p.day}
                  </span>
                  <span
                    className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 transition ${
                      p.spike
                        ? 'border-elevated bg-elevated'
                        : on
                          ? 'border-ink bg-ink'
                          : 'border-ink/30 bg-bg'
                    }`}
                  />
                  {p.spike && (
                    <span className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-elevated uppercase">
                      Stress spike
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
          key={point.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-border bg-white p-6 md:p-10"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
                {point.day} · {point.time}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                Signal {point.score}
              </p>
            </div>
            <a
              href="#explain"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-bg"
            >
              Explore this moment
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-4">
            <Detail label="Resting HR" value={point.body.hr} />
            <Detail label="Sleep" value={point.body.sleep} />
            <Detail label="Urgency in language" value={point.body.urgency} />
            <Detail label="Recurring topic" value={point.topic} />
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Why we noticed
            </p>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-ink">{point.why}</p>
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
