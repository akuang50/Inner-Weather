import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SectionLabel } from '../src/components/ui';
import { useApp } from '../src/state/AppContext';
import { buildInsight } from '../src/engine/stress';
import { colors, spacing } from '../src/theme';

export default function InsightScreen() {
  const { latestInsight, snapshot, journals } = useApp();
  const router = useRouter();
  const insight =
    latestInsight ?? buildInsight(snapshot, journals[journals.length - 1]?.transcript);

  return (
    <LinearGradient colors={['#F7F8FA', '#EEF1F6']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>I heard you.</Text>
          <Text style={styles.title}>You seem to be dealing with:</Text>

          <View style={styles.list}>
            {insight.heardThemes.map((theme, i) => (
              <View key={theme} style={styles.row}>
                <Text style={styles.num}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.theme}>{theme}</Text>
              </View>
            ))}
          </View>

          <SectionLabel>Biggest change</SectionLabel>
          <Text style={styles.change}>
            The biggest change from your recent entries is uncertainty — showing up alongside{' '}
            {insight.primaryTheme}.
          </Text>

          <SectionLabel>Cross-modal link</SectionLabel>
          <View style={styles.chain}>
            {['Voice', 'Deadline', 'Journal history', 'Health deviation', 'Stress signal'].map(
              (step, i, arr) => (
                <View key={step} style={styles.chainItem}>
                  <Text style={styles.chainText}>{step}</Text>
                  {i < arr.length - 1 && <Text style={styles.arrow}>↓</Text>}
                </View>
              ),
            )}
          </View>

          <Text style={styles.disclaimer}>{insight.uncertainty}</Text>

          <Button
            label="Help me unpack this"
            onPress={() => router.push('/actions')}
            style={{ marginTop: spacing.lg }}
          />
          <Button label="Why am I seeing this?" variant="ghost" onPress={() => router.push('/why')} />
          <Button label="Back home" variant="soft" onPress={() => router.replace('/home')} />
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
    fontSize: 34,
    lineHeight: 40,
    color: colors.primary,
    marginBottom: spacing.xl,
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
    fontSize: 24,
    color: colors.primary,
    flex: 1,
  },
  change: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(21,23,26,0.78)',
    marginBottom: spacing.xl,
  },
  chain: {
    marginBottom: spacing.lg,
  },
  chainItem: {
    alignItems: 'flex-start',
  },
  chainText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.primary,
  },
  arrow: {
    color: colors.muted,
    marginVertical: 2,
    marginLeft: 8,
  },
  disclaimer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
});
