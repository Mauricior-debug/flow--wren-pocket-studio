import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { ProjectCard } from '../../components/ProjectCard';
import { EmptyState, SectionTitle } from '../../components/ui';
import { useStore } from '../../data/store';
import { timeAgo } from '../../lib/format';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import type { ProjectType } from '../../data/types';
import { colors, fonts, radius } from '../../theme/tokens';

const tiles: { title: string; detail: string; icon: keyof typeof Ionicons.glyphMap; tint: string; type: ProjectType; mode: 'create' | 'feature' }[] = [
  { title: 'New Build', detail: 'From an idea', icon: 'color-wand', tint: '#6D5BD0', type: 'new-website', mode: 'create' },
  { title: 'Rebuild', detail: 'Improve an existing site', icon: 'refresh', tint: '#2F6FED', type: 'rebuild-website', mode: 'create' },
  { title: 'Design to Code', detail: 'Turn designs into a working app', icon: 'image', tint: '#1F8A4C', type: 'design-to-code', mode: 'create' },
  { title: 'Add Feature', detail: 'Update a live project', icon: 'layers', tint: '#C98612', type: 'feature', mode: 'feature' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const { user, projects, screens, jobs, notifications, startFromPrompt } = useStore();
  const [idea, setIdea] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const first = user?.name.split(' ')[0];
  const pending = screens.filter((screen) => screen.status === 'pending' || screen.status === 'changes');
  const activeJob = jobs.find((job) => job.status === 'building' || job.status === 'queued');

  const launch = (type: ProjectType, mode: 'create' | 'feature') => {
    router.push({ pathname: '/builder', params: { mode, type } });
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <StudioHeader />
      <Text style={styles.hello}>
        Hi, I’m <Text style={styles.lime}>Wren</Text> 👋
      </Text>
      <Text style={styles.role}>Your AI Website & Application Architect.</Text>
      <Text style={styles.pitch}>Tell me what you want to build, and I’ll plan, design, develop and deploy it for you.</Text>
      <View style={styles.prompt}>
        <Ionicons name="sparkles" size={16} color={colors.lime} />
        <TextInput
          value={idea}
          onChangeText={setIdea}
          placeholder="What would you like to build today?"
          placeholderTextColor="#8EA0A8"
          style={styles.promptInput}
          returnKeyType="send"
          onSubmitEditing={() => {
            const id = startFromPrompt(idea);
            if (!id) {
              setPromptError('Describe the idea in a few words.');
              return;
            }
            setIdea('');
            setPromptError(null);
            router.push(`/plan/${id}`);
          }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Describe it by voice" onPress={() => router.push('/voice-sheet')} style={styles.mic}>
          <Ionicons name="mic-outline" size={20} color={colors.text} />
        </Pressable>
      </View>
      {promptError ? <Text style={styles.promptError}>{promptError}</Text> : null}
      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <Pressable key={tile.title} accessibilityRole="button" accessibilityLabel={tile.title} onPress={() => launch(tile.type, tile.mode)} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75 }]}>
            <View style={[styles.tileIcon, { backgroundColor: tile.tint }]}>
              <Ionicons name={tile.icon} size={18} color={colors.white} />
            </View>
            <Text style={styles.tileTitle}>{tile.title}</Text>
            <Text style={styles.tileDetail}>{tile.detail}</Text>
          </Pressable>
        ))}
      </View>
      <SectionTitle title="My Projects" action="View All →" onAction={() => router.navigate('/(tabs)/projects')} />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" body={first ? `${first}, describe an idea above or start a new build.` : 'Describe an idea above or start a new build.'} action="New build" onAction={() => launch('new-website', 'create')} />
      ) : (
        <View style={{ gap: 10 }}>
          {projects.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </View>
      )}
      <SectionTitle title="Pending approvals" />
      {pending.length === 0 ? (
        <Text style={styles.quiet}>No screens are waiting.</Text>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/design/${pending[0].projectId}`)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
          <Text style={styles.rowTitle}>{pending.length} screen{pending.length === 1 ? '' : 's'} to approve</Text>
          <Text style={styles.rowMeta}>Open the design studio</Text>
        </Pressable>
      )}
      <SectionTitle title="Build progress" action={activeJob ? 'View log →' : undefined} onAction={activeJob ? () => router.push(`/job/${activeJob.id}`) : undefined} />
      {activeJob ? (
        <View style={styles.row}>
          <Text style={styles.rowTitle}>{projects.find((item) => item.id === activeJob.projectId)?.name}</Text>
          <Text style={styles.rowMeta}>
            {activeJob.progress}% · {activeJob.verified ? 'Verified' : 'Not verified'}
            {activeJob.sample ? ' · Sample workspace' : ''}
          </Text>
        </View>
      ) : (
        <Text style={styles.quiet}>No build is in progress.</Text>
      )}
      <SectionTitle title="Recent activity" action="Notifications" onAction={() => router.push('/notifications')} />
      {notifications.slice(0, 4).map((item) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(item.route || '/notifications')} style={styles.activity}>
          <View style={[styles.activityDot, { backgroundColor: item.read ? colors.line : colors.lime }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowMeta}>{timeAgo(item.createdAt)}</Text>
          </View>
        </Pressable>
      ))}
      {notifications.length === 0 ? <Text style={styles.quiet}>No activity yet.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hello: { color: colors.white, fontFamily: fonts.extra, fontSize: 34, marginTop: 12, letterSpacing: -0.5 },
  lime: { color: colors.lime },
  role: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 16, marginTop: 6 },
  pitch: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, marginTop: 4 },
  prompt: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    gap: 8,
    shadowColor: colors.lime,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  promptInput: { flex: 1, color: colors.white, fontFamily: fonts.medium, fontSize: 15, paddingVertical: 12 },
  mic: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  promptError: { color: '#FFB4B4', marginTop: 8, fontFamily: fonts.medium },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 8 },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, minHeight: 112, gap: 6 },
  tileIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  tileDetail: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 14 },
  quiet: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, marginBottom: 8 },
  row: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  rowTitle: { color: colors.white, fontFamily: fonts.semibold, fontSize: 15 },
  rowMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  activity: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
});
