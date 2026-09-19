import type { ChatStore } from './types'

const KEY_PREFIX = 'stress-monitor-chat-v1'

function storeKey(userId: string) {
  return `${KEY_PREFIX}:${userId}`
}

export function emptyChatStore(): ChatStore {
  return { sessions: [], activeSessionId: null }
}

export function loadChatStore(userId: string): ChatStore {
  try {
    const raw = localStorage.getItem(storeKey(userId))
    if (!raw) return emptyChatStore()
    const parsed = JSON.parse(raw) as ChatStore
    if (!Array.isArray(parsed.sessions)) return emptyChatStore()
    return {
      sessions: parsed.sessions,
      activeSessionId: parsed.activeSessionId ?? null,
    }
  } catch {
    return emptyChatStore()
  }
}

export function saveChatStore(userId: string, store: ChatStore) {
  localStorage.setItem(storeKey(userId), JSON.stringify(store))
}

export function clearChatStore(userId: string) {
  localStorage.removeItem(storeKey(userId))
}
