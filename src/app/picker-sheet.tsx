import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../data/store';
import { DATA_SOURCES, MODELS, TEMPLATES, modelMeta } from '../lib/planner';
import { colors, fonts, radius } from '../theme/tokens';

export default function PickerSheet() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const insets = useSafeAreaInsets();
  const { draft, patchDraft } = useStore();
  const title = kind === 'source' ? 'Data source' : kind === 'template' ? 'UI template' : 'AI model';
  const options =
    kind === 'source'
      ? DATA_SOURCES.map((item) => ({ id: item.id, label: item.label }))
      : kind === 'template'
        ? TEMPLATES.map((item) => ({ id: item.id, label: item.label }))
        : MODELS.map((item) => ({ id: item.id, label: item.label }));
  const selected = kind === 'source' ? draft?.dataSource : kind === 'template' ? draft?.template : draft?.aiModel;

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>{title}</Text>
      {kind !== 'source' && kind !== 'template' && modelMeta(selected || 'gpt-4o').remote ? (
        <Text style={styles.note}>This model isn’t connected. Wren will keep planning on this device.</Text>
      ) : null}
      {options.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="button"
          onPress={() => {
            if (kind === 'source') patchDraft({ dataSource: option.id });
            else if (kind === 'template') patchDraft({ template: option.id });
            else patchDraft({ aiModel: option.id });
            router.back();
          }}
          style={[styles.row, selected === option.id && styles.on]}
        >
          <Text style={styles.label}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 8 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 24, marginBottom: 8 },
  note: { color: '#F3E2A2', fontFamily: fonts.medium, fontSize: 13, marginBottom: 8 },
  row: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.card, justifyContent: 'center', paddingHorizontal: 14 },
  on: { borderWidth: 1, borderColor: colors.lime },
  label: { color: colors.white, fontFamily: fonts.medium, fontSize: 16 },
});
