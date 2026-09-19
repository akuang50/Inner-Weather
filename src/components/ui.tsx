import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'ghost' | 'soft';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'soft' && styles.soft,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          variant === 'ghost' && styles.ghostLabel,
          variant === 'soft' && styles.softLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function BarRow({
  label,
  pct,
  tone = 'neutral',
}: {
  label: string;
  pct: number;
  tone?: 'up' | 'down' | 'neutral';
}) {
  const width = Math.min(100, Math.max(8, Math.abs(pct) * 1.2));
  const color =
    tone === 'up' ? colors.stress : tone === 'down' ? colors.calm : colors.insight;

  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barPct, { color }]}>
          {pct > 0 ? '+' : ''}
          {pct}%
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.spark}>
      {values.map((v, i) => (
        <View
          key={`${i}-${v}`}
          style={[
            styles.sparkBar,
            {
              height: 12 + (v / max) * 36,
              backgroundColor: i === values.length - 1 ? colors.stress : colors.primary,
              opacity: i === values.length - 1 ? 1 : 0.18 + (i / values.length) * 0.5,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  soft: {
    backgroundColor: colors.surfaceSoft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: colors.white,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  ghostLabel: {
    color: colors.primary,
  },
  softLabel: {
    color: colors.primary,
  },
  section: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  barRow: {
    marginBottom: spacing.md,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: colors.primary,
  },
  barPct: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  barTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  spark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 52,
  },
  sparkBar: {
    width: 10,
    borderRadius: 6,
  },
});
