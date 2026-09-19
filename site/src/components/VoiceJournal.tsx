import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { stressData } from '../data/stressData'
import { Eyebrow, Reveal, Section } from './ui'

type VoiceState = 'idle' | 'listening' | 'processing' | 'result' | 'action'

export function VoiceJournal() {
  const [state, setState] = useState<VoiceState>('idle')
  const reduce = useReducedMotion()

  useEffect(() => {
    if (state !== 'listening') return
    const t = window.setTimeout(() => setState('processing'), 2000)
    return () => window.clearTimeout(t)
  }, [state])

  useEffect(() => {
    if (state !== 'processing') return
    const t = window.setTimeout(() => setState('result'), 1400)
    return () => window.clearTimeout(t)
  }, [state])

  const start = () => {
    if (state === 'idle' || state === 'result' || state === 'action') setState('listening')
  }

  return (
    <Section id="voice" dark className="py-24 md:py-32">
      <Reveal>
        <Eyebrow light>Voice rant</Eyebrow>
        <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
          Don’t journal.
          <br />
          Just talk.
        </h2>
        <p className="mt-4 max-w-md text-base text-white/60 md:text-lg">
          Hold a button. Say what’s on your mind. We’ll help you find the pattern.
        </p>
      </Reveal>

      <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={start}
            aria-label="Start voice rant demo"
            className="relative flex h-44 w-44 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {(state === 'listening' || state === 'processing') && !reduce && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full border border-elevated/50"
                  animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <motion.span
                  className="absolute inset-3 rounded-full border border-white/20"
                  animate={{ scale: [1, 1.12], opacity: [0.5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.25 }}
                />
              </>
            )}
            <Mic className="relative h-9 w-9 text-white" strokeWidth={1.5} />
          </button>
          <p className="mt-6 text-sm text-white/55">
            {state === 'idle' && 'Click to rant'}
            {state === 'listening' && 'Listening…'}
            {state === 'processing' && 'Connecting dots…'}
            {state === 'result' && 'I heard you.'}
            {state === 'action' && 'A place to start'}
          </p>

          {state === 'listening' && (
            <div className="mt-6 flex h-10 items-end gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-elevated"
                  animate={
                    reduce
                      ? { height: 12 }
                      : { height: [8, 28, 10, 22, 8] }
                  }
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <AnimatePresence mode="wait">
            {(state === 'processing' || state === 'result' || state === 'action') && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-white/5 p-6"
              >
                <p className="text-lg leading-relaxed text-white/85 md:text-xl">
                  “{stressData.voiceTranscript}”
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {(state === 'result' || state === 'action') && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div>
                <Eyebrow light>What I heard</Eyebrow>
                <ol className="mt-4 space-y-3">
                  {stressData.voiceThemes.map((t, i) => (
                    <li key={t.name} className="flex items-baseline gap-4">
                      <span className="text-sm text-white/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{t.name}</span>
                          <span className="text-white/40">{t.strength}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-ai"
                            initial={{ width: 0 }}
                            animate={{ width: `${t.strength}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-white/65">
                The strongest change from your recent entries is{' '}
                <span className="text-white">uncertainty</span>.
              </p>

              {state === 'result' && (
                <button
                  type="button"
                  onClick={() => setState('action')}
                  className="rounded-full bg-white px-5 py-3 text-sm font-medium text-ink"
                >
                  Help me unpack this
                </button>
              )}

              {state === 'action' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-ai/30 bg-ai/10 p-6"
                >
                  <p className="text-lg leading-relaxed">
                    You don’t seem stuck on the entire project.
                    <br />
                    You seem stuck on where to start.
                  </p>
                  <p className="mt-4 text-white/65">
                    Want to turn it into three concrete next steps?
                  </p>
                  <button
                    type="button"
                    className="mt-5 rounded-full bg-ai px-5 py-3 text-sm font-medium text-white"
                  >
                    Let’s do it
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {state === 'idle' && (
            <p className="text-sm text-white/40">
              Simulated demo — no audio leaves this page.
            </p>
          )}
        </Reveal>
      </div>
    </Section>
  )
}
