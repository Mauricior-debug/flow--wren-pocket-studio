import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { colors, fonts } from '../theme/tokens';

export default function Terms() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}>
      <StudioHeader back />
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.body}>Wren Pocket Studio helps you turn an idea into a brief, a set of screens, and a development job that stays on this device until a remote agent is connected.</Text>
      <Text style={styles.body}>You keep the projects you create. Don’t upload material you don’t have the right to use.</Text>
      <Text style={styles.body}>A screen, a build, or a deployment is not finished just because the app shows progress. Wren will not call a build successful until it has been verified.</Text>
      <Text style={styles.body}>Remote models and coding agents are optional. If they are not connected, planning continues on this device and the job stays queued.</Text>
      <Text style={styles.body}>The studio is provided as software on your phone. You can export or delete your account from Privacy & Data.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginVertical: 12 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginBottom: 14 },
});
