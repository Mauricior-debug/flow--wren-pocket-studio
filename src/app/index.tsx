import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { useCrm } from '../data/crm';
import { images } from '../theme/images';
import { colors, fonts } from '../theme/tokens';

export default function Splash() {
  const { ready, error, user, onboarded, refreshSession } = useCrm();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0.08);
  const [hold, setHold] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((value) => (value >= 0.92 ? 0.92 : value + 0.08));
    }, 120);
    const done = setTimeout(() => setHold(false), 900);
    return () => {
      clearInterval(timer);
      clearTimeout(done);
    };
  }, []);

  if (!hold && ready && !error) {
    if (!onboarded) return <Redirect href="/onboarding" />;
    if (!user) return <Redirect href="/sign-in" />;
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
      <Image source={images.icon} style={styles.mark} contentFit="contain" accessibilityLabel="Wren Studio" />
      <Text style={styles.title}>
        Wren <Text style={styles.lime}>Studio</Text>
      </Text>
      <Text style={styles.tag}>Pocket desk for FlowTrack Wren</Text>
      <Image source={images.astronaut} style={styles.hero} contentFit="contain" accessibilityLabel="Wren astronaut" />
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn’t restore the session</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Button label="Try again" onPress={refreshSession} />
        </View>
      ) : (
        <View style={styles.loading}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.loadingText}>Opening Wren’s desk…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  mark: { width: 92, height: 92, marginTop: 12 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 40, marginTop: 8 },
  lime: { color: colors.lime },
  tag: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 16, marginTop: 4 },
  hero: { width: 320, height: 280, marginTop: 12 },
  loading: { marginTop: 'auto', width: '78%', gap: 14, alignItems: 'center' },
  track: { height: 8, width: '100%', borderRadius: 99, backgroundColor: '#243140', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.lime, borderRadius: 99 },
  loadingText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 15 },
  errorBox: { marginTop: 'auto', width: '100%', paddingHorizontal: 24, gap: 12 },
  errorTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 22 },
  errorBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
