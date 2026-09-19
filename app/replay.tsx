import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SectionLabel } from '../src/components/ui';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function ReplayScreen() {
  const { snapshot } = useApp();
  const router = useRouter();
  const points = useMemo(
    () =>
      snapshot.weekScores.map((score, i) => ({
        day: DAYS[i] ?? `D${i}`,
        score,
        label: i === 1 ? 'poor sleep' : i === 4 ? 'deadline' : null,
      })),
    [snapshot.weekScores],
  );
  const [selected, setSelected] = useState(points.length - 1);

  const point = points[selected]!;

  return (
    <SafeAreaView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <Text style={styles.title}>Stress Replay</Text>
        <Text style={styles.sub}>Scrub your week. Explore spikes without judgment.</Text>

        <View style={styles.timeline}>
          {points.map((p, i) => (
            <Pressable key={p.day} onPress={() => setSelected(i)} style={styles.col}>
              <Text style={[styles.day, i === selected && styles.dayOn]}>{p.day}</Text>
              <View style={styles.lineWrap}>
                <View style={styles.line} />
                <View
                  style={[
                    styles.dot,
                    { top: 40 - (p.score / 100) * 36 },
                    i === selected && styles.dotOn,
                  ]}
                />
              </View>
              {p.label && <Text style={styles.anno}>{p.label}</Text>}
            </Pressable>
          ))}
        </View>

        <SectionLabel>Selected day</SectionLabel>
        <Text style={styles.scoreLine}>
          Stress signal {point.score}
          {point.label ? ` · ${point.label}` : ''}
        </Text>

        <View style={styles.panels}>
          <Panel
            title="Body"
            body={
              selected >= 4
                ? 'Sleep was about 18–21% below your baseline. Resting heart rate trended up.'
                : 'Physiological signals stayed near your personal baseline.'
            }
          />
          <Panel
            title="Language"
            body={
              selected >= 3
                ? 'You used significantly more urgency-related language.'
                : 'Journal language looked relatively steady.'
            }
          />
          <Panel
            title="Context"
            body={
              selected >= 4
                ? 'Your journal mentioned your project deadline repeatedly.'
                : 'No strong recurring stressor theme yet.'
            }
          />
          <Panel
            title="AI"
            body="These changes occurred together. The system cannot determine whether one caused another."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    color: colors.primary,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.xl,
    marginTop: 6,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    minHeight: 120,
  },
  col: { alignItems: 'center', flex: 1 },
  day: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 8,
  },
  dayOn: { color: colors.primary },
  lineWrap: {
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    top: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(21,23,26,0.25)',
    position: 'absolute',
  },
  dotOn: {
    backgroundColor: colors.stress,
    transform: [{ scale: 1.2 }],
  },
  anno: {
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  scoreLine: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  panels: { gap: spacing.md },
  panel: { gap: 6 },
  panelTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  panelBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
});
