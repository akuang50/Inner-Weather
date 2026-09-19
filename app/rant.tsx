import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RantButton } from '../src/components/RantButton';
import { Button } from '../src/components/ui';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

const DEMO_TRANSCRIPT =
  "I'm honestly freaking out about this project. I keep saying I'll start and then I don't. I don't know where to begin and everything is piling up.";

type Phase = 'idle' | 'recording' | 'processing';

export default function RantScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startedAt = useRef<number>(0);
  const router = useRouter();
  const { addRant } = useApp();

  const start = async () => {
    setError(null);
    startedAt.current = Date.now();
    setPhase('recording');
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        // Demo path without mic permission
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
    } catch {
      // Keep UI in recording state; we'll use demo transcript on release.
    }
  };

  const stop = async () => {
    if (phase !== 'recording') return;
    setPhase('processing');

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {
      // ignore
    }

    // Prototype: local heuristic analysis with demo transcript.
    // Swap for speech-to-text + LLM structured extraction later.
    await new Promise((r) => setTimeout(r, 900));
    const durationSec = Math.max(3, Math.round((Date.now() - startedAt.current) / 1000));
    addRant(DEMO_TRANSCRIPT, durationSec);
    router.replace('/insight');
  };

  return (
    <LinearGradient colors={['#F7F8FA', '#F3EFEA']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.top}>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.hint}>Hold to talk. Release when you’re done.</Text>
        </View>
        <View style={styles.center}>
          <RantButton phase={phase} onPressIn={start} onPressOut={stop} />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
        <Text style={styles.footnote}>
          No forms. No mood sliders. Just what you’re carrying.
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
    paddingHorizontal: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: spacing.md,
    color: colors.stress,
    fontFamily: 'DMSans_400Regular',
  },
  footnote: {
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
