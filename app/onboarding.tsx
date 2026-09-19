import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/ui';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

const STEPS = [
  {
    eyebrow: 'Inner Weather',
    title: 'Your body and your words share a weather system.',
    body: 'Most apps show metrics or vibes. We detect when they drift from your personal baseline — together.',
    cta: 'Show me',
  },
  {
    eyebrow: 'Personal baseline',
    title: 'Not vs other 21-year-olds. Vs you last week.',
    body: 'Demo health data is loaded for Alex: sleep, resting HR, HRV, steps — normalized to a rolling personal baseline.',
    cta: 'Continue',
  },
  {
    eyebrow: 'Privacy',
    title: 'Reflection, not diagnosis.',
    body: 'We explain co-occurrence with uncertainty. Your journals stay yours. This never claims medical causation.',
    cta: 'Enter Inner Weather',
  },
] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { completeOnboarding, connectHealth } = useApp();
  const current = STEPS[step]!;

  const advance = () => {
    if (step === 1) connectHealth();
    if (step >= STEPS.length - 1) {
      completeOnboarding();
      router.replace('/home');
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <LinearGradient colors={['#F7F8FA', '#EEF2F6', '#F3EFEA']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          <Text style={styles.brand}>Inner Weather</Text>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{current.eyebrow}</Text>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.body}>{current.body}</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
              ))}
            </View>
            <Button label={current.cta} onPress={advance} />
            <Button
              label="Skip to the fuse"
              variant="ghost"
              onPress={() => {
                connectHealth();
                completeOnboarding();
                router.replace('/fuse');
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  hero: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    lineHeight: 42,
    color: colors.primary,
    letterSpacing: -0.8,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(21,23,26,0.72)',
    maxWidth: 360,
  },
  footer: {
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(21,23,26,0.15)',
  },
  dotOn: {
    backgroundColor: colors.primary,
    width: 22,
  },
});
