import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../components/chrome';
import { Button, EmptyState, Field, Pill, ProgressBar } from '../../components/ui';
import { useStore } from '../../data/store';
import { formatStat, statusLabel } from '../../lib/format';
import { images } from '../../theme/images';
import { colors, fonts, radius } from '../../theme/tokens';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { projects, screens, jobs, deployments, createJob, toggleTask, saveRepo, addFeature } = useStore();
  const project = projects.find((item) => item.id === id);
  const [tab, setTab] = useState<'Overview' | 'Analytics' | 'Settings'>('Overview');
  const [feature, setFeature] = useState('');
  const [repo, setRepo] = useState(project?.repoUrl ?? '');
  const [jobError, setJobError] = useState<string | null>(null);
  if (!project) return <View style={styles.screen}><EmptyState title="Project missing" body="It is not on this device." action="Back home" onAction={() => router.replace('/(tabs)')} /></View>;

  const mine = screens.filter((screen) => screen.projectId === project.id);
  const approved = mine.filter((screen) => screen.status === 'approved').length;
  const job = jobs.find((item) => item.projectId === project.id);
  const deployment = deployments.find((item) => item.projectId === project.id);
  const tone = project.status === 'live' ? 'green' : project.status === 'building' ? 'purple' : project.status === 'design' ? 'amber' : 'muted';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.brand}>Wren Studio</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Project settings" onPress={() => setTab('Settings')} style={styles.gear}>
            <Text style={styles.gearText}>⚙</Text>
          </Pressable>
        </View>
        <Image source={images.hero} style={styles.hero} contentFit="cover" accessibilityLabel="Build without limits" />
        <Text style={styles.name}>{project.name}</Text>
        <Text style={styles.desc}>{project.description || 'No description yet.'}</Text>
        <View style={styles.statusRow}>
          <Pill label={statusLabel(project.status)} tone={tone} />
          <Button label={project.status === 'live' ? 'View Live' : 'Open share'} kind="secondary" onPress={() => router.push(`/share/${project.id}`)} />
        </View>
        <View style={styles.tabs}>
          {(['Overview', 'Analytics', 'Settings'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="button" onPress={() => setTab(item)} style={styles.tab}>
              <Text style={[styles.tabText, tab === item && styles.tabOn]}>{item}</Text>
              {tab === item ? <View style={styles.underline} /> : <View style={styles.underlineOff} />}
            </Pressable>
          ))}
        </View>

        {tab === 'Overview' ? (
          <View style={{ gap: 12 }}>
            <View style={styles.stats}>
              <Stat value={formatStat(project.analytics.visitors)} label="Total Visitors" delta={project.analytics.visitorDelta} />
              <Stat value={formatStat(project.analytics.interactions)} label="App Interactions" delta={project.analytics.interactionDelta} />
              <Stat value={project.analytics.uptime == null ? '—' : `${project.analytics.uptime}%`} label="Uptime" delta={project.analytics.uptimeDelta} />
            </View>
            <View style={styles.actions}>
              <Button label="Edit" kind="blue" flex={1} onPress={() => router.push({ pathname: '/builder', params: { mode: 'edit', projectId: project.id, type: project.type } })} />
              <Button label="Share / Deploy" kind="purple" flex={1.4} onPress={() => router.push(`/share/${project.id}`)} />
              <Button label="Delete" kind="danger" flex={1} onPress={() => router.push({ pathname: '/delete-sheet', params: { projectId: project.id } })} />
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/design/${project.id}`)} style={styles.block}>
              <Text style={styles.blockTitle}>Design</Text>
              <Text style={styles.blockBody}>{approved} of {mine.length} screens approved. Approved revisions stay until you change them.</Text>
            </Pressable>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Development</Text>
              <Text style={styles.blockBody}>{job ? `${job.status} · ${job.progress}% · ${job.verified ? 'Verified' : 'Not verified'}` : 'No coding job yet.'}</Text>
              {job ? <ProgressBar value={job.progress} color={colors.purple} /> : null}
              {jobError ? <Text style={styles.error}>{jobError}</Text> : null}
              <Button
                label={job ? 'Open build log' : 'Start development'}
                kind="secondary"
                onPress={() => {
                  if (job) {
                    router.push(`/job/${job.id}`);
                    return;
                  }
                  const result = createJob(project.id);
                  if (!result.ok) {
                    setJobError(result.error);
                    return;
                  }
                  router.push(`/job/${result.jobId}`);
                }}
              />
            </View>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Roadmap</Text>
              {project.roadmap.map((phase) => (
                <Text key={phase.id} style={styles.line}>
                  {phase.state === 'done' ? '✓' : phase.state === 'now' ? '•' : '○'} {phase.title} — {phase.detail}
                </Text>
              ))}
            </View>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Tasks</Text>
              {project.tasks.map((task) => (
                <Pressable key={task.id} accessibilityRole="button" onPress={() => toggleTask(project.id, task.id)} style={styles.task}>
                  <Text style={styles.taskMark}>{task.done ? '✓' : '○'}</Text>
                  <Text style={[styles.line, task.done && styles.done]}>{task.title}</Text>
                </Pressable>
              ))}
              <Field value={feature} onChangeText={setFeature} placeholder="Request a feature" />
              <Button
                label="Add feature"
                kind="secondary"
                onPress={() => {
                  addFeature(project.id, feature);
                  setFeature('');
                }}
              />
            </View>
            {deployment ? <Text style={styles.note}>{deployment.note}</Text> : null}
          </View>
        ) : null}

        {tab === 'Analytics' ? (
          <View style={{ gap: 12 }}>
            <View style={styles.stats}>
              <Stat value={formatStat(project.analytics.visitors)} label="Total Visitors" delta={project.analytics.visitorDelta} />
              <Stat value={formatStat(project.analytics.interactions)} label="App Interactions" delta={project.analytics.interactionDelta} />
              <Stat value={project.analytics.uptime == null ? '—' : `${project.analytics.uptime}%`} label="Uptime" delta={project.analytics.uptimeDelta} />
            </View>
            <Text style={styles.note}>
              {project.analytics.visitors == null
                ? 'No visits are recorded on this device. Counts appear only when this workspace already has them.'
                : 'These figures are the sample workspace from the approved design. They are not a live analytics feed.'}
            </Text>
          </View>
        ) : null}

        {tab === 'Settings' ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.line}>Template · {project.template}</Text>
            <Text style={styles.line}>Model · {project.aiModel}</Text>
            <Field label="Repository URL" value={repo} onChangeText={setRepo} autoCapitalize="none" placeholder="https://github.com/…" />
            <Text style={styles.note}>Creating a GitHub repository needs a connected account. You can save a URL you already have.</Text>
            <Button label="Save repository" kind="secondary" onPress={() => saveRepo(project.id, repo)} />
            <Text style={styles.blockTitle}>Files</Text>
            {project.files.length === 0 ? <Text style={styles.note}>No files yet. Add them from Edit.</Text> : project.files.map((file) => <Text key={file.id} style={styles.line}>{file.name}</Text>)}
            <Button label="Continue planning" kind="secondary" onPress={() => router.push(`/plan/${project.id}`)} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, delta }: { value: string; label: string; delta?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {delta ? <Text style={styles.delta}>↑ {delta.replace('+', '')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  gear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  gearText: { color: colors.white, fontSize: 20 },
  hero: { height: 168, borderRadius: radius.lg, marginTop: 8 },
  name: { color: colors.white, fontFamily: fonts.extra, fontSize: 28, marginTop: 14 },
  desc: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  tabs: { flexDirection: 'row', marginTop: 18, marginBottom: 14 },
  tab: { flex: 1, alignItems: 'center' },
  tabText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15, paddingBottom: 8 },
  tabOn: { color: colors.white },
  underline: { height: 3, width: '70%', backgroundColor: colors.lime, borderRadius: 2 },
  underlineOff: { height: 3 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, minHeight: 96 },
  statValue: { color: colors.white, fontFamily: fonts.extra, fontSize: 22 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  delta: { color: colors.green, fontFamily: fonts.semibold, fontSize: 12, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  block: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 8 },
  blockTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  blockBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  line: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  task: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', minHeight: 36 },
  taskMark: { color: colors.lime, fontFamily: fonts.bold, width: 16 },
  done: { textDecorationLine: 'line-through', color: colors.textMuted },
  note: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, fontSize: 13 },
});
