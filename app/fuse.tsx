import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FusionDiagram } from '../src/components/FusionDiagram';
import { Button } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { liveFusionPreview } from '../src/engine/daySeries';
import { analyzeTranscriptLocally } from '../src/engine/stress';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

const PROMPTS = [
  "I'm freaking out about this project deadline and I don't know where to start.",
  'Honestly feeling fine today. Classes were normal.',
  'Everything is piling up and I keep scrolling instead of working.',
];

export default function FuseScreen() {
  const { analyses, addRant, snapshot } = useApp();
  const [text, setText] = useState('');
  const deferred = useDeferredValue(text);
  const router = useRouter();

  const live = useMemo(
    () => liveFusionPreview(demoHealthSignals, analyses, deferred, analyzeTranscriptLocally),
    [analyses, deferred],
  );

  const baselineScore = snapshot.baselineScore;
  const delta = live.score - baselineScore;

  const commit = () => {
    const t = text.trim() || PROMPTS[0]!;
    addRant(t, Math.max(8, Math.round(t.split(/\s+/).length / 2)));
    router.push('/insight');
  };

  return (
    <LinearGradient colors={['#F4F6F8', '#F7F8FA', '#F3EFEA']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.brand}>Inner Weather</Text>
          <Text style={styles.title}>Watch body and words meet</Text>
          <Text style={styles.sub}>
            Body signals are already off your baseline. Add language — watch whether the channels
            co-occur.
          </Text>

          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Live stress signal</Text>
              <Text style={styles.score}>{live.score}</Text>
            </View>
            <View style={styles.deltaBox}>
              <Text style={styles.deltaLabel}>vs your baseline {baselineScore}</Text>
              <Text style={[styles.delta, delta > 8 && styles.deltaHot]}>
                {delta >= 0 ? '+' : ''}
                {delta}
              </Text>
            </View>
          </View>

          <FusionDiagram
            body={live.bodyScore}
            language={live.languageScore}
            context={live.contextScore}
            linked={live.coOccurrence}
          />

          <Text style={styles.section}>Type what’s going on</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="No mood slider. Just words…"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
            textAlignVertical="top"
          />

          <View style={styles.prompts}>
            {PROMPTS.map((p) => (
              <Pressable key={p} onPress={() => setText(p)} style={styles.prompt}>
                <Text style={styles.promptText} numberOfLines={2}>
                  Try: {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>What the extractor hears</Text>
          <View style={styles.chips}>
            {(live.emotional.length ? live.emotional : ['waiting for language']).map((e) => (
              <View key={e} style={styles.chip}>
                <Text style={styles.chipText}>{e}</Text>
              </View>
            ))}
          </View>
          <View style={styles.metricGrid}>
            <Metric label="Urgency" value={live.urgency} />
            <Metric label="Uncertainty" value={live.uncertainty} />
            <Metric label="Overwhelm" value={live.overwhelm} />
          </View>

          <Text style={styles.section}>Body already anomalous</Text>
          {live.deviations.slice(0, 3).map((d) => (
            <Text key={d.metric} style={styles.devLine}>
              {d.label}: {d.current} vs baseline {d.baseline} ({d.changePct > 0 ? '+' : ''}
              {d.changePct}%)
            </Text>
          ))}

          <Text style={styles.disclaimer}>
            Co-occurrence ≠ causation. Experimental prototype weights — not a medical model.
          </Text>

          <Button
            label={live.coOccurrence ? 'Lock this insight' : 'Save entry anyway'}
            onPress={commit}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{Math.round(value * 100)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
            paddingBottom: spacing.cue,
  },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    lineHeight: 40,
    color: colors.primary,
    marginTop: 8,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(21,23,26,0.7)',
    marginTop: 8,
    marginBottom: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  scoreLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  score: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
    color: colors.primary,
  },
  deltaBox: { alignItems: 'flex-end', paddingBottom: 10 },
  deltaLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  delta: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.primary,
  },
  deltaHot: { color: colors.stress },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  input: {
    minHeight: 110,
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  prompts: { gap: 8, marginTop: spacing.sm },
  prompt: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
  },
  promptText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(21,23,26,0.7)',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
  },
  chipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  metricGrid: { flexDirection: 'row', gap: 12, marginTop: spacing.sm },
  metric: { flex: 1 },
  metricLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  metricValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.primary,
  },
  devLine: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors.primary,
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
});
