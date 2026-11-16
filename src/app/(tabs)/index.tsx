import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudioHeader } from '../../components/chrome';
import { Button, EmptyState, ErrorState, Pill, SectionTitle } from '../../components/ui';
import { useCrm } from '../../data/crm';
import { asText } from '../../lib/activityText';
import { STATUS_FILTERS, WREN_FUNNEL, WREN_RUN_TASKS } from '../../lib/wrenConstants';
import { useTabScrollToTop } from '../../lib/useTabScrollToTop';
import { colors, fonts, radius } from '../../theme/tokens';

function statusTone(status?: string): 'purple' | 'amber' | 'green' | 'blue' | 'muted' | 'red' {
  if (status === 'queued_build' || status === 'outreach_drafted' || status === 'researching') return 'amber';
  if (status === 'built' || status === 'converted') return 'green';
  if (status === 'skipped') return 'muted';
  if (status === 'analyzed') return 'blue';
  if (status === 'assigned') return 'purple';
  return 'muted';
}

export default function Desk() {
  const insets = useSafeAreaInsets();
  const ref = useRef<any>(null);
  useTabScrollToTop(ref);
  const { employee, prospects, kpis, loadingDesk, error, loadDesk, runTasks, statusFilter, setStatusFilter, showToast } = useCrm();
  const [query, setQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(WREN_RUN_TASKS.slice(0, 5).map((item) => item.id));
  const [running, setRunning] = useState(false);

  const funnel = kpis?.funnel || {};
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prospects;
    return prospects.filter((item) =>
      [item.companyName, item.contactName, item.email, item.websiteUrl, item.status].join(' ').toLowerCase().includes(q),
    );
  }, [prospects, query]);

  const activeBuilds = prospects.filter((item) => {
    const delivery = item.buildDelivery || {};
    return delivery.agentId || delivery.status === 'building' || delivery.status === 'ready' || delivery.runStatus;
  });

  const toggleTask = (id: string) => {
    setSelectedTasks((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const launchMission = async () => {
    if (!selectedTasks.length) {
      showToast('Pick at least one mission task.');
      return;
    }
    setRunning(true);
    const result = await runTasks(selectedTasks);
    setRunning(false);
    if (!result.ok) showToast(result.error || 'Mission failed.');
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28, paddingHorizontal: 16 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <StudioHeader onRefresh={() => loadDesk()} />
      <Text style={styles.title}>{employee?.displayName || 'Wren'}’s desk</Text>
      <Text style={styles.sub}>Live prospects, mission control, and active builds from FlowTrack.</Text>

      {error ? <ErrorState title="Desk unavailable" body={error} onRetry={() => loadDesk()} /> : null}

      <View style={styles.kpiRow}>
        {[
          ['Scouted', kpis.scouted ?? funnel.scout ?? 0],
          ['Analysed', kpis.analysedCum ?? funnel.analyse ?? 0],
          ['Built', kpis.builtCum ?? funnel.build ?? 0],
          ['Sent', kpis.sent ?? funnel.sent ?? 0],
        ].map(([label, value]) => (
          <View key={String(label)} style={styles.kpi}>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Pipeline" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {WREN_FUNNEL.map((stage) => {
          const on = statusFilter === stage.filter;
          return (
            <Pressable key={stage.id} accessibilityRole="button" onPress={() => setStatusFilter(stage.filter)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{stage.label}</Text>
              <Text style={[styles.chipCount, on && styles.chipTextOn]}>{funnel[stage.id] ?? 0}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionTitle title="Mission control" />
      <View style={styles.taskGrid}>
        {WREN_RUN_TASKS.map((task) => {
          const on = selectedTasks.includes(task.id);
          return (
            <Pressable key={task.id} accessibilityRole="button" onPress={() => toggleTask(task.id)} style={[styles.task, on && styles.taskOn]}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? colors.lime : colors.textMuted} />
              <Text style={styles.taskText}>{task.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button label={running ? 'Running…' : 'Run selected tasks'} onPress={launchMission} loading={running} />

      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search prospects" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {STATUS_FILTERS.map((item) => {
          const on = statusFilter === item.id;
          return (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => setStatusFilter(item.id)} style={[styles.filter, on && styles.filterOn]}>
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionTitle title="Prospects" action="Give job →" onAction={() => router.navigate('/(tabs)/job')} />
      {loadingDesk && !prospects.length ? (
        <ActivityIndicator color={colors.lime} style={{ marginVertical: 24 }} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No prospects here" body="Run a scout mission or switch filters. Wren’s website desk shows the same list." action="Refresh" onAction={() => loadDesk()} />
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((prospect) => (
            <Pressable
              key={prospect.id}
              accessibilityRole="button"
              accessibilityLabel={prospect.companyName || 'Prospect'}
              onPress={() => router.push(`/prospect/${prospect.id}`)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.company} numberOfLines={1}>
                  {prospect.companyName || 'Untitled prospect'}
                </Text>
                <Pill label={String(prospect.status || 'assigned').replace(/_/g, ' ')} tone={statusTone(prospect.status)} />
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {prospect.websiteUrl || prospect.contactName || prospect.email || 'No website yet'}
              </Text>
              {asText(prospect.buildDelivery?.current) || asText(prospect.buildDelivery?.activity) ? (
                <Text style={styles.live} numberOfLines={2}>
                  {asText(prospect.buildDelivery?.current) || asText(prospect.buildDelivery?.activity)}
                </Text>
              ) : null}
              {asText(prospect.lastError) ? <Text style={styles.err}>{asText(prospect.lastError)}</Text> : null}
            </Pressable>
          ))}
        </View>
      )}

      <SectionTitle title="Active builds" action="All →" onAction={() => router.navigate('/(tabs)/builds')} />
      {activeBuilds.length === 0 ? (
        <Text style={styles.quiet}>No builds running. Cook a job or open Builds.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {activeBuilds.slice(0, 3).map((item) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/build/${item.id}`)} style={({ pressed }) => [styles.buildRow, pressed && { opacity: 0.8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.company}>{item.companyName}</Text>
                <Text style={styles.meta}>{item.buildDelivery?.appKind || item.buildDelivery?.status || 'building'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ height: 12 }} />
      <Button label="Give Wren the job" onPress={() => router.navigate('/(tabs)/job')} />
      <View style={{ height: 8 }} />
      <Button label="Desk options" kind="secondary" onPress={() => router.push('/desk-options-sheet')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.white, fontFamily: fonts.extra, fontSize: 32, marginTop: 14 },
  sub: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginTop: 6, marginBottom: 14 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpi: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12 },
  kpiValue: { color: colors.lime, fontFamily: fonts.extra, fontSize: 20 },
  kpiLabel: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  chip: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.lime },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: 13 },
  chipCount: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  chipTextOn: { color: colors.ink },
  taskGrid: { gap: 8, marginBottom: 12 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: 'transparent' },
  taskOn: { borderColor: colors.lime },
  taskText: { color: colors.white, fontFamily: fonts.medium, fontSize: 14 },
  search: { marginTop: 16, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.input, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, color: colors.white, fontFamily: fonts.medium, fontSize: 15, paddingVertical: 10 },
  filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.cardAlt },
  filterOn: { backgroundColor: '#2A2458' },
  filterText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12 },
  filterTextOn: { color: colors.white },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: '#1E2A3A' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  company: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, flex: 1 },
  meta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },
  live: { color: colors.lime, fontFamily: fonts.medium, fontSize: 13, marginTop: 8, lineHeight: 18 },
  err: { color: '#FFB4B4', fontFamily: fonts.medium, fontSize: 12, marginTop: 6 },
  quiet: { color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 8 },
  buildRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12 },
});
