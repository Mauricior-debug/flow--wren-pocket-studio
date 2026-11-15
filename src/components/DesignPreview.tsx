import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

const themes = {
  Modern: { bg: '#101820', ink: '#FFFFFF', mute: '#93A3B8', accent: colors.lime, card: '#1A2433' },
  Bold: { bg: '#140A18', ink: '#FFFFFF', mute: '#C4B4D4', accent: colors.amber, card: '#2A1430' },
  Soft: { bg: '#F6F1E8', ink: '#1C1915', mute: '#6B645C', accent: '#111111', card: '#FFFFFF' },
  Minimal: { bg: '#0E1114', ink: '#F4F4F4', mute: '#9AA1A8', accent: '#F4F4F4', card: '#171B20' },
};

export function DesignPreview({
  name,
  template,
  blocks,
  compact,
}: {
  name: string;
  template: string;
  blocks: string[];
  compact?: boolean;
}) {
  const theme = themes[template as keyof typeof themes] ?? themes.Modern;
  return (
    <View style={[styles.phone, { backgroundColor: theme.bg }, compact && styles.compact]}>
      <View style={styles.status}>
        <View style={[styles.notch, { backgroundColor: theme.card }]} />
      </View>
      <Text style={[styles.name, { color: theme.ink }]} numberOfLines={1}>
        {name}
      </Text>
      {blocks.map((block, index) => (
        <Block key={`${block}-${index}`} kind={block} theme={theme} />
      ))}
    </View>
  );
}

function Block({
  kind,
  theme,
}: {
  kind: string;
  theme: { bg: string; ink: string; mute: string; accent: string; card: string };
}) {
  if (kind === 'hero') {
    return (
      <View style={[styles.hero, { backgroundColor: theme.card }]}>
        <View style={[styles.heroMark, { backgroundColor: theme.accent }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.line, { backgroundColor: theme.ink, width: '80%' }]} />
          <View style={[styles.line, { backgroundColor: theme.mute, width: '55%', opacity: 0.6 }]} />
        </View>
      </View>
    );
  }
  if (kind === 'search') {
    return <View style={[styles.search, { borderColor: theme.accent }]} />;
  }
  if (kind === 'stats') {
    return (
      <View style={styles.stats}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={[styles.stat, { backgroundColor: theme.card }]} />
        ))}
      </View>
    );
  }
  if (kind === 'form') {
    return (
      <View style={{ gap: 8 }}>
        <View style={[styles.input, { backgroundColor: theme.card }]} />
        <View style={[styles.input, { backgroundColor: theme.card }]} />
      </View>
    );
  }
  if (kind === 'actions') {
    return (
      <View style={[styles.action, { backgroundColor: theme.accent }]}>
        <Text style={[styles.actionText, { color: theme.bg }]}>Continue</Text>
      </View>
    );
  }
  if (kind === 'chart') {
    return (
      <View style={[styles.chart, { backgroundColor: theme.card }]}>
        {[40, 70, 50, 90].map((height, index) => (
          <View key={index} style={{ width: 14, height, borderRadius: 4, backgroundColor: theme.accent }} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.row, { backgroundColor: theme.card }]}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <View style={[styles.line, { backgroundColor: theme.mute, flex: 1, opacity: 0.7 }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  phone: {
    borderRadius: 28,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 280,
  },
  compact: { minHeight: 220, padding: 12 },
  status: { alignItems: 'center' },
  notch: { width: 72, height: 8, borderRadius: 8 },
  name: { fontFamily: fonts.bold, fontSize: 18 },
  hero: { height: 72, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  heroMark: { width: 36, height: 36, borderRadius: 10 },
  line: { height: 8, borderRadius: 6 },
  search: { height: 36, borderRadius: 18, borderWidth: 1.5 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, height: 48, borderRadius: 12 },
  input: { height: 36, borderRadius: 10 },
  action: { height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.bold, fontSize: 13 },
  chart: { height: 110, borderRadius: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', padding: 12 },
  row: { height: 36, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
