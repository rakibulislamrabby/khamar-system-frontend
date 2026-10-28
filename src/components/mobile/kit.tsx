import { router } from 'expo-router';
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/dashboard/icons';
import { Tx } from '@/components/dashboard/kit';
import { C, TONES, type Tone } from '@/components/dashboard/theme';

export { Tx };

/** Height reserved under scrolling content so the floating tab bar never covers it. */
export const TAB_SPACE = 120;
const noOutline = { outlineStyle: 'none' } as unknown as TextStyle;

export function MScreen({
  children,
  header,
  footer,
  tabs = false,
  refreshing,
  onRefresh,
  bg = C.canvas,
  gap = 16,
  plainFooter,
}: PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  plainFooter?: boolean;
  tabs?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  bg?: string;
  gap?: number;
}>) {
  const insets = useSafeAreaInsets();
  const bottom = tabs ? TAB_SPACE + insets.bottom : footer ? 24 : 32 + insets.bottom;
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: header ? 8 : 12, paddingBottom: bottom, gap }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={C.padma} colors={[C.padma]} /> : undefined}>
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={
              plainFooter
                ? { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 + insets.bottom }
                : { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 + insets.bottom, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line }
            }>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

/** Large page title used on tab roots (Livestock, Sell, Hisab, More). */
export function TitleHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={28} w="800" style={{ letterSpacing: -0.8, lineHeight: 34 }}>{title}</Tx>
        {sub ? <Tx s={14} color={C.sub} style={{ marginTop: 4, lineHeight: 20 }}>{sub}</Tx> : null}
      </View>
      {right}
    </View>
  );
}

/** Back circle, centred title, optional right action (sub pages and forms). */
export function NavHeader({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
      <CircleBtn icon="left" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(app)')))} label="Back" />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
        <Tx s={17} w="700" lines={1} style={{ letterSpacing: -0.3 }}>{title}</Tx>
      </View>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function CircleBtn({ icon, onPress, label, dot }: { icon: IconName; onPress?: () => void; label?: string; dot?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
      <Icon name={icon} size={20} color={C.ink} />
      {dot ? <View style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral, borderWidth: 1.5, borderColor: C.white }} /> : null}
    </Pressable>
  );
}

export function LimeSquare({ icon = 'plus', onPress, label }: { icon?: IconName; onPress?: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 15, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
      <Icon name={icon} size={22} color={C.forest} sw={2.4} />
    </Pressable>
  );
}

export function SectionHead({ title, action, onAction, right, style }: { title: string; action?: string; onAction?: () => void; right?: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }, style]}>
      <Tx s={17} w="700" style={{ letterSpacing: -0.3, flexShrink: 1 }} lines={1}>{title}</Tx>
      {right ??
        (action ? (
          <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Tx s={13} w="700" color={C.padma}>{action}</Tx>
            <Icon name="right" size={14} color={C.padma} sw={2.4} />
          </Pressable>
        ) : null)}
    </View>
  );
}

/** Uppercase grouping caption (Settings / Organization sections). */
export function Caption({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    <Tx s={11} w="700" color={C.faint} style={{ letterSpacing: 0.9, textTransform: 'uppercase', ...style }}>
      {children}
    </Tx>
  );
}

export function MCard({ children, style, pad = 16, dark, onPress, radius = 24 }: PropsWithChildren<{ style?: ViewStyle; pad?: number; dark?: boolean; onPress?: () => void; radius?: number }>) {
  const base: ViewStyle = {
    backgroundColor: dark ? C.forest : C.white,
    borderRadius: radius,
    borderWidth: dark ? 0 : 1,
    borderColor: C.line,
    padding: pad,
    overflow: 'hidden',
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, style, { opacity: pressed ? 0.92 : 1 }]}>
      {children}
    </Pressable>
  );
}

