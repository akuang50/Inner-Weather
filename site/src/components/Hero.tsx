import { Eyebrow, Reveal } from './ui'
import { StressGraph } from './StressGraph'

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-6 pt-28 pb-20 md:px-10 md:pt-36 lg:px-16 lg:pb-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,107,107,0.12),transparent_68%)] blur-2xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
        <Reveal>
          <p className="font-display text-3xl tracking-tight text-ink md:text-4xl">
            Stress Monitor
          </p>
          <Eyebrow>A personal stress intelligence system</Eyebrow>
          <h1 className="font-display mt-5 max-w-[12ch] text-[clamp(3rem,8vw,6.1rem)] leading-[0.92] text-ink">
            Your body notices <span className="italic text-ink/80">stress</span> before you do.
          </h1>
          <p className="mt-7 max-w-md text-[1.05rem] leading-relaxed text-muted md:text-lg">
            Connect changes in your health data with changes in what you say — revealing patterns
            you might not notice yourself.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#demo" className="btn-primary">
              Explore your signals
            </a>
            <a href="#voice" className="btn-secondary">
              Try a voice rant
            </a>
          </div>
          <div className="mt-10 flex items-center gap-4 text-sm text-muted">
            <span className="inline-flex h-2 w-2 rounded-full bg-calm" />
            Personal baseline · body + language · explainable
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <StressGraph
            onExplore={() => {
              document.querySelector('#signals')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </Reveal>
      </div>
    </section>
  )
}
