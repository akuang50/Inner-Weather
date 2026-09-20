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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#demo" className="btn-primary">
            Try Stress Monitor
          </a>
          <a
            href="https://github.com/akuang50/Inner-Weather#mobile-app-expo"
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Get the mobile app
          </a>
        </div>
        <p className="mt-5 text-sm text-muted">
          Web demo + Expo app · same personal-baseline fusion · HackMIT 2026
        </p>
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
            Stress Monitor
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
          <a
            href="https://github.com/akuang50/Inner-Weather#mobile-app-expo"
            className="transition hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            Mobile
          </a>
        </div>
        <p className="text-sm text-muted">HackMIT 2026</p>
      </div>
    </footer>
  )
}