/** Soft circle in the top-right of the dark hero cards. */
export function HeroBlob({ size = 170, top = -2, right = -40, color = C.forest2 }: { size?: number; top?: number; right?: number; color?: string }) {
  return <View pointerEvents="none" style={{ position: 'absolute', top, right, width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

type BtnKind = 'dark' | 'lime' | 'outline' | 'soft' | 'limeSoft' | 'danger' | 'grey';

export function MButton({
  label,
  icon,
  kind = 'dark',
  onPress,
  loading,
  disabled,
  style,
  h = 56,
}: {
  label: string;
  icon?: IconName;
  kind?: BtnKind;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  h?: number;
}) {
  const p = {
    dark: { bg: C.forest, fg: C.white, bd: C.forest, ic: C.lime },
    lime: { bg: C.lime, fg: C.forest, bd: C.lime, ic: C.forest },
    outline: { bg: C.white, fg: C.ink, bd: C.line, ic: C.padma },
    soft: { bg: C.mint, fg: C.padma, bd: C.mint, ic: C.padma },
    limeSoft: { bg: C.limeSoft, fg: C.forest, bd: C.limeSoft, ic: C.padma },
    danger: { bg: C.coralSoft, fg: C.coralInk, bd: C.coralSoft, ic: C.coral },
    grey: { bg: C.canvas, fg: C.ink, bd: C.canvas, ic: C.coral },
  }[kind];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        { height: h, borderRadius: 18, backgroundColor: p.bg, borderWidth: 1, borderColor: p.bd, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16, opacity: off ? 0.6 : pressed ? 0.88 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={p.fg} /> : icon ? <Icon name={icon} size={20} color={p.ic} sw={2.2} /> : null}
      <Tx s={16} w="700" color={p.fg} lines={1}>{label}</Tx>
    </Pressable>
  );
}

export function FieldLabel({ label, optional }: { label?: string; optional?: string }) {
  if (!label) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
      <Tx s={13} w="600">{label}</Tx>
      {optional ? <Tx s={13} color={C.sub}>{optional}</Tx> : null}
    </View>
  );
}

export function MField({
  label,
  optional,
  value,
  onChangeText,
  placeholder,
  icon,
  prefix,
  suffix,
  keyboardType,
  secure,
  multiline,
  autoCapitalize,
  style,
  error,
  right,
  big,
}: {
  label?: string;
  optional?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  prefix?: ReactNode;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  style?: ViewStyle;
  error?: boolean;
  right?: ReactNode;
  big?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={[{ minWidth: 0 }, style]}>
      <FieldLabel label={label} optional={optional} />
      <View
        style={{
          minHeight: multiline ? 88 : 54,
          borderRadius: 16,
          borderWidth: focus || error ? 2 : 1,
          borderColor: error ? C.coral : focus ? C.padma : C.line,
          backgroundColor: C.white,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: focus || error ? 16 : 17,
          gap: 12,
          boxShadow: focus ? '0 0 0 4px rgba(19,160,106,0.12)' : undefined,
        }}>
        {icon ? <View style={{ paddingTop: multiline ? 16 : 0 }}><Icon name={icon} size={18} color={C.sub} /></View> : null}
        {typeof prefix === 'string' ? <Tx s={15} w="700" color={C.sub}>{prefix}</Tx> : prefix}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : undefined)}
          secureTextEntry={secure && !show}
          multiline={multiline}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[
            {
              flex: 1,
              minWidth: 0,
              fontSize: big ? 18 : 15,
              fontWeight: big ? '800' : '600',
              color: C.ink,
              minHeight: multiline ? 84 : 50,
              paddingVertical: multiline ? 15 : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            noOutline,
          ]}
        />
        {suffix ? <Tx s={14} w="600" color={C.sub}>{suffix}</Tx> : null}
        {right}
        {secure ? (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} accessibilityLabel={show ? 'Hide password' : 'Show password'}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} color={C.sub} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type Option<T extends string> = { value: T; label: string; sub?: string; icon?: IconName; tone?: Tone };

/** Field-looking trigger that opens a bottom sheet of options. */
export function MSelect<T extends string>({
  label,
  optional,
  value,
  options,
  onChange,
  placeholder = '—',
  icon,
  style,
  title,
  footer,
}: {
  label?: string;
  optional?: string;
  value: T | '';
  options: Option<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  icon?: IconName;
  style?: ViewStyle;
  title?: string;
  footer?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={[{ minWidth: 0 }, style]}>
      <FieldLabel label={label} optional={optional} />
      <Pressable
        onPress={() => setOpen(true)}
        style={{ height: 54, borderRadius: 16, borderWidth: open ? 2 : 1, borderColor: open ? C.padma : C.line, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: open ? 16 : 17, gap: 12 }}>
        {icon ? <Icon name={icon} size={18} color={C.sub} /> : null}
        <Tx s={15} w="600" color={current ? C.ink : C.faint} lines={1} style={{ flex: 1 }}>{current?.label ?? placeholder}</Tx>
        <Icon name="down" size={16} color={C.sub} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={title ?? label}>
        {options.length ? (
          options.map((o) => (
            <SheetRow
              key={o.value}
              label={o.label}
              sub={o.sub}
              icon={o.icon}
              tone={o.tone}
              active={o.value === value}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
            />
          ))
        ) : (
          <Tx s={14} color={C.sub} style={{ padding: 16 }}>—</Tx>
        )}
        {footer ? footer(() => setOpen(false)) : null}
      </Sheet>
    </View>
  );
}

export function Sheet({ open, onClose, title, children }: PropsWithChildren<{ open: boolean; onClose: () => void; title?: string }>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={open} onRequestClose={onClose} animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: C.overlay }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ maxHeight: '78%', backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 12 + insets.bottom }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.line }} />
          </View>
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <Tx s={17} w="700" style={{ flex: 1 }}>{title}</Tx>
              <Pressable onPress={onClose} hitSlop={10}><Icon name="x" size={20} color={C.sub} /></Pressable>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function SheetRow({ label, sub, icon, tone = 'green', active, onPress }: { label: string; sub?: string; icon?: IconName; tone?: Tone; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, minHeight: 54, paddingVertical: 8, borderRadius: 14, backgroundColor: active ? C.mint : pressed ? C.head : 'transparent' })}>
      {icon ? <ToneTile icon={icon} tone={tone} size={36} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={15} w="600" lines={1}>{label}</Tx>
        {sub ? <Tx s={12} color={C.sub} lines={1}>{sub}</Tx> : null}
      </View>
      {active ? <Icon name="check" size={18} color={C.padma} sw={2.6} /> : null}
    </Pressable>
  );
}

