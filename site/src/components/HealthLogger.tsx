import { useState } from 'react'
import { useTracker, useSleepLabel } from '../state/TrackerProvider'
import { Eyebrow, Reveal, Section } from './ui'

export function HealthLogger() {
  const { body, logHealth, realEntryCount, resetToSeed, clearAll, journals, healthLogs } = useTracker()
  const current = body.current
  const latestSleep = useSleepLabel(current?.sleepHours)
  const [sleep, setSleep] = useState(String(current?.sleepHours ?? 6.5))
  const [hr, setHr] = useState(String(current?.restingHr ?? 64))
  const [steps, setSteps] = useState(String(current?.steps ?? 5000))
  const [saved, setSaved] = useState(false)

  const save = () => {
    logHealth({
      sleepHours: Number(sleep) || 0,
      restingHr: Number(hr) || 0,
      steps: Number(steps) || 0,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <Section id="track" className="py-20 md:py-28">
      <Reveal>
        <Eyebrow>Live tracking</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          It tracks what it says it tracks.
        </h2>
        <p className="mt-3 max-w-xl text-muted md:text-lg">
          Journals and health logs stay in your browser. Baselines, language shifts, and stress
          scores recompute from <span className="font-medium text-ink">your</span> history — not a
          fake screenshot.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-[28px] border border-border bg-white p-6 md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            Log today’s body signals
          </p>
          <p className="mt-2 text-sm text-muted">
            Web can’t read Apple Health yet — you enter today’s numbers. We still compute a real
            personal baseline from the rolling log.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Field label="Sleep (hours)" value={sleep} onChange={setSleep} />
            <Field label="Resting HR" value={hr} onChange={setHr} />
            <Field label="Steps" value={steps} onChange={setSteps} />
          </div>
          <button
            type="button"
            onClick={save}
            className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
          >
            Save today’s health
          </button>
          {saved && <p className="mt-3 text-sm text-calm">Saved. Baseline & signal score updated.</p>}
          <p className="mt-4 text-sm text-muted">
            Latest stored: {latestSleep} · {current?.restingHr ?? '—'} bpm ·{' '}
            {current?.steps?.toLocaleString() ?? '—'} steps
          </p>
        </Reveal>

        <Reveal delay={0.08} className="rounded-[28px] border border-border bg-white p-6 md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            What’s stored on this device
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <Row label="Health days logged" value={String(healthLogs.length)} />
            <Row label="Journal entries" value={String(journals.length)} />
            <Row label="Your real entries (non-seed)" value={String(realEntryCount)} />
            <Row
              label="Baseline window"
              value={`${body.baseline.n || healthLogs.length} days`}
            />
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetToSeed}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-bg"
            >
              Reset demo seed
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-elevated hover:bg-bg"
            >
              Delete all local data
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Voice rants use the Web Speech API when available. Language features are extracted from
            the transcript you actually produce.
          </p>
        </Reveal>
      </div>
    </Section>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-ink outline-none focus:border-ink/30"
      />
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
