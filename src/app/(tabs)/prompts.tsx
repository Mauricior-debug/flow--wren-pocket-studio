import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, Field } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { uploadWrenFile } from '../../lib/upload';
import { colors, fonts, radius } from '../../theme/tokens';

export default function Prompts() {
  const insets = useSafeAreaInsets();
  const { employee, saveArchitectConfig, wrenPrompt, showToast } = useCrm();
  const cfg = employee?.architectConfig || {};
  const [direction, setDirection] = useState(String(cfg.designDirection || ''));
  const [assets, setAssets] = useState<any[]>(Array.isArray(cfg.promptAssets) ? cfg.promptAssets : []);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const employeeId = employee?._id || employee?.id;

  useEffect(() => {
    setDirection(String(cfg.designDirection || ''));
    setAssets(Array.isArray(cfg.promptAssets) ? cfg.promptAssets : []);
  }, [employee?._id, cfg.designDirection]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await saveArchitectConfig({
      ...cfg,
      designDirection: direction,
      promptAssets: assets,
    });
    setSaving(false);
    if (!result.ok) setError(result.error || 'Save failed.');
  };

  const uploadRef = async () => {
    if (!employeeId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is off.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      const uploaded = await uploadWrenFile(employeeId, {
        uri: asset.uri,
        name: asset.fileName || 'reference.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
      setAssets((current) => [...current, { ...uploaded, role: 'reference' }].slice(0, 12));
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    }
  };

  const sendToBuild = async () => {
    setSending(true);
    setError(null);
    try {
      await wrenPrompt({
        action: 'send',
        designDirection: direction,
        designPrompts: cfg.designPrompts || [],
        promptAssets: assets,
      });
      showToast('Sent to the build in progress.');
    } catch (err: any) {
      setError(err?.message || 'Could not send prompts.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
      <StudioHeader />
      <Text style={styles.title}>Prompts</Text>
      <Text style={styles.sub}>Design direction and reference images for Wren — same prompt tab as the website desk.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Field label="Design direction" value={direction} onChangeText={setDirection} multiline placeholder="Tone, layout, brand notes…" style={{ minHeight: 140 }} />
      <View style={{ height: 12 }} />
      <Button label="Upload reference image" kind="secondary" icon="image-outline" onPress={uploadRef} />
      <View style={{ gap: 8, marginTop: 12 }}>
        {assets.map((asset) => (
          <View key={asset.id || asset.url} style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {asset.name}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setAssets((current) => current.filter((item) => (item.id || item.url) !== (asset.id || asset.url)))}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={{ height: 16 }} />
      <Button label="Save prompts" onPress={save} loading={saving} />
      <View style={{ height: 8 }} />
      <Button label="Send to build in progress" kind="secondary" onPress={sendToBuild} loading={sending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginVertical: 8 },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, padding: 12 },
  name: { color: colors.white, fontFamily: fonts.semibold, flex: 1 },
  remove: { color: colors.red, fontFamily: fonts.bold, fontSize: 13 },
});
