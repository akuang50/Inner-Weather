import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function Section({
  id,
  children,
  className = '',
  dark = false,
}: {
  id?: string
  children: ReactNode
  className?: string
  dark?: boolean
}) {
  return (
    <section
      id={id}
      className={`relative px-6 md:px-10 lg:px-16 ${dark ? 'bg-dark text-white' : ''} ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${
        light ? 'text-white/50' : 'text-muted'
      }`}
    >
      {children}
    </p>
  )
}

export function Bar({
  value,
  tone = 'elevated',
}: {
  value: number
  tone?: 'elevated' | 'calm' | 'changing' | 'ai'
}) {
  const colors = {
    elevated: 'bg-elevated',
    calm: 'bg-calm',
    changing: 'bg-changing',
    ai: 'bg-ai',
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
      <motion.div
        className={`h-full rounded-full ${colors[tone]}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.min(100, Math.max(6, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  )
}
