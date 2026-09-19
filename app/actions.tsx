import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SectionLabel } from '../src/components/ui';
import { actionOptionsForTheme } from '../src/engine/stress';
import { useApp } from '../src/state/AppContext';
import { colors, radii, spacing } from '../src/theme';

export default function ActionsScreen() {
  const { snapshot, latestInsight } = useApp();
  const theme = latestInsight?.primaryTheme ?? snapshot.primaryTheme ?? 'deadline pressure';
  const options = actionOptionsForTheme(theme);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <SectionLabel>Detected theme</SectionLabel>
        <Text style={styles.title}>{theme}</Text>
        <Text style={styles.sub}>Lightweight interventions — you choose the pace.</Text>

        <View style={styles.list}>
          {options.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setPicked(opt.id)}
              style={[styles.card, picked === opt.id && styles.cardOn]}
            >
              <Text style={styles.duration}>{opt.duration}</Text>
              <Text style={styles.cardTitle}>{opt.title}</Text>
              <Text style={styles.cardBody}>{opt.body}</Text>
            </Pressable>
          ))}
        </View>

        {picked && (
          <View style={styles.feedback}>
            <Text style={styles.feedbackQ}>Was this useful?</Text>
            <View style={styles.feedbackRow}>
              {['Yes', 'Not really'].map((label) => (
                <Pressable key={label} onPress={() => setFeedback(label)} style={styles.chip}>
                  <Text style={styles.chipText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {feedback && (
              <Text style={styles.thanks}>Thanks — that helps personalize future suggestions.</Text>
            )}
          </View>
        )}

        <Button label="Done" onPress={() => router.replace('/home')} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 32,
    color: colors.primary,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  list: { gap: spacing.md },
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardOn: {
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  duration: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    color: colors.primary,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(21,23,26,0.65)',
  },
  feedback: { marginTop: spacing.xl, gap: spacing.sm },
  feedbackQ: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.primary,
  },
  feedbackRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
  },
  chipText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.primary,
  },
  thanks: {
    fontFamily: 'DMSans_400Regular',
    color: colors.calm,
    fontSize: 14,
  },
});
