import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, Pill } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { activityLines, asText } from '../../lib/activityText';
import { colors, fonts, radius } from '../../theme/tokens';

export default function BuildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { prospects, liveMap } = useCrm();
  const prospect = prospects.find((item) => item.id === id);
  const delivery = {
    ...(prospect?.buildDelivery || {}),
    ...(liveMap[id] || {}),
    ...(liveMap[prospect?.buildDelivery?.agentId] || {}),
  };
  const kind = String(delivery.appKind || '');
  const isNative = kind.includes('react-native') || kind.includes('native');

  if (!prospect) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 16, paddingHorizontal: 16 }]}>
        <StudioHeader back />
        <Text style={styles.title}>Build not found</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const files = delivery.changes?.files || [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}>
      <StudioHeader back />
      <Text style={styles.title}>{prospect.companyName || 'Build'}</Text>
      <Pill label={String(delivery.status || delivery.runStatus || 'building')} tone={delivery.error ? 'red' : 'purple'} />
      <Text style={styles.meta}>Stack: {delivery.appKind || '—'}</Text>
      {asText(delivery.current) ? <Text style={styles.live}>{asText(delivery.current)}</Text> : null}
      {activityLines(delivery.activity).map((line, index) => (
        <Text key={`activity-${index}`} style={styles.body}>
          {line}
        </Text>
      ))}
      {asText(delivery.note) || asText(delivery.speech) ? (
        <Text style={styles.body}>{asText(delivery.note) || asText(delivery.speech)}</Text>
      ) : null}
      {asText(delivery.error) || asText(delivery.expoError) ? (
        <Text style={styles.err}>{asText(delivery.error) || asText(delivery.expoError)}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Links</Text>
        {delivery.repoUrl ? <Button label="Open repository" kind="secondary" onPress={() => Linking.openURL(delivery.repoUrl)} /> : <Text style={styles.meta}>No repo yet</Text>}
        <View style={{ height: 8 }} />
        {delivery.prUrl ? <Button label="Open pull request" kind="secondary" onPress={() => Linking.openURL(delivery.prUrl)} /> : null}
        {delivery.agentUrl ? (
          <>
            <View style={{ height: 8 }} />
            <Button label="Open agent" kind="secondary" onPress={() => Linking.openURL(delivery.agentUrl)} />
          </>
        ) : null}
        {isNative && delivery.expoGoUrl ? (
          <>
            <View style={{ height: 8 }} />
            <Button label="Open in Expo Go" onPress={() => Linking.openURL(delivery.expoGoUrl)} />
          </>
        ) : null}
        {!isNative && delivery.vercelUrl ? (
          <>
            <View style={{ height: 8 }} />
            <Button label="Open deployed site" kind="secondary" onPress={() => Linking.openURL(delivery.vercelUrl)} />
          </>
        ) : null}
        {isNative ? <Text style={styles.note}>Deploy to Vercel is not offered on React Native builds.</Text> : null}
      </View>

      {isNative && delivery.expoQrUrl ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expo Go QR</Text>
          <Image source={{ uri: delivery.expoQrUrl }} style={styles.qr} contentFit="contain" />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Changed files</Text>
        {files.length === 0 ? <Text style={styles.meta}>No file list yet.</Text> : null}
        {files.slice(0, 40).map((file: any) => (
          <Text key={file.path || file} style={styles.file}>
            {file.path || String(file)} {file.status ? `· ${file.status}` : ''}
          </Text>
        ))}
      </View>

      <Button label="Add to this app" onPress={() => router.push({ pathname: '/follow-up-sheet', params: { prospectId: prospect.id, company: prospect.companyName || '' } })} />
      <View style={{ height: 8 }} />
      <Button label="Ready for both stores" kind="secondary" onPress={() => router.push({ pathname: '/follow-up-sheet', params: { prospectId: prospect.id, company: prospect.companyName || '', storeReady: '1' } })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 30, marginTop: 12, marginBottom: 10 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 8 },
  live: { color: colors.lime, fontFamily: fonts.semibold, fontSize: 15, marginTop: 12, lineHeight: 21 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginTop: 8 },
  err: { color: '#FFB4B4', fontFamily: fonts.medium, marginTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginTop: 14, gap: 4 },
  cardTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, marginBottom: 8 },
  qr: { width: 180, height: 180, backgroundColor: '#fff', borderRadius: 12 },
  note: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },
  file: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12, marginBottom: 4 },
});
