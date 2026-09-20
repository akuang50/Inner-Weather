import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSleep, useApp } from '../../src/state/AppContext';
import { colors, spacing, stressWarmth } from '../../src/theme';

export default function HomeScreen() {
  const { stressScore, coOccurrence, body, language, daySeries } = useApp();
  const router = useRouter();
  const today = daySeries[daySeries.length - 1];
  const bg = stressWarmth(stressScore);

  return (
    <LinearGradient colors={[bg, colors.background]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>Stress Monitor</Text>
          <Text style={styles.title}>
            {coOccurrence ? 'Something in you shifted.' : 'Watching your weather.'}
          </Text>
          <Text style={styles.lede}>
            Not vs other people — vs your baseline. Body and language, together.
          </Text>

          <View style={styles.scoreRow}>
            <Text style={styles.score}>{stressScore}</Text>
            <View>
              <Text style={styles.scoreLabel}>Stress signal</Text>
              <Text style={styles.scoreMeta}>
                {coOccurrence ? 'Channels co-occurring' : 'Building pattern'}
              </Text>
            </View>
          </View>

          <Stream label="Body" value={Math.round((today?.bodyScore ?? body.score) * 100)} />
          <Stream label="Words" value={Math.round((today?.languageScore ?? language.score) * 100)} />
          <Stream label="Context" value={Math.round((today?.contextScore ?? 0.2) * 100)} />

          <Text style={styles.blurb}>
            Sleep {body.deltas.sleepPct}% · HR {body.deltas.restingHeartRatePct}% · urgency{' '}
            {language.current.urgency}
            {body.current ? ` · today ${formatSleep(body.current.sleepHours)}` : ''}
          </Text>

          <Pressable style={styles.primary} onPress={() => router.push('/(tabs)/talk')}>
            <Text style={styles.primaryText}>Tell me what’s going on</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/(tabs)/replay')}>
            <Text style={styles.secondaryText}>Scrub the week</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Stream({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stream}>
      <Text style={styles.streamLabel}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fillBar,
            {
              width: `${Math.max(8, Math.min(100, value))}%`,
              backgroundColor: value >= 45 ? colors.stress : colors.calm,
            },
          ]}
        />
      </View>
      <Text style={styles.streamValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    lineHeight: 40,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  lede: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  score: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -2,
    color: colors.primary,
  },
  scoreLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  scoreMeta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.stress,
    marginTop: 4,
  },
  stream: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  streamLabel: {
    width: 64,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  fillBar: { height: '100%', borderRadius: 6 },
  streamValue: {
    width: 28,
    textAlign: 'right',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  blurb: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: {
    color: colors.white,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  secondary: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.primary,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
});
