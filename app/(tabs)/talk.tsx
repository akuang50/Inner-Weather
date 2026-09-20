import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../src/state/AppContext';
import { colors, spacing } from '../../src/theme';

export default function TalkScreen() {
  const { addJournal, grokEnabled } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    themes: string[];
    reflection: string;
    source: string;
    urgency: number;
    uncertainty: number;
  } | null>(null);
  const router = useRouter();

  const submit = async () => {
    const clean = text.trim();
    if (clean.length < 3 || busy) return;
    setBusy(true);
    try {
      const entry = await addJournal(clean, { source: 'typed' });
      setResult({
        themes: entry.analysis.themes,
        reflection: entry.reflection ?? '',
        source: entry.analysisSource ?? 'local',
        urgency: entry.analysis.urgency,
        uncertainty: entry.analysis.uncertainty,
      });
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[colors.dark, '#1a1c1f']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>Voice rant</Text>
          <Text style={styles.title}>Don’t journal. Just talk.</Text>
          <Text style={styles.sub}>
            Type what’s going on (mic STT lands next). Analyzer:{' '}
            {grokEnabled ? 'Grok' : 'local heuristics'}.
          </Text>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What’s actually going on…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            style={styles.input}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.btn, (busy || text.trim().length < 3) && styles.btnDisabled]}
            onPress={submit}
            disabled={busy || text.trim().length < 3}
          >
            {busy ? (
              <ActivityIndicator color={colors.dark} />
            ) : (
              <Text style={styles.btnText}>Analyze & save</Text>
            )}
          </Pressable>

          {result && (
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>I heard you · {result.source}</Text>
              {result.themes.map((t, i) => (
                <Text key={t} style={styles.theme}>
                  {String(i + 1).padStart(2, '0')}  {t}
                </Text>
              ))}
              <Text style={styles.meta}>
                Urgency {result.urgency} · Uncertainty {result.uncertainty}
              </Text>
              <Text style={styles.reflection}>{result.reflection}</Text>
              <Pressable onPress={() => router.push('/(tabs)/replay')}>
                <Text style={styles.link}>See it on your timeline →</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
  },
  title: {
    marginTop: 10,
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    lineHeight: 42,
    color: colors.white,
  },
  sub: {
    marginTop: 10,
    marginBottom: spacing.lg,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.55)',
  },
  input: {
    minHeight: 140,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: colors.white,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.dark,
  },
  card: {
    marginTop: spacing.xl,
    borderRadius: 24,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardEyebrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.md,
  },
  theme: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    color: colors.white,
    marginBottom: 8,
  },
  meta: {
    marginTop: spacing.sm,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  reflection: {
    marginTop: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.8)',
  },
  link: {
    marginTop: spacing.lg,
    fontFamily: 'DMSans_600SemiBold',
    color: colors.insight,
  },
});
