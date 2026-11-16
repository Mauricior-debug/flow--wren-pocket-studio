import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, StudioHeader } from '../../components/chrome';
import { Button, Pill } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { colors, fonts, radius } from '../../theme/tokens';

export default function ProspectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { prospects, prospectAction, showToast } = useCrm();
  const prospect = prospects.find((item) => item.id === id);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: string, extra?: Record<string, any>) => {
    if (!prospect) return;
    setBusy(action);
    setError(null);
    const result = await prospectAction(prospect.id, action, extra);
    setBusy(null);
    if (!result.ok) {
      setError(result.error || 'Action failed.');
      return;
    }
    showToast(`${action.replace(/_/g, ' ')} done.`);
  };

  if (!prospect) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12, paddingHorizontal: 16 }]}>
        <BackButton />
        <Text style={styles.title}>Prospect not found</Text>
        <Button label="Back to desk" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}>
      <StudioHeader back />
      <Text style={styles.title}>{prospect.companyName || 'Prospect'}</Text>
      <Pill label={String(prospect.status || 'assigned').replace(/_/g, ' ')} tone="purple" />
      <Text style={styles.meta}>{prospect.websiteUrl || 'No website'}</Text>
      <Text style={styles.meta}>{prospect.contactName || prospect.email || ''}</Text>
      {prospect.buildRequest ? <Text style={styles.body}>{prospect.buildRequest}</Text> : null}
      {prospect.analysis ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Analysis</Text>
          <Text style={styles.body}>{typeof prospect.analysis === 'string' ? prospect.analysis : JSON.stringify(prospect.analysis).slice(0, 800)}</Text>
        </View>
      ) : null}
      {prospect.outreach ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outreach</Text>
          <Text style={styles.body}>{typeof prospect.outreach === 'string' ? prospect.outreach : prospect.outreach?.subject || JSON.stringify(prospect.outreach).slice(0, 600)}</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button label="Analyse" flex={1} kind="secondary" loading={busy === 'analyze'} onPress={() => run('analyze')} />
        <Button label="Build" flex={1} loading={busy === 'build'} onPress={() => run('build')} />
      </View>
      <View style={styles.actions}>
        <Button label="Outreach" flex={1} kind="secondary" loading={busy === 'outreach'} onPress={() => run('outreach')} />
        <Button label="Demo video" flex={1} kind="secondary" loading={busy === 'demo_video'} onPress={() => run('demo_video')} />
      </View>
      <View style={styles.actions}>
        <Button label="Skip" flex={1} kind="danger" loading={busy === 'skip'} onPress={() => run('skip')} />
        <Button label="Open build" flex={1} kind="secondary" onPress={() => router.push(`/build/${prospect.id}`)} />
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
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 6 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginTop: 10 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginTop: 14 },
  cardTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
