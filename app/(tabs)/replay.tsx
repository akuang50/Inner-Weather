import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSleep, useApp } from '../../src/state/AppContext';
import { colors, spacing } from '../../src/theme';

export default function ReplayScreen() {
  const { daySeries } = useApp();
  const defaultIdx = Math.max(
    0,
    daySeries.reduce((best, s, i, arr) => (s.score > arr[best]!.score ? i : best), 0),
  );
  const [selected, setSelected] = useState(defaultIdx);
  const point = daySeries[selected] ?? daySeries[daySeries.length - 1];

  if (!point) {
    return (
      <SafeAreaView style={styles.fill} edges={['top']}>
        <Text style={{ padding: 24 }}>No timeline yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Stress Replay</Text>
        <Text style={styles.title}>See your week differently.</Text>
        <Text style={styles.sub}>Built from your stored health logs and journals.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 20 }}>
          <View style={styles.timeline}>
            {daySeries.map((p, i) => (
              <Pressable key={p.date} onPress={() => setSelected(i)} style={styles.col}>
                <Text style={[styles.day, i === selected && styles.dayOn]}>{p.dayLabel}</Text>
                <View
                  style={[
                    styles.dot,
                    p.coOccurrence && styles.dotHot,
                    i === selected && styles.dotOn,
                  ]}
                />
                <Text style={styles.scoreMini}>{p.score}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.selected}>
          {point.dayLabel} · {point.date} · signal {point.score}
          {point.coOccurrence ? ' · linked' : ''}
        </Text>

        <Panel title="Body" body={`Sleep ${formatSleep(point.sleepHours)} · HR ${point.restingHr ?? '—'}`} />
        <Panel
          title="Language"
          body={
            point.language
              ? `Urgency ${point.language.urgency} · uncertainty ${point.language.uncertainty}`
              : 'No journal that day'
          }
        />
        <Panel title="Context" body={point.topics[0] ? `Theme: ${point.topics[0]}` : 'No strong theme'} />
        <Panel
          title="Fusion"
          body={
            point.coOccurrence
              ? 'Body deviation and language shift co-occurred against your baseline.'
              : 'Channels have not fully confirmed each other yet.'
          }
        />
        {point.transcript && <Text style={styles.quote}>“{point.transcript}”</Text>}
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
  eyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  title: {
    marginTop: 8,
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    color: colors.primary,
  },
  sub: {
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
  },
  timeline: { flexDirection: 'row', gap: 18, paddingRight: 20 },
  col: { alignItems: 'center', width: 52 },
  day: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 10,
  },
  dayOn: { color: colors.primary },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(21,23,26,0.2)',
  },
  dotHot: { backgroundColor: colors.stress },
  dotOn: { transform: [{ scale: 1.2 }] },
  scoreMini: {
    marginTop: 8,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.muted,
  },
  selected: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  panel: { marginBottom: spacing.md },
  panelTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  panelBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  quote: {
    marginTop: spacing.md,
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    lineHeight: 28,
    color: colors.primary,
  },
});
