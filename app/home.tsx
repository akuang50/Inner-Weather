import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FusionDiagram } from '../src/components/FusionDiagram';
import { MetricPills, SignalHero } from '../src/components/SignalHero';
import { Button } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { buildDaySeries } from '../src/engine/daySeries';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

export default function HomeScreen() {
  const { preferences, snapshot, journals, analyses } = useApp();
  const router = useRouter();
  const bg = snapshot.score >= 70 ? '#F3EFEA' : snapshot.score >= 50 ? '#F6F4F2' : '#F7F8FA';

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
          <View style={styles.top}>
            <Text style={styles.brand}>Inner Weather</Text>
            <Text style={styles.hello}>{preferences.name}</Text>
          </View>
          <Text style={styles.lede}>
            Something in you shifted — vs <Text style={styles.em}>your</Text> baseline, not vs other
            people.
          </Text>

          <SignalHero
            score={snapshot.score}
            baseline={snapshot.baselineScore}
            change={snapshot.change}
          />
          <MetricPills deviations={snapshot.metricDeviations} />

          <FusionDiagram
            body={today?.bodyScore ?? snapshot.physiologicalSignal}
            language={today?.languageScore ?? snapshot.languageSignal}
            messaging={snapshot.messagingSignal}
            context={today?.contextScore ?? snapshot.contextSignal}
            linked={linked}
          />

          <Text style={styles.fusionLine}>{fusionLine}</Text>

          <Pressable style={styles.primaryHit} onPress={() => router.push('/rant')}>
            <Text style={styles.primaryHitLabel}>Tell me what’s going on</Text>
            <Text style={styles.primaryHitSub}>Hold to talk, or type. We’ll fuse it with today.</Text>
          </Pressable>

          <Button
            label="Watch the signals fuse live"
            variant="soft"
            onPress={() => router.push('/fuse')}
          />
          <Button label="Scrub the week" variant="ghost" onPress={() => router.push('/replay')} />
          <Button
            label="Why this isn’t a diagnosis"
            variant="ghost"
            onPress={() => router.push('/why')}
          />

          <Text style={styles.scoreFoot}>
            Confidence {Math.round(snapshot.confidence * 100)}% · prototype weights · pattern, not a
            diagnosis
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
    paddingBottom: spacing.cue,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.primary,
  },
  hello: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.muted,
  },
  lede: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(21,23,26,0.72)',
    marginBottom: spacing.md,
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
    paddingVertical: 18,
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
  scoreFoot: {
    marginTop: spacing.lg,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
});
