import { Eyebrow, Reveal } from './ui'
import { StressGraph } from './StressGraph'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-6 pt-28 pb-16 md:px-10 md:pt-36 lg:px-16 lg:pb-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <Eyebrow>A personal stress intelligence system</Eyebrow>
          <h1 className="mt-5 max-w-[11ch] text-[clamp(2.75rem,7.5vw,5.75rem)] leading-[0.95] font-semibold tracking-[-0.045em] text-ink">
            Your body notices stress before you do.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
            Stress Monitor connects changes in your health data with changes in what you say —
            revealing patterns you might not notice yourself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#demo"
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Explore your signals
            </a>
            <a
              href="#voice"
              className="rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition hover:bg-black/[0.02]"
            >
              Try a voice rant
            </a>
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
