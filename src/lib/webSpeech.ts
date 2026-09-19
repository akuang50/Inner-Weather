type SpeechCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

function speechCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canUseWebSpeech(): boolean {
  return speechCtor() != null;
}

/** Browser speech-to-text for the web demo path (HTTPS / GitHub Pages). */
export function startWebSpeech(onTranscript: (text: string, isFinal: boolean) => void): () => void {
  const Ctor = speechCtor();
  if (!Ctor) return () => undefined;

  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.onresult = (event) => {
    let combined = '';
    let final = false;
    for (let i = 0; i < event.results.length; i++) {
      const piece = event.results[i];
      combined += piece[0]?.transcript ?? '';
      if (piece.isFinal) final = true;
    }
    onTranscript(combined.trim(), final);
  };
  rec.onerror = () => undefined;
  try {
    rec.start();
  } catch {
    return () => undefined;
  }
  return () => {
    try {
      rec.stop();
    } catch {
      // already stopped
    }
  };
}
