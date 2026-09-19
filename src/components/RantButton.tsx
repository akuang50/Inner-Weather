import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Phase = 'idle' | 'recording' | 'processing';

type Props = {
  phase: Phase;
  onPressIn: () => void;
  onPressOut: () => void;
};

export function RantButton({ phase, onPressIn, onPressOut }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulse.stopAnimation();
    if (phase === 'idle') {
      Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      return;
    }
    const toValue = phase === 'recording' ? 1.08 : 0.92;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue,
          duration: phase === 'recording' ? 700 : 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: phase === 'recording' ? 700 : 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const caption =
    phase === 'idle'
      ? 'Tell me what’s\ngoing on'
      : phase === 'recording'
        ? 'Listening...'
        : 'Connecting\ndots...';

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel="Hold to tell me what’s going on"
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.ring,
          phase === 'recording' && styles.ringHot,
          phase === 'processing' && styles.ringProcess,
          { transform: [{ scale: pulse }] },
        ]}
      >
        <View
          style={[
            styles.core,
            phase === 'recording' && styles.coreHot,
            phase === 'processing' && styles.coreProcess,
          ]}
        />
      </Animated.View>
      <Text style={styles.caption}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  ring: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1.5,
    borderColor: 'rgba(21,23,26,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  ringHot: {
    borderColor: colors.stress,
    backgroundColor: 'rgba(255,107,107,0.08)',
  },
  ringProcess: {
    borderColor: colors.insight,
    backgroundColor: 'rgba(91,108,255,0.08)',
  },
  core: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  coreHot: {
    backgroundColor: colors.stress,
    borderColor: colors.stress,
  },
  coreProcess: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    borderColor: colors.insight,
  },
  caption: {
    textAlign: 'center',
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    lineHeight: 34,
    color: colors.primary,
  },
});
