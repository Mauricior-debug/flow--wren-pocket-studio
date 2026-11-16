import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, Field } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { DEFAULT_API_BASE } from '../../lib/session';
import { colors, fonts, radius } from '../../theme/tokens';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, apiBase, updateApiBase, logout, employee, loadDesk } = useCrm();
  const [base, setBase] = useState(apiBase);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const saveBase = async () => {
    setSaving(true);
    await updateApiBase(base);
    setSaving(false);
    setMessage('API base saved. Sign in again if the host changed.');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
      <StudioHeader />
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name || 'Signed in'}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Wren: {employee?.displayName || 'not linked yet'}</Text>
      </View>

      <Text style={styles.section}>CRM API</Text>
      <Field label="API base" value={base} onChangeText={setBase} autoCapitalize="none" placeholder={DEFAULT_API_BASE} />
      <Text style={styles.hint}>Default {DEFAULT_API_BASE}. Use a local CRM base when developing against your machine.</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button label="Save API base" onPress={saveBase} loading={saving} style={{ marginTop: 10 }} />

      <Text style={styles.section}>Desk</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/desk-options-sheet')} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
        <Ionicons name="options-outline" size={20} color={colors.white} />
        <Text style={styles.rowText}>Desk options</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => loadDesk()} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
        <Ionicons name="refresh" size={20} color={colors.white} />
        <Text style={styles.rowText}>Refresh desk</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={{ height: 18 }} />
      <Button
        label="Sign out"
        kind="danger"
        icon="log-out-outline"
        onPress={async () => {
          await logout();
          router.replace('/sign-in');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 4 },
  name: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  section: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginTop: 22, marginBottom: 10 },
  hint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 8, lineHeight: 18 },
  message: { color: colors.lime, fontFamily: fonts.medium, marginTop: 8 },
  row: { minHeight: 54, borderRadius: radius.md, backgroundColor: colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  rowText: { color: colors.white, fontFamily: fonts.semibold, flex: 1 },
});
