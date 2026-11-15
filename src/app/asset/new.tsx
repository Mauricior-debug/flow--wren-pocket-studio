import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Banner, Button, Field } from '../../components/ui';
import { useStore } from '../../data/store';
import type { AssetKind } from '../../data/types';
import { persistUpload } from '../../lib/files';
import { colors, fonts, radius } from '../../theme/tokens';

const kinds: { id: AssetKind; label: string }[] = [
  { id: 'image', label: 'Image' },
  { id: 'logo', label: 'Logo' },
  { id: 'icon', label: 'Icon' },
  { id: 'illustration', label: 'Illustration' },
  { id: 'image-3d', label: 'Image to 3D' },
  { id: 'text-3d', label: 'Text to 3D' },
  { id: 'model', label: 'GLB model' },
];

export default function NewAsset() {
  const insets = useSafeAreaInsets();
  const { addAsset } = useStore();
  const [kind, setKind] = useState<AssetKind>('image');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; mime: string; size?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }} keyboardShouldPersistTaps="handled">
      <StudioHeader back />
      <Text style={styles.title}>New asset</Text>
      <Banner>Image and 3D providers are not connected. A prompt is saved. An uploaded file is stored.</Banner>
      <View style={styles.wrap}>
        {kinds.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => setKind(item.id)} style={[styles.chip, kind === item.id && styles.chipOn]}>
            <Text style={[styles.chipText, kind === item.id && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Ridge mark" />
      <Field label="Prompt" value={prompt} onChangeText={setPrompt} placeholder="Describe the asset" multiline />
      {kind === 'model' || kind === 'image-3d' ? (
        <Button
          label="Attach a file"
          kind="secondary"
          onPress={async () => {
            const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
            if (result.canceled) return;
            const asset = result.assets[0];
            setFile({ uri: asset.uri, name: asset.name, mime: asset.mimeType || 'application/octet-stream', size: asset.size });
          }}
        />
      ) : (
        <Button
          label="Attach an image"
          kind="secondary"
          onPress={async () => {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
              setError('Photo access is off.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
            if (result.canceled) return;
            const asset = result.assets[0];
            setFile({ uri: asset.uri, name: asset.fileName || 'image.jpg', mime: asset.mimeType || 'image/jpeg', size: asset.fileSize });
          }}
        />
      )}
      {file ? <Text style={styles.file}>{file.name}{file.size ? ` · ${Math.round(file.size / 1024)} KB` : ''}</Text> : null}
      {file?.name.toLowerCase().endsWith('.glb') ? <Text style={styles.file}>The model file will be stored. Expo Go does not preview the mesh.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label="Save asset"
        onPress={async () => {
          let uri = file?.uri;
          if (file) uri = await persistUpload(file.uri, 'assets', file.name);
          const asset = addAsset({ name, kind, prompt, uri, fileName: file?.name, mime: file?.mime, size: file?.size });
          if (!asset) {
            setError('Sign in first.');
            return;
          }
          router.replace(`/asset/${asset.id}`);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.card, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.ink },
  file: { color: colors.textSecondary, fontFamily: fonts.medium },
  error: { color: '#FFB4B4', fontFamily: fonts.medium },
});
