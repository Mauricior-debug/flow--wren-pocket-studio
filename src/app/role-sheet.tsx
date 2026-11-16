import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JOB_FILE_ROLES } from '../lib/wrenConstants';
import { colors, fonts, radius } from '../theme/tokens';

/** Role picker helper — Job screen also applies roles via quick chips. */
export default function RoleSheet() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fileId?: string; role?: string }>();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}>
      <Text style={styles.title}>File role</Text>
      <Text style={styles.sub}>Pick the role Wren should treat this attachment as. Apply it with the chips under Attachments on the Job tab for the latest file.</Text>
      {JOB_FILE_ROLES.map((role) => {
        const on = params.role === role.id;
        return (
          <Pressable key={role.id} onPress={() => router.back()} style={[styles.row, on && styles.rowOn]}>
            <Text style={styles.label}>{role.label}</Text>
            <Text style={styles.id}>{role.id}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 28 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginVertical: 10 },
  row: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  rowOn: { borderColor: colors.lime },
  label: { color: colors.white, fontFamily: fonts.semibold, fontSize: 16 },
  id: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
});
