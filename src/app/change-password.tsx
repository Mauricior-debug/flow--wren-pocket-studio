import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { passwordIssues } from '../lib/format';
import { colors, fonts, radius } from '../theme/tokens';

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const { user, changePassword } = useStore();
  const googleOnly = user?.provider === 'google' && !user.passwordHash;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rules = passwordIssues(next);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
      <StudioHeader back />
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.sub}>{googleOnly ? 'This Google account has no password yet. You can add one for this device.' : 'Choose a new password for your account.'}</Text>
      {!googleOnly ? <Field placeholder="Current password" icon="lock-closed-outline" value={current} onChangeText={setCurrent} secure={!show} secureToggle onToggleSecure={() => setShow((value) => !value)} /> : null}
      <View style={{ height: 12 }} />
      <Field placeholder="New password" icon="lock-closed-outline" value={next} onChangeText={setNext} secure />
      <View style={{ height: 12 }} />
      <Field placeholder="Confirm new password" icon="lock-closed-outline" value={confirm} onChangeText={setConfirm} secure error={error} />
      <View style={styles.rules}>
        <Rule ok={rules.length} label="At least 8 characters" />
        <Rule ok={rules.number} label="Includes a number" />
        <Rule ok={rules.letter} label="Includes a letter" />
      </View>
      <View style={styles.actions}>
        <Button label="Cancel" kind="secondary" flex={1} onPress={() => router.back()} />
        <Button
          label="Update Password"
          flex={1.4}
          loading={loading}
          onPress={async () => {
            setLoading(true);
            const result = await changePassword(current, next, confirm);
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.back();
          }}
        />
      </View>
    </ScrollView>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.rule}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={ok ? colors.green : colors.textMuted} />
      <Text style={styles.ruleText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, marginVertical: 10 },
  rules: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 10, marginTop: 14 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
