import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  analyzeMessageStress,
  buildTrackerCoachContext,
  generateCoachReply,
  generateOpeningReply,
  generateSessionDebrief,
  pickCoachTone,
} from '../lib/chatCoach'
import { loadChatStore, saveChatStore } from '../lib/chatStorage'
import type { ChatSessionRecord, ChatStore } from '../lib/types'
import { useAuth } from './AuthProvider'
import { useTracker } from './TrackerProvider'

type ChatContextValue = {
  ready: boolean
  store: ChatStore
  activeSession: ChatSessionRecord | null
  busy: boolean
  lastSource: 'grok' | 'local' | null
  startSession: () => Promise<string | null>
  sendMessage: (text: string) => Promise<string | null>
  endSession: () => Promise<ChatSessionRecord | null>
  selectSession: (id: string | null) => void
  viewingSession: ChatSessionRecord | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth()
  const tracker = useTracker()
  const [ready, setReady] = useState(false)
  const [store, setStore] = useState<ChatStore>({ sessions: [], activeSessionId: null })
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastSource, setLastSource] = useState<'grok' | 'local' | null>(null)

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      setStore({ sessions: [], activeSessionId: null })
      setViewingId(null)
      setReady(true)
      return
    }
    setStore(loadChatStore(user.id))
    setReady(true)
  }, [authReady, user?.id])

  useEffect(() => {
    if (!ready || !user) return
    saveChatStore(user.id, store)
  }, [store, ready, user?.id])

  const coachContext = useMemo(() => {
    if (!user) return null
    return buildTrackerCoachContext({
      displayName: user.displayName,
      stressScore: tracker.stressScore,
      coOccurrence: tracker.coOccurrence,
      body: tracker.body,
      baseline: tracker.baseline,
      journals: tracker.journals,
      languageTopics: tracker.language.current.topics,
      grokEnabled: tracker.grokEnabled,
    })
  }, [user, tracker])

  const activeSession = useMemo(
    () => store.sessions.find((s) => s.id === store.activeSessionId) ?? null,
    [store],
  )

  const viewingSession = useMemo(() => {
    if (!viewingId) return null
    return store.sessions.find((s) => s.id === viewingId) ?? null
  }, [store.sessions, viewingId])

  const patchStore = useCallback((updater: (prev: ChatStore) => ChatStore) => {
    setStore((prev) => updater(prev))
  }, [])

  const startSession = useCallback(async () => {
    if (!user || !coachContext) return 'Sign in to start a chat session.'
    if (store.activeSessionId) return 'End your current session before starting a new one.'

    setBusy(true)
    const id = `chat-${Date.now()}`
    const session: ChatSessionRecord = {
      id,
      startedAt: new Date().toISOString(),
      status: 'active',
      messages: [],
    }

    const past = store.sessions.filter((s) => s.status === 'completed')
    try {
      const opening = await generateOpeningReply(coachContext, past)
      setLastSource(opening.source)
      session.messages.push(opening.message)
      patchStore((prev) => ({
        sessions: [session, ...prev.sessions],
        activeSessionId: id,
      }))
      setViewingId(null)
      return null
    } catch (e) {
      console.warn(e)
      return 'Could not start session. Try again.'
    } finally {
      setBusy(false)
    }
  }, [user, coachContext, store.activeSessionId, store.sessions, patchStore])

  const sendMessage = useCallback(
    async (text: string) => {
      const clean = text.trim()
      if (!clean) return 'Type a message first.'
      if (!user || !coachContext || !activeSession) return 'Start a session to chat.'

      const stress = analyzeMessageStress(clean)
      const peak = activeSession.messages.reduce(
        (max, m) => Math.max(max, m.stress?.score ?? 0),
        0,
      )
      const tone = pickCoachTone(stress, peak)

      const userMessage = {
        id: `m-${Date.now()}-u`,
        role: 'user' as const,
        content: clean,
        timestamp: new Date().toISOString(),
        stress,
      }

      patchStore((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, userMessage] }
            : s,
        ),
      }))

      setBusy(true)
      try {
        const sessionWithUser: ChatSessionRecord = {
          ...activeSession,
          messages: [...activeSession.messages, userMessage],
        }
        const past = store.sessions.filter((s) => s.status === 'completed')
        const reply = await generateCoachReply({
          userText: clean,
          stress,
          tone,
          ctx: coachContext,
          session: sessionWithUser,
          pastSessions: past,
        })
        setLastSource(reply.source)

        patchStore((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === activeSession.id
              ? { ...s, messages: [...s.messages, reply.message] }
              : s,
          ),
        }))
        return null
      } catch (e) {
        console.warn(e)
        return 'Something went wrong sending your message.'
      } finally {
        setBusy(false)
      }
    },
    [user, coachContext, activeSession, store.sessions, patchStore],
  )

  const endSession = useCallback(async () => {
    if (!user || !coachContext || !activeSession) return null

    setBusy(true)
    try {
      const debrief = await generateSessionDebrief({ session: activeSession, ctx: coachContext })
      const endedAt = new Date().toISOString()
      const completed: ChatSessionRecord = {
        ...activeSession,
        status: 'completed',
        endedAt,
        debrief,
      }
      patchStore((prev) => ({
        activeSessionId: null,
        sessions: prev.sessions.map((s) => (s.id === activeSession.id ? completed : s)),
      }))
      setViewingId(completed.id)
      return completed
    } catch (e) {
      console.warn(e)
      return null
    } finally {
      setBusy(false)
    }
  }, [user, coachContext, activeSession, patchStore])

  const value: ChatContextValue = {
    ready: ready && tracker.ready,
    store,
    activeSession,
    busy,
    lastSource,
    startSession,
    sendMessage,
    endSession,
    selectSession: setViewingId,
    viewingSession,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
