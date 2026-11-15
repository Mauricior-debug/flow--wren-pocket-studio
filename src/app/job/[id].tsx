import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Banner, Button, Field, Pill } from '../../components/ui';
import { useStore } from '../../data/store';
import { timeAgo } from '../../lib/format';
import { colors, fonts, radius } from '../../theme/tokens';

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { jobs, projects, screens, addJobInstruction } = useStore();
  const job = jobs.find((item) => item.id === id);
  const project = projects.find((item) => item.id === job?.projectId);
  const [note, setNote] = useState('');
  if (!job || !project) return null;
  const attached = screens.filter((screen) => screen.approvedRevisionId && job.designRevisionIds.includes(screen.approvedRevisionId));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
      <StudioHeader back />
      <Text style={styles.title}>Development</Text>
      <Text style={styles.sub}>{project.name}</Text>
      <View style={styles.row}>
        <Pill label={job.status === 'building' ? 'Building' : job.status === 'queued' ? 'Queued' : job.status === 'failed' ? 'Failed' : 'Needs attention'} tone={job.status === 'failed' ? 'red' : job.status === 'building' ? 'purple' : 'amber'} />
        <Text style={styles.meta}>{job.provider === 'cursor' ? 'Cursor Cloud Agent' : 'Fallback'} · Not verified</Text>
      </View>
      <Banner>
        {job.sample
          ? 'Sample workspace progress. A remote agent has not verified this build.'
          : 'The coding agent runs remotely. It is not connected from this device, so this job stays queued. Nothing here is a successful build.'}
      </Banner>
      <Text style={styles.section}>Attached design</Text>
      {attached.length === 0 ? <Text style={styles.body}>No approved revisions are attached.</Text> : attached.map((screen) => (
        <Text key={screen.id} style={styles.body}>• {screen.name}</Text>
      ))}
      <Text style={styles.section}>Log</Text>
      {job.log.map((line) => (
        <View key={line.id} style={styles.log}>
          <Text style={styles.logText}>{line.text}</Text>
          <Text style={styles.meta}>{timeAgo(line.at)}</Text>
        </View>
      ))}
      <Text style={styles.section}>Tests</Text>
      <Text style={styles.body}>No test run has been verified.</Text>
      <Text style={styles.section}>Errors</Text>
      <Text style={styles.body}>{job.status === 'failed' ? 'The last log marks a failure. Nothing has been auto-fixed.' : 'No error has been reported by a connected agent.'}</Text>
      <Text style={styles.section}>Version history</Text>
      {job.versions.map((version) => (
        <Text key={version.id} style={styles.body}>{timeAgo(version.at)} — {version.note}</Text>
      ))}
      <Field label="Add an instruction" value={note} onChangeText={setNote} placeholder="Change the copy, add a screen, fix a flow" />
      <Button
        label="Send instruction"
        onPress={() => {
          addJobInstruction(job.id, note);
          setNote('');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 8 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  meta: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12 },
  section: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, marginTop: 16, marginBottom: 6 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  log: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  logText: { color: colors.white, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
});
