import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, EmptyState, Pill } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { colors, fonts, radius } from '../../theme/tokens';

export default function Builds() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const { prospects, loadDesk, loadingDesk } = useCrm();
  const [grid, setGrid] = useState(false);

  const builds = useMemo(
    () =>
      prospects.filter((item) => {
        const d = item.buildDelivery || {};
        return d.agentId || d.status || d.repoUrl || d.prUrl || d.expoGoUrl || d.activity || d.current;
      }),
    [prospects],
  );

  return (
    <FlatList
      ref={ref}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}
      contentInsetAdjustmentBehavior="automatic"
      data={builds}
      key={grid ? 'g' : 'l'}
      numColumns={grid ? 2 : 1}
      keyExtractor={(item) => item.id}
      refreshing={loadingDesk}
      onRefresh={() => loadDesk()}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <StudioHeader onRefresh={() => loadDesk()} />
          <Text style={styles.title}>Active builds</Text>
          <Text style={styles.sub}>Status, stack, repo, PR, files, and Expo Go links from Wren’s live board.</Text>
          <View style={styles.toggleRow}>
            <Pressable accessibilityRole="button" onPress={() => setGrid(false)} style={[styles.toggle, !grid && styles.toggleOn]}>
              <Text style={[styles.toggleText, !grid && styles.toggleTextOn]}>List</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setGrid(true)} style={[styles.toggle, grid && styles.toggleOn]}>
              <Text style={[styles.toggleText, grid && styles.toggleTextOn]}>Grid</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const d = item.buildDelivery || {};
        const kind = d.appKind || 'html';
        const isNative = String(kind).includes('react-native') || String(kind).includes('native');
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/build/${item.id}`)}
            style={({ pressed }) => [styles.card, grid && styles.gridCard, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.top}>
              <Text style={styles.name} numberOfLines={2}>
                {item.companyName || 'Build'}
              </Text>
              <Pill label={String(d.status || d.runStatus || item.status || 'building')} tone={d.error || d.expoError ? 'red' : 'purple'} />
            </View>
            <Text style={styles.meta}>{kind}</Text>
            {d.current || d.activity ? (
              <Text style={styles.live} numberOfLines={3}>
                {d.current || d.activity}
              </Text>
            ) : null}
            {d.error || d.expoError ? <Text style={styles.err}>{d.error || d.expoError}</Text> : null}
            <View style={styles.actions}>
              {d.repoUrl ? (
                <Pressable accessibilityRole="button" onPress={() => Linking.openURL(d.repoUrl)}>
                  <Text style={styles.link}>Repo</Text>
                </Pressable>
              ) : null}
              {d.prUrl ? (
                <Pressable accessibilityRole="button" onPress={() => Linking.openURL(d.prUrl)}>
                  <Text style={styles.link}>Pull request</Text>
                </Pressable>
              ) : null}
              {isNative && d.expoGoUrl ? (
                <Pressable accessibilityRole="button" onPress={() => Linking.openURL(d.expoGoUrl)}>
                  <Text style={styles.link}>Open in Expo Go</Text>
                </Pressable>
              ) : null}
              {!isNative && d.vercelUrl ? (
                <Pressable accessibilityRole="button" onPress={() => Linking.openURL(d.vercelUrl)}>
                  <Text style={styles.link}>Open site</Text>
                </Pressable>
              ) : null}
            </View>
            {isNative && d.expoQrUrl ? <Image source={{ uri: d.expoQrUrl }} style={styles.qr} contentFit="contain" /> : null}
            {isNative ? <Text style={styles.note}>Deploy to Vercel is not offered for React Native builds.</Text> : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <EmptyState title="No active builds" body="Cook a job from the Job tab. Live activity appears here while Wren builds." action="Give Wren the job" onAction={() => router.navigate('/(tabs)/job')} />
      }
      ListFooterComponent={
        builds.length ? (
          <View style={{ marginTop: 12 }}>
            <Button label="Add to this app" onPress={() => router.push('/follow-up-sheet')} />
          </View>
        ) : (
          <View />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginTop: 8 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  toggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card },
  toggleOn: { backgroundColor: colors.lime },
  toggleText: { color: colors.textMuted, fontFamily: fonts.semibold },
  toggleTextOn: { color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1E2A3A', flex: 1 },
  gridCard: { marginHorizontal: 4 },
  top: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  name: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, flex: 1 },
  meta: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, marginTop: 6, textTransform: 'uppercase' },
  live: { color: colors.lime, fontFamily: fonts.medium, fontSize: 13, marginTop: 8, lineHeight: 18 },
  err: { color: '#FFB4B4', fontFamily: fonts.medium, fontSize: 12, marginTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  link: { color: colors.link, fontFamily: fonts.bold, fontSize: 13 },
  qr: { width: 140, height: 140, marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 12 },
  note: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },
});
