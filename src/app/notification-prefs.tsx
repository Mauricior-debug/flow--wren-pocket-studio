import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { useStore } from '../data/store';
import { colors, fonts, radius } from '../theme/tokens';

const rows = [
  { key: 'builds' as const, label: 'Build updates', detail: 'When a development job is queued or changes.' },
  { key: 'designReviews' as const, label: 'Design reviews', detail: 'When screens are ready to approve.' },
  { key: 'deployments' as const, label: 'Deployments', detail: 'When a deployment is requested.' },
  { key: 'productNews' as const, label: 'Product news', detail: 'Welcome notes and studio updates.' },
];

export default function NotificationPrefs() {
  const insets = useSafeAreaInsets();
  const { user, updateNotificationSettings } = useStore();
  const settings = user?.notificationSettings;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
      <StudioHeader back />
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.sub}>These stay inside the app. Push delivery is not connected.</Text>
      <View style={styles.list}>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.detail}>{row.detail}</Text>
            </View>
            <Switch
              accessibilityLabel={row.label}
              value={settings?.[row.key] ?? true}
              onValueChange={(value) => updateNotificationSettings({ [row.key]: value })}
              trackColor={{ false: '#243140', true: colors.lime }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, marginVertical: 10 },
  list: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1C2836' },
  label: { color: colors.white, fontFamily: fonts.semibold, fontSize: 16 },
  detail: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
});
