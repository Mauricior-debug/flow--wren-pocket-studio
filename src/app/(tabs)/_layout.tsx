import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Platform } from 'react-native';
import { useCrm } from '../../data/crm';
import { colors, fonts } from '../../theme/tokens';

export default function TabLayout() {
  const { user, ready } = useCrm();
  if (ready && !user) return <Redirect href="/sign-in" />;

  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.lime,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.line,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Desk', tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={String(color)} size={size} /> }} />
        <Tabs.Screen name="job" options={{ title: 'Job', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={String(color)} size={size} /> }} />
        <Tabs.Screen name="builds" options={{ title: 'Builds', tabBarIcon: ({ color, size }) => <Ionicons name="construct" color={String(color)} size={size} /> }} />
        <Tabs.Screen name="prompts" options={{ title: 'Prompts', tabBarIcon: ({ color, size }) => <Ionicons name="color-palette" color={String(color)} size={size} /> }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={String(color)} size={size} /> }} />
        <Tabs.Screen name="projects" options={{ href: null }} />
        <Tabs.Screen name="create" options={{ href: null }} />
        <Tabs.Screen name="library" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <NativeTabs
      tintColor={colors.lime}
      backgroundColor={colors.bg}
      iconColor={{ default: colors.textMuted, selected: colors.lime }}
      labelStyle={{
        default: { color: colors.textMuted, fontSize: 11 },
        selected: { color: colors.lime, fontSize: 11 },
      }}
      blurEffect="systemChromeMaterialDark"
      minimizeBehavior="never"
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Desk</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="job">
        <NativeTabs.Trigger.Label>Job</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} md="chat" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="builds">
        <NativeTabs.Trigger.Label>Builds</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'hammer', selected: 'hammer.fill' }} md="build" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prompts">
        <NativeTabs.Trigger.Label>Prompts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'paintpalette', selected: 'paintpalette.fill' }} md="palette" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
