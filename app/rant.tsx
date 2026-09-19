import React, { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FusionDiagram } from '../src/components/FusionDiagram';
import { RantButton } from '../src/components/RantButton';
import { Button } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { liveFusionPreview } from '../src/engine/daySeries';
import { analyzeTranscriptLocally } from '../src/engine/stress';
import { canUseWebSpeech, startWebSpeech } from '../src/lib/webSpeech';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

const DEMO_TRANSCRIPT =
  "I'm honestly freaking out about this project. I keep saying I'll start and then I don't. I don't know where to begin and everything is piling up.";

type Phase = 'idle' | 'recording' | 'processing' | 'linking';

export default function RantScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const stopSpeech = useRef<(() => void) | null>(null);
  const liveSpeech = useRef('');
  const startedAt = useRef<number>(0);
  const router = useRouter();
  const { addRant, analyses } = useApp();

  const previewText =
    draft.trim() ||
    liveSpeech.current ||
    (phase === 'processing' || phase === 'linking' ? DEMO_TRANSCRIPT : '');
  const live = useMemo(
    () => liveFusionPreview(demoHealthSignals, analyses, previewText, analyzeTranscriptLocally),
    [analyses, previewText],
  );

  const start = async () => {
    startedAt.current = Date.now();
    liveSpeech.current = '';
    setPhase('recording');
    if (Platform.OS === 'web' && canUseWebSpeech()) {
      stopSpeech.current = startWebSpeech((text) => {
        liveSpeech.current = text;
        setDraft(text);
      });
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
    } catch {
      // demo path — typed / seeded transcript still fuses
    }
  };

  const finishWith = async (transcript: string) => {
    setPhase('processing');
    await new Promise((r) => setTimeout(r, 700));
    setPhase('linking');
    setDraft(transcript);
    await new Promise((r) => setTimeout(r, 900));
    const durationSec = Math.max(3, Math.round((Date.now() - startedAt.current) / 1000));
    addRant(transcript, durationSec);
    router.replace('/insight');
  };

  const stop = async () => {
    if (phase !== 'recording') return;
    stopSpeech.current?.();
    stopSpeech.current = null;
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {
      // ignore
    }
    await finishWith(draft.trim() || liveSpeech.current.trim() || DEMO_TRANSCRIPT);
  };

  return (
    <LinearGradient colors={['#F7F8FA', '#F3EFEA']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.top}>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.title}>Tell me what’s going on</Text>
          <Text style={styles.hint}>
            Hold to talk — or type. We’ll fuse it with today’s body deviations. Not a diagnosis.
          </Text>
        </View>

        <View style={styles.center}>
          {(phase === 'processing' || phase === 'linking' || draft.length > 8) && (
            <FusionDiagram
              body={live.bodyScore}
              language={live.languageScore}
              context={live.contextScore}
              linked={live.coOccurrence && phase !== 'idle'}
              compact
            />
          )}
          <RantButton
            phase={phase === 'linking' ? 'processing' : phase === 'idle' ? 'idle' : phase}
            onPressIn={start}
            onPressOut={stop}
          />
        </View>

        <View style={styles.bottom}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Or type the rant…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            editable={phase === 'idle'}
          />
          <Button
            label="Fuse this text"
            variant="soft"
            disabled={phase !== 'idle' || draft.trim().length < 4}
            onPress={() => {
              startedAt.current = Date.now();
              void finishWith(draft.trim());
            }}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.cue,
    gap: spacing.sm,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.primary,
  },
});
