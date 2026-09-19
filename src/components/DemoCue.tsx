import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';

const NEXT: Record<string, { href: string; label: string; step: string }> = {
  '/home': { href: '/rant', label: 'Tell me what’s going on', step: '2 / 5' },
  '/fuse': { href: '/insight', label: 'Lock this insight', step: '2 / 5' },
  '/rant': { href: '/insight', label: 'See what connected', step: '3 / 5' },
  '/insight': { href: '/replay', label: 'Scrub the week', step: '4 / 5' },
  '/why': { href: '/actions', label: 'Choose a next step', step: '4 / 5' },
  '/replay': { href: '/actions', label: 'One small action', step: '5 / 5' },
  '/actions': { href: '/home', label: 'Back to home', step: 'Done' },
};

/** Quiet Linear-style cue so judges always know the next beat. */
export function DemoCue() {
  const pathname = usePathname();
  const router = useRouter();
  const { preferences } = useApp();
  const next = NEXT[pathname];

  if (!preferences.onboardingComplete || !next) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(next.href)}
      style={({ pressed }) => [styles.cue, pressed && styles.pressed]}
    >
      <Text style={styles.step}>{next.step}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {next.label}
      </Text>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(21,23,26,0.92)',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  step: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.5)',
  },
  label: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.white,
  },
  arrow: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});
