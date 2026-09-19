import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FusionDiagram } from '../src/components/FusionDiagram';
import { Button } from '../src/components/ui';
import { demoHealthSignals } from '../src/data/demoDataset';
import { buildDaySeries } from '../src/engine/daySeries';
import { useApp } from '../src/state/AppContext';
import { colors, spacing } from '../src/theme';

export default function ReplayScreen() {
  const { journals, analyses } = useApp();
  const router = useRouter();
  const series = useMemo(
    () => buildDaySeries(demoHealthSignals, journals, analyses, 7),
    [journals, analyses],
  );
  const [selected, setSelected] = useState(Math.max(0, series.length - 1));
  const point = series[selected];

  if (!point) {
    return (
      <SafeAreaView style={styles.fill}>
        <Text style={{ padding: 24 }}>No series yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#F7F8FA', '#F3EFEA']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content}>
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.title}>Stress Replay</Text>
          <Text style={styles.sub}>
            Scrub the week. Linked days are when body and language moved together — a personal
            anomaly, not a diagnosis.
          </Text>

          <View style={styles.timeline}>
            {series.map((p, i) => {
              const h = 18 + (p.score / 100) * 72;
              const on = i === selected;
              return (
                <Pressable key={p.date} onPress={() => setSelected(i)} style={styles.col}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: h,
                          backgroundColor: p.coOccurrence
                            ? colors.stress
                            : on
                              ? colors.primary
                              : 'rgba(21,23,26,0.18)',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.day, on && styles.dayOn]}>{p.label}</Text>
                  {p.coOccurrence ? <Text style={styles.anno}>linked</Text> : <Text style={styles.anno}> </Text>}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.scoreLine}>
            {point.label} · signal {point.score}
            {point.coOccurrence ? ' · co-occurrence' : ''}
          </Text>

          <FusionDiagram
            body={point.bodyScore}
            language={point.languageScore}
            context={point.contextScore}
            linked={point.coOccurrence}
          />

          <Panel title="Body" body={point.narrative.body} />
          <Panel title="Language" body={point.narrative.language} />
          <Panel title="Context" body={point.narrative.context} />
          <Panel title="Fusion" body={point.narrative.fusion} />

          {point.journalSnippet ? (
            <>
              <Text style={styles.quoteLabel}>From that day</Text>
              <Text style={styles.quote}>“{point.journalSnippet}”</Text>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.cue },
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
    lineHeight: 22,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    minHeight: 140,
    gap: 4,
  },
  col: { alignItems: 'center', flex: 1 },
  barTrack: {
    height: 96,
    width: '70%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 28,
    borderRadius: 10,
  },
  day: {
    marginTop: 8,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
  },
  dayOn: { color: colors.primary },
  anno: {
    marginTop: 4,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: colors.stress,
    textAlign: 'center',
    minHeight: 14,
  },
  scoreLine: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  panel: { gap: 6, marginTop: spacing.md },
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
  quoteLabel: {
    marginTop: spacing.xl,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  quote: {
    marginTop: 8,
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    lineHeight: 28,
    color: colors.primary,
  },
});
