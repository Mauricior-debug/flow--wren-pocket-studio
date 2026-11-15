import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Wordmark } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { passwordIssues } from '../lib/format';
import { colors, fonts, radius } from '../theme/tokens';

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const { requestPasswordReset, setNewPasswordFromReset } = useStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const rules = passwordIssues(password);

  const send = () => {
    const result = requestPasswordReset(email);
    if (!result.ok) {
      setError(result.error);
      setSent(false);
      return;
    }
    setError(null);
    setSent(true);
  };

  const save = async () => {
    setLoading(true);
    const result = await setNewPasswordFromReset(email, password, confirm);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/sign-in');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <BackButton />
          <Wordmark size={18} />
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.sub}>Enter your email address and set a new password on this device. Email delivery isn’t connected.</Text>
        <Field label="Email address" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} />
        <View style={{ height: 16 }} />
        <Button label="Send Reset Link" onPress={send} />
        {sent ? (
          <View style={styles.card}>
            <Ionicons name="checkmark-circle" size={28} color={colors.green} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.cardTitle}>Reset is ready</Text>
              <Text style={styles.cardBody}>
                No inbox is connected. Choose a new password for <Text style={styles.em}>{email.trim()}</Text> to finish.
              </Text>
            </View>
          </View>
        ) : null}
        {sent ? (
          <View style={{ gap: 12, marginTop: 16 }}>
            <Field label="New password" value={password} onChangeText={setPassword} secure secureToggle onToggleSecure={() => undefined} />
            <Rule ok={rules.length} label="At least 8 characters" />
            <Rule ok={rules.number} label="Includes a number" />
            <Rule ok={rules.letter} label="Includes a letter" />
            <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secure />
            <Button label="Update Password" onPress={save} loading={loading} />
          </View>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace('/sign-in')} style={styles.back}>
          <Text style={styles.backText}>Back to Sign In</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, marginTop: 8, marginBottom: 20 },
  card: { marginTop: 18, backgroundColor: '#10241C', borderRadius: radius.lg, padding: 16, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#1E4A36' },
  cardTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  cardBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  em: { color: colors.white, fontFamily: fonts.semibold },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 14 },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  backText: { color: colors.link, fontFamily: fonts.semibold, fontSize: 16, textDecorationLine: 'underline' },
});
