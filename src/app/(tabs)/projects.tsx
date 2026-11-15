import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StudioHeader } from '../../components/chrome';
import { ProjectCard } from '../../components/ProjectCard';
import { EmptyState } from '../../components/ui';
import { useStore } from '../../data/store';
import type { ProjectStatus } from '../../data/types';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { colors, fonts, radius } from '../../theme/tokens';

const filters: { id: 'all' | ProjectStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'building', label: 'Building' },
  { id: 'design', label: 'Review' },
  { id: 'live', label: 'Live' },
  { id: 'planning', label: 'Planning' },
];

export default function Projects() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const { projects, screens } = useStore();
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all');
  const data = projects.filter((project) => filter === 'all' || project.status === filter);

  return (
    <FlatList
      ref={ref}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}
      contentInsetAdjustmentBehavior="automatic"
      data={data}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <StudioHeader />
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.sub}>Everything Wren is planning, designing, or waiting to verify.</Text>
          <View style={styles.filters}>
            {filters.map((item) => (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => setFilter(item.id)} style={[styles.chip, filter === item.id && styles.chipOn]}>
                <Text style={[styles.chipText, filter === item.id && styles.chipTextOn]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: 10 }}>
          <ProjectCard project={item} />
          <Text style={styles.screenCount}>
            {screens.filter((screen) => screen.projectId === item.id).length} screens · {item.tasks.filter((task) => !task.done).length} open tasks
          </Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="Nothing in this list" body="Start a project and it will stay here, including after you close the app." action="Create a project" onAction={() => router.push('/(tabs)/create')} />}
      ListFooterComponent={
        <View style={{ marginTop: 12, gap: 8 }}>
          {data.length ? <Text style={styles.footerTitle}>Screens across projects</Text> : null}
          {data.length
            ? screens.map((screen) => (
                <Pressable key={screen.id} accessibilityRole="button" onPress={() => router.push(`/design/${screen.projectId}/${screen.id}`)} style={styles.screenRow}>
                  <Text style={styles.screenName}>{screen.name}</Text>
                  <Text style={styles.screenStatus}>{screen.status}</Text>
                </Pressable>
              ))
            : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginTop: 6, marginBottom: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.ink },
  screenCount: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 6, marginLeft: 8 },
  footerTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginBottom: 8 },
  screenRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  screenName: { color: colors.white, fontFamily: fonts.medium, fontSize: 15 },
  screenStatus: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, textTransform: 'capitalize' },
});