function shiftDay(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD field: quick picks for recent days, or type an exact date. */
export function MDateField({ label, value, onChange, style, format, labels }: { label?: string; value: string; onChange: (v: string) => void; style?: ViewStyle; format: (iso: string) => string; labels: { today: string; yesterday: string; daysAgo: (n: number) => string; exact: string } }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const picks = [0, 1, 2, 3, 7].map((n) => ({ iso: shiftDay(n), label: n === 0 ? labels.today : n === 1 ? labels.yesterday : labels.daysAgo(n) }));
  return (
    <View style={[{ minWidth: 0 }, style]}>
      <FieldLabel label={label} />
      <Pressable
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        style={{ height: 54, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, gap: 12 }}>
        <Icon name="cal" size={18} color={C.sub} />
        <Tx s={15} w="600" lines={1} style={{ flex: 1 }}>{/^\d{4}-\d{2}-\d{2}$/.test(value) ? format(value) : value || '—'}</Tx>
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {picks.map((p) => (
          <SheetRow
            key={p.iso}
            label={p.label}
            sub={format(p.iso)}
            icon="cal"
            active={p.iso === value}
            onPress={() => {
              onChange(p.iso);
              setOpen(false);
            }}
          />
        ))}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', paddingHorizontal: 8, paddingTop: 10 }}>
          <MField label={labels.exact} value={draft} onChangeText={setDraft} placeholder="2026-10-01" autoCapitalize="none" style={{ flex: 1 }} />
          <MButton
            label="OK"
            kind="dark"
            style={{ width: 80 }}
            h={54}
            disabled={!/^\d{4}-\d{2}-\d{2}$/.test(draft)}
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}

export function ToneTile({ icon, tone = 'green', size = 46, radius }: { icon: IconName; tone?: Tone; size?: number; radius?: number }) {
  const t = TONES[tone];
  const bg = tone === 'lime' ? C.limeSoft : t.bg;
  const fg = tone === 'gold' ? C.goldInk : tone === 'lime' ? C.padma : t.fg;
  return (
    <View style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.33), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={Math.round(size * 0.48)} color={fg} sw={1.9} />
    </View>
  );
}

/** Square action tile: icon chip above a label (quick actions, add-entry, spend type). */
export function ActionTile({ icon, tone, label, onPress, active, style }: { icon: IconName; tone: Tone; label: string; onPress?: () => void; active?: boolean; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, minWidth: 0, height: 94, borderRadius: 20, borderWidth: active ? 2 : 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.head : C.white, alignItems: 'center', paddingTop: active ? 14 : 15, gap: 8, opacity: pressed ? 0.85 : 1 },
        style,
      ]}>
      <ToneTile icon={icon} tone={tone} size={40} radius={13} />
      <Tx s={12} w="700" lines={1}>{label}</Tx>
    </Pressable>
  );
}

