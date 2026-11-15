import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, Field } from '../../components/ui';
import { useStore } from '../../data/store';
import { colors, fonts, radius } from '../../theme/tokens';

export default function Plan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { projects, sendPlanMessage, saveBrief, generateScreens } = useStore();
  const project = projects.find((item) => item.id === id);
  const [text, setText] = useState('');
  const scroll = useRef<any>(null);
  if (!project) return null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 16 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        <StudioHeader back />
        <Text style={styles.title}>Planning</Text>
        <Text style={styles.sub}>{project.name}</Text>
        {project.messages.map((message) => (
          <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.user : styles.wren]}>
            <Text style={[styles.bubbleText, message.role === 'user' && styles.userText]}>{message.text}</Text>
          </View>
        ))}
        {!project.planAwaiting && project.audience ? (
          <View style={styles.brief}>
            <Text style={styles.briefTitle}>Brief</Text>
            <Text style={styles.briefLine}>Audience · {project.audience || 'Not set'}</Text>
            <Text style={styles.briefLine}>Actions · {project.features.join('; ') || 'Not set'}</Text>
            {project.journeys.map((journey) => (
              <Text key={journey.name} style={styles.briefLine}>{journey.name}: {journey.steps.join(' → ')}</Text>
            ))}
            {project.stack.map((item) => (
              <Text key={item} style={styles.briefLine}>Stack · {item}</Text>
            ))}
            <Button label={project.briefSaved ? 'Brief saved' : 'Save brief'} disabled={project.briefSaved} onPress={() => saveBrief(project.id)} />
            <Button label="Generate screens" kind="secondary" onPress={() => { generateScreens(project.id); router.push(`/design/${project.id}`); }} />
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <Field value={text} onChangeText={setText} placeholder={project.planAwaiting === 'audience' ? 'Who is it for?' : project.planAwaiting === 'features' ? 'What must they do?' : 'Add to the brief'} />
        <Button
          label="Send"
          onPress={() => {
            sendPlanMessage(project.id, text);
            setText('');
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 8 },
  sub: { color: colors.textMuted, fontFamily: fonts.medium, marginBottom: 12 },
  bubble: { maxWidth: '88%', borderRadius: radius.lg, padding: 12, marginBottom: 8 },
  wren: { alignSelf: 'flex-start', backgroundColor: colors.card },
  user: { alignSelf: 'flex-end', backgroundColor: colors.lime },
  bubbleText: { color: colors.white, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  userText: { color: colors.ink },
  brief: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 8, marginTop: 8 },
  briefTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  briefLine: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  composer: { paddingHorizontal: 16, gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 },
});
