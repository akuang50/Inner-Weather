import { stressData } from '../data/stressData'
import { Bar, Eyebrow, Reveal, Section } from './ui'

export function ExplainabilityCard() {
  const items = [
    {
      title: 'Sleep is lower than baseline',
      value: Math.abs(stressData.deltas.sleepPct) + 40,
      detail: `${stressData.current.sleepLabel} vs ${stressData.baseline.sleepLabel}`,
    },
    {
      title: 'Resting HR is higher',
      value: stressData.deltas.restingHeartRatePct + 45,
      detail: `${stressData.current.restingHeartRate} vs ${stressData.baseline.restingHeartRate} bpm`,
    },
    {
      title: 'Language changed',
      value: stressData.language.urgency + 30,
      detail: `Urgency +${stressData.language.urgency}%`,
    },
  ]

  return (
    <Section id="explain" className="py-24 md:py-32">
      <Reveal>
        <Eyebrow>Explainability</Eyebrow>
        <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
          No black box.
        </h2>
        <p className="mt-3 text-muted md:text-lg">Every insight tells you why it appeared.</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12 rounded-[28px] border border-border bg-white p-6 shadow-[0_24px_80px_rgba(21,23,26,0.05)] md:p-10">
        <p className="text-2xl font-semibold tracking-tight md:text-3xl">
          Your stress signals are elevated.
        </p>
        <p className="mt-8 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
          Why?
        </p>
        <ol className="mt-5 space-y-6">
          {items.map((item, i) => (
            <li key={item.title}>
              <div className="mb-2 flex gap-3">
                <span className="text-sm text-muted">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted">{item.detail}</p>
                  <div className="mt-3">
                    <Bar value={item.value} tone={i === 2 ? 'ai' : 'elevated'} />
                  </div>
                </div>
              </div>
            </li>
          ))}
          <li className="flex gap-3">
            <span className="text-sm text-muted">04</span>
            <p className="font-medium">
              Deadline mentioned {stressData.topics[0]!.mentions}×
            </p>
          </li>
        </ol>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Confidence
            </p>
            <p className="mt-1 text-xl font-semibold text-ai">{stressData.confidence}</p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            These patterns don’t establish causation or a diagnosis.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
