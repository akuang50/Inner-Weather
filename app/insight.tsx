import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FusionDiagram } from '../src/components/FusionDiagram';
import { Button, SectionLabel } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { buildDaySeries } from '../src/engine/daySeries';
import { buildInsight } from '../src/engine/stress';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

export default function InsightScreen() {
  const { latestInsight, snapshot, journals, analyses } = useApp();
  const router = useRouter();
  const insight =
    latestInsight ?? buildInsight(snapshot, journals[journals.length - 1]?.transcript);

  const today = useMemo(() => {
    const series = buildDaySeries(demoHealthSignals, journals, analyses, 7);
    return series[series.length - 1];
  }, [journals, analyses]);

  return (
    <LinearGradient colors={['#F7F8FA', '#EEF1F6']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>I heard you.</Text>
          <Text style={styles.title}>We connected what you said with what your body did.</Text>

          <FusionDiagram
            body={today?.bodyScore ?? snapshot.physiologicalSignal}
            language={today?.languageScore ?? snapshot.languageSignal}
            messaging={snapshot.messagingSignal}
            context={today?.contextScore ?? snapshot.contextSignal}
            linked={today?.coOccurrence ?? true}
          />

          <SectionLabel>You seem to be dealing with</SectionLabel>
          <View style={styles.list}>
            {insight.heardThemes.map((theme, i) => (
              <View key={theme} style={styles.row}>
                <Text style={styles.num}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.theme}>{theme}</Text>
              </View>
            ))}
          </View>

          <SectionLabel>Supporting signals</SectionLabel>
          {insight.supportingSignals.map((s) => (
            <Text key={s} style={styles.support}>
              · {s}
            </Text>
          ))}

          <Text style={styles.disclaimer}>{insight.uncertainty}</Text>

          <Button
            label="Help me unpack this"
            onPress={() => router.push('/actions')}
            style={{ marginTop: spacing.lg }}
          />
          <Button
            label="Scrub when it started"
            variant="soft"
            onPress={() => router.push('/replay')}
          />
          <Button label="Back home" variant="ghost" onPress={() => router.replace('/home')} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  kicker: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 32,
    lineHeight: 38,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  num: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.muted,
    width: 28,
  },
  theme: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    color: colors.primary,
    flex: 1,
  },
  support: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(21,23,26,0.8)',
  },
  disclaimer: {
    marginTop: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
});
