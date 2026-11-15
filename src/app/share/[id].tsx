import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button } from '../../components/ui';
import { useStore } from '../../data/store';
import { shareLink } from '../../lib/format';
import { colors, fonts, radius } from '../../theme/tokens';

export default function ShareDeploy() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { projects, requestDeploy, deployments } = useStore();
  const project = projects.find((item) => item.id === id);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!project) return null;
  const link = deployments.find((item) => item.projectId === project.id)?.link || shareLink(project.name);
  const embed = `<iframe src="${link}" title="${project.name}"></iframe>`;

  const copy = async (value: string, which: 'link' | 'code') => {
    await Clipboard.setStringAsync(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}>
      <StudioHeader back />
      <View style={styles.titleRow}>
        <Ionicons name="share-social-outline" size={22} color={colors.white} />
        <Text style={styles.title}>Share & Deploy</Text>
      </View>
      <Text style={styles.sub}>Get a link ready. A deployment stays pending until a build is verified.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Share link</Text>
        <Text style={styles.cardBody}>Anyone you send this to can see the address. It is not a verified live site.</Text>
        <View style={styles.linkRow}>
          <Text style={styles.link} numberOfLines={1}>{link}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Copy link" onPress={() => copy(link, 'link')} style={styles.iconBtn}>
            <Ionicons name="copy-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <Button label={copied === 'link' ? 'Copied' : 'Copy Link'} kind="secondary" flex={1} icon="copy-outline" onPress={() => copy(link, 'link')} />
          <Button
            label="Share"
            kind="secondary"
            flex={1}
            icon="share-outline"
            onPress={() => Share.share({ message: `${project.name} ${link}`, url: link })}
          />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Embed code</Text>
        <Text style={styles.cardBody}>Add this code to a website you control.</Text>
        <View style={styles.linkRow}>
          <Text style={styles.link} numberOfLines={1}>{embed}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Copy embed code" onPress={() => copy(embed, 'code')} style={styles.iconBtn}>
            <Ionicons name="copy-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
        <Button label={copied === 'code' ? 'Copied' : 'Copy Code'} kind="secondary" icon="copy-outline" onPress={() => copy(embed, 'code')} />
      </View>
      <Text style={styles.section}>Request a deployment</Text>
      {(['web', 'app-store', 'play'] as const).map((platform) => (
        <Button
          key={platform}
          label={platform === 'web' ? 'Web' : platform === 'app-store' ? 'App Store' : 'Google Play'}
          kind="secondary"
          onPress={() => {
            requestDeploy(project.id, platform);
            setMessage('Requested. Status stays pending until a build is verified.');
          }}
        />
      ))}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button label="Back to project" kind="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 30 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginVertical: 8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 10, marginBottom: 12 },
  cardTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  cardBody: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  linkRow: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  link: { flex: 1, color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  section: { color: colors.white, fontFamily: fonts.bold, fontSize: 18, marginBottom: 8 },
  message: { color: colors.lime, fontFamily: fonts.medium, marginTop: 8 },
});
