import { useTracker } from '../state/TrackerProvider'
import { Eyebrow, Reveal, Section } from './ui'

export function BaselineSection() {
  const { baseline, body } = useTracker()
  const current = body.current
  return (
    <Section className="py-24 md:py-32">
      <Reveal>
        <Eyebrow>Personal baseline · computed</Eyebrow>
        <h2 className="font-display mt-4 max-w-xl text-4xl tracking-tight md:text-5xl">
          Normal is personal.
        </h2>
        <p className="mt-3 max-w-lg text-muted md:text-lg">
          Rolling mean from your last {baseline.n || '—'} logged days (excluding today when
          possible). Not a population chart.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal>
          <BaselineCard
            title="Person A"
            path="M 20 40 C 80 40, 100 20, 160 20 C 220 20, 240 40, 300 40"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <BaselineCard
            title="Person B"
            path="M 20 25 C 70 25, 90 50, 160 50 C 230 50, 250 25, 300 25"
          />
        </Reveal>
      </div>
      <p className="mt-4 text-sm text-muted">Different people. Different baselines.</p>

      <Reveal delay={0.12} className="mt-10 surface-solid rounded-[28px] p-6 md:p-10">
        <Eyebrow>Your baseline</Eyebrow>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Stat label="Sleep" value={baseline.sleepLabel} />
          <Stat label="RHR" value={`${baseline.restingHeartRate} bpm`} />
          <Stat label="Activity" value={`${baseline.activity.toLocaleString()}/day`} />
        </div>
        {current && (
          <p className="mt-8 max-w-lg text-base leading-relaxed text-muted">
            Today: {current.sleepHours.toFixed(1)}h · {current.restingHr} bpm ·{' '}
            {current.steps.toLocaleString()} steps. Deltas: sleep {body.deltas.sleepPct}%, HR{' '}
            {body.deltas.restingHeartRatePct}%, activity {body.deltas.activityPct}%.
          </p>
        )}
      </Reveal>
    </Section>
  )
}

function BaselineCard({ title, path }: { title: string; path: string }) {
  return (
    <div className="surface-solid rounded-[24px] p-6">
      <p className="text-sm font-medium text-muted">{title}</p>
      <svg viewBox="0 0 320 70" className="mt-6 h-16 w-full" aria-hidden>
        <path d={path} fill="none" stroke="#15171A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
