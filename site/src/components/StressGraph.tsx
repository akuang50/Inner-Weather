import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTracker } from '../state/TrackerProvider'
import { Eyebrow } from './ui'

export function StressGraph({ onExplore }: { onExplore?: () => void }) {
  const { daySeries, stressScore, body, language, coOccurrence } = useTracker()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)

  const width = 520
  const height = 220
  const { d, coords, spike } = useMemo(() => {
    const pts = daySeries.map((s, i) => ({ x: i, y: s.score }))
    if (!pts.length) return { d: '', coords: [] as { x: number; y: number; score: number }[], spike: { x: 0, y: 0, score: 0 } }
    const maxX = Math.max(1, pts.length - 1)
    const minY = 20
    const maxY = 90
    const coords = pts.map((p) => {
      const x = (p.x / maxX) * width
      const y = height - ((p.y - minY) / (maxY - minY)) * height
      return { x, y, score: p.y }
    })
    let d = `M ${coords[0]!.x} ${coords[0]!.y}`
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1]!
      const curr = coords[i]!
      const cx = (prev.x + curr.x) / 2
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`
    }
    const spike = coords.reduce((a, b) => (b.score > a.score ? b : a))
    return { d, coords, spike }
  }, [daySeries])

  const spikeDay = daySeries.reduce((a, b) => (b.score > a.score ? b : a), daySeries[0]!)

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-white p-6 shadow-[0_20px_60px_rgba(21,23,26,0.04)] md:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Your stress signal</Eyebrow>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            {stressScore}
          </p>
        </div>
        <p className="max-w-[180px] text-right text-sm text-muted">
          Live from your baseline + journals{coOccurrence ? ' · co-occurrence' : ''}.
        </p>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Live stress signal chart from your tracked data"
        >
          {[20, 40, 60, 80].map((tick) => {
            const y = height - ((tick - 20) / 70) * height
            return (
              <g key={tick}>
                <line x1="0" x2={width} y1={y} y2={y} stroke="rgba(21,23,26,0.06)" strokeWidth="1" />
                <text x="0" y={y - 6} fill="#73777D" fontSize="11" fontFamily="Inter, sans-serif">
                  {tick}
                </text>
              </g>
            )
          })}

          {d && (
            <motion.path
              d={d}
              fill="none"
              stroke="#15171A"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0.2 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          )}

          {coords.map((c, i) => (
            <motion.circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={c === spike ? 6 : 3.5}
              fill={c === spike ? '#FF6B6B' : '#15171A'}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduce ? 0 : 0.9 + i * 0.06, duration: 0.35 }}
            />
          ))}

          <motion.g
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 1.7, duration: 0.5 }}
          >
            <foreignObject
              x={Math.min(spike.x - 20, width - 160)}
              y={Math.max(8, spike.y - 48)}
              width="150"
              height="40"
            >
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-full border border-border bg-white/95 px-3 py-1.5 text-left text-xs font-medium text-ink shadow-sm backdrop-blur transition hover:border-elevated/40"
              >
                Something changed.
              </button>
            </foreignObject>
          </motion.g>
        </svg>

        <div className="mt-2 flex justify-between px-1 text-xs text-muted">
          {daySeries.map((d) => (
            <span key={d.date}>{d.dayLabel[0]}</span>
          ))}
        </div>
      </div>

      {open && spikeDay && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mt-6 rounded-2xl border border-border bg-bg p-5"
        >
          <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            {spikeDay.dayLabel} · signal {spikeDay.score}
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {spikeDay.coOccurrence ? 'Stress signals elevated' : 'Signals shifting'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <Stat label="Sleep" value={`${body.deltas.sleepPct >= 0 ? '↑' : '↓'} ${Math.abs(body.deltas.sleepPct)}%`} />
            <Stat label="Resting HR" value={`${body.deltas.restingHeartRatePct >= 0 ? '↑' : '↓'} ${Math.abs(body.deltas.restingHeartRatePct)}%`} />
            <Stat label="Language" value={`${language.current.urgency}`} />
          </div>
          <button
            type="button"
            onClick={onExplore}
            className="mt-5 text-sm font-medium text-ink underline underline-offset-4"
          >
            See why
          </button>
        </motion.div>
      )}

      {!open && (
        <button
          type="button"
          className="mt-4 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          onClick={() => setOpen(true)}
        >
          Inspect the spike
        </button>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  )
}
