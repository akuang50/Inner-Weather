import { Activity, Ear, MessageSquareText, Scale, Sparkles } from 'lucide-react'
import { Eyebrow, Reveal, Section } from './ui'

const steps = [
  {
    n: '01',
    title: 'Listen',
    body: 'You talk naturally.',
    icon: Ear,
  },
  {
    n: '02',
    title: 'Measure',
    body: 'We look at changes in your health signals.',
    icon: Activity,
  },
  {
    n: '03',
    title: 'Understand',
    body: 'AI identifies changes in language and recurring themes.',
    icon: MessageSquareText,
  },
  {
    n: '04',
    title: 'Compare',
    body: 'Everything is compared against your personal baseline.',
    icon: Scale,
  },
  {
    n: '05',
    title: 'Reflect',
    body: 'You get an explanation, not a diagnosis.',
    icon: Sparkles,
  },
]

export function HowItWorks() {
  return (
    <Section id="how" className="py-24 md:py-32">
      <Reveal>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="font-display mt-4 max-w-xl text-4xl tracking-tight md:text-5xl">
          From rant to pattern.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-5">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <div className="h-full surface-solid rounded-[24px] p-5">
              <s.icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
              <p className="mt-6 text-[11px] font-semibold tracking-[0.16em] text-muted">
                {s.n}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
