type SpeechHandlers = {
  onPartial?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (message: string) => void
  onEnd?: () => void
}

type RecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

function getRecognition(): RecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike
    webkitSpeechRecognition?: new () => RecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function speechSupported() {
  return typeof window !== 'undefined' && !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}

export function startSpeechRecognition(handlers: SpeechHandlers) {
  const recognition = getRecognition()
  if (!recognition) {
    handlers.onError?.('Speech recognition is not supported in this browser. Type instead, or try Chrome.')
    return null
  }

  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  let finalText = ''

  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const piece = event.results[i]![0]!.transcript
      if (event.results[i]!.isFinal) finalText += piece + ' '
      else interim += piece
    }
    const combined = (finalText + interim).trim()
    handlers.onPartial?.(combined)
  }

  recognition.onerror = (event) => {
    if (event.error === 'aborted' || event.error === 'no-speech') return
    handlers.onError?.(event.error)
  }

  recognition.onend = () => {
    handlers.onFinal?.(finalText.trim())
    handlers.onEnd?.()
  }

  try {
    recognition.start()
  } catch {
    handlers.onError?.('Could not start the microphone.')
    return null
  }

  return {
    stop: () => {
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    },
  }
}
