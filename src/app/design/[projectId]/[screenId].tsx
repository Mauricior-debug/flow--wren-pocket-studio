import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../../components/chrome';
import { DesignPreview } from '../../../components/DesignPreview';
import { Button, Field, Pill } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { timeAgo } from '../../../lib/format';
import { colors, fonts, radius } from '../../../theme/tokens';

export default function ScreenDetail() {
  const { projectId, screenId } = useLocalSearchParams<{ projectId: string; screenId: string }>();
  const insets = useSafeAreaInsets();
  const { screens, projects, approveScreen, rejectScreen, regenerateScreen, requestScreenChange } = useStore();
  const screen = screens.find((item) => item.id === screenId);
  const project = projects.find((item) => item.id === projectId);
  const [note, setNote] = useState('');
  const [compare, setCompare] = useState(false);
  if (!screen || !project) return null;
  const latest = screen.revisions[screen.revisions.length - 1];
  const approved = screen.revisions.find((item) => item.id === screen.approvedRevisionId);
  const previous = screen.revisions.length > 1 ? screen.revisions[screen.revisions.length - 2] : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
      <StudioHeader back />
      <View style={styles.titleRow}>
        <Text style={styles.title}>{screen.name}</Text>
        <Pill label={screen.status} tone={screen.status === 'approved' ? 'green' : screen.status === 'rejected' ? 'red' : 'amber'} />
      </View>
      <Text style={styles.purpose}>{screen.purpose}</Text>
      {approved && approved.id !== latest?.id ? (
        <Text style={styles.keep}>The approved revision stays attached until you approve this one.</Text>
      ) : null}
      <DesignPreview name={screen.name} template={project.template} blocks={latest?.blocks ?? []} />
      <Text style={styles.section}>Design specifications</Text>
      <Text style={styles.body}>{latest?.spec}</Text>
      <Text style={styles.section}>Related components</Text>
      {screen.components.map((item) => (
        <Text key={item} style={styles.body}>• {item}</Text>
      ))}
      <Text style={styles.section}>Functional requirements</Text>
      {screen.requirements.map((item) => (
        <Text key={item} style={styles.body}>• {item}</Text>
      ))}
      <View style={styles.actions}>
        <Button label="Approve" kind="primary" flex={1} onPress={() => approveScreen(screen.id)} />
        <Button label="Reject" kind="danger" flex={1} onPress={() => rejectScreen(screen.id)} />
      </View>
      <Button label="Regenerate this screen" kind="secondary" onPress={() => regenerateScreen(screen.id)} />
      <Field label="Request a visual change" value={note} onChangeText={setNote} placeholder="What should be different?" />
      <Button
        label="Save change request"
        kind="secondary"
        onPress={() => {
          requestScreenChange(screen.id, note);
          setNote('');
        }}
      />
      {previous ? <Button label={compare ? 'Hide comparison' : 'Compare revisions'} kind="ghost" onPress={() => setCompare((value) => !value)} /> : null}
      {compare && previous && latest ? (
        <View style={{ gap: 12 }}>
          <Text style={styles.section}>Previous · {previous.note}</Text>
          <DesignPreview name={screen.name} template={project.template} blocks={previous.blocks} compact />
          <Text style={styles.section}>Current · {latest.note}</Text>
          <DesignPreview name={screen.name} template={project.template} blocks={latest.blocks} compact />
        </View>
      ) : null}
      <Text style={styles.section}>Revision history</Text>
      {screen.revisions.map((revision) => (
        <View key={revision.id} style={styles.rev}>
          <Text style={styles.revTitle}>{revision.note}</Text>
          <Text style={styles.revMeta}>{timeAgo(revision.createdAt)}{revision.id === screen.approvedRevisionId ? ' · Approved' : ''}</Text>
        </View>
      ))}
      <Button label="Back to screens" kind="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 28, flex: 1 },
  purpose: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginVertical: 10 },
  keep: { color: '#F3E2A2', fontFamily: fonts.medium, fontSize: 13, marginBottom: 10 },
  section: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, marginTop: 16, marginBottom: 6 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  rev: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  revTitle: { color: colors.white, fontFamily: fonts.semibold, fontSize: 14 },
  revMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
});
