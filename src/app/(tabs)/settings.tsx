import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { images } from '../../theme/images';
import { colors, fonts, radius } from '../../theme/tokens';

const rows: { label: string; icon: keyof typeof Ionicons.glyphMap; href: '/change-password' | '/notification-prefs' | '/privacy-data' | '/app-preferences' }[] = [
  { label: 'Change Password', icon: 'lock-closed-outline', href: '/change-password' },
  { label: 'Notifications', icon: 'notifications-outline', href: '/notification-prefs' },
  { label: 'Privacy & Data', icon: 'shield-checkmark-outline', href: '/privacy-data' },
  { label: 'App Preferences', icon: 'settings-outline', href: '/app-preferences' },
];

export default function Settings() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const { user, signOut } = useStore();
  const source = user?.avatar === 'custom' && user.avatarUri ? { uri: user.avatarUri } : user?.avatar === 'alex' ? images.avatarAlex : null;

  return (
    <ScrollView ref={ref} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }} contentInsetAdjustmentBehavior="automatic">
      <StudioHeader />
      <Text style={styles.title}>Profile & Settings</Text>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/edit-profile')} style={styles.profile}>
          <View style={styles.avatar}>
            {source ? <Image source={source} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.initial}>{(user?.name || 'W').slice(0, 1)}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        <Button label="Edit Profile" kind="secondary" onPress={() => router.push('/edit-profile')} />
      </View>
      <View style={styles.list}>
        {rows.map((row) => (
          <Pressable key={row.label} accessibilityRole="button" onPress={() => router.push(row.href)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <Ionicons name={row.icon} size={18} color={colors.textSecondary} />
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.red} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 16, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  avatar: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 56, height: 56 },
  initial: { color: colors.lime, fontFamily: fonts.bold, fontSize: 22 },
  name: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  email: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 2 },
  list: { marginTop: 16, backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#1C2836' },
  rowLabel: { flex: 1, color: colors.white, fontFamily: fonts.medium, fontSize: 16 },
  signOut: { marginTop: 22, minHeight: 56, borderRadius: radius.lg, borderWidth: 1, borderColor: '#6E2430', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signOutText: { color: colors.red, fontFamily: fonts.bold, fontSize: 16 },
});
