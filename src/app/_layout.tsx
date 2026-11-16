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
import { CrmProvider, useCrm } from '../data/crm';
import { StoreProvider } from '../data/store';
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
  const { toast } = useCrm();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="verify-2fa" />
        <Stack.Screen name="prospect/[id]" />
        <Stack.Screen name="build/[id]" />
        <Stack.Screen name="follow-up-sheet" options={{ ...sheet, sheetAllowedDetents: [0.62, 0.92] }} />
        <Stack.Screen name="desk-options-sheet" options={{ ...sheet, sheetAllowedDetents: [0.72, 0.95] }} />
        <Stack.Screen name="pdf-sheet" options={{ ...sheet, sheetAllowedDetents: [0.7, 0.95] }} />
        <Stack.Screen name="role-sheet" options={{ ...sheet, sheetAllowedDetents: [0.55, 0.88] }} />
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
      <CrmProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </CrmProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
