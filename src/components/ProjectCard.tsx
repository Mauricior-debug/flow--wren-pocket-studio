import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Project, ProjectStatus } from '../data/types';
import { projectSubtitle } from '../lib/format';
import { images } from '../theme/images';
import { colors, fonts, radius } from '../theme/tokens';
import { Pill, ProgressBar } from './ui';

function tone(status: ProjectStatus): 'purple' | 'amber' | 'green' | 'muted' {
  if (status === 'building') return 'purple';
  if (status === 'design') return 'amber';
  if (status === 'live') return 'green';
  return 'muted';
}

function barColor(status: ProjectStatus) {
  if (status === 'building') return colors.purple;
  if (status === 'design') return colors.lime;
  return colors.green;
}

export function ProjectCard({ project }: { project: Project }) {
  const label =
    project.status === 'building'
      ? 'Building'
      : project.status === 'design'
        ? 'Awaiting Approval'
        : project.status === 'live'
          ? 'Live'
          : project.status === 'planning'
            ? 'Planning'
            : 'Attention';

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${project.name}, ${projectSubtitle(project)}`}
        onPress={() => router.push(`/project/${project.id}`)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.thumb}>
          {project.thumb ? (
            <Image source={images.thumbs[project.thumb]} style={styles.thumbImage} contentFit="cover" />
          ) : (
            <Ionicons name="phone-portrait-outline" size={20} color={colors.lime} />
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {project.name}
            </Text>
            <Pill label={label} tone={tone(project.status)} />
          </View>
          <Text style={styles.meta}>{projectSubtitle(project)}</Text>
          {project.status !== 'live' ? (
            <View style={styles.progressRow}>
              <View style={{ flex: 1 }}>
                <ProgressBar value={project.progress} color={barColor(project.status)} />
              </View>
              <Text style={styles.percent}>{project.progress}%</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {project.status === 'live' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share"
          onPress={() => router.push(`/share/${project.id}`)}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
        >
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : (
        <View style={styles.more}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2A3A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  main: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  pressed: { opacity: 0.78 },
  thumb: {
    width: 64,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: { width: 64, height: 52 },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, flex: 1 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  percent: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: 12, width: 36, textAlign: 'right' },
  more: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
});
