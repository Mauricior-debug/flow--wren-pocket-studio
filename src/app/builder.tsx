import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../components/chrome';
import { Banner, Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import type { ProjectType } from '../data/types';
import { DATA_SOURCES, modelMeta, MODELS, proposeScreens, sourceLabel, TEMPLATES, typeMeta } from '../lib/planner';
import { colors, fonts, radius } from '../theme/tokens';

const steps = ['App Basics', 'References', 'Audience', 'Screens', 'Review'];

export default function Builder() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; type?: string; projectId?: string }>();
  const { draft, setDraft, patchDraft, saveBuilder, projects, attachFiles } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mode = (params.mode === 'edit' || params.mode === 'feature' ? params.mode : 'create') as 'create' | 'edit' | 'feature';
  const signature = `${mode}:${params.type ?? ''}:${params.projectId ?? ''}`;
  const seen = useRef('');

  useEffect(() => {
    if (seen.current === signature) return;
    seen.current = signature;
    const existing = params.projectId ? projects.find((item) => item.id === params.projectId) : undefined;
    setDraft({
      mode,
      step: 1,
      projectId: params.projectId,
      type: (params.type as ProjectType) || existing?.type || 'new-website',
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      aiModel: existing?.aiModel ?? 'gpt-4o',
      dataSource: existing?.dataSource ?? 'none',
      template: existing?.template ?? 'Modern',
      instructions: existing?.instructions ?? '',
      sourceUrl: existing?.sourceUrl ?? '',
      audience: existing?.audience ?? '',
      features: existing?.features.join(', ') ?? '',
      files: existing?.files ?? [],
      screenNames: [],
    });
  }, [signature]);

  if (!draft) return <View style={styles.screen} />;

  const step = draft.step;
  const remote = modelMeta(draft.aiModel).remote;

  const next = async () => {
    setError(null);
    if (draft.mode === 'feature') {
      setSaving(true);
      const result = await saveBuilder();
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(`/project/${result.projectId}`);
      return;
    }
    if (step === 1 && draft.name.trim().length < 2) {
      setError('Give the app a name.');
      return;
    }
    if (step === 3 && draft.mode === 'create' && draft.audience.trim().length < 2) {
      setError('Say who this is for.');
      return;
    }
    if (step === 4 && draft.screenNames.length === 0) {
      const proposed = proposeScreens({
        type: draft.type,
        name: draft.name || 'App',
        audience: draft.audience,
        features: draft.features.split(',').map((part) => part.trim()).filter(Boolean),
        template: draft.template,
      });
      patchDraft({ screenNames: proposed.map((item) => item.name), step: 5 });
      return;
    }
    if (step < 5) {
      if (step === 3) {
        const proposed = proposeScreens({
          type: draft.type,
          name: draft.name || 'App',
          audience: draft.audience,
          features: draft.features.split(',').map((part) => part.trim()).filter(Boolean),
          template: draft.template,
        });
        patchDraft({ step: step + 1, screenNames: draft.screenNames.length ? draft.screenNames : proposed.map((item) => item.name) });
        return;
      }
      patchDraft({ step: step + 1 });
      return;
    }
    setSaving(true);
    const result = await saveBuilder();
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(`/project/${result.projectId}`);
  };

  const proposed = proposeScreens({
    type: draft.type,
    name: draft.name || 'App',
    audience: draft.audience,
    features: draft.features.split(',').map((part) => part.trim()).filter(Boolean),
    template: draft.template,
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <BackButton />
          <Text style={styles.header}>{draft.mode === 'edit' ? 'Edit app' : draft.mode === 'feature' ? 'Add a feature' : 'Build New App'}</Text>
          <View style={{ width: 44 }} />
        </View>
        {draft.mode !== 'feature' ? (
          <View style={styles.steps}>
            {steps.map((label, index) => {
              const number = index + 1;
              const on = number === step;
              const done = number < step;
              return (
                <View key={label} style={styles.stepWrap}>
                  <View style={[styles.step, (on || done) && styles.stepOn]}>
                    <Text style={[styles.stepText, (on || done) && styles.stepTextOn]}>{number}</Text>
                  </View>
                  {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
                </View>
              );
            })}
          </View>
        ) : null}
        <Text style={styles.stepTitle}>{draft.mode === 'feature' ? 'New feature' : `${step}. ${steps[step - 1]}`}</Text>
        <Text style={styles.stepSub}>
          {draft.mode === 'feature'
            ? 'This stays on the current project. Approved screens are not replaced.'
            : step === 1
              ? 'Give your app a name and tell us what it does.'
              : step === 2
                ? 'Add the references Wren should keep with the brief.'
                : step === 3
                  ? 'Who is it for, and what must they be able to do?'
                  : step === 4
                    ? 'Uncheck a screen if it does not belong.'
                    : 'Review the plan, then save it on this device.'}
        </Text>
        {remote && step === 1 ? <Banner>Remote model unavailable. Wren plans on this device and keeps the brief here.</Banner> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {draft.mode === 'feature' ? (
          <View style={{ gap: 12, marginTop: 12 }}>
            <Text style={styles.label}>Project</Text>
            {projects.map((project) => (
              <Pressable key={project.id} accessibilityRole="button" onPress={() => patchDraft({ projectId: project.id })} style={[styles.choice, draft.projectId === project.id && styles.choiceOn]}>
                <Text style={styles.choiceTitle}>{project.name}</Text>
              </Pressable>
            ))}
            {projects.length === 0 ? <Text style={styles.quiet}>Create a project before adding a feature.</Text> : null}
            <Field label="What should change?" value={draft.instructions} onChangeText={(instructions) => patchDraft({ instructions })} placeholder="Describe the feature" multiline style={{ minHeight: 80 }} />
          </View>
        ) : null}

        {draft.mode !== 'feature' && step === 1 ? (
          <View style={{ gap: 14, marginTop: 8 }}>
            <Field label="App name" value={draft.name} onChangeText={(name) => patchDraft({ name })} placeholder="e.g. Fitness Tracker" />
            <Field label="Description" value={draft.description} onChangeText={(description) => patchDraft({ description })} placeholder="Describe your app and what it should do..." multiline style={{ minHeight: 90 }} />
            <PickerRow label="AI model" value={MODELS.find((item) => item.id === draft.aiModel)?.label ?? draft.aiModel} onPress={() => router.push({ pathname: '/picker-sheet', params: { kind: 'model' } })} />
            <PickerRow label="Data source" value={sourceLabel(draft.dataSource)} onPress={() => router.push({ pathname: '/picker-sheet', params: { kind: 'source' } })} />
            <PickerRow label="UI template" value={draft.template} onPress={() => router.push({ pathname: '/picker-sheet', params: { kind: 'template' } })} />
          </View>
        ) : null}

        {draft.mode !== 'feature' && step === 2 ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Text style={styles.label}>Project type</Text>
            {(['new-website', 'web-app', 'native-app', 'rebuild-website', 'rebuild-app', 'design-to-code'] as ProjectType[]).map((type) => (
              <Pressable key={type} accessibilityRole="button" onPress={() => patchDraft({ type })} style={[styles.choice, draft.type === type && styles.choiceOn]}>
                <Text style={styles.choiceTitle}>{typeMeta(type).title}</Text>
                <Text style={styles.choiceDetail}>{typeMeta(type).detail}</Text>
              </Pressable>
            ))}
            <Field label="Instructions" value={draft.instructions} onChangeText={(instructions) => patchDraft({ instructions })} placeholder="What should Wren know?" multiline />
            <Field label="Existing website" value={draft.sourceUrl} onChangeText={(sourceUrl) => patchDraft({ sourceUrl })} placeholder="https://" autoCapitalize="none" />
            <Button
              label="Upload images"
              kind="secondary"
              icon="image-outline"
              onPress={async () => {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                  setError('Photo access is off.');
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
                if (result.canceled) return;
                await attachFiles(
                  'draft',
                  undefined,
                  result.assets.map((asset) => ({ uri: asset.uri, name: asset.fileName || 'image.jpg', mime: asset.mimeType || 'image/jpeg', size: asset.fileSize })),
                );
              }}
            />
            <Button
              label="Upload a document or ZIP"
              kind="secondary"
              icon="document-outline"
              onPress={async () => {
                const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: true });
                if (result.canceled) return;
                await attachFiles(
                  'draft',
                  undefined,
                  result.assets.map((asset) => ({ uri: asset.uri, name: asset.name, mime: asset.mimeType || 'application/octet-stream', size: asset.size })),
                );
              }}
            />
            <Button label="Add a voice note" kind="secondary" icon="mic-outline" onPress={() => router.push('/voice-sheet')} />
            {draft.files.map((file) => (
              <Text key={file.id} style={styles.file}>
                {file.name}
              </Text>
            ))}
            {draft.voiceTranscript ? <Text style={styles.file}>Voice: {draft.voiceTranscript}</Text> : null}
          </View>
        ) : null}

        {draft.mode !== 'feature' && step === 3 ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Field label="Who is this for?" value={draft.audience} onChangeText={(audience) => patchDraft({ audience })} placeholder="The people who will use it" />
            <Field label="What must they be able to do?" value={draft.features} onChangeText={(features) => patchDraft({ features })} placeholder="Separate actions with commas" multiline />
          </View>
        ) : null}

        {draft.mode !== 'feature' && step === 4 ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            {proposed.map((screen) => {
              const on = draft.screenNames.includes(screen.name);
              return (
                <Pressable
                  key={screen.name}
                  accessibilityRole="button"
                  onPress={() =>
                    patchDraft({
                      screenNames: on ? draft.screenNames.filter((name) => name !== screen.name) : [...draft.screenNames, screen.name],
                    })
                  }
                  style={[styles.choice, on && styles.choiceOn]}
                >
                  <Text style={styles.choiceTitle}>{screen.name}</Text>
                  <Text style={styles.choiceDetail}>{screen.purpose}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {draft.mode !== 'feature' && step === 5 ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text style={styles.review}>{draft.name}</Text>
            <Text style={styles.choiceDetail}>{typeMeta(draft.type).title} · {draft.template} · {sourceLabel(draft.dataSource)}</Text>
            <Text style={styles.choiceDetail}>For {draft.audience || 'an audience you still need to name'}.</Text>
            <Text style={styles.choiceDetail}>{draft.screenNames.length} screens will be drafted as pending approval.</Text>
            {draft.mode === 'edit' ? <Banner>Saving keeps screens you already approved.</Banner> : null}
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Cancel" kind="secondary" flex={1} onPress={() => router.back()} />
        <Button label={step === 5 || draft.mode === 'feature' ? 'Save' : 'Continue  →'} flex={1.3} onPress={next} loading={saving} />
      </View>
    </View>
  );
}

function PickerRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.picker}>
        <Text style={styles.pickerText}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  header: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  steps: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 18 },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  step: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  stepOn: { backgroundColor: colors.lime },
  stepText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  stepTextOn: { color: colors.ink },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.line, marginHorizontal: 4 },
  stepTitle: { color: colors.white, fontFamily: fonts.extra, fontSize: 26 },
  stepSub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginTop: 6, marginBottom: 12 },
  label: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 14, marginBottom: 8 },
  picker: { minHeight: 56, borderRadius: radius.md, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { color: colors.white, fontFamily: fonts.medium, fontSize: 16 },
  choice: { borderRadius: radius.md, backgroundColor: colors.card, padding: 14, borderWidth: 1, borderColor: 'transparent' },
  choiceOn: { borderColor: colors.lime },
  choiceTitle: { color: colors.white, fontFamily: fonts.semibold, fontSize: 16 },
  choiceDetail: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 18 },
  file: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 14 },
  quiet: { color: colors.textMuted, fontFamily: fonts.regular },
  review: { color: colors.white, fontFamily: fonts.bold, fontSize: 22 },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, marginVertical: 8 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
});
