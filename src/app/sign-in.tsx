import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../data/seed';
import { images } from '../theme/images';
import { colors, fonts } from '../theme/tokens';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { signIn, enterDemo } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to continue building.</Text>
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
        <Pressable accessibilityRole="button" onPress={() => router.push('/reset')} style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
        <Button label="Sign In" onPress={submit} loading={loading} />
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
          Don’t have an account?{' '}
          <Text style={styles.switchLink} onPress={() => router.push('/sign-up')}>
            Sign Up
          </Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Alex Carter’s demo workspace"
          onPress={async () => {
            setLoading(true);
            const result = await enterDemo();
            setLoading(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.replace('/(tabs)');
          }}
          style={styles.demo}
        >
          <Text style={styles.demoText}>
            Preview Alex’s workspace · {DEMO_EMAIL} · {DEMO_PASSWORD}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brand: { alignItems: 'center', marginBottom: 28 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 34, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, textAlign: 'center', marginTop: 8 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  forgotText: { color: colors.link, fontFamily: fonts.semibold, fontSize: 14 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
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
  switch: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', marginTop: 22 },
  switchLink: { color: colors.lime, fontFamily: fonts.bold },
  demo: { minHeight: 44, justifyContent: 'center', marginTop: 12 },
  demoText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' },
});
