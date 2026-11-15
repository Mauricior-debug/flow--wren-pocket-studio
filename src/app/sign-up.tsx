import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { images } from '../theme/images';
import { colors, fonts } from '../theme/tokens';

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const { signUp } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const result = await signUp({ name: '', email, password, confirm });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Wordmark size={26} />
        </View>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.sub}>Start building with AI today.</Text>
        <View style={{ gap: 12, marginTop: 24 }}>
          <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
          <Field icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secure={!showPassword} secureToggle onToggleSecure={() => setShowPassword((value) => !value)} textContentType="newPassword" />
          <Field icon="lock-closed-outline" placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secure={!showConfirm} secureToggle onToggleSecure={() => setShowConfirm((value) => !value)} error={error} textContentType="newPassword" />
        </View>
        <View style={{ height: 16 }} />
        <Button label="Sign Up" onPress={submit} loading={loading} />
        <View style={styles.or}>
          <View style={styles.rule} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.rule} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" onPress={() => router.push('/google-sheet')} style={({ pressed }) => [styles.google, pressed && { opacity: 0.7 }]}>
          <Image source={images.google} style={styles.g} contentFit="contain" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
        <Text style={styles.switch}>
          Already have an account?{' '}
          <Text style={styles.switchLink} onPress={() => router.push('/sign-in')}>
            Sign In
          </Text>
        </Text>
        <Text style={styles.legal}>
          By signing up, you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brand: { alignItems: 'center', marginBottom: 24 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, textAlign: 'center', marginTop: 8 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  orText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13 },
  google: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  g: { width: 22, height: 22 },
  googleText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 16 },
  switch: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', marginTop: 20 },
  switchLink: { color: colors.lime, fontFamily: fonts.bold },
  legal: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', marginTop: 14, lineHeight: 18 },
  legalLink: { color: colors.link, textDecorationLine: 'underline' },
});
