import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '../components/chrome';
import { Button } from '../components/ui';
import { useCrm } from '../data/crm';
import { images } from '../theme/images';
import { colors, fonts, radius } from '../theme/tokens';

const slides = [
  {
    title: 'Wren’s desk on your phone',
    body: 'The same FlowTrack Wren who scouts, plans, designs, and cooks builds — now in your pocket.',
    image: images.onboarding,
  },
  {
    title: 'Live prospects and builds',
    body: 'Open the pipeline, run mission tasks, watch active Cursor builds, and grab Expo Go links when a native job is ready.',
    image: images.hero,
  },
  {
    title: 'Give Wren the job',
    body: 'Chat the brief, attach files, plan every screen, design the icon, then cook — just like the website desk.',
    image: images.astronaut,
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useCrm();
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const finish = async () => {
    await setOnboarded(true);
    router.replace('/sign-in');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Wordmark />
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>
      <Image source={slide.image} style={styles.hero} contentFit="contain" />
      <View style={styles.dots}>
        {slides.map((item, i) => (
          <View key={item.title} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
      <Button
        label={index === slides.length - 1 ? 'Sign in to FlowTrack' : 'Continue  →'}
        onPress={() => {
          if (index === slides.length - 1) finish();
          else setIndex((value) => value + 1);
        }}
      />
      <Pressable accessibilityRole="button" onPress={finish} style={styles.skip}>
        <Text style={styles.skipText}>I already have an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 28, lineHeight: 38 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, marginTop: 12 },
  hero: { width: '100%', height: 280, marginTop: 18 },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 28, backgroundColor: colors.lime, borderRadius: radius.pill },
  skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  skipText: { color: colors.lime, fontFamily: fonts.semibold },
});
