import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { colors, fonts } from '../theme/tokens';

export default function Privacy() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}>
      <StudioHeader back />
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.kicker}>Draft for Wren Pocket Studio. The public URL placeholder is https://wren.studio/privacy.</Text>
      <Text style={styles.h}>What is stored</Text>
      <Text style={styles.body}>Your name, email, a password hash, profile photo, project briefs, screen approvals, uploads, voice notes, and in-app notifications. They stay on this device.</Text>
      <Text style={styles.h}>What the phone can access</Text>
      <Text style={styles.body}>Photos and the camera, only when you add a profile photo or a reference. The microphone, only when you record a voice note. Wren does not ask for location, tracking, or push notifications.</Text>
      <Text style={styles.h}>What is not done</Text>
      <Text style={styles.body}>Provider keys are not stored in the app. There is no advertising and no sale of personal information. Usage notes, if you turn them on, stay on the device.</Text>
      <Text style={styles.h}>Your choices</Text>
      <Text style={styles.body}>You can export a copy of your data, clear notifications, or delete the account from Privacy & Data. Deleting removes the account and its projects from this device.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  kicker: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, marginVertical: 10 },
  h: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginTop: 12, marginBottom: 6 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
});
