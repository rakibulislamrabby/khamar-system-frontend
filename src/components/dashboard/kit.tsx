import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type PressableStateCallbackType,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/dashboard/icons';
import { C, FONT, RADIUS, TONES, type Tone } from '@/components/dashboard/theme';

type PressState = PressableStateCallbackType & { hovered?: boolean };
const noOutline = { outlineStyle: 'none' } as unknown as TextStyle;

export function Tx({
  children,
  s = 14,
  w = '500',
  color = C.ink,
  style,
  lines,
  tabular,
}: {
  children: ReactNode;
  s?: number;
  w?: TextStyle['fontWeight'];
  color?: string;
  style?: TextStyle;
  lines?: number;
  tabular?: boolean;
}) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          fontFamily: FONT,
          fontSize: s,
          fontWeight: w,
          color,
          lineHeight: Math.round(s * 1.36),
          letterSpacing: s >= 26 ? -1 : s >= 20 ? -0.4 : 0,
        },
        tabular ? ({ fontVariant: ['tabular-nums'] } as TextStyle) : null,
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return (
    <Tx s={13} w="600" style={{ marginBottom: 8, ...style }}>
      {children}
    </Tx>
  );
}

export function Card({ children, style, pad = 22, dark = false }: PropsWithChildren<{ style?: ViewStyle; pad?: number; dark?: boolean }>) {
  return (
    <View
      style={[
        {
          backgroundColor: dark ? C.forest : C.white,
          borderRadius: RADIUS,
          borderWidth: dark ? 0 : 1,
          borderColor: C.line,
          padding: pad,
          overflow: 'hidden',
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function CardHead({ title, sub, right, style }: { title: string; sub?: string; right?: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, style]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={17} w="700">{title}</Tx>
        {sub ? <Tx s={12} color={C.sub} style={{ marginTop: 3 }}>{sub}</Tx> : null}
      </View>
      {right}
    </View>
  );
}

type BtnKind = 'lime' | 'dark' | 'outline' | 'ghost' | 'danger' | 'soft';

export function Btn({
  label,
  icon,
  iconRight,
  kind = 'outline',
  onPress,
  size = 'md',
  disabled,
  loading,
  block,
  style,
}: {
  label?: string;
  icon?: IconName;
  iconRight?: IconName;
  kind?: BtnKind;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  style?: ViewStyle;
}) {
  const palette: Record<BtnKind, { bg: string; fg: string; border: string; hover: string }> = {
    lime: { bg: C.lime, fg: C.forest, border: C.lime, hover: '#B9E651' },
    dark: { bg: C.forest, fg: C.white, border: C.forest, hover: C.forest2 },
    outline: { bg: C.white, fg: C.ink, border: C.line, hover: C.head },
    ghost: { bg: 'transparent', fg: C.ink, border: 'transparent', hover: '#EEF2EF' },
    danger: { bg: C.coral, fg: C.white, border: C.coral, hover: '#D94A3B' },
    soft: { bg: C.mint, fg: C.padma, border: C.mint, hover: '#D2EBDD' },
  };
  const p = palette[kind];
  const h = size === 'sm' ? 34 : size === 'lg' ? 52 : 42;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      style={(state: PressState) => [
        {
          height: h,
          paddingHorizontal: label ? (size === 'sm' ? 12 : 18) : 0,
          width: label ? undefined : h,
          borderRadius: size === 'sm' ? 10 : 13,
          borderWidth: 1,
          borderColor: p.border,
          backgroundColor: state.hovered && !off ? p.hover : p.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: off ? 0.55 : state.pressed ? 0.88 : 1,
          alignSelf: block ? 'stretch' : 'auto',
          cursor: off ? 'not-allowed' : 'pointer',
        } as ViewStyle,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={p.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} color={p.fg} sw={2.2} /> : null}
          {label ? <Tx s={size === 'sm' ? 13 : 14} w="700" color={p.fg}>{label}</Tx> : null}
          {iconRight ? <Icon name={iconRight} size={15} color={p.fg} sw={2.2} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, dot, label }: { icon: IconName; onPress?: () => void; dot?: boolean; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={(state: PressState) => ({
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: state.hovered ? '#E8EEEA' : C.canvas,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      <Icon name={icon} size={18} color={C.ink} />
      {dot ? (
        <View style={{ position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral, borderWidth: 1.5, borderColor: C.canvas }} />
      ) : null}
    </Pressable>
  );
}

export function Pill({ label, tone = 'green', icon, solid }: { label: string; tone?: Tone; icon?: IconName; solid?: boolean }) {
  const t = TONES[tone];
  const bg = solid ? (tone === 'dark' ? C.forest : t.fg) : t.bg;
  const fg = solid ? (tone === 'dark' ? C.lime : C.white) : t.ink;
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, height: 26 }}>
      {icon ? <Icon name={icon} size={13} color={fg} sw={2.4} /> : null}
      <Tx s={12} w="600" color={fg} lines={1}>{label}</Tx>
    </View>
  );
}

/** "+12%" trend chip. `goodWhenUp=false` for expenses. */
export function Delta({ value, goodWhenUp = true, onDark, text }: { value: number | null; goodWhenUp?: boolean; onDark?: boolean; text?: string }) {
  if (value == null && !text) return null;
  const up = (value ?? 0) >= 0;
  const good = text ? true : up === goodWhenUp;
  const bg = onDark ? 'rgba(197,239,99,0.16)' : good ? C.mint : C.coralSoft;
  const fg = onDark ? C.lime : good ? C.padma : C.coralInk;
  const label = text ?? `${up ? '+' : ''}${(value ?? 0).toFixed(Math.abs(value ?? 0) < 10 ? 1 : 0)}%`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, height: 26 }}>
      <Icon name={text ? 'up' : up ? 'up' : 'trendDown'} size={13} color={onDark ? C.lime : good ? C.padma : C.coral} sw={2.4} />
      <Tx s={12} w="600" color={fg}>{label}</Tx>
    </View>
  );
}

export function IconTile({ name, tone = 'green', size = 38, onDark }: { name: IconName; tone?: Tone; size?: number; onDark?: boolean }) {
  const t = TONES[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: onDark ? C.lime : tone === 'lime' ? C.limeSoft : t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={name} size={size * 0.47} color={onDark ? C.forest : t.fg === C.gold ? C.goldInk : t.fg} sw={2.1} />
    </View>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  style,
}: {
  value: T;
  options: Array<{ key: T; label: string; disabled?: boolean }>;
  onChange: (key: T) => void;
  size?: 'md' | 'lg';
  style?: ViewStyle;
}) {
  const h = size === 'lg' ? 44 : 36;
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: '#E9EFEB', borderRadius: 14, padding: 4, gap: 2 }, style]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={o.disabled ? undefined : () => onChange(o.key)}
            style={{
              flex: 1,
              minWidth: size === 'lg' ? 88 : 64,
              height: h,
              borderRadius: 11,
              paddingHorizontal: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? C.white : 'transparent',
              boxShadow: active ? '0 1px 3px rgba(12,42,32,0.12)' : undefined,
              opacity: o.disabled ? 0.45 : 1,
            }}>
            <Tx s={13} w={active ? '700' : '600'} color={active ? C.ink : C.sub}>{o.label}</Tx>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chips<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: Array<{ key: T; label: string; icon?: IconName }>;
  onChange: (key: T) => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={(state: PressState) => ({
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 999,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderColor: active ? C.forest : C.line,
              backgroundColor: active ? C.forest : state.hovered ? C.head : C.white,
            })}>
            {active && !o.icon ? <Icon name="check" size={14} color={C.lime} sw={2.6} /> : null}
            {o.icon ? <Icon name={o.icon} size={14} color={active ? C.lime : C.sub} /> : null}
            <Tx s={13} w="600" color={active ? C.white : C.ink}>{o.label}</Tx>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  width = 240,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  width?: number | `${number}%`;
}) {
  return (
    <View style={{ width, height: 40, borderRadius: 12, backgroundColor: C.canvas, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
      <Icon name="search" size={16} color={C.faint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        style={[{ flex: 1, fontFamily: FONT, fontSize: 13, color: C.ink, height: 40 }, noOutline]}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Icon name="x" size={14} color={C.sub} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  prefix,
  suffix,
  keyboardType,
  secure,
  multiline,
  error,
  style,
  autoFocus,
  onSubmitEditing,
  editable = true,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  multiline?: boolean;
  error?: string;
  style?: ViewStyle;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  editable?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  const border = error ? C.coral : focus ? C.emerald : C.line;
  return (
    <View style={[{ minWidth: 0 }, style]}>
      {label ? <Label>{label}</Label> : null}
      <View
        style={{
          minHeight: multiline ? 92 : 50,
          borderRadius: 14,
          borderWidth: focus ? 1.5 : 1,
          borderColor: border,
          backgroundColor: editable ? C.white : C.head,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: 14,
          gap: 10,
          boxShadow: focus ? '0 0 0 4px rgba(19,160,106,0.12)' : undefined,
        }}>
        {icon ? <View style={{ paddingTop: multiline ? 14 : 0 }}><Icon name={icon} size={17} color={C.sub} /></View> : null}
        {prefix ? <Tx s={14} w="600" color={C.sub}>{prefix}</Tx> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          keyboardType={keyboardType}
          secureTextEntry={secure && !show}
          multiline={multiline}
          autoFocus={autoFocus}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[
            {
              flex: 1,
              minWidth: 0,
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: '600',
              color: C.ink,
              height: multiline ? 88 : 48,
              paddingTop: multiline ? 14 : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            noOutline,
          ]}
        />
        {suffix ? <Tx s={13} w="600" color={C.sub}>{suffix}</Tx> : null}
        {secure ? (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={8} accessibilityLabel={show ? 'Hide password' : 'Show password'}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={17} color={C.sub} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Tx s={12} color={C.coralInk} style={{ marginTop: 6 }}>{error}</Tx> : null}
    </View>
  );
}

type Anchor = { x: number; y: number; w: number; h: number };

/** Portaled popover anchored under its trigger, so it never gets clipped by cards or scroll views. */
export function Popover({
  trigger,
  children,
  width,
  align = 'left',
}: {
  trigger: (open: () => void, isOpen: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  width?: number;
  align?: 'left' | 'right';
}) {
  const ref = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const open = useCallback(() => {
    ref.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  }, []);
  const close = useCallback(() => setAnchor(null), []);
  const panelW = width ?? anchor?.w ?? 220;
  const { width: vw, height: vh } = Dimensions.get('window');
  const left = anchor ? Math.max(8, Math.min(vw - panelW - 8, align === 'right' ? anchor.x + anchor.w - panelW : anchor.x)) : 0;
  const top = anchor ? anchor.y + anchor.h + 6 : 0;
  return (
    <View ref={ref} collapsable={false}>
      {trigger(open, Boolean(anchor))}
      <Modal transparent visible={Boolean(anchor)} onRequestClose={close} animationType="none">
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} />
        {anchor ? (
          <View
            style={{
              position: 'absolute',
              top,
              left,
              width: panelW,
              maxHeight: Math.max(160, vh - top - 16),
              backgroundColor: C.white,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.line,
              boxShadow: '0 18px 40px rgba(8,26,19,0.16)',
              overflow: 'hidden',
            }}>
            <ScrollView>{children(close)}</ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

export function MenuItem({ label, sub, icon, tone, onPress, active, right }: { label: string; sub?: string; icon?: IconName; tone?: Tone; onPress: () => void; active?: boolean; right?: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={(state: PressState) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: sub ? 10 : 11,
        backgroundColor: active ? C.mint : state.hovered ? C.head : C.white,
      })}>
      {icon ? (tone ? <IconTile name={icon} tone={tone} size={32} /> : <Icon name={icon} size={17} color={C.sub} />) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={14} w="600" lines={1}>{label}</Tx>
        {sub ? <Tx s={12} color={C.sub} lines={1}>{sub}</Tx> : null}
      </View>
      {right}
      {active ? <Icon name="check" size={16} color={C.padma} sw={2.4} /> : null}
    </Pressable>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  icon,
  style,
  height = 50,
  footer,
}: {
  label?: string;
  value: T | '';
  options: Array<{ value: T; label: string; sub?: string }>;
  onChange: (v: T) => void;
  placeholder?: string;
  icon?: IconName;
  style?: ViewStyle;
  height?: number;
  footer?: (close: () => void) => ReactNode;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <View style={[{ minWidth: 0 }, style]}>
      {label ? <Label>{label}</Label> : null}
      <Popover
        trigger={(open, isOpen) => (
          <Pressable
            onPress={open}
            style={{
              height,
              borderRadius: height < 44 ? 12 : 14,
              borderWidth: isOpen ? 1.5 : 1,
              borderColor: isOpen ? C.emerald : C.line,
              backgroundColor: C.white,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              gap: 10,
            }}>
            {icon ? <Icon name={icon} size={17} color={C.sub} /> : null}
            <Tx s={height < 44 ? 13 : 14} w="600" color={current ? C.ink : C.faint} lines={1} style={{ flex: 1 }}>
              {current?.label ?? placeholder}
            </Tx>
            <Icon name="down" size={16} color={C.sub} />
          </Pressable>
        )}>
        {(close) => (
          <View style={{ paddingVertical: 6 }}>
            {options.length ? (
              options.map((o) => (
                <MenuItem
                  key={o.value}
                  label={o.label}
                  sub={o.sub}
                  active={o.value === value}
                  onPress={() => {
                    onChange(o.value);
                    close();
                  }}
                />
              ))
            ) : (
              <View style={{ padding: 14 }}>
                <Tx s={13} color={C.sub}>—</Tx>
              </View>
            )}
            {footer ? <View style={{ borderTopWidth: 1, borderTopColor: C.line, marginTop: 6 }}>{footer(close)}</View> : null}
          </View>
        )}
      </Popover>
    </View>
  );
}

export function Progress({ pct, color = C.emerald, track = '#E7EFEA', h = 7 }: { pct: number; color?: string; track?: string; h?: number }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${v}%`, height: h, borderRadius: h, backgroundColor: color }} />
    </View>
  );
}

export type Col = { key: string; label: string; flex?: number; width?: number; align?: 'left' | 'right' | 'center' };

function colStyle(col: Col): ViewStyle {
  return {
    flex: col.width ? undefined : col.flex ?? 1,
    width: col.width,
    minWidth: 0,
    alignItems: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
  };
}

export function Table<T>({
  cols,
  rows,
  render,
  onRowPress,
  rowKey,
  empty,
  dense,
}: {
  cols: Col[];
  rows: T[];
  render: (row: T, col: Col, index: number) => ReactNode;
  onRowPress?: (row: T) => void;
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  dense?: boolean;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.head, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingHorizontal: 22, height: 40 }}>
        {cols.map((col) => (
          <View key={col.key} style={colStyle(col)}>
            <Tx s={11} w="700" color={C.faint} style={{ letterSpacing: 0.8, textTransform: 'uppercase' }} lines={1}>{col.label}</Tx>
          </View>
        ))}
      </View>
      {rows.length === 0 && empty ? <View style={{ padding: 22 }}>{empty}</View> : null}
      {rows.map((row, i) => (
        <Pressable
          key={rowKey(row, i)}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
          style={(state: PressState) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 22,
            minHeight: dense ? 52 : 62,
            paddingVertical: 8,
            borderBottomWidth: i === rows.length - 1 ? 0 : 1,
            borderBottomColor: C.line,
            backgroundColor: onRowPress && state.hovered ? C.head : C.white,
            cursor: onRowPress ? 'pointer' : 'auto',
          }) as ViewStyle}>
          {cols.map((col) => (
            <View key={col.key} style={colStyle(col)}>
              {render(row, col, i)}
            </View>
          ))}
        </Pressable>
      ))}
    </View>
  );
}

export function Cell({ title, sub, align, strong }: { title: ReactNode; sub?: ReactNode; align?: 'left' | 'right'; strong?: boolean }) {
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start', minWidth: 0 }}>
      <Tx s={14} w={strong ? '700' : '600'} lines={1} tabular>{title}</Tx>
      {sub ? <Tx s={12} color={C.sub} lines={1} style={{ marginTop: 2 }}>{sub}</Tx> : null}
    </View>
  );
}

export function Empty({ icon = 'leaf', title, sub, action }: { icon?: IconName; title: string; sub?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 8 }}>
      <IconTile name={icon} tone="green" size={46} />
      <Tx s={15} w="700" style={{ marginTop: 4, textAlign: 'center' }}>{title}</Tx>
      {sub ? <Tx s={13} color={C.sub} style={{ textAlign: 'center', maxWidth: 360 }}>{sub}</Tx> : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

export function Skeleton({ h = 18, w = '100%', r = 8, style }: { h?: number; w?: number | `${number}%`; r?: number; style?: ViewStyle }) {
  return <View style={[{ height: h, width: w, borderRadius: r, backgroundColor: '#E6EDE8' }, style]} />;
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: C.line }, style]} />;
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{ width: 46, height: 28, borderRadius: 14, padding: 3, backgroundColor: value ? C.emerald : '#D9E2DC', justifyContent: 'center' }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, alignSelf: value ? 'flex-end' : 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </Pressable>
  );
}

export function Avatar({ text, size = 38, tone = 'green' }: { text: string; size?: number; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone === 'lime' ? C.lime : t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Tx s={Math.round(size * 0.34)} w="700" color={tone === 'lime' ? C.forest : t.ink}>{text}</Tx>
    </View>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  width = 520,
}: PropsWithChildren<{ open: boolean; onClose: () => void; title: string; sub?: string; footer?: ReactNode; width?: number }>) {
  return (
    <Modal transparent visible={open} onRequestClose={onClose} animationType="fade">
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.overlay }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ width, maxWidth: '100%', backgroundColor: C.white, borderTopLeftRadius: 24, borderBottomLeftRadius: 24, boxShadow: '-20px 0 60px rgba(8,26,19,0.22)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 28, paddingTop: 26, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <View style={{ flex: 1 }}>
              <Tx s={22} w="800">{title}</Tx>
              {sub ? <Tx s={13} color={C.sub} style={{ marginTop: 4 }}>{sub}</Tx> : null}
            </View>
            <IconBtn icon="x" onPress={onClose} label="Close" />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, gap: 18 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? (
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 28, paddingVertical: 20, borderTopWidth: 1, borderTopColor: C.line }}>{footer}</View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.coralSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }}>
      <Icon name="alert" size={16} color={C.coral} />
      <Tx s={13} w="600" color={C.coralInk} style={{ flex: 1 }}>{message}</Tx>
    </View>
  );
}

type ToastItem = { id: number; text: string; tone: 'ok' | 'err' };
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'err') => void>(() => {});

export function ToastProvider({ children, position }: PropsWithChildren<{ position?: ViewStyle }>) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[{ position: 'absolute', right: 28, bottom: 28, gap: 10, zIndex: 100 }, position]}>
        {items.map((t) => (
          <View
            key={t.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.tone === 'ok' ? C.forest : C.coralInk, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, boxShadow: '0 14px 34px rgba(8,26,19,0.25)', maxWidth: 380 }}>
            <Icon name={t.tone === 'ok' ? 'check' : 'alert'} size={16} color={t.tone === 'ok' ? C.lime : C.white} sw={2.4} />
            <Tx s={13} w="600" color={C.white}>{t.text}</Tx>
          </View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

/** Icon + label + big number tile (Figma W04 / W11 stat row). */
export function StatTile({ icon, tone, label, value, sub, subColor }: { icon: IconName; tone: Tone; label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 220, minWidth: 0, backgroundColor: C.white, borderRadius: RADIUS, borderWidth: 1, borderColor: C.line, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
      <IconTile name={icon} tone={tone} size={46} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={12} color={C.sub} lines={1}>{label}</Tx>
        <Tx s={24} w="800" lines={1} tabular style={{ marginTop: 1 }}>{value}</Tx>
        {sub ? <Tx s={12} color={subColor ?? C.sub} lines={1}>{sub}</Tx> : null}
      </View>
    </View>
  );
}

/** Row of equal-width children that wraps to fewer columns on narrow screens. */
export function Grid({ cols, gap = 16, children, style }: PropsWithChildren<{ cols: number; gap?: number; style?: ViewStyle }>) {
  const list = (Array.isArray(children) ? children : [children]).filter(Boolean) as ReactNode[];
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>
      {list.map((child, i) => (
        <View key={i} style={{ flexBasis: `${100 / cols - 2}%`, flexGrow: 1, minWidth: 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
