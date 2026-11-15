import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { useStore } from '../../data/store';
import { images } from '../../theme/images';
import { colors, fonts, radius } from '../../theme/tokens';

const bundled = { astronaut: images.astronaut, hero: images.hero, icon: images.icon };

export default function AssetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { assets } = useStore();
  const asset = assets.find((item) => item.id === id);
  if (!asset) return null;
  const source = asset.bundled ? bundled[asset.bundled] : asset.uri ? { uri: asset.uri } : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
      <StudioHeader back />
      <Text style={styles.title}>{asset.name}</Text>
      <Text style={styles.meta}>{asset.kind} · {asset.status === 'provider-unavailable' ? 'Provider unavailable' : asset.status}</Text>
      {source ? <Image source={source} style={styles.preview} contentFit="contain" accessibilityLabel={asset.name} /> : <View style={styles.placeholder}><Text style={styles.meta}>No preview file</Text></View>}
      {asset.prompt ? <Text style={styles.body}>{asset.prompt}</Text> : null}
      <Text style={styles.body}>{asset.note}</Text>
      {asset.fileName ? <Text style={styles.meta}>{asset.fileName}{asset.size ? ` · ${Math.round(asset.size / 1024)} KB` : ''}</Text> : null}
      {asset.kind === 'model' || asset.kind === 'text-3d' || asset.kind === 'image-3d' ? (
        <Text style={styles.body}>GLB files stay in the project library. This Expo Go build does not spin a 3D mesh.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 8 },
  meta: { color: colors.textMuted, fontFamily: fonts.medium, marginVertical: 8 },
  preview: { width: '100%', height: 280, borderRadius: radius.lg, backgroundColor: colors.card },
  placeholder: { height: 160, borderRadius: radius.lg, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 10 },
});
