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
  const halo = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    pulse.stopAnimation();
    halo.stopAnimation();
    if (phase === 'idle') {
      Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      Animated.timing(halo, { toValue: 0.2, duration: 220, useNativeDriver: true }).start();
      return;
    }
    const toValue = phase === 'recording' ? 1.06 : 0.96;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue,
            duration: phase === 'recording' ? 900 : 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: phase === 'recording' ? 900 : 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(halo, {
            toValue: 0.7,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(halo, {
            toValue: 0.25,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse, halo]);

  const caption =
    phase === 'idle'
      ? 'Hold to talk'
      : phase === 'recording'
        ? 'Listening…'
        : 'Connecting dots…';

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel="Hold to tell me what’s going on"
      style={styles.wrap}
    >
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: halo,
              transform: [{ scale: pulse }],
              borderColor: phase === 'recording' ? colors.stress : colors.insight,
            },
          ]}
        />
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
      </View>
      <Text style={styles.caption}>{caption}</Text>
      <Text style={styles.sub}>
        {phase === 'idle' ? 'No mood sliders. Just what’s on your mind.' : ' '}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  stage: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
  },
  ring: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1,
    borderColor: 'rgba(21,23,26,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
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
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  coreHot: {
    backgroundColor: colors.stress,
    borderColor: colors.stress,
  },
  coreProcess: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    borderColor: colors.insight,
  },
  caption: {
    textAlign: 'center',
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26,
    lineHeight: 32,
    color: colors.primary,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    minHeight: 18,
  },
});
