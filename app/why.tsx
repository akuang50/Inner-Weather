import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SectionLabel } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { buildDaySeries } from '../src/engine/daySeries';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

export default function WhyScreen() {
  const { snapshot, journals, analyses } = useApp();
  const router = useRouter();
  const today = buildDaySeries(demoHealthSignals, journals, analyses, 7).at(-1);

  const reasons = [
    today?.narrative.body,
    today?.narrative.language,
    today?.narrative.context,
    today?.narrative.fusion,
  ].filter(Boolean) as string[];

  return (
    <SafeAreaView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Close" variant="ghost" onPress={() => router.back()} />
        <SectionLabel>Why we noticed</SectionLabel>
        <Text style={styles.title}>
          Independent channels moved together against your personal baseline.
        </Text>

        <View style={styles.list}>
          {reasons.map((reason, i) => (
            <View key={reason} style={styles.item}>
              <Text style={styles.num}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.reason}>{reason}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.confidence}>
          Confidence: {Math.round(snapshot.confidence * 100)}% · prototype fusion weights
        </Text>
        <Text style={styles.note}>
          This is a pattern detector, not a diagnosis. Correlation is not causation.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.cue,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 30,
    lineHeight: 36,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  list: { gap: spacing.lg, marginBottom: spacing.xl },
  item: { flexDirection: 'row', gap: spacing.md },
  num: {
    fontFamily: 'DMSans_600SemiBold',
    color: colors.muted,
    width: 28,
    marginTop: 2,
  },
  reason: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 26,
    color: colors.primary,
  },
  confidence: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.insight,
    marginBottom: 8,
  },
  note: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },
});
