import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../components/chrome';
import { Banner } from '../components/ui';
import { useStore } from '../data/store';
import { MODELS, TEMPLATES, modelMeta } from '../lib/planner';
import { colors, fonts, radius } from '../theme/tokens';

export default function AppPreferences() {
  const insets = useSafeAreaInsets();
  const { user, updatePreferences } = useStore();
  const prefs = user?.preferences;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>
      <StudioHeader back />
      <Text style={styles.title}>App Preferences</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Haptics when something finishes</Text>
        <Switch accessibilityLabel="Haptics" value={prefs?.haptics !== false} onValueChange={(haptics) => updatePreferences({ haptics })} trackColor={{ false: '#243140', true: colors.lime }} thumbColor={colors.white} />
      </View>
      <Text style={styles.section}>Default model</Text>
      {modelMeta(prefs?.defaultModel || 'gpt-4o').remote ? <Banner>The selected remote model is not connected. Planning still runs on this device.</Banner> : null}
      {MODELS.map((model) => (
        <Pressable key={model.id} accessibilityRole="button" onPress={() => updatePreferences({ defaultModel: model.id })} style={[styles.choice, prefs?.defaultModel === model.id && styles.on]}>
          <Text style={styles.choiceText}>{model.label}</Text>
        </Pressable>
      ))}
      <Text style={styles.section}>Default template</Text>
      <View style={styles.wrap}>
        {TEMPLATES.map((template) => (
          <Pressable key={template.id} accessibilityRole="button" onPress={() => updatePreferences({ defaultTemplate: template.id })} style={[styles.chip, prefs?.defaultTemplate === template.id && styles.chipOn]}>
            <Text style={[styles.chipText, prefs?.defaultTemplate === template.id && styles.chipTextOn]}>{template.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { color: colors.white, fontFamily: fonts.medium, fontSize: 16, flex: 1 },
  section: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginTop: 8 },
  choice: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.card, justifyContent: 'center', paddingHorizontal: 14 },
  on: { borderWidth: 1, borderColor: colors.lime },
  choiceText: { color: colors.white, fontFamily: fonts.medium, fontSize: 15 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.ink },
});
