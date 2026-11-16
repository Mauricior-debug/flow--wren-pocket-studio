import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCrm } from '../data/crm';
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
  const { user } = useCrm();
  const uri = user?.imageUrl || user?.profileImage;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      onPress={() => router.navigate('/(tabs)/settings')}
      style={({ pressed }) => [styles.avatar, { width: size, height: size, borderRadius: size / 2 }, pressed && styles.pressed]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <Text style={styles.initials}>{(user?.name || 'W').slice(0, 1).toUpperCase()}</Text>
      )}
    </Pressable>
  );
}

export function RefreshButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Refresh desk" onPress={onPress} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
      <Ionicons name="refresh" size={22} color={colors.text} />
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

export function StudioHeader({ back, onRefresh }: { back?: boolean; onRefresh?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{back ? <BackButton /> : null}</View>
      <Wordmark size={20} />
      <View style={styles.headerActions}>
        {onRefresh ? <RefreshButton onPress={onRefresh} /> : null}
        <AvatarButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { color: colors.white, fontFamily: fonts.extra },
  studio: { color: colors.lime },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  headerSide: { width: 44 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 44, justifyContent: 'flex-end' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: colors.lime, fontFamily: fonts.bold, fontSize: 14 },
  pressed: { opacity: 0.7 },
});