export function MChips<T extends string>({ value, options, onChange }: { value: T; options: Array<{ key: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ height: 36, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, alignItems: 'center', justifyContent: 'center' }}>
            <Tx s={13} w="600" color={active ? C.white : C.ink}>{o.label}</Tx>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Wrapping single-choice chips; the active one is forest with a lime check (form pickers). */
export function CheckChips<T extends string>({ value, options, onChange }: { value: T; options: Array<{ key: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ height: 38, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {active ? <Icon name="check" size={14} color={C.lime} /> : null}
            <Tx s={14} w="600" color={active ? C.lime : C.ink}>{o.label}</Tx>
          </Pressable>
        );
      })}
    </View>
  );
}

/** − value + control sized like a field (quantities). */
export function Stepper({ label, value, onChange, step = 1, style }: { label?: string; value: string; onChange: (v: string) => void; step?: number; style?: ViewStyle }) {
  const n = Number(value) || 0;
  const set = (v: number) => onChange(String(Math.max(0, v)));
  return (
    <View style={[{ minWidth: 0 }, style]}>
      <FieldLabel label={label} />
      <View style={{ height: 54, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6 }}>
        <Pressable onPress={() => set(n - step)} accessibilityLabel="−" style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 12, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Tx s={17} w="700">−</Tx>
        </Pressable>
        <TextInput
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={C.faint}
          style={[{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.ink, padding: 0 }, noOutline]}
        />
        <Pressable onPress={() => set(n + step)} accessibilityLabel="+" style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 12, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
          <Icon name="plus" size={18} color={C.lime} />
        </Pressable>
      </View>
    </View>
  );
}

