import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export async function hapticSuccess(enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics are optional. A missing motor should not block the action.
  }
}

export async function hapticWarning(enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Ignore.
  }
}
