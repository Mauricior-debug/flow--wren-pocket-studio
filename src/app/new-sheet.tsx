import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProjectType } from '../data/types';
import { colors, fonts, radius } from '../theme/tokens';

const starts: { title: string; detail: string; type: ProjectType; mode: 'create' | 'feature' }[] = [
  { title: 'New Build', detail: 'From an idea', type: 'new-website', mode: 'create' },
  { title: 'Rebuild', detail: 'Improve an existing site', type: 'rebuild-website', mode: 'create' },
  { title: 'Design to Code', detail: 'Turn designs into a working app', type: 'design-to-code', mode: 'create' },
  { title: 'Add Feature', detail: 'Update a project you already have', type: 'feature', mode: 'feature' },
];

export default function NewSheet() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Start something</Text>
      <Text style={styles.body}>Drag this sheet. It follows your finger, then settles.</Text>
      {starts.map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          onPress={() => {
            router.dismiss();
            router.push({ pathname: '/builder', params: { mode: item.mode, type: item.type } });
          }}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowDetail}>{item.detail}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 10 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 26, marginTop: 8 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15 },
  row: { minHeight: 64, borderRadius: radius.lg, backgroundColor: colors.card, padding: 14, justifyContent: 'center' },
  rowTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
  rowDetail: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
});
