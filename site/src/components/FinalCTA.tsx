import { Reveal, Section } from './ui'

export function FinalCTA() {
  return (
    <Section className="py-28 md:py-36">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.05]">
          You don’t need another dashboard.
          <br />
          <span className="text-muted">You need to understand yourself.</span>
        </h2>
        <a
          href="#demo"
          className="mt-10 inline-flex rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Try Stress Monitor
        </a>
        <p className="mt-5 text-sm text-muted">Built for HackMIT 2026.</p>
      </Reveal>
    </Section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-elevated" />
            Stress Monitor
          </p>
          <p className="mt-2 text-sm text-muted">Personal stress intelligence.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted">
          <a href="#demo" className="hover:text-ink">
            Demo
          </a>
          <a href="#how" className="hover:text-ink">
            How it works
          </a>
          <a href="#voice" className="hover:text-ink">
            Voice
          </a>
        </div>
        <p className="text-sm text-muted">HackMIT 2026</p>
      </div>
    </footer>
  )
}
