import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Wordmark } from '../components/chrome';
import { Button, Field } from '../components/ui';
import { useCrm } from '../data/crm';
import { colors, fonts } from '../theme/tokens';

export default function Verify2fa() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string; challengeToken?: string }>();
  const { verify2fa } = useCrm();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!params.email || !params.challengeToken) {
      setError('Missing challenge. Sign in again.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verify2fa(String(params.email), code, String(params.challengeToken));
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
        <BackButton />
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Wordmark size={24} />
        </View>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.sub}>Use the 6-digit authenticator code or an 8-character backup code for {params.email}.</Text>
        <Field
          label="Verification code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          error={error}
          style={{ marginTop: 24 }}
        />
        <Button label="Verify and open desk" onPress={submit} loading={loading} style={{ marginTop: 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, textAlign: 'center', marginTop: 24 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
