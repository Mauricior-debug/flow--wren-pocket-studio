import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../../components/chrome';
import { Button, EmptyState, Pill } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { colors, fonts, radius } from '../../../theme/tokens';

export default function DesignStudio() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();
  const { projects, screens, generateScreens, approveAll } = useStore();
  const project = projects.find((item) => item.id === projectId);
  const mine = screens.filter((item) => item.projectId === projectId);
  const approved = mine.filter((item) => item.status === 'approved').length;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
      data={mine}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <StudioHeader back />
          <Text style={styles.title}>Design studio</Text>
          <Text style={styles.sub}>{project?.name}. {approved} of {mine.length} approved. An approved screen stays until you change it.</Text>
          <Button label="Draft missing screens" kind="secondary" onPress={() => projectId && generateScreens(projectId)} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/design/${projectId}/${item.id}`)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.purpose}>{item.purpose}</Text>
          </View>
          <Pill label={item.status} tone={item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : item.status === 'changes' ? 'amber' : 'muted'} />
        </Pressable>
      )}
      ListEmptyComponent={<EmptyState title="No screens yet" body="Save a brief, then draft the screens you want to approve." />}
      ListFooterComponent={
        <View style={{ marginTop: 8 }}>
          {mine.length ? (
            <Button label="Approve the complete design" onPress={() => projectId && approveAll(projectId)} disabled={mine.every((item) => item.status === 'approved' || item.status === 'rejected')} />
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 8 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginVertical: 10 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  name: { color: colors.white, fontFamily: fonts.bold, fontSize: 17 },
  purpose: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
});
