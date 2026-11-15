import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '../components/chrome';
import { Button } from '../components/ui';
import { useStore } from '../data/store';
import { images } from '../theme/images';
import { colors, fonts } from '../theme/tokens';

const slides = [
  {
    key: 'ideas',
    title: 'Turn your ideas\ninto powerful apps',
    lime: 'powerful apps',
    body: 'Build websites, web apps and mobile apps with the power of AI. No coding required.',
    art: true,
  },
  {
    key: 'describe',
    title: 'Describe it\nyour way',
    lime: 'your way',
    body: 'Write it, say it, or attach a picture, a PDF, a website, or a zip of source. Wren keeps all of it with the project.',
  },
  {
    key: 'approve',
    title: 'Approve the design\nbefore it’s built',
    lime: 'before it’s built',
    body: 'Wren drafts every screen. You approve, reject, or ask for a change. Approved screens stay until you change them.',
  },
  {
    key: 'journey',
    title: 'One companion\nfor the whole job',
    lime: 'whole job',
    body: 'The brief, the screens, and the remote coding job stay together. A build is not called done until it is verified.',
  },
  {
    key: 'consent',
    title: 'Your workspace\nstays on this device',
    lime: 'on this device',
    body: 'Account, projects, and uploads are stored on this phone. Continuing means you agree to the Terms and the Privacy Policy.',
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);
  const [analytics, setAnalytics] = useState(false);
  const { completeOnboarding } = useStore();

  const finish = (href: '/sign-up' | '/sign-in') => {
    completeOnboarding(analytics);
    router.replace(href);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.brand}>
        <Wordmark />
      </View>
      <FlatList
        ref={list}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 24 }}>
            <Text style={styles.title}>
              {item.title.replace(item.lime, '')}
              <Text style={styles.lime}>{item.lime}</Text>
            </Text>
            <Text style={styles.body}>{item.body}</Text>
            {item.art ? (
              <Image source={images.onboarding} style={styles.art} contentFit="contain" accessibilityLabel="Two phones showing an idea becoming a live app" />
            ) : item.key === 'consent' ? (
              <Image source={images.astronaut} style={styles.astro} contentFit="contain" accessibilityLabel="Wren" />
            ) : (
              <View style={styles.spacer} />
            )}
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((slide, dot) => (
          <View key={slide.key} style={[styles.dot, dot === index && styles.dotOn]} />
        ))}
      </View>
      {index === slides.length - 1 ? (
        <View style={styles.consent}>
          <View style={styles.consentRow}>
            <Text style={styles.consentText}>Keep basic usage on this device so the workspace can show what you did.</Text>
            <Switch
              accessibilityLabel="Usage stored on this device"
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{ false: '#243140', true: colors.lime }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      ) : null}
      <View style={styles.footer}>
        <Button label="Get Started  →" onPress={() => finish('/sign-up')} />
        <Pressable accessibilityRole="button" onPress={() => finish('/sign-in')} style={styles.linkBtn}>
          <Text style={styles.link}>I already have an account</Text>
        </Pressable>
        <Text style={styles.legal}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  brand: { paddingHorizontal: 24, marginBottom: 8 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  lime: { color: colors.lime },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginTop: 12 },
  art: { width: '100%', height: 280, marginTop: 12 },
  astro: { width: '100%', height: 240, marginTop: 8 },
  spacer: { height: 40 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2C3A4C' },
  dotOn: { width: 22, backgroundColor: colors.lime },
  consent: { paddingHorizontal: 24, marginBottom: 8 },
  consentRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  consentText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  footer: { paddingHorizontal: 24, gap: 8 },
  linkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: colors.lime, fontFamily: fonts.semibold, fontSize: 15 },
  legal: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  legalLink: { color: colors.link, textDecorationLine: 'underline' },
});
