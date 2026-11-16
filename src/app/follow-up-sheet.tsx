import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '../components/ui';
import { useCrm } from '../data/crm';
import { uploadWrenFile } from '../lib/upload';
import { storeReadyPrompt } from '../lib/wrenConstants';
import { colors, fonts } from '../theme/tokens';

export default function FollowUpSheet() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ prospectId?: string; company?: string; storeReady?: string }>();
  const { employee, followUp, showToast } = useCrm();
  const employeeId = employee?._id || employee?.id;
  const readyText = useMemo(
    () =>
      storeReadyPrompt({
        appName: params.company || 'this app',
        hasIcon: false,
      }),
    [params.company],
  );
  const [text, setText] = useState(params.storeReady === '1' ? readyText : '');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attach = async () => {
    if (!employeeId) return;
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.canceled) {
      const images = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (images.canceled) return;
      const asset = images.assets[0];
      const uploaded = await uploadWrenFile(employeeId, {
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
      setFiles((current) => [...current, uploaded]);
      return;
    }
    const asset = result.assets[0];
    const uploaded = await uploadWrenFile(employeeId, {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/octet-stream',
      size: asset.size,
    });
    setFiles((current) => [...current, uploaded]);
  };

  const send = async () => {
    if (!text.trim() && !files.length) {
      setError('Add follow-up text or files.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await followUp({
      text: text.trim(),
      jobFiles: files,
      prospectId: params.prospectId,
      company: params.company,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || 'Follow-up failed.');
      return;
    }
    showToast('Follow-up sent.');
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add to this app</Text>
      <Text style={styles.sub}>Sends a follow_up to the running Cursor build. Upload files through Wren first.</Text>
      {params.storeReady === '1' ? <Text style={styles.badge}>Store-ready prompt loaded</Text> : null}
      <Field label="Follow-up" value={text} onChangeText={setText} multiline style={{ minHeight: 160 }} placeholder="What should Wren change?" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: 12 }} />
      <Button label="Upload file" kind="secondary" onPress={attach} />
      {files.map((file) => (
        <Text key={file.id || file.url} style={styles.file}>
          {file.name}
        </Text>
      ))}
      <View style={{ height: 12 }} />
      <Button label="Send follow-up" onPress={send} loading={loading} />
      {params.storeReady !== '1' ? (
        <>
          <View style={{ height: 8 }} />
          <Button label="Use store-ready prompt" kind="secondary" onPress={() => setText(readyText)} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 28 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginVertical: 10 },
  badge: { color: colors.lime, fontFamily: fonts.bold, marginBottom: 8 },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, marginTop: 8 },
  file: { color: colors.textSecondary, fontFamily: fonts.medium, marginTop: 8 },
});
