import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import type { ChatSessionRecord, CoachTone } from '../lib/types'
import { useChat } from '../state/ChatProvider'
import { useTracker } from '../state/TrackerProvider'
import { Eyebrow, Reveal, Section } from './ui'

function toneBadge(tone: CoachTone | undefined) {
  if (!tone) return null
  const labels: Record<CoachTone, string> = {
    warm: 'Warm tone',
    gentle: 'Gentle tone',
    grounding: 'Grounding tone',
    encouraging: 'Encouraging tone',
  }
  return (
    <span className="text-[10px] uppercase tracking-wide text-muted">{labels[tone]}</span>
  )
}

function StressPill({ score }: { score: number }) {
  const level = score >= 65 ? 'elevated' : score >= 45 ? 'changing' : 'calm'
  const colors = {
    elevated: 'bg-elevated/15 text-elevated',
    changing: 'bg-changing/20 text-amber-900',
    calm: 'bg-calm/15 text-emerald-900',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${colors[level]}`}>
      stress {score}
    </span>
  )
}

function SessionList({
  sessions,
  activeId,
  viewingId,
  onSelect,
}: {
  sessions: ChatSessionRecord[]
  activeId: string | null
  viewingId: string | null
  onSelect: (id: string | null) => void
}) {
  const completed = sessions.filter((s) => s.status === 'completed')
  if (!completed.length && !activeId) {
    return (
      <p className="text-sm text-muted">No past sessions yet — start one to build memory for next time.</p>
    )
  }

  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
      {sessions.map((s) => {
        const selected = viewingId === s.id || (s.status === 'active' && !viewingId)
        const label = new Date(s.startedAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.status === 'active' ? null : s.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                selected ? 'border-ink/20 bg-white shadow-sm' : 'border-border bg-bg/80 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{label}</span>
                <span className="text-xs text-muted capitalize">{s.status}</span>
              </div>
              {s.debrief ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted">{s.debrief.summary}</p>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function MessageList({
  session,
  readOnly,
}: {
  session: ChatSessionRecord
  readOnly?: boolean
}) {
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.messages.length])

  return (
    <div
      className={`flex max-h-[min(420px,50vh)] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-bg/50 p-4 ${
        readOnly ? 'opacity-95' : ''
      }`}
    >
      {session.messages.map((m) => (
        <div
          key={m.id}
          className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-ink text-white'
                : 'surface-solid border border-border text-ink'
            }`}
          >
            {m.content}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-1">
            {m.role === 'user' && m.stress ? <StressPill score={m.stress.score} /> : null}
            {m.role === 'assistant' ? toneBadge(m.coachTone) : null}
          </div>
        </div>
      ))}
      <div ref={bottom} />
    </div>
  )
}

function DebriefPanel({ session }: { session: ChatSessionRecord }) {
  const d = session.debrief
  if (!d) return null
  return (
    <div className="mt-4 rounded-2xl border border-ai/20 bg-ai/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Sparkles className="h-4 w-4 text-ai" />
        Session debrief
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{d.summary}</p>
      <p className="mt-2 text-sm text-muted">{d.stressArc}</p>
      {d.whatHelped.length ? (
        <ul className="mt-3 list-inside list-disc text-sm text-muted">
          {d.whatHelped.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm text-ink">{d.followUp}</p>
      <p className="mt-3 text-xs text-muted">
        Saved for future sessions · peak stress {d.peakStress}/100
      </p>
    </div>
  )
}

export function StressCoachChat() {
  const { grokEnabled, stressScore } = useTracker()
  const {
    store,
    activeSession,
    viewingSession,
    busy,
    lastSource,
    startSession,
    sendMessage,
    endSession,
    selectSession,
  } = useChat()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const displaySession =
    activeSession ?? viewingSession ?? store.sessions.find((s) => s.status === 'completed') ?? null
  const readOnly = Boolean(viewingSession && viewingSession.status === 'completed')

  const onStart = async () => {
    setError(null)
    const err = await startSession()
    if (err) setError(err)
  }

  const onSend = async () => {
    setError(null)
    const err = await sendMessage(draft)
    if (err) setError(err)
    else setDraft('')
  }

  const onEnd = async () => {
    setError(null)
    await endSession()
  }

  return (
    <Section id="coach" className="py-16 md:py-24">
      <Reveal>
        <Eyebrow>Coach</Eyebrow>
        <h2 className="font-display mt-3 max-w-2xl text-3xl tracking-tight md:text-4xl">
          Chat session with stress-aware support
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Open a session, talk through what&apos;s happening, and get tone shifts and destress ideas
          when language looks elevated. Uses your tracker baseline, journals, and past session memory
          {grokEnabled ? ' (Grok)' : ' (local fallback — add an xAI key in Track for richer replies)'}.
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
        <aside className="surface rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <MessageCircle className="h-4 w-4" />
            Past sessions
          </div>
          <div className="mt-3">
            <SessionList
              sessions={store.sessions}
              activeId={store.activeSessionId}
              viewingId={viewingSession?.id ?? null}
              onSelect={selectSession}
            />
          </div>
        </aside>

        <div className="surface-solid rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">
                {activeSession ? 'Live session' : readOnly ? 'Reviewing session' : 'No active session'}
              </p>
              <p className="text-xs text-muted">
                App stress signal {stressScore} ·{' '}
                {lastSource ? `last reply: ${lastSource}` : 'ready'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!activeSession ? (
                <button type="button" className="btn-primary text-sm" disabled={busy} onClick={onStart}>
                  Start session
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  disabled={busy}
                  onClick={onEnd}
                >
                  End & debrief
                </button>
              )}
            </div>
          </div>

          {!displaySession ? (
            <p className="mt-8 text-sm text-muted">
              Start a session to chat. When you end it, you&apos;ll get a summary stored here and remembered
              in future sessions.
            </p>
          ) : (
            <>
              <div className="mt-5">
                <MessageList session={displaySession} readOnly={readOnly} />
              </div>

              {activeSession && !readOnly ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none ring-ai/30 focus:ring-2"
                    placeholder="What's on your mind?"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void onSend()
                      }
                    }}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="btn-primary shrink-0 text-sm"
                    disabled={busy || !draft.trim()}
                    onClick={onSend}
                  >
                    {busy ? 'Thinking…' : 'Send'}
                  </button>
                </div>
              ) : null}

              {readOnly && displaySession.debrief ? <DebriefPanel session={displaySession} /> : null}
            </>
          )}

          {error ? (
            <p className="mt-3 text-sm text-elevated" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </Reveal>
    </Section>
  )
}
