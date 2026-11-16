import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '../components/ui';
import { useCrm } from '../data/crm';
import { colors, fonts, radius } from '../theme/tokens';

export default function PdfSheet() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ title?: string }>();
  const { wrenPrompt, showToast } = useCrm();
  const [layout, setLayout] = useState<'single' | 'pair'>('single');
  const [coverText, setCoverText] = useState('');
  const [title, setTitle] = useState(String(params.title || 'Wren designs'));
  const [copy, setCopy] = useState('');
  const [pdfB64, setPdfB64] = useState<string | null>(null);
  const [screens, setScreens] = useState<{ url: string; label: string; on: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => screens.filter((item) => item.on), [screens]);

  const loadFromPromptAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      // designs_pdf needs explicit screens; caller can paste URLs via cover or we ask board assets from a prior job.
      // Seed with empty and let the person paste labels; if none, generate copy only.
      if (!screens.length) {
        setScreens([{ url: '', label: 'Home', on: true }]);
      }
      const body = await wrenPrompt({
        action: 'pdf_copy',
        title,
        brief: coverText,
        screens: selected.map((item) => ({ url: item.url, label: item.label })),
      });
      setCopy(String(body.text || ''));
      showToast('PDF copy ready.');
    } catch (err: any) {
      setError(err?.message || 'Could not build PDF copy.');
    } finally {
      setLoading(false);
    }
  };

  const buildPdf = async () => {
    const usable = selected.filter((item) => item.url);
    if (!usable.length) {
      setError('Add at least one screen URL (from the Job design board) before building the PDF.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await wrenPrompt({
        action: 'designs_pdf',
        title,
        layout,
        coverText,
        screens: usable.map((item) => ({ url: item.url, label: item.label })),
      });
      if (!body.pdf) throw new Error('No PDF returned.');
      setPdfB64(body.pdf);
      showToast(`${body.name || 'designs.pdf'} ready.`);
    } catch (err: any) {
      setError(err?.message || 'PDF failed.');
    } finally {
      setLoading(false);
    }
  };

  const sharePdf = async () => {
    if (!pdfB64) return;
    const path = `${FileSystem.cacheDirectory || ''}wren-designs.pdf`;
    await FileSystem.writeAsStringAsync(path, pdfB64, { encoding: FileSystem.EncodingType.Base64 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/pdf', dialogTitle: 'Share Wren screen PDF' });
    } else {
      showToast('PDF saved on device.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Screen PDF</Text>
      <Text style={styles.sub}>Uncheck screens, pick single or pair layout, preview copy, then share the PDF.</Text>
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="Cover text" value={coverText} onChangeText={setCoverText} multiline style={{ minHeight: 80, marginTop: 10 }} />
      <Text style={styles.label}>Layout</Text>
      <View style={styles.row}>
        {(['single', 'pair'] as const).map((item) => (
          <Pressable key={item} onPress={() => setLayout(item)} style={[styles.chip, layout === item && styles.chipOn]}>
            <Text style={[styles.chipText, layout === item && styles.chipTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Screens</Text>
      {screens.map((screen, index) => (
        <View key={`${screen.label}-${index}`} style={styles.screenRow}>
          <Pressable onPress={() => setScreens((current) => current.map((item, i) => (i === index ? { ...item, on: !item.on } : item)))}>
            <Text style={styles.link}>{screen.on ? 'On' : 'Off'}</Text>
          </Pressable>
          <Field
            value={screen.label}
            onChangeText={(label) => setScreens((current) => current.map((item, i) => (i === index ? { ...item, label } : item)))}
            placeholder="Label"
            style={{ flex: 1 }}
          />
          <Field
            value={screen.url}
            onChangeText={(url) => setScreens((current) => current.map((item, i) => (i === index ? { ...item, url } : item)))}
            placeholder="https://…"
            autoCapitalize="none"
            style={{ flex: 1.4 }}
          />
        </View>
      ))}
      <Button label="Add screen row" kind="secondary" onPress={() => setScreens((current) => [...current, { url: '', label: `Screen ${current.length + 1}`, on: true }])} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {copy ? <Text style={styles.copy}>{copy}</Text> : null}
      <View style={{ height: 12 }} />
      <Button label="Generate PDF copy" kind="secondary" onPress={loadFromPromptAssets} loading={loading} />
      <View style={{ height: 8 }} />
      <Button label="Build PDF" onPress={buildPdf} loading={loading} />
      {pdfB64 ? (
        <>
          <View style={{ height: 8 }} />
          <Button label="Share / save PDF" kind="secondary" onPress={sharePdf} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 28 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginVertical: 10 },
  label: { color: colors.textSecondary, fontFamily: fonts.medium, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.ink },
  screenRow: { gap: 8, marginBottom: 10 },
  link: { color: colors.lime, fontFamily: fonts.bold, marginBottom: 4 },
  error: { color: '#FFB4B4', marginTop: 8, fontFamily: fonts.medium },
  copy: { color: colors.textSecondary, fontFamily: fonts.regular, marginTop: 12, lineHeight: 20 },
});
