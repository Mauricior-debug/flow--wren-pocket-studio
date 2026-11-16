import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useCrm } from '../data/crm';
import { DEFAULT_API_BASE } from '../lib/session';
import { colors, fonts, radius } from '../theme/tokens';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { login, apiBase, updateApiBase } = useCrm();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [base, setBase] = useState(apiBase || DEFAULT_API_BASE);
  const [showBase, setShowBase] = useState(false);
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    if (base.trim() && base.trim().replace(/\/$/, '') !== apiBase) {
      await updateApiBase(base.trim());
    }
    const result = await login(email, password);
    setLoading(false);
    if (result.ok === false && result.requires2FA && result.challengeToken) {
      router.push({
        pathname: '/verify-2fa',
        params: { email: result.email || email, challengeToken: result.challengeToken },
      });
      return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Wordmark size={26} />
        </View>
        <Text style={styles.title}>Sign in to FlowTrack</Text>
        <Text style={styles.sub}>Open the same Wren desk you use on the website. Your session stays on this device.</Text>
        <View style={{ gap: 12, marginTop: 28 }}>
          <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secure={secure}
            secureToggle
            onToggleSecure={() => setSecure((value) => !value)}
            textContentType="password"
            error={error}
          />
        </View>
        <Button label="Sign In" onPress={submit} loading={loading} style={{ marginTop: 18 }} />
        <Pressable accessibilityRole="button" onPress={() => setShowBase((value) => !value)} style={styles.baseToggle}>
          <Text style={styles.baseToggleText}>{showBase ? 'Hide API base' : 'Use a custom CRM base'}</Text>
        </Pressable>
        {showBase ? (
          <View style={styles.baseBox}>
            <Field label="API base" value={base} onChangeText={setBase} autoCapitalize="none" placeholder={DEFAULT_API_BASE} />
            <Text style={styles.hint}>Default is the hosted CRM. Point this at a local FlowTrack instance when you need to.</Text>
          </View>
        ) : (
          <Text style={styles.hint}>API: {apiBase}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brand: { alignItems: 'center', marginBottom: 28 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 34, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  baseToggle: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  baseToggleText: { color: colors.link, fontFamily: fonts.semibold },
  baseBox: { marginTop: 8, gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card },
  hint: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 18 },
});
