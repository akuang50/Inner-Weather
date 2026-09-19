import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarRow, Button, SectionLabel, Sparkline } from '../src/components/ui';
import { useApp } from '../src/state/AppContext';
import { colors, spacing, stressWarmth } from '../src/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { preferences, snapshot } = useApp();
  const router = useRouter();
  const bg = stressWarmth(snapshot.score);

  const sleep = snapshot.metricDeviations.find((d) => d.metric === 'sleep_hours');
  const rhr = snapshot.metricDeviations.find((d) => d.metric === 'resting_hr');

  const related = useMemo(() => {
    if (!snapshot.primaryTheme) return null;
    const mentions = snapshot.contributingFactors.find((c) => c.includes('mentioned'));
    return { theme: snapshot.primaryTheme, mentions };
  }, [snapshot]);

  return (
    <LinearGradient colors={[bg, '#F7F8FA']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.hello}>
            {greeting()}, {preferences.name}.
          </Text>

          <SectionLabel>Your signals</SectionLabel>
          <View style={styles.scoreBlock}>
            <Text style={styles.score}>{snapshot.score}</Text>
            <View style={styles.scoreMeta}>
              <Text style={styles.elevated}>Elevated today</Text>
              <Text style={styles.delta}>
                ↑ {Math.abs(snapshot.change)}% from your recent baseline
              </Text>
            </View>
          </View>

          <SectionLabel>What changed?</SectionLabel>
          {sleep && (
            <BarRow
              label="Sleep"
              pct={sleep.changePct}
              tone={sleep.changePct < 0 ? 'up' : 'down'}
            />
          )}
          {rhr && (
            <BarRow
              label="Resting heart rate"
              pct={rhr.changePct}
              tone={rhr.changePct > 0 ? 'up' : 'down'}
            />
          )}
          <BarRow
            label="Language signals"
            pct={Math.max(8, snapshot.languageChangePct)}
            tone="up"
          />

          <SectionLabel>What might be related?</SectionLabel>
          <View style={styles.related}>
            <Text style={styles.relatedTitle}>
              {related?.theme
                ? related.theme.charAt(0).toUpperCase() + related.theme.slice(1)
                : 'Rising pressure'}
            </Text>
            <Text style={styles.relatedBody}>
              {related?.mentions ??
                'Several of your recent entries echo the same pressure points.'}
            </Text>
            <Text style={styles.disclaimer}>{snapshot.uncertainty}</Text>
          </View>

          <Button
            label="Tell me what’s going on"
            onPress={() => router.push('/rant')}
            style={{ marginTop: spacing.md }}
          />
          <Button
            label="Why am I seeing this?"
            variant="ghost"
            onPress={() => router.push('/why')}
          />

          <SectionLabel>Your week</SectionLabel>
          <Sparkline values={snapshot.weekScores} />

          <Button
            label="Explore stress replay"
            variant="soft"
            onPress={() => router.push('/replay')}
            style={{ marginTop: spacing.lg }}
          />
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
  hello: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  score: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 88,
    lineHeight: 92,
    color: colors.primary,
    letterSpacing: -3,
  },
  scoreMeta: {
    paddingBottom: 14,
    gap: 4,
  },
  elevated: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.stress,
  },
  delta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    maxWidth: 160,
  },
  related: {
    marginBottom: spacing.md,
    gap: 8,
  },
  relatedTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    color: colors.primary,
  },
  relatedBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(21,23,26,0.75)',
  },
  disclaimer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 4,
  },
});
