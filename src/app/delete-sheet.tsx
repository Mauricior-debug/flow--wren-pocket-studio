import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { useStore } from '../data/store';
import { colors, fonts } from '../theme/tokens';

export default function DeleteSheet() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();
  const { projects, deleteProject } = useStore();
  const project = projects.find((item) => item.id === projectId);

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Delete {project?.name ?? 'this project'}?</Text>
      <Text style={styles.body}>This removes the project, its screens, and its jobs from this device. It does not touch a remote repository.</Text>
      <Button
        label="Delete"
        kind="danger"
        onPress={() => {
          if (projectId) deleteProject(projectId);
          router.dismissAll();
          router.replace('/(tabs)');
        }}
      />
      <Button label="Cancel" kind="secondary" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 12 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 24, marginTop: 8 },
  body: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
});
