import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Props = {
  body: number; // 0..1
  language: number;
  /** Optional Tonewatch messaging channel (0..1). */
  messaging?: number;
  context: number;
  linked: boolean;
  compact?: boolean;
};

export function FusionDiagram({ body, language, messaging, context, linked, compact }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!linked) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [linked, pulse]);

  const glow = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }),
      },
    ],
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.row}>
        <Well label="Body" value={body} hint="vs baseline" compact={compact} />
        <Well label="Words" value={language} hint="linguistic" compact={compact} />
        {messaging != null ? (
          <Well label="Texts" value={messaging} hint="tone" compact={compact} />
        ) : null}
        <Well label="Context" value={context} hint="themes" compact={compact} />
      </View>
      <Animated.View style={[styles.result, linked && styles.resultHot, linked && glow]}>
        <View style={[styles.dot, linked && styles.dotHot]} />
        <View style={styles.resultCopy}>
          <Text style={styles.resultEyebrow}>{linked ? 'Co-occurrence' : 'Watching'}</Text>
          <Text style={styles.resultTitle}>
            {linked ? 'Personal anomaly' : 'Channels disagree'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Well({
  label,
  value,
  hint,
  compact,
}: {
  label: string;
  value: number;
  hint: string;
  compact?: boolean;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const hot = pct >= 45;
  const size = compact ? 64 : 74;

  return (
    <View style={styles.well}>
      <View style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.orbFill,
            {
              height: `${Math.max(10, pct)}%`,
              backgroundColor: hot ? 'rgba(255,107,107,0.88)' : 'rgba(91,200,164,0.85)',
            },
          ]}
        />
        <Text style={styles.orbNum}>{pct}</Text>
      </View>
      <Text style={styles.wellLabel}>{label}</Text>
      {compact ? null : <Text style={styles.wellHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  wrapCompact: {
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  well: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  orb: {
    overflow: 'hidden',
    backgroundColor: 'rgba(21,23,26,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(21,23,26,0.08)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  orbFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  orbNum: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: colors.primary,
    marginBottom: 10,
    zIndex: 1,
  },
  wellLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  wellHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: colors.muted,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(21,23,26,0.06)',
  },
  resultHot: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: 'rgba(255,107,107,0.16)',
  },
  resultCopy: { flex: 1 },
  resultEyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 2,
  },
  resultTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
    color: colors.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.calm,
  },
  dotHot: {
    backgroundColor: colors.stress,
  },
});
