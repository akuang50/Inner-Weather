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
    title: 'Meet Stress Monitor.',
    body: 'Your body and your words can reveal patterns you don’t always notice.',
    cta: 'Get Started',
  },
  {
    eyebrow: 'Health',
    title: 'Connect Apple Health',
    body: 'Share sleep, resting heart rate, HRV, and activity so we can learn your personal baseline — not someone else’s.',
    cta: 'Continue with demo data',
  },
  {
    eyebrow: 'Baseline',
    title: 'We’re learning what “normal” looks like for you.',
    body: 'With demo data loaded, you’ll see how today’s signals compare to your recent weeks.',
    cta: 'Continue',
  },
  {
    eyebrow: 'Privacy',
    title: 'Your data is yours.',
    body: 'Journal entries stay private. You control health sharing. AI insights use only the signals you choose to provide. This is reflection — not diagnosis.',
    cta: 'Enter Stress Monitor',
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
    fontSize: 40,
    lineHeight: 46,
    color: colors.primary,
    letterSpacing: -0.8,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(21,23,26,0.72)',
    maxWidth: 340,
  },
  footer: {
    gap: spacing.lg,
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
