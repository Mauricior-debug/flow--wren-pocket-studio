import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, RecordingPresets } from 'expo-audio';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '../components/ui';
import { useStore } from '../data/store';
import { persistUpload } from '../lib/files';
import { colors, fonts } from '../theme/tokens';

export default function VoiceSheet() {
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { draft, patchDraft, startFromPrompt } = useStore();
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState<string | undefined>();
  const [transcript, setTranscript] = useState(draft?.voiceTranscript ?? '');
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (Platform.OS === 'web') {
      setError('Recording needs the phone. Type the idea instead.');
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone access is off. Type the idea instead.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
    setError(null);
  };

  const stop = async () => {
    if (!recording) return;
    await recorder.stop();
    setRecording(false);
    if (recorder.uri) {
      const stored = await persistUpload(recorder.uri, 'voice', 'note.m4a');
      setUri(stored);
    }
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Voice note</Text>
      <Text style={styles.body}>Hold to record. This device can’t turn speech into text, so type the idea as well if you want Wren to use the words.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : 'Hold to record'}
        onPressIn={start}
        onPressOut={stop}
        style={({ pressed }) => [styles.hold, (pressed || recording) && styles.holdOn]}
      >
        <Text style={styles.holdText}>{recording ? 'Listening…' : 'Hold to talk'}</Text>
      </Pressable>
      {uri ? <Text style={styles.saved}>Recording saved on this device.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Field label="What you said" value={transcript} onChangeText={setTranscript} placeholder="Type the idea" multiline />
      <Button
        label="Use this"
        onPress={() => {
          if (draft) {
            patchDraft({ voiceUri: uri, voiceTranscript: transcript, instructions: transcript || draft.instructions });
            router.back();
            return;
          }
          const id = startFromPrompt(transcript, { voiceUri: uri });
          if (!id) {
            setError('Type a few words so Wren has something to plan.');
            return;
          }
          router.dismiss();
          router.push(`/plan/${id}`);
        }}
      />
      <Button label="Close" kind="secondary" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 12 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 24, marginTop: 8 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  hold: { minHeight: 64, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  holdOn: { backgroundColor: colors.lime },
  holdText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  saved: { color: colors.lime, fontFamily: fonts.medium },
  error: { color: '#FFB4B4', fontFamily: fonts.medium },
});
