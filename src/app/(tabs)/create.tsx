import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button } from '../../components/ui';
import type { ProjectType } from '../../data/types';
import { typeMeta } from '../../lib/planner';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { colors, fonts, radius } from '../../theme/tokens';

const types: ProjectType[] = ['new-website', 'web-app', 'native-app', 'rebuild-website', 'rebuild-app', 'design-to-code', 'feature'];

export default function Create() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const [type, setType] = useState<ProjectType>('native-app');

  return (
    <ScrollView ref={ref} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }} contentInsetAdjustmentBehavior="automatic">
      <StudioHeader />
      <Text style={styles.title}>What should Wren build?</Text>
      <Text style={styles.sub}>Pick a starting point. You can add files, a voice note, and a brief before any screen is designed.</Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        {types.map((item) => {
          const meta = typeMeta(item);
          const on = item === type;
          return (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setType(item)} style={[styles.row, on && styles.rowOn]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{meta.title}</Text>
                <Text style={styles.rowDetail}>{meta.detail}</Text>
              </View>
              <View style={[styles.radio, on && styles.radioOn]} />
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: 16 }} />
      <Button
        label="Continue"
        onPress={() =>
          router.push({
            pathname: '/builder',
            params: { mode: type === 'feature' ? 'feature' : 'create', type },
          })
        }
      />
      <View style={{ height: 8 }} />
      <Button label="Open the start sheet" kind="secondary" onPress={() => router.push('/new-sheet')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 16 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginVertical: 10 },
  row: { minHeight: 72, borderRadius: radius.lg, backgroundColor: colors.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'transparent' },
  rowOn: { borderColor: colors.lime },
  rowTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  rowDetail: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.line },
  radioOn: { borderColor: colors.lime, backgroundColor: colors.lime },
});
