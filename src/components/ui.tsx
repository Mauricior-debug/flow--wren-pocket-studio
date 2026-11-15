import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'blue' | 'purple' | 'green';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  loading,
  icon,
  flex,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  flex?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const ink = kind === 'primary';
  const color = ink ? colors.ink : kind === 'danger' ? colors.red : kind === 'green' ? colors.green : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        kind === 'ghost' && styles.ghost,
        kind === 'danger' && styles.danger,
        kind === 'blue' && styles.blue,
        kind === 'purple' && styles.purple,
        kind === 'green' && styles.green,
        flex != null && { flex },
        (disabled || loading) && styles.disabled,
        pressed && (ink ? styles.primaryPressed : styles.pressed),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.buttonRow}>
          {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
          <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  icon,
  error,
  secureToggle,
  secure,
  onToggleSecure,
  style,
  ...input
}: TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  secureToggle?: boolean;
  secure?: boolean;
  onToggleSecure?: () => void;
}) {
  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry={secure}
          autoCorrect={false}
          {...input}
        />
        {secureToggle ? (
          <Pressable accessibilityRole="button" accessibilityLabel={secure ? 'Show password' : 'Hide password'} onPress={onToggleSecure} hitSlop={8} style={styles.eye}>
            <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Pill({
  label,
  tone,
}: {
  label: string;
  tone: 'purple' | 'amber' | 'green' | 'blue' | 'muted' | 'red';
}) {
  const map = {
    purple: { bg: '#2E2460', fg: '#D7D2FF', icon: 'cube-outline' as const },
    amber: { bg: '#3D3114', fg: '#FFD27A', icon: 'time-outline' as const },
    green: { bg: '#143226', fg: colors.green, icon: 'checkmark-circle' as const },
    blue: { bg: colors.blueDim, fg: '#9CC4FF', icon: 'ellipse' as const },
    muted: { bg: colors.cardAlt, fg: colors.textSecondary, icon: 'ellipse' as const },
    red: { bg: colors.redDim, fg: '#FFB4B4', icon: 'alert-circle' as const },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Ionicons name={map.icon} size={12} color={map.fg} />
      <Text style={[styles.pillText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.lime }: { value: number; color?: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${width}%`, backgroundColor: color }]} />
    </View>
  );
}

export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && onAction ? <Button label={action} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="cloud-offline-outline" size={28} color={colors.amber} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} kind="secondary" /> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonLabel: { fontFamily: fonts.bold, fontSize: 16 },
  primary: {
    backgroundColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryPressed: { backgroundColor: colors.limeDeep, transform: [{ scale: 0.985 }] },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#3A1418', borderWidth: 1, borderColor: '#6E2430' },
  blue: { backgroundColor: '#1D4ED8' },
  purple: { backgroundColor: '#6D28D9' },
  green: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.green },
  fieldLabel: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 14, marginBottom: 8 },
  field: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  fieldError: { borderColor: colors.red },
  input: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 16, paddingVertical: 14 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#FFB4B4', fontFamily: fonts.medium, fontSize: 13, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontFamily: fonts.semibold, fontSize: 12 },
  track: { height: 6, borderRadius: 99, backgroundColor: '#243140', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 99 },
  empty: { padding: 24, gap: 10, alignItems: 'flex-start' },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 20 },
  emptyBody: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 20 },
  sectionAction: { minHeight: 44, justifyContent: 'center' },
  sectionActionText: { color: colors.lime, fontFamily: fonts.semibold, fontSize: 14 },
  banner: { backgroundColor: '#241E08', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: '#4A3E12' },
  bannerText: { color: '#F3E2A2', fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toastText: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
});