export function MSegmented<T extends string>({ value, options, onChange, h = 48 }: { value: T; options: Array<{ key: T; label: string }>; onChange: (v: T) => void; h?: number }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#E6EDE9', borderRadius: 16, padding: 4, height: h }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? C.white : 'transparent', boxShadow: active ? '0 1px 3px rgba(12,42,32,0.10)' : undefined }}>
            <Tx s={13} w="700" color={active ? C.ink : C.sub} lines={1}>{o.label}</Tx>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchField({ value, onChange, placeholder, onFilter }: { value: string; onChange: (v: string) => void; placeholder: string; onFilter?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1, height: 48, borderRadius: 15, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
        <Icon name="search" size={18} color={C.faint} sw={1.6} />
        <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.faint} style={[{ flex: 1, fontSize: 14, fontWeight: '500', color: C.ink, height: 46 }, noOutline]} />
        {value ? (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <Icon name="x" size={16} color={C.sub} />
          </Pressable>
        ) : null}
      </View>
      {onFilter ? (
        <Pressable onPress={onFilter} style={{ width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sort" size={20} color={C.ink} sw={1.7} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Grey box of 2–3 metrics separated by hairlines (batch cards, farm cards). */
export function MetricBox({ items, style }: { items: Array<{ label: string; value: string; color?: string; suffix?: string }>; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.canvas, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12 }, style]}>
      {items.map((m, i) => (
        <View key={m.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
          {i > 0 ? <View style={{ width: 1, height: 30, backgroundColor: C.line, marginRight: 10 }} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={11} w="600" color={C.sub} lines={1}>{m.label}</Tx>
            <Tx s={15} w="800" color={m.color ?? C.ink} lines={1} tabular style={{ marginTop: 2 }}>
              {m.value}
              {m.suffix ? <Tx s={12} color={C.sub}>{m.suffix}</Tx> : null}
            </Tx>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Pill with tinted background. */
export function MPill({ label, tone = 'green', solid, style }: { label: string; tone?: Tone; solid?: boolean; style?: ViewStyle }) {
  const t = TONES[tone];
  return (
    <View style={[{ alignSelf: 'flex-start', height: 26, borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: solid ? C.lime : t.bg }, style]}>
      <Tx s={12} w="600" color={solid ? C.forest : t.ink} lines={1}>{label}</Tx>
    </View>
  );
}

/** White card holding list rows with hairline separators. */
export function ListCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const list = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean) as ReactNode[];
  return (
    <View style={[{ backgroundColor: C.white, borderRadius: 24, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }, style]}>
      {list.map((child, i) => (
        <View key={i}>
          {i > 0 ? <View style={{ height: 1, backgroundColor: C.line, marginHorizontal: 16 }} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

export function IconRow({ icon, tone = 'green', title, sub, right, onPress, danger }: { icon: IconName; tone?: Tone; title: string; sub?: string; right?: ReactNode; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: pressed ? C.head : 'transparent' })}>
      <ToneTile icon={icon} tone={danger ? 'coral' : tone} size={40} radius={13} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={15} w="600" color={danger ? C.coralInk : C.ink} lines={1}>{title}</Tx>
        {sub ? <Tx s={12} color={C.sub} lines={1} style={{ marginTop: 2 }}>{sub}</Tx> : null}
      </View>
      {right !== undefined ? right : onPress ? <Icon name="right" size={18} color={C.faint} sw={1.8} /> : null}
    </Pressable>
  );
}

export function Notice({ message, tone = 'coral' }: { message?: string | null; tone?: 'coral' | 'green' }) {
  if (!message) return null;
  const coral = tone === 'coral';
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: coral ? C.coralSoft : C.mint, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
      <Icon name={coral ? 'alert' : 'check'} size={16} color={coral ? C.coral : C.padma} />
      <Tx s={13} w="600" color={coral ? C.coralInk : C.padma} style={{ flex: 1 }}>{message}</Tx>
    </View>
  );
}

export function EmptyCard({ icon = 'leaf', title, sub, action }: { icon?: IconName; title: string; sub?: string; action?: ReactNode }) {
  return (
    <MCard style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
      <ToneTile icon={icon} tone="green" size={48} />
      <Tx s={15} w="700" style={{ marginTop: 4, textAlign: 'center' }}>{title}</Tx>
      {sub ? <Tx s={13} color={C.sub} style={{ textAlign: 'center' }}>{sub}</Tx> : null}
      {action ? <View style={{ marginTop: 8, alignSelf: 'stretch' }}>{action}</View> : null}
    </MCard>
  );
}

export function Loading({ h = 120 }: { h?: number }) {
  return (
    <View style={{ height: h, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.padma} />
    </View>
  );
}

export function Bar({ pct, color = C.emerald, track = C.mint, h = 6 }: { pct: number; color?: string; track?: string; h?: number }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${v}%`, height: h, borderRadius: h, backgroundColor: color }} />
    </View>
  );
}
