import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FusionDiagram } from '../src/components/FusionDiagram';
import { Button } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { buildDaySeries } from '../src/engine/daySeries';
import { useApp } from '../src/state/AppContext';
import { colors, spacing, stressWarmth } from '../src/theme';

export default function HomeScreen() {
  const { preferences, snapshot, journals, analyses } = useApp();
  const router = useRouter();
  const bg = stressWarmth(snapshot.score);

  const series = useMemo(
    () => buildDaySeries(demoHealthSignals, journals, analyses, 7),
    [journals, analyses],
  );
  const today = series[series.length - 1];
  const linked =
    (today?.coOccurrence ?? false) ||
    (snapshot.messagingSignal >= 0.45 && snapshot.physiologicalSignal >= 0.4);

  const fusionLine =
    snapshot.latestTone?.flags?.[0] ??
    today?.narrative.fusion ??
    snapshot.uncertainty;

  return (
    <LinearGradient colors={[bg, '#F7F8FA', '#EEF2F4']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>Inner Weather</Text>
          <Text style={styles.hello}>
            {preferences.name}, something in you shifted.
          </Text>
          <Text style={styles.lede}>
            Not vs other people — vs <Text style={styles.em}>your</Text> baseline. Body, words,
            and message tone moved together.
          </Text>

          <FusionDiagram
            body={today?.bodyScore ?? snapshot.physiologicalSignal}
            language={today?.languageScore ?? snapshot.languageSignal}
            messaging={snapshot.messagingSignal}
            context={today?.contextScore ?? snapshot.contextSignal}
            linked={linked}
          />

          <Text style={styles.fusionLine}>{fusionLine}</Text>

          <Pressable style={styles.primaryHit} onPress={() => router.push('/fuse')}>
            <Text style={styles.primaryHitLabel}>Watch the signals fuse</Text>
            <Text style={styles.primaryHitSub}>
              Type what’s on your mind — see body + words connect live
            </Text>
          </Pressable>

          <View style={styles.rowActions}>
            <Button
              label="Tell me what’s going on"
              onPress={() => router.push('/rant')}
              style={{ flex: 1 }}
            />
          </View>
          <Button label="Scrub the week" variant="soft" onPress={() => router.push('/replay')} />
          <Button
            label="Why this isn’t a diagnosis"
            variant="ghost"
            onPress={() => router.push('/why')}
          />

          <Text style={styles.scoreFoot}>
            Stress signal {snapshot.score} · baseline ~{snapshot.baselineScore} · confidence{' '}
            {Math.round(snapshot.confidence * 100)}%
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  hello: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  lede: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(21,23,26,0.72)',
    marginBottom: spacing.sm,
    maxWidth: 420,
  },
  em: {
    fontFamily: 'DMSans_600SemiBold',
    color: colors.primary,
  },
  fusionLine: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  primaryHit: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  primaryHitLabel: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.white,
    marginBottom: 6,
  },
  primaryHitSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
  },
  rowActions: {
    marginBottom: spacing.sm,
  },
  scoreFoot: {
    marginTop: spacing.xl,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
});
