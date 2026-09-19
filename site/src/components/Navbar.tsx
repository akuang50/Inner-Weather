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
            ? 'border-border bg-white/75 shadow-[0_12px_40px_rgba(21,23,26,0.08)] backdrop-blur-xl'
            : 'border-white/40 bg-white/35 backdrop-blur-md'
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-elevated/40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-elevated" />
          </span>
          <span className="font-display text-lg tracking-tight text-ink">Stress Monitor</span>
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
          <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-muted tabular-nums">
            signal {stressScore}
            {realEntryCount > 0 ? ` · ${realEntryCount} live` : ''}
          </span>
        </div>
        <a href="#voice" className="btn-primary !px-4 !py-2 text-sm">
          Talk now
        </a>
      </nav>
    </header>
  )
}
