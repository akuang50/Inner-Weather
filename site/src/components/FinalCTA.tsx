import { Reveal, Section } from './ui'

export function FinalCTA() {
  return (
    <Section className="py-28 md:py-40">
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="section-rule mx-auto mb-14 max-w-xs" />
        <h2 className="font-display text-4xl tracking-tight md:text-6xl md:leading-[1.05]">
          You don’t need another dashboard.
          <br />
          <span className="italic text-ink/55">You need to understand yourself.</span>
        </h2>
        <a href="#demo" className="btn-primary mt-10">
          Try Inner Weather
        </a>
        <p className="mt-5 text-sm text-muted">Built for HackMIT 2026.</p>
      </Reveal>
    </Section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border/80 px-6 py-12 md:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display flex items-center gap-2 text-xl tracking-tight">
            <span className="h-2 w-2 rounded-full bg-elevated" />
            Inner Weather
          </p>
          <p className="mt-2 text-sm text-muted">Personal stress intelligence.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted">
          <a href="#demo" className="transition hover:text-ink">
            Demo
          </a>
          <a href="#how" className="transition hover:text-ink">
            How it works
          </a>
          <a href="#voice" className="transition hover:text-ink">
            Voice
          </a>
        </div>
        <p className="text-sm text-muted">HackMIT 2026</p>
      </div>
    </footer>
  )
}
