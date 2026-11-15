import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { EmptyState, ErrorState } from '../components/ui';
import { useStore } from '../data/store';
import { timeAgo } from '../lib/format';
import type { Notice } from '../data/types';
import { colors, fonts, radius } from '../theme/tokens';

const tones: Record<Notice['type'], { bg: string; icon: keyof typeof Ionicons.glyphMap; dot: string }> = {
  build: { bg: '#143226', icon: 'home', dot: colors.green },
  milestone: { bg: '#2A2458', icon: 'people', dot: colors.purple },
  deploy: { bg: '#16324F', icon: 'rocket', dot: colors.cyan },
  feature: { bg: '#3A2A10', icon: 'flash', dot: colors.amber },
  welcome: { bg: '#143226', icon: 'chatbubble', dot: colors.green },
  design: { bg: '#2A2458', icon: 'color-wand', dot: colors.purple },
};

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const ref = useRef<FlatList>(null);
  const { notifications, markAllRead, markRead, error, retry } = useStore();

  return (
    <FlatList
      ref={ref}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, flexGrow: 1 }}
      data={notifications}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <StudioHeader back />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notifications</Text>
            <Pressable accessibilityRole="button" onPress={markAllRead} style={styles.mark}>
              <Text style={styles.markText}>Mark all as read</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }: { item: Notice }) => {
        const tone = tones[item.type];
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              markRead(item.id);
              if (item.route) router.push(item.route as '/notifications');
            }}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
          >
            <View style={[styles.icon, { backgroundColor: tone.bg }]}>
              <Ionicons name={tone.icon} size={18} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
            </View>
            {!item.read ? <View style={[styles.dot, { backgroundColor: tone.dot }]} /> : <View style={styles.dot} />}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        error ? (
          <ErrorState title="Couldn’t load notifications" body={error} onRetry={retry} />
        ) : (
          <EmptyState title="You’re caught up" body="Build, design, and deployment notes will show up here." />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 30 },
  mark: { minHeight: 44, justifyContent: 'center' },
  markText: { color: colors.lime, fontFamily: fonts.bold, fontSize: 14, textDecorationLine: 'underline' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, marginBottom: 10, alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  time: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12 },
  message: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, marginTop: 4, lineHeight: 19 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
