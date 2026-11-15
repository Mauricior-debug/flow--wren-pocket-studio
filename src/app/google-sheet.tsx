import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { colors, fonts } from '../theme/tokens';

export default function GoogleSheet() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle } = useStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Continue with Google</Text>
      <Text style={styles.body}>Google sign-in isn’t connected. Enter the account and Wren will keep it on this device.</Text>
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} />
      <Button
        label="Continue"
        loading={loading}
        onPress={async () => {
          setLoading(true);
          const result = await signInWithGoogle(email, name);
          setLoading(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.dismiss();
          router.replace('/(tabs)');
        }}
      />
      <Button label="Cancel" kind="secondary" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 12 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 24, marginTop: 8 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
});
