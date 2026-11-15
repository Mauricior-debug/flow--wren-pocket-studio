import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { Button } from '../components/ui';
import { useStore } from '../data/store';
import { colors, fonts } from '../theme/tokens';

export default function PrivacyData() {
  const insets = useSafeAreaInsets();
  const { user, setConsentAnalytics, exportJson, deleteAccount, clearNotifications } = useStore();
  const [confirm, setConfirm] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 28, gap: 12 }}>
      <StudioHeader back />
      <Text style={styles.title}>Privacy & Data</Text>
      <Text style={styles.body}>Projects, designs, and uploads stay on this device. Wren does not send them to an analytics company.</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Keep usage notes on this device</Text>
        <Switch accessibilityLabel="Usage notes" value={Boolean(user?.consent.analytics)} onValueChange={setConsentAnalytics} trackColor={{ false: '#243140', true: colors.lime }} thumbColor={colors.white} />
      </View>
      <Button label="Read the privacy policy" kind="secondary" onPress={() => router.push('/privacy')} />
      <Button
        label="Export my data"
        kind="secondary"
        onPress={() => Share.share({ message: exportJson() })}
      />
      <Button label="Clear notifications" kind="secondary" onPress={clearNotifications} />
      {confirm ? (
        <Button
          label="Delete account now"
          kind="danger"
          onPress={async () => {
            await deleteAccount();
            router.replace('/sign-in');
          }}
        />
      ) : (
        <Button label="Delete account" kind="danger" onPress={() => setConfirm(true)} />
      )}
      {confirm ? <Text style={styles.body}>This removes the account, projects, and files stored on this device.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56 },
  label: { color: colors.white, fontFamily: fonts.medium, fontSize: 16, flex: 1 },
});
