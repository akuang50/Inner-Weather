import type { CoachTone } from './types'

export type MetaReplyPayload = {
    messages: { role: 'user' | 'assistant'; content: string }[]
    tone: CoachTone
    stressScore: number
    displayName?: string
    memory: string[]
}

export type MetaReply = {
    reply: string
    coachTone: CoachTone
    model: string
}

/**
 * Sends the conversation to chatbot.py (via the Vite /api proxy)
 * and returns the processed reply.
 * Throws on network errors, timeouts, or non-2xx responses.
 */
export async function fetchMetaReply(
    payload: MetaReplyPayload,
    timeoutMs = 30_000,
): Promise<MetaReply> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const res = await fetch('/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            // camelCase (JS) -> snake_case (Python)
            body: JSON.stringify({
                messages: payload.messages,
                tone: payload.tone,
                stress_score: payload.stressScore,
                display_name: payload.displayName ?? null,
                memory: payload.memory,
            }),
        })

        if (!res.ok) {
            let detail = ''
            try {
                detail = (await res.json()).detail ?? ''
            } catch {
                /* response wasn't JSON */
            }
            throw new Error(`Coach API ${res.status}${detail ? `: ${detail}` : ''}`)
        }

        const data = await res.json()
        if (typeof data.reply !== 'string' || !data.reply.trim()) {
            throw new Error('Coach API returned no reply text')
        }

        // snake_case (Python) -> camelCase (JS)
        return {
            reply: data.reply,
            coachTone: (data.coach_tone ?? payload.tone) as CoachTone,
            model: String(data.model ?? 'meta'),
        }
    } finally {
        clearTimeout(timer)
    }
}
