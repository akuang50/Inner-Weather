import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MetricDeviation } from '../types';
import { colors } from '../theme';

export function SignalHero({
  score,
  baseline,
  change,
}: {
  score: number;
  baseline: number;
  change: number;
}) {
  const hot = change >= 8;
  return (
    <View style={styles.hero}>
      <Text style={styles.kicker}>Stress signal vs your baseline</Text>
      <View style={styles.row}>
        <Text style={styles.score}>{score}</Text>
        <View style={styles.deltaBox}>
          <Text style={styles.base}>baseline {baseline}</Text>
          <Text style={[styles.delta, hot && styles.deltaHot]}>
            {change >= 0 ? '+' : ''}
            {change}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function MetricPills({ deviations }: { deviations: MetricDeviation[] }) {
  if (!deviations.length) return null;
  return (
    <View style={styles.pills}>
      {deviations.slice(0, 4).map((d) => (
        <View key={d.metric} style={styles.pill}>
          <Text style={styles.pillLabel}>{d.label}</Text>
          <Text style={styles.pillValue}>
            {d.current}
            <Text style={styles.pillDelta}>
              {' '}
              {d.changePct > 0 ? '+' : ''}
              {d.changePct}%
            </Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: 8,
  },
  kicker: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  score: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -2.5,
    color: colors.primary,
  },
  deltaBox: { alignItems: 'flex-end', paddingBottom: 10 },
  base: {
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
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(21,23,26,0.06)',
    minWidth: '47%',
    flexGrow: 1,
  },
  pillLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  pillValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: colors.primary,
  },
  pillDelta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
});
