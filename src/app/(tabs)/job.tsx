import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, Field } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { uploadWrenFile } from '../../lib/upload';
import { acceptSuggestion, appendStoreReady, JOB_FILE_ROLES, planText, WREN_STACKS, type WrenStack } from '../../lib/wrenConstants';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { colors, fonts, radius } from '../../theme/tokens';

type ChatMsg = {
  id: string;
  who: 'you' | 'wren';
  text: string;
  kept?: string[];
  changed?: string[];
  before?: string;
  after?: string;
};

export default function JobScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  useTabScrollToTop(scrollRef);
  const { employee, wrenPrompt, cookJob, showToast } = useCrm();
  const employeeId = employee?._id || employee?.id;

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brief, setBrief] = useState('');
  const [stack, setStack] = useState<WrenStack>('auto');
  const [storeReady, setStoreReady] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [talking, setTalking] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [designing, setDesigning] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);
  const [pendingBrief, setPendingBrief] = useState<{ before: string; after: string; kept: string[]; changed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deskList, setDeskList] = useState<any[] | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [selectedScreen, setSelectedScreen] = useState('Home');

  const isNative = stack === 'react-native' || (stack === 'auto' && /native|expo|ios|android/i.test(brief));
  const stackLabel = WREN_STACKS.find((item) => item.id === stack)?.label || 'Auto';

  const plannedText = useMemo(
    () =>
      appendStoreReady(planText(plan, { web: !isNative }), {
        enabled: isNative && storeReady,
        appName: brief.split('\n')[0]?.slice(0, 60) || 'this app',
        hasIcon: files.some((file) => file.role === 'app_icon' && file.url),
      }),
    [plan, isNative, storeReady, brief, files],
  );

  const screens = files.filter((file) => file.role === 'screen_design' && file.url);
  const icon = files.find((file) => file.role === 'app_icon' && file.url);

  const ensureEmployee = () => {
    if (!employeeId) {
      setError('Wren was not found on this account.');
      return false;
    }
    return true;
  };

  const attachPicker = async (source: 'image' | 'document') => {
    if (!ensureEmployee()) return;
    setUploading(true);
    setError(null);
    try {
      let picked: { uri: string; name: string; mimeType?: string; size?: number } | null = null;
      if (source === 'image') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Photo access is off.');
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
        if (result.canceled) return;
        const asset = result.assets[0];
        picked = { uri: asset.uri, name: asset.fileName || 'image.jpg', mimeType: asset.mimeType || 'image/jpeg', size: asset.fileSize };
      } else {
        const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
        if (result.canceled) return;
        const asset = result.assets[0];
        picked = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream', size: asset.size };
      }
      if (!picked) return;
      const asset = await uploadWrenFile(employeeId, picked);
      setFiles((current) => [...current, { ...asset, role: asset.role || 'reference' }].slice(0, 40));
      showToast(`Attached ${picked.name}`);
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const setRole = (id: string, role: string) => {
    setFiles((current) => current.map((file) => (file.id === id || file.url === id ? { ...file, role } : file)));
  };

  const talk = async () => {
    if (!ensureEmployee() || !chatInput.trim() || talking) return;
    const message = chatInput.trim();
    setChatInput('');
    setTalking(true);
    setError(null);
    const prior = messages;
    setMessages((current) => [...current, { id: `y-${Date.now()}`, who: 'you', text: message }]);
    try {
      const body = await wrenPrompt({
        action: 'talk',
        message,
        brief,
        web: !isNative,
        stackLabel,
        history: prior.slice(-8).map((row) => ({ role: row.who === 'wren' ? 'assistant' : 'user', content: row.text })),
        files: files
          .filter((file) => file.role !== 'screen_design')
          .slice(0, 8)
          .map((file) => ({ name: file.name, text: String(file.text || '').slice(0, 1800) })),
      });
      const nextBrief = String(body.brief || '').trim();
      const rewritten = Boolean(nextBrief && nextBrief !== brief.trim());
      setMessages((current) => [
        ...current,
        {
          id: `w-${Date.now()}`,
          who: 'wren',
          text: body.reply || '…',
          kept: body.kept || [],
          changed: body.changed || [],
          ...(rewritten ? { before: brief, after: nextBrief } : {}),
        },
      ]);
      if (rewritten) setPendingBrief({ before: brief, after: nextBrief, kept: body.kept || [], changed: body.changed || [] });
    } catch (err: any) {
      setError(err?.message || 'Wren did not answer.');
    } finally {
      setTalking(false);
    }
  };

  const runPlan = async () => {
    if (!ensureEmployee()) return;
    setPlanning(true);
    setError(null);
    try {
      const material = [websiteUrl.trim(), brief.trim(), ...files.filter((f) => f.text).map((f) => String(f.text).slice(0, 2000))].filter(Boolean).join('\n\n');
      const body = await wrenPrompt({
        action: 'plan',
        brief: material || brief,
        web: !isNative,
        stackLabel,
        files: files
          .filter((f) => f.text)
          .map((f) => `${f.name}: ${String(f.text).slice(0, 500)}`)
          .join('\n'),
      });
      setPlan(body.plan || null);
      showToast('Plan ready.');
    } catch (err: any) {
      setError(err?.message || 'Planning failed.');
    } finally {
      setPlanning(false);
    }
  };

  const designBoard = async () => {
    if (!ensureEmployee() || !plan?.screens?.length) {
      setError('Plan screens first.');
      return;
    }
    setDesigning(true);
    setError(null);
    try {
      const names = plan.screens.map((screen: any) => screen.name);
      const body = await wrenPrompt({
        action: 'board',
        screens: names,
        app: brief.split('\n')[0]?.slice(0, 40) || 'App',
        brief: [plannedText, brief].filter(Boolean).join('\n\n'),
        format: isNative ? 'phone' : 'desktop',
        brandUrls: files.filter((f) => f.role === 'logo' || f.role === 'brand_guidelines').map((f) => f.url).filter(Boolean),
      });
      const assets = Array.isArray(body.assets) ? body.assets : body.board ? [body.board] : [];
      setFiles((current) => [...current, ...assets.map((asset: any) => ({ ...asset, role: asset.role || 'screen_design' }))].slice(0, 40));
      if (isNative) {
        const iconBody = await wrenPrompt({
          action: 'icon',
          app: brief.split('\n')[0]?.slice(0, 40) || 'App',
          brief: [plannedText, brief].filter(Boolean).join('\n\n'),
          brandUrls: files.filter((f) => f.role === 'logo').map((f) => f.url).filter(Boolean),
        });
        if (iconBody.asset) setFiles((current) => [...current.filter((f) => f.role !== 'app_icon'), { ...iconBody.asset, role: 'app_icon' }]);
      }
      showToast('Designs ready.');
    } catch (err: any) {
      setError(err?.message || 'Design failed.');
    } finally {
      setDesigning(false);
    }
  };

  const redrawScreen = async () => {
    if (!ensureEmployee()) return;
    setDesigning(true);
    setError(null);
    try {
      const body = await wrenPrompt({
        action: 'screen',
        screen: selectedScreen || 'Home',
        change: changeNote,
        app: brief.split('\n')[0]?.slice(0, 40) || 'App',
        brief: [plannedText, brief].filter(Boolean).join('\n\n'),
        format: isNative ? 'phone' : 'desktop',
        sourceUrl: screens.find((s) => s.screen === selectedScreen)?.url,
      });
      if (body.asset) {
        setFiles((current) => {
          const without = current.filter((file) => !(file.role === 'screen_design' && file.screen === body.asset.screen));
          return [...without, { ...body.asset, role: 'screen_design' }];
        });
      }
      setChangeNote('');
      showToast('Screen redrawn.');
    } catch (err: any) {
      setError(err?.message || 'Could not redraw the screen.');
    } finally {
      setDesigning(false);
    }
  };

  const loadDesks = async () => {
    if (!ensureEmployee()) return;
    try {
      const body = await wrenPrompt({ action: 'desks' });
      setDeskList(Array.isArray(body.desks) ? body.desks : []);
    } catch (err: any) {
      setError(err?.message || 'Could not load desks.');
    }
  };

  const importDesk = async (deskId: string) => {
    if (!ensureEmployee()) return;
    try {
      const body = await wrenPrompt({ action: 'import_desk', deskId });
      if (body.brief) setBrief((current) => (current ? `${current}\n\n${body.brief}` : body.brief));
      if (Array.isArray(body.assets)) setFiles((current) => [...current, ...body.assets].slice(0, 40));
      showToast('Desk imported.');
      setDeskList(null);
    } catch (err: any) {
      setError(err?.message || 'Import failed.');
    }
  };

  const cook = async () => {
    if (!ensureEmployee()) return;
    if (!brief.trim() && !websiteUrl.trim() && !files.length) {
      setError('Add a brief, a website, or files before cooking.');
      return;
    }
    setCooking(true);
    setError(null);
    const result = await cookJob({
      websiteUrl: websiteUrl.trim() || undefined,
      buildRequest: [brief.trim(), plannedText].filter(Boolean).join('\n\n'),
      jobFiles: files,
      stack: stack === 'auto' ? undefined : stack,
    });
    setCooking(false);
    if (!result.ok) {
      setError(result.error || 'Cook failed.');
      return;
    }
    router.navigate('/(tabs)/builds');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <StudioHeader />
        <Text style={styles.title}>Give Wren the job</Text>
        <Text style={styles.sub}>Chat, attach files, plan screens, design, then cook — same flow as the website desk.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Field label="Website URL" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" placeholder="https://" />
        <View style={{ height: 10 }} />
        <Field label="Brief" value={brief} onChangeText={setBrief} multiline placeholder="What should Wren build?" style={{ minHeight: 110 }} />

        <Text style={styles.label}>Stack</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {WREN_STACKS.map((item) => {
            const on = stack === item.id;
            return (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => setStack(item.id)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isNative ? (
          <Pressable accessibilityRole="button" onPress={() => setStoreReady((value) => !value)} style={styles.checkRow}>
            <Ionicons name={storeReady ? 'checkbox' : 'square-outline'} size={20} color={storeReady ? colors.lime : colors.textMuted} />
            <Text style={styles.checkText}>Ready for both stores (appends store-ready instructions)</Text>
          </Pressable>
        ) : null}

        <View style={styles.row}>
          <Button label="Photos" kind="secondary" flex={1} icon="image-outline" onPress={() => attachPicker('image')} loading={uploading} />
          <Button label="Files" kind="secondary" flex={1} icon="document-outline" onPress={() => attachPicker('document')} loading={uploading} />
        </View>

        {files.length ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            {files.map((file) => (
              <View key={file.id || file.url || file.name} style={styles.fileRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name || file.screen || 'Attachment'}
                  </Text>
                  <Text style={styles.fileMeta}>{file.role || 'reference'}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/role-sheet', params: { fileId: file.id || file.url, role: file.role || 'reference' } })}>
                  <Text style={styles.link}>Role</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFiles((current) => current.filter((item) => (item.id || item.url) !== (file.id || file.url)))}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Quick role chips when role-sheet not used yet */}
        {files.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
            {JOB_FILE_ROLES.slice(0, 8).map((role) => (
              <Pressable
                key={role.id}
                accessibilityRole="button"
                onPress={() => {
                  const last = files[files.length - 1];
                  if (last) setRole(last.id || last.url, role.id);
                }}
                style={styles.miniChip}
              >
                <Text style={styles.miniChipText}>{role.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Section title="Chat with Wren" />
        <View style={styles.chatBox}>
          {messages.length === 0 ? <Text style={styles.quiet}>Ask Wren to sharpen the brief. She’ll show what she kept and changed.</Text> : null}
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.who === 'you' ? styles.you : styles.wren]}>
              <Text style={styles.bubbleText}>{msg.text}</Text>
              {msg.kept?.length ? <Text style={styles.diff}>Kept: {msg.kept.join(' · ')}</Text> : null}
              {msg.changed?.length ? <Text style={styles.diff}>Changed: {msg.changed.join(' · ')}</Text> : null}
            </View>
          ))}
        </View>
        {pendingBrief ? (
          <View style={styles.acceptBox}>
            <Text style={styles.acceptTitle}>Wren rewrote the brief</Text>
            <Text style={styles.diff}>Kept: {(pendingBrief.kept || []).join(' · ') || '—'}</Text>
            <Text style={styles.diff}>Changed: {(pendingBrief.changed || []).join(' · ') || '—'}</Text>
            <View style={styles.row}>
              <Button
                label="Accept brief"
                flex={1}
                onPress={() => {
                  setBrief(pendingBrief.after);
                  setPendingBrief(null);
                  showToast('Brief updated.');
                }}
              />
              <Button label="Keep mine" kind="secondary" flex={1} onPress={() => setPendingBrief(null)} />
            </View>
          </View>
        ) : null}
        <View style={styles.chatInputRow}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Message Wren"
            placeholderTextColor={colors.textMuted}
            style={styles.chatInput}
            onSubmitEditing={talk}
            returnKeyType="send"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={talk} style={({ pressed }) => [styles.send, pressed && { opacity: 0.75 }]}>
            {talking ? <ActivityIndicator color={colors.ink} /> : <Ionicons name="arrow-up" size={20} color={colors.ink} />}
          </Pressable>
        </View>

        <Section title="Import another desk" />
        <Button label="List desks" kind="secondary" onPress={loadDesks} />
        {deskList ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            {deskList.length === 0 ? <Text style={styles.quiet}>No other desks available.</Text> : null}
            {deskList.map((desk) => (
              <Pressable key={desk.id || desk._id} accessibilityRole="button" onPress={() => importDesk(desk.id || desk._id)} style={styles.fileRow}>
                <Text style={styles.fileName}>{desk.name || desk.title || desk.id}</Text>
                <Text style={styles.link}>Import</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Section title="Plan" />
        <Button label={planning ? 'Planning…' : 'Plan screens'} onPress={runPlan} loading={planning} />
        {plan ? (
          <View style={styles.planBox}>
            {plan.product ? <Text style={styles.planProduct}>{plan.product}</Text> : null}
            {(plan.screens || []).map((screen: any, index: number) => (
              <View key={screen.name} style={styles.planScreen}>
                <Text style={styles.planName}>
                  {index + 1}. {screen.name}
                </Text>
                {screen.purpose ? <Text style={styles.meta}>{screen.purpose}</Text> : null}
                {screen.contents?.length ? <Text style={styles.meta}>Shows: {screen.contents.join('; ')}</Text> : null}
                {screen.actions?.length ? <Text style={styles.meta}>Actions: {screen.actions.join('; ')}</Text> : null}
                {screen.states?.length ? <Text style={styles.meta}>States: {screen.states.join('; ')}</Text> : null}
                {screen.data?.length ? <Text style={styles.meta}>Data: {screen.data.join('; ')}</Text> : null}
              </View>
            ))}
            {(plan.flow || []).length ? <Text style={styles.meta}>Flows: {plan.flow.join(' · ')}</Text> : null}
            {(plan.integrations || []).length ? <Text style={styles.meta}>Integrations: {plan.integrations.join(' · ')}</Text> : null}
            {(plan.assumptions || []).length ? <Text style={styles.meta}>Assumptions: {plan.assumptions.join(' · ')}</Text> : null}
            {(plan.suggested || []).map((row: any) => (
              <Pressable
                key={row.name}
                accessibilityRole="button"
                onPress={() => setPlan((current: any) => acceptSuggestion(current, row.name))}
                style={styles.suggest}
              >
                <Text style={styles.link}>Accept “{row.name}”</Text>
                <Text style={styles.meta}>{row.why}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Section title="Design" />
        <Button label={designing ? 'Designing…' : 'Design board + icon'} onPress={designBoard} loading={designing} kind="secondary" />
        {icon?.url ? (
          <View style={styles.iconWrap}>
            <Text style={styles.label}>App icon</Text>
            <Image source={{ uri: icon.url }} style={styles.icon} contentFit="cover" />
          </View>
        ) : null}
        {screens.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 10 }}>
            {screens.map((screen) => (
              <Pressable key={screen.url} onPress={() => setSelectedScreen(screen.screen || screen.name || 'Home')} style={styles.screenCard}>
                <Image source={{ uri: screen.url }} style={styles.screenImage} contentFit="cover" />
                <Text style={styles.fileMeta}>{screen.screen || 'Screen'}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <Field label="Redraw screen" value={selectedScreen} onChangeText={setSelectedScreen} placeholder="Home" style={{ marginTop: 10 }} />
        <Field label="Change note" value={changeNote} onChangeText={setChangeNote} placeholder="What should change?" />
        <Button label="Redraw this screen" kind="secondary" onPress={redrawScreen} loading={designing} />
        <Button
          label="Screen PDF"
          kind="secondary"
          onPress={() =>
            router.push({
              pathname: '/pdf-sheet',
              params: { title: brief.split('\n')[0] || 'Wren designs' },
            })
          }
        />

        <View style={{ height: 18 }} />
        <Button label={cooking ? 'Cooking…' : 'Cook'} onPress={cook} loading={cooking} />
        <View style={{ height: 8 }} />
        <Button label="Open builds" kind="secondary" onPress={() => router.navigate('/(tabs)/builds')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 12 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginVertical: 8 },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, marginBottom: 8 },
  label: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 14, marginTop: 14, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: 13 },
  chipTextOn: { color: colors.ink },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14 },
  checkText: { color: colors.white, fontFamily: fonts.medium, fontSize: 14, flex: 1 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, padding: 12 },
  fileName: { color: colors.white, fontFamily: fonts.semibold, fontSize: 14 },
  fileMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  link: { color: colors.lime, fontFamily: fonts.bold, fontSize: 13 },
  miniChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.cardAlt },
  miniChipText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 11 },
  section: { color: colors.white, fontFamily: fonts.bold, fontSize: 20, marginTop: 22, marginBottom: 10 },
  chatBox: { gap: 8, minHeight: 80 },
  bubble: { borderRadius: radius.md, padding: 12, maxWidth: '92%' },
  you: { alignSelf: 'flex-end', backgroundColor: '#2A2458' },
  wren: { alignSelf: 'flex-start', backgroundColor: colors.card },
  bubbleText: { color: colors.white, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  diff: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12, marginTop: 6 },
  acceptBox: { marginTop: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.cardAlt, gap: 6 },
  acceptTitle: { color: colors.lime, fontFamily: fonts.bold, fontSize: 14 },
  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  chatInput: { flex: 1, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.input, paddingHorizontal: 14, color: colors.white, fontFamily: fonts.medium },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  quiet: { color: colors.textMuted, fontFamily: fonts.regular },
  planBox: { marginTop: 12, gap: 10 },
  planProduct: { color: colors.white, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  planScreen: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12 },
  planName: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 18 },
  suggest: { padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  iconWrap: { marginTop: 12, alignItems: 'flex-start' },
  icon: { width: 96, height: 96, borderRadius: 22, backgroundColor: colors.card },
  screenCard: { width: 140 },
  screenImage: { width: 140, height: 220, borderRadius: 16, backgroundColor: colors.card },
});
