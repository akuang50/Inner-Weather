import { useEffect, useState } from 'react'
import { useTracker } from '../state/TrackerProvider'

const links = [
  { href: '#demo', label: 'Explore' },
  { href: '#track', label: 'Track' },
  { href: '#how', label: 'How it works' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { realEntryCount, stressScore } = useTracker()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-300 md:px-5 ${
          scrolled
            ? 'border-border bg-bg/80 shadow-[0_8px_30px_rgba(21,23,26,0.06)] backdrop-blur-xl'
            : 'border-transparent bg-bg/40 backdrop-blur-md'
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-elevated" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-ink">Stress Monitor</span>
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <span className="text-xs text-muted tabular-nums">
            signal {stressScore}
            {realEntryCount > 0 ? ` · ${realEntryCount} live` : ''}
          </span>
        </div>
        <a
          href="#voice"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Talk now
        </a>
      </nav>
    </header>
  )
}
