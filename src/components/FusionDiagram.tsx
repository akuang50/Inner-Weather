import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Props = {
  body: number; // 0..1
  language: number;
  context: number;
  linked: boolean;
  compact?: boolean;
};

export function FusionDiagram({ body, language, context, linked, compact }: Props) {
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
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [linked, pulse]);

  const glow = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
      },
    ],
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Stream label="Body" value={body} hint="vs your baseline" />
      <Text style={styles.plus}>+</Text>
      <Stream label="Words" value={language} hint="linguistic shift" />
      <Text style={styles.plus}>+</Text>
      <Stream label="Context" value={context} hint="recurring themes" />
      <Text style={styles.arrow}>↓</Text>
      <Animated.View style={[styles.result, linked && styles.resultHot, linked && glow]}>
        <Text style={styles.resultEyebrow}>{linked ? 'Co-occurrence' : 'Watching'}</Text>
        <Text style={styles.resultTitle}>
          {linked ? 'Personal anomaly' : 'Channels disagree'}
        </Text>
      </Animated.View>
    </View>
  );
}

function Stream({ label, value, hint }: { label: string; value: number; hint: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={styles.stream}>
      <View style={styles.streamMeta}>
        <Text style={styles.streamLabel}>{label}</Text>
        <Text style={styles.streamHint}>{hint}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(6, pct)}%`,
              backgroundColor: pct >= 45 ? colors.stress : colors.calm,
            },
          ]}
        />
      </View>
      <Text style={styles.pct}>{pct}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  wrapCompact: {
    marginVertical: spacing.sm,
  },
  stream: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streamMeta: {
    width: 88,
  },
  streamLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  streamHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.muted,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  pct: {
    width: 32,
    textAlign: 'right',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  plus: {
    fontFamily: 'DMSans_400Regular',
    color: colors.muted,
    marginLeft: 30,
  },
  arrow: {
    color: colors.muted,
    marginLeft: 30,
    marginVertical: 2,
  },
  result: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
  },
  resultHot: {
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
  resultEyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  resultTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.primary,
  },
});
