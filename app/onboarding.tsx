import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

const STEPS = [
  {
    title: 'Your body and your words share a weather system.',
    body: 'We detect when they drift from your personal baseline — together.',
  },
  {
    title: 'Normal is personal.',
    body: 'Log health, talk or type. Baselines and language signals recompute from your history.',
  },
  {
    title: 'Reflection, not diagnosis.',
    body: 'Patterns and co-occurrence with uncertainty. Your data stays on device.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { completeOnboarding } = useApp();
  const router = useRouter();
  const current = STEPS[step]!;

  return (
    <LinearGradient colors={[colors.background, colors.backgroundWarm]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.content}>
          <Text style={styles.brand}>Stress Monitor</Text>
          <View style={styles.hero}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.body}>{current.body}</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
              ))}
            </View>
            <Pressable
              style={styles.btn}
              onPress={() => {
                if (step >= STEPS.length - 1) {
                  completeOnboarding();
                  router.replace('/(tabs)/home');
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              <Text style={styles.btnText}>{step >= STEPS.length - 1 ? 'Enter app' : 'Continue'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: colors.primary,
  },
  hero: { gap: spacing.md },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    lineHeight: 42,
    color: colors.primary,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 26,
    color: colors.muted,
  },
  footer: { gap: spacing.lg },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(21,23,26,0.15)',
  },
  dotOn: { width: 22, backgroundColor: colors.primary },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
});
