import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { useCrm } from '../data/crm';
import { WREN_STACKS } from '../lib/wrenConstants';
import { colors, fonts, radius } from '../theme/tokens';

const BUILDERS = [
  { id: 'cursor', label: 'Cursor' },
  { id: 'openai', label: 'OpenAI' },
];
const JOB_KINDS = [
  { id: 'match', label: 'Match' },
  { id: 'rebuild', label: 'Rebuild' },
  { id: 'port', label: 'Port' },
  { id: 'product', label: 'Product' },
];

export default function DeskOptionsSheet() {
  const insets = useSafeAreaInsets();
  const { employee, saveArchitectConfig } = useCrm();
  const cfg = employee?.architectConfig || {};
  const [builder, setBuilder] = useState(cfg.builder || 'cursor');
  const [cursorModel, setCursorModel] = useState(cfg.cursorModel || '');
  const [jobKind, setJobKind] = useState(cfg.jobKind || 'match');
  const [appKind, setAppKind] = useState(cfg.appKind || 'html');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await saveArchitectConfig({
      ...cfg,
      builder,
      cursorModel,
      jobKind,
      appKind,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Save failed.');
      return;
    }
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Desk options</Text>
      <Text style={styles.sub}>Builder, Cursor model, job kind, and app kind — PUT architectConfig.</Text>

      <Text style={styles.label}>Builder</Text>
      <View style={styles.row}>
        {BUILDERS.map((item) => (
          <Pressable key={item.id} onPress={() => setBuilder(item.id)} style={[styles.chip, builder === item.id && styles.chipOn]}>
            <Text style={[styles.chipText, builder === item.id && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Cursor model</Text>
      <View style={styles.row}>
        {['', 'claude-4.5-sonnet', 'gpt-5', 'composer-1'].map((item) => (
          <Pressable key={item || 'default'} onPress={() => setCursorModel(item)} style={[styles.chip, cursorModel === item && styles.chipOn]}>
            <Text style={[styles.chipText, cursorModel === item && styles.chipTextOn]}>{item || 'Default'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Job kind</Text>
      <View style={styles.row}>
        {JOB_KINDS.map((item) => (
          <Pressable key={item.id} onPress={() => setJobKind(item.id)} style={[styles.chip, jobKind === item.id && styles.chipOn]}>
            <Text style={[styles.chipText, jobKind === item.id && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>App kind</Text>
      <View style={styles.row}>
        {WREN_STACKS.map((item) => (
          <Pressable key={item.id} onPress={() => setAppKind(item.id)} style={[styles.chip, appKind === item.id && styles.chipOn]}>
            <Text style={[styles.chipText, appKind === item.id && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: 16 }} />
      <Button label="Save options" onPress={save} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 28 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginVertical: 10 },
  label: { color: colors.textSecondary, fontFamily: fonts.medium, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: 13 },
  chipTextOn: { color: colors.ink },
  error: { color: '#FFB4B4', marginTop: 12, fontFamily: fonts.medium },
});
