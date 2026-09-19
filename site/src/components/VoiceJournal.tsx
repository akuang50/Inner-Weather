import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { speechSupported, startSpeechRecognition } from '../lib/speech'
import { useTracker } from '../state/TrackerProvider'
import { Eyebrow, Reveal, Section } from './ui'

type VoiceState = 'idle' | 'listening' | 'processing' | 'result' | 'action'

export function VoiceJournal() {
  const { addJournal, grokEnabled } = useTracker()
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [themes, setThemes] = useState<string[]>([])
  const [analysisBars, setAnalysisBars] = useState<
    { name: string; strength: number }[]
  >([])
  const [strongest, setStrongest] = useState('uncertainty')
  const [reflection, setReflection] = useState('')
  const [analysisSource, setAnalysisSource] = useState<'grok' | 'local'>('local')
  const reduce = useReducedMotion()
  const session = useRef<{ stop: () => void } | null>(null)
  const startedAt = useRef(0)
  const supportsSpeech = typeof window !== 'undefined' && speechSupported()

  useEffect(() => {
    return () => session.current?.stop()
  }, [])

  const finishWithTranscript = async (text: string, source: 'voice' | 'typed') => {
    const clean = text.trim()
    if (!clean) {
      setError('No speech captured — try again or type below.')
      setState('idle')
      return
    }
    setState('processing')
    setTranscript(clean)
    try {
      const entry = await addJournal(clean, {
        source,
        durationSec: Math.max(3, Math.round((Date.now() - startedAt.current) / 1000)),
      })
      const a = entry.analysis
      setThemes(a.themes)
      setAnalysisBars(
        [
          { name: 'Urgency', strength: a.urgency },
          { name: 'Uncertainty', strength: a.uncertainty },
          { name: 'Overwhelm', strength: a.overwhelm },
          { name: 'Negativity', strength: a.negativity },
        ]
          .sort((x, y) => y.strength - x.strength)
          .slice(0, 3),
      )
      setStrongest(
        [
          { name: 'urgency', v: a.urgency },
          { name: 'uncertainty', v: a.uncertainty },
          { name: 'overwhelm', v: a.overwhelm },
        ].sort((x, y) => y.v - x.v)[0]?.name ?? 'uncertainty',
      )
      setReflection(entry.reflection ?? '')
      setAnalysisSource(entry.analysisSource ?? 'local')
      setState('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
      setState('idle')
    }
  }

  const start = () => {
    if (state === 'listening') return
    setError(null)
    setTranscript('')
    startedAt.current = Date.now()

    if (!supportsSpeech) {
      setError('Live mic needs Chrome/Edge. Type your rant below — it still gets tracked.')
      return
    }

    setState('listening')
    session.current = startSpeechRecognition({
      onPartial: (t) => setTranscript(t),
      onError: (m) => {
        setError(m)
        setState('idle')
      },
      onFinal: (t) => {
        // handled on stop
        if (t) setTranscript(t)
      },
    })
  }

  const stop = () => {
    if (state !== 'listening') return
    session.current?.stop()
    session.current = null
    // small delay for final results
    window.setTimeout(() => {
      void finishWithTranscript(transcript || typed, 'voice')
    }, 350)
  }

  return (
    <Section id="voice" dark className="py-24 md:py-32">
      <Reveal>
        <Eyebrow light>Voice rant · live</Eyebrow>
        <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
          Don’t journal.
          <br />
          Just talk.
        </h2>
        <p className="mt-4 max-w-md text-base text-white/60 md:text-lg">
          Browser speech-to-text captures your words.
          {grokEnabled
            ? ' Grok analyzes the transcript for themes and language signals.'
            : ' Add an xAI API key in Track to analyze with Grok (local heuristics until then).'}
        </p>
        <p className="mt-2 text-xs text-white/35">
          Analyzer: {grokEnabled ? 'Grok (xAI)' : 'local fallback'} · mic still uses Web Speech API
        </p>
      </Reveal>

      <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="flex flex-col items-center text-center">
          <button
            type="button"
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={() => {
              if (state === 'listening') stop()
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              start()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              stop()
            }}
            onClick={() => {
              // click toggle fallback for accessibility
              if (state === 'listening') stop()
              else if (state === 'idle' || state === 'result' || state === 'action') start()
            }}
            aria-label="Hold to talk"
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
            {state === 'idle' && (supportsSpeech ? 'Hold to rant' : 'Type below to track')}
            {state === 'listening' && 'Listening… release to analyze'}
            {state === 'processing' &&
              (grokEnabled ? 'Grok is reading your words…' : 'Extracting language signals…')}
            {state === 'result' && 'I heard you — entry saved.'}
            {state === 'action' && 'A place to start'}
          </p>

          {state === 'listening' && (
            <div className="mt-6 flex h-10 items-end gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-elevated"
                  animate={reduce ? { height: 12 } : { height: [8, 28, 10, 22, 8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>
          )}

          {error && <p className="mt-4 max-w-xs text-sm text-elevated">{error}</p>}
        </Reveal>

        <Reveal delay={0.1}>
          <label className="block text-sm text-white/50">
            Or type — still tracked as a real journal entry
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={3}
              placeholder="What’s actually going on…"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/25"
            />
          </label>
          <button
            type="button"
            disabled={typed.trim().length < 3 || state === 'listening' || state === 'processing'}
            onClick={() => {
              startedAt.current = Date.now()
              void finishWithTranscript(typed, 'typed')
              setTyped('')
            }}
            className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Analyze & save text
          </button>

          <AnimatePresence mode="wait">
            {(state === 'processing' || state === 'result' || state === 'action') && transcript && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6"
              >
                <p className="text-lg leading-relaxed text-white/85 md:text-xl">“{transcript}”</p>
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
                  {themes.map((t, i) => (
                    <li key={t} className="flex items-baseline gap-4">
                      <span className="text-sm text-white/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-lg">{t}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 space-y-3">
                  {analysisBars.map((t, i) => (
                    <div key={t.name}>
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
                  ))}
                </div>
              </div>

              <p className="text-white/65">
                The strongest shift in this entry is{' '}
                <span className="text-white">{strongest}</span>
                {analysisSource === 'grok' ? ' (via Grok)' : ' (local analyzer)'}. It’s saved to your
                local timeline.
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
                    {reflection ||
                      (strongest === 'uncertainty'
                        ? "You don’t seem stuck on everything — you seem stuck on where to start."
                        : strongest === 'urgency'
                          ? 'There’s a lot of urgency here. Name the single next action that would lower the pressure.'
                          : 'There’s a lot of weight in this. Shrink it to one finishable step.')}
                  </p>
                  <a
                    href="#replay"
                    className="mt-5 inline-flex rounded-full bg-ai px-5 py-3 text-sm font-medium text-white"
                  >
                    See it on your timeline
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}
        </Reveal>
      </div>
    </Section>
  )
}
