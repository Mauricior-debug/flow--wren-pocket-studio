import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../data/store';
import { colors, fonts } from '../theme/tokens';
import { images } from '../theme/images';

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={styles.brand}>
      <Image source={images.icon} style={{ width: size + 10, height: size + 10 }} contentFit="contain" accessibilityLabel="Wren Studio mark" />
      <Text style={[styles.word, { fontSize: size }]}>
        Wren <Text style={styles.studio}>Studio</Text>
      </Text>
    </View>
  );
}

export function AvatarButton({ size = 36 }: { size?: number }) {
  const { user } = useStore();
  const source = user?.avatar === 'custom' && user.avatarUri ? { uri: user.avatarUri } : user?.avatar === 'alex' ? images.avatarAlex : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      onPress={() => router.navigate('/(tabs)/settings')}
      style={({ pressed }) => [styles.avatar, { width: size, height: size, borderRadius: size / 2 }, pressed && styles.pressed]}
    >
      {source ? (
        <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <Text style={styles.initials}>{(user?.name || 'W').slice(0, 1).toUpperCase()}</Text>
      )}
    </Pressable>
  );
}

export function BellButton() {
  const { unread } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      onPress={() => router.push('/notifications')}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {unread ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}

export function StudioHeader({ back, gear, onGear }: { back?: boolean; gear?: boolean; onGear?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{back ? <BackButton /> : null}</View>
      <Wordmark size={20} />
      <View style={styles.headerActions}>
        {gear ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Project settings" onPress={onGear} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <BellButton />
        )}
        <AvatarButton />
      </View>
    </View>
  );
}

export function PageTitle({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.page}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { color: colors.white, fontFamily: fonts.extra },
  studio: { color: colors.lime },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  headerSide: { width: 44 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  avatar: { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: colors.lime, fontFamily: fonts.bold, fontSize: 16 },
  page: { gap: 6, marginTop: 8, marginBottom: 16 },
  kicker: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, letterSpacing: -0.6 },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
});
