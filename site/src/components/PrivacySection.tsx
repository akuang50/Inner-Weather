import { Lock, ShieldCheck, Eye } from 'lucide-react'
import { Eyebrow, Reveal, Section } from './ui'

const cards = [
  {
    title: 'Your data',
    body: 'You control what you share.',
    icon: Lock,
  },
  {
    title: 'No diagnosis',
    body: 'We surface patterns, not medical conclusions.',
    icon: ShieldCheck,
  },
  {
    title: 'Explainable',
    body: 'Every insight shows why it appeared.',
    icon: Eye,
  },
]

export function PrivacySection() {
  return (
    <Section dark className="py-24 md:py-32">
      <Reveal>
        <Eyebrow light>Privacy</Eyebrow>
        <h2 className="font-display mt-4 max-w-2xl text-4xl tracking-tight md:text-5xl">
          Your most personal data deserves more than a checkbox.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08}>
            <div className="h-full rounded-[24px] border border-white/10 bg-white/5 p-6">
              <c.icon className="h-5 w-5 text-white/70" strokeWidth={1.5} />
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
