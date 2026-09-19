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
      className={`relative px-6 md:px-10 lg:px-16 ${
        dark ? 'bg-gradient-to-b from-dark to-dark-soft text-white' : ''
      } ${className}`}
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
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`text-[11px] font-semibold tracking-[0.2em] uppercase ${
        light ? 'text-white/45' : 'text-muted'
      }`}
    >
      {children}
    </p>
  )
}

export function Display({
  children,
  className = '',
  as: Tag = 'h2',
}: {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
}) {
  return <Tag className={`font-display ${className}`}>{children}</Tag>
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
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.05]">
      <motion.div
        className={`h-full rounded-full ${colors[tone]}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.min(100, Math.max(6, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
