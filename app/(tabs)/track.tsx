import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSleep, getXaiApiKey, useApp } from '../../src/state/AppContext';
import { colors, spacing } from '../../src/theme';

export default function TrackScreen() {
  const {
    body,
    logHealth,
    realEntryCount,
    healthLogs,
    journals,
    grokEnabled,
    resetToSeed,
    clearAll,
    saveGrokKey,
    removeGrokKey,
  } = useApp();
  const current = body.current;
  const [sleep, setSleep] = useState(String(current?.sleepHours ?? 6.5));
  const [hr, setHr] = useState(String(current?.restingHr ?? 64));
  const [steps, setSteps] = useState(String(current?.steps ?? 5000));
  const [apiKey, setApiKey] = useState('');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void getXaiApiKey().then((k) => setApiKey(k ?? ''));
  }, []);

  return (
    <SafeAreaView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>Live tracking</Text>
        <Text style={styles.title}>It tracks what it claims.</Text>
        <Text style={styles.sub}>
          Health + journals stay on device. Baselines recompute from your history.
        </Text>

        <Text style={styles.section}>Today’s body</Text>
        <Field label="Sleep (hours)" value={sleep} onChange={setSleep} />
        <Field label="Resting HR" value={hr} onChange={setHr} />
        <Field label="Steps" value={steps} onChange={setSteps} />
        <Pressable
          style={styles.btn}
          onPress={() => {
            logHealth({
              sleepHours: Number(sleep) || 0,
              restingHr: Number(hr) || 0,
              steps: Number(steps) || 0,
            });
            setNote('Health saved. Signal updated.');
          }}
        >
          <Text style={styles.btnText}>Save today’s health</Text>
        </Pressable>
        <Text style={styles.meta}>
          Latest: {formatSleep(current?.sleepHours)} · {current?.restingHr ?? '—'} bpm ·{' '}
          {current?.steps?.toLocaleString() ?? '—'} steps
        </Text>

        <Text style={styles.section}>On this device</Text>
        <Row label="Health days" value={String(healthLogs.length)} />
        <Row label="Journal entries" value={String(journals.length)} />
        <Row label="Your real entries" value={String(realEntryCount)} />
        <Row label="Baseline window" value={`${body.baseline.n} days`} />

        <Text style={styles.section}>Grok / xAI</Text>
        <Text style={styles.hint}>
          Optional. Key stays in SecureStore on device (or localStorage on web). Status:{' '}
          {grokEnabled ? 'connected' : 'local analyzer'}.
        </Text>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="xai-..."
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <View style={styles.rowBtns}>
          <Pressable
            style={styles.btn}
            onPress={async () => {
              await saveGrokKey(apiKey);
              setNote('Grok key saved.');
            }}
          >
            <Text style={styles.btnText}>Save key</Text>
          </Pressable>
          <Pressable
            style={styles.ghost}
            onPress={async () => {
              await removeGrokKey();
              setApiKey('');
              setNote('Grok key cleared.');
            }}
          >
            <Text style={styles.ghostText}>Clear</Text>
          </Pressable>
        </View>

        <View style={styles.rowBtns}>
          <Pressable style={styles.ghost} onPress={resetToSeed}>
            <Text style={styles.ghostText}>Reset seed</Text>
          </Pressable>
          <Pressable
            style={styles.ghost}
            onPress={async () => {
              await clearAll();
              setNote('Local data cleared.');
            }}
          >
            <Text style={[styles.ghostText, { color: colors.stress }]}>Delete all</Text>
          </Pressable>
        </View>
        {note && <Text style={styles.note}>{note}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={styles.input}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
    marginBottom: spacing.lg,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  fieldLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.primary,
  },
  btn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  meta: {
    marginTop: 10,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontFamily: 'DMSans_400Regular', color: colors.muted },
  rowValue: { fontFamily: 'DMSans_600SemiBold', color: colors.primary },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: 10,
  },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  ghost: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ghostText: { fontFamily: 'DMSans_600SemiBold', color: colors.primary },
  note: { marginTop: 14, color: colors.calm, fontFamily: 'DMSans_500Medium' },
});
