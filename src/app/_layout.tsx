import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from '../components/ui';
import { StoreProvider, useStore } from '../data/store';
import { colors } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const sheet = {
  headerShown: false,
  presentation: 'formSheet' as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.58, 0.92] as number[],
  sheetInitialDetentIndex: 0,
  contentStyle: { backgroundColor: colors.bg },
};

function Shell() {
  const { toast } = useStore();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="builder" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="voice-sheet" options={sheet} />
        <Stack.Screen name="new-sheet" options={{ ...sheet, sheetAllowedDetents: [0.72, 0.95] }} />
        <Stack.Screen name="google-sheet" options={{ ...sheet, sheetAllowedDetents: [0.52, 0.86] }} />
        <Stack.Screen name="delete-sheet" options={{ ...sheet, sheetAllowedDetents: [0.42, 0.7] }} />
        <Stack.Screen name="picker-sheet" options={{ ...sheet, sheetAllowedDetents: [0.5, 0.88] }} />
      </Stack>
      <Toast message={toast} />
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
