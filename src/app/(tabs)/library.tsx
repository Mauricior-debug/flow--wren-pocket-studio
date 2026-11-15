import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, EmptyState } from '../../components/ui';
import { useStore } from '../../data/store';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { images } from '../../theme/images';
import { colors, fonts, radius } from '../../theme/tokens';

const bundled = { astronaut: images.astronaut, hero: images.hero, icon: images.icon };

export default function Assets() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const { assets } = useStore();

  return (
    <FlatList
      ref={ref}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}
      contentInsetAdjustmentBehavior="automatic"
      data={assets}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <StudioHeader />
          <Text style={styles.title}>Assets</Text>
          <Text style={styles.sub}>Images, logos, and 3D requests live with the project. Generation providers are not connected, so a request is saved rather than pretended.</Text>
          <Button label="New asset" onPress={() => router.push('/asset/new')} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/asset/${item.id}`)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}>
          {item.bundled ? (
            <Image source={item.bundled ? bundled[item.bundled as keyof typeof bundled] : images.icon} style={styles.preview} contentFit="cover" />
          ) : item.uri ? (
            <Image source={{ uri: item.uri }} style={styles.preview} contentFit="cover" />
          ) : (
            <View style={styles.preview}>
              <Text style={styles.kind}>{item.kind}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.status}>{item.status === 'provider-unavailable' ? 'Provider unavailable' : item.status === 'stored' ? 'Stored' : 'Saved'}</Text>
        </Pressable>
      )}
      ListEmptyComponent={<EmptyState title="No assets yet" body="Upload a reference or save a generation request. GLB files are kept with the project." action="New asset" onAction={() => router.push('/asset/new')} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginVertical: 10 },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: 10, overflow: 'hidden' },
  preview: { height: 110, backgroundColor: colors.bgRaised, alignItems: 'center', justifyContent: 'center' },
  kind: { color: colors.textMuted, fontFamily: fonts.medium, textTransform: 'uppercase', fontSize: 12 },
  name: { color: colors.white, fontFamily: fonts.semibold, fontSize: 14, paddingHorizontal: 10, paddingTop: 8 },
  status: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, paddingHorizontal: 10, paddingBottom: 10 },
});
