import { Stack, usePathname, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { type DashCopy } from '@/components/dashboard/copy';
import { useBatches, useCustomers, useDashboard, useFarms, useItems, useSales, due, batchTitle, isActiveBatch } from '@/components/dashboard/data';
import { bdt, initials, num } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Avatar, Btn, IconBtn, IconTile, MenuItem, Popover, ToastProvider, Tx } from '@/components/dashboard/kit';
import { C, FONT, SIDEBAR_W, TOPBAR_H } from '@/components/dashboard/theme';
import { useDash } from '@/components/dashboard/use-dash';
import { Contours } from '@/components/web-landing/graphics';
import { isWebsite } from '@/lib/app-target';
import { downloadApk } from '@/lib/download-apk';
import { useAuth } from '@/providers/auth-provider';

type PressState = PressableStateCallbackType & { hovered?: boolean };

export const DESKTOP_MIN = 960;

export function useDesktopWeb() {
  const { width } = useWindowDimensions();
  return isWebsite && width >= DESKTOP_MIN;
}

export { useDash };

/** Usable content width next to the sidebar; screens use it to pick column counts. */
export function useContentWidth() {
  const { width } = useWindowDimensions();
  return Math.max(640, width - SIDEBAR_W - 64);
}

export function useWebFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'khamar-landing-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+Bengali:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

type NavKey = keyof Pick<DashCopy, 'dashboard' | 'livestock' | 'farms' | 'stock' | 'sell' | 'sales' | 'hisab' | 'customers' | 'organization' | 'settings'>;

const NAV: Array<{ group: keyof Pick<DashCopy, 'overview' | 'farm' | 'money' | 'account'>; items: Array<{ key: NavKey; href: Href; icon: IconName; match: RegExp }> }> = [
  { group: 'overview', items: [{ key: 'dashboard', href: '/(app)', icon: 'grid', match: /^\/?$/ }] },
  {
    group: 'farm',
    items: [
      { key: 'livestock', href: '/(app)/livestock', icon: 'bird', match: /^\/(livestock|poultry|cattle)/ },
      { key: 'farms', href: '/(app)/farms', icon: 'barn', match: /^\/farms/ },
      { key: 'stock', href: '/(app)/inventory', icon: 'box', match: /^\/inventory/ },
    ],
  },
  {
    group: 'money',
    items: [
      { key: 'sell', href: '/(app)/sell', icon: 'cash', match: /^\/sell/ },
      { key: 'sales', href: '/(app)/sales', icon: 'receipt', match: /^\/sales/ },
      { key: 'hisab', href: '/(app)/hisab', icon: 'file', match: /^\/hisab/ },
      { key: 'customers', href: '/(app)/customers', icon: 'users', match: /^\/customers/ },
    ],
  },
  {
    group: 'account',
    items: [
      { key: 'organization', href: '/(app)/organization', icon: 'briefcase', match: /^\/organization/ },
      { key: 'settings', href: '/(app)/settings', icon: 'settings', match: /^\/(settings|more)/ },
    ],
  },
];

export function DashboardShell() {
  useWebFonts();
  return (
    <ToastProvider>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.canvas }}>
        <Sidebar />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: C.canvas } }} />
        </View>
      </View>
    </ToastProvider>
  );
}

function Sidebar() {
  const { c } = useDash();
  const { user, organization, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const farms = useFarms();
  const dash = useDashboard();
  const lowCount = dash.data?.alerts.lowStockItems?.length ?? 0;
  const farmCount = farms.data?.length ?? 1;

  return (
    <View style={{ width: SIDEBAR_W, backgroundColor: C.forest, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0 }}>
        <Contours w={SIDEBAR_W + 60} h={420} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, transform: [{ scaleY: -1 }] }}>
        <Contours w={SIDEBAR_W + 60} h={300} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 24, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12.8, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="leaf" size={22} color={C.forest} sw={2.3} />
          </View>
          <View>
            <Tx s={15} w="800" color={C.white}>Khamar Manager</Tx>
            <Tx s={12} color="rgba(255,255,255,0.5)">{c.webDashboard}</Tx>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/farms')}
          style={(state: PressState) => ({
            marginTop: 22,
            height: 56,
            borderRadius: 16,
            backgroundColor: state.hovered ? C.forest3 : C.forest2,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            gap: 10,
          })}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.forest3, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="barn" size={16} color={C.lime} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={13} w="700" color={C.white} lines={1}>{organization?.name ?? 'Khamar'}</Tx>
            <Tx s={11} color="rgba(255,255,255,0.55)" lines={1}>
              {[organization?.district, c.farmsCount(farmCount)].filter(Boolean).join(' · ')}
            </Tx>
          </View>
          <Icon name="right" size={15} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {NAV.map((section) => (
          <View key={section.group} style={{ marginTop: 22 }}>
            <Tx s={11} w="700" color="rgba(255,255,255,0.38)" style={{ letterSpacing: 0.9, textTransform: 'uppercase', marginLeft: 12, marginBottom: 8 }}>
              {c[section.group]}
            </Tx>
            {section.items.map((item) => {
              const active = item.match.test(pathname);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.navigate(item.href)}
                  style={(state: PressState) => ({
                    height: 42,
                    borderRadius: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 12,
                    marginBottom: 2,
                    backgroundColor: active ? C.lime : state.hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
                  })}>
                  <Icon name={item.icon} size={19} color={active ? C.forest : 'rgba(255,255,255,0.86)'} sw={active ? 2.2 : 1.9} />
                  <Tx s={14} w={active ? '700' : '600'} color={active ? C.forest : 'rgba(255,255,255,0.78)'} style={{ flex: 1 }}>
                    {c[item.key]}
                  </Tx>
                  {item.key === 'stock' && lowCount > 0 ? (
                    <View style={{ minWidth: 23, height: 20, borderRadius: 999, backgroundColor: C.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                      <Tx s={11} w="700" color={C.white}>{lowCount}</Tx>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
        <View style={{ backgroundColor: C.forest2, borderRadius: 16, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="android" size={16} color={C.forest} />
            </View>
            <View>
              <Tx s={13} w="700" color={C.white}>{c.androidApp}</Tx>
              <Tx s={11} color="rgba(255,255,255,0.55)">{c.sameLogin}</Tx>
            </View>
          </View>
          <Btn label={c.downloadApk} icon="download" kind="lime" size="sm" onPress={downloadApk} style={{ marginTop: 12 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar text={initials(user?.name)} size={36} tone="lime" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={13} w="700" color={C.white} lines={1}>{user?.name}</Tx>
            <Tx s={11} color="rgba(255,255,255,0.55)" lines={1}>{user ? c.roles[user.role] : ''}</Tx>
          </View>
          <Pressable onPress={() => logout()} accessibilityLabel={c.signOut} hitSlop={8} style={(state: PressState) => ({ padding: 6, borderRadius: 8, backgroundColor: state.hovered ? 'rgba(255,255,255,0.08)' : 'transparent' })}>
            <Icon name="logout" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function PageTop({ crumbs, title, actions }: { crumbs: string[]; title: string; actions?: ReactNode }) {
  const { c } = useDash();
  const [palette, setPalette] = useState(false);
  const roomy = useWindowDimensions().width >= 1280;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <View style={{ height: TOPBAR_H, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 16, zIndex: 10 }}>
      <View style={{ flex: 1, minWidth: 170 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {crumbs.map((cr, i) => (
            <View key={`${cr}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {i > 0 ? <Icon name="right" size={12} color={C.faint} /> : null}
              <Tx s={12} w="500" color={C.sub} lines={1}>{cr}</Tx>
            </View>
          ))}
        </View>
        <Tx s={22} w="800" lines={1} style={{ marginTop: 2 }}>{title}</Tx>
      </View>
      <Pressable
        onPress={() => setPalette(true)}
        accessibilityLabel={c.searchPlaceholder}
        style={(state: PressState) => ({
          width: roomy ? 236 : 42,
          height: 42,
          borderRadius: 13,
          backgroundColor: state.hovered ? '#E8EEEA' : C.canvas,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: roomy ? 'flex-start' : 'center',
          paddingHorizontal: roomy ? 13 : 0,
          gap: 9,
        })}>
        <Icon name="search" size={16} color={roomy ? C.faint : C.ink} />
        {roomy ? (
          <>
            <Tx s={13} color={C.faint} style={{ flex: 1 }} lines={1}>{c.searchPlaceholder}</Tx>
            <View style={{ borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Tx s={10} w="700" color={C.sub}>Ctrl K</Tx>
            </View>
          </>
        ) : null}
      </Pressable>
      <Bell />
      {actions}
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </View>
  );
}

function Bell() {
  const { c } = useDash();
  const router = useRouter();
  const dash = useDashboard();
  const sales = useSales();
  const low = dash.data?.alerts.lowStockItems ?? [];
  const owing = (sales.data ?? []).filter((s) => due(s) > 0);
  const dueTotal = owing.reduce((a, s) => a + due(s), 0);
  const buyers = new Set(owing.map((s) => (typeof s.customerId === 'object' && s.customerId ? s.customerId._id : s.customerId ?? s._id))).size;
  const has = low.length > 0 || owing.length > 0;
  return (
    <Popover
      width={340}
      align="right"
      trigger={(open) => <IconBtn icon="bell" onPress={open} dot={has} label={c.notifications} />}>
      {(close) => (
        <View style={{ paddingVertical: 8 }}>
          <Tx s={13} w="700" style={{ paddingHorizontal: 14, paddingVertical: 8 }}>{c.notifications}</Tx>
          {!has ? <Tx s={13} color={C.sub} style={{ paddingHorizontal: 14, paddingBottom: 12 }}>{c.allClear}</Tx> : null}
          {low.slice(0, 5).map((item) => (
            <MenuItem
              key={item._id}
              icon="alert"
              tone="coral"
              label={c.lowStockNote(item.name, `${num(item.currentStock)} ${item.unit}`)}
              onPress={() => {
                close();
                router.navigate('/(app)/inventory');
              }}
            />
          ))}
          {owing.length ? (
            <MenuItem
              icon="wallet"
              tone="gold"
              label={c.dueNote(buyers, bdt(dueTotal))}
              onPress={() => {
                close();
                router.navigate('/(app)/customers');
              }}
            />
          ) : null}
        </View>
      )}
    </Popover>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <PaletteBody onClose={onClose} />;
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { c } = useDash();
  const router = useRouter();
  const [q, setQ] = useState('');
  const inputRef = useRef<TextInput>(null);
  const batches = useBatches();
  const customers = useCustomers();
  const items = useItems();

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);

  const go = (href: Href) => {
    onClose();
    router.navigate(href);
  };

  const needle = q.trim().toLowerCase();
  const results = useMemo(() => {
    const pages = NAV.flatMap((s) => s.items).filter((i) => !needle || c[i.key].toLowerCase().includes(needle));
    const bs = (batches.data ?? []).filter((b) => needle && `${batchTitle(b)} ${b.birdType}`.toLowerCase().includes(needle)).slice(0, 5);
    const cs = (customers.data ?? []).filter((x) => needle && `${x.name} ${x.phone ?? ''}`.toLowerCase().includes(needle)).slice(0, 5);
    const its = (items.data ?? []).filter((x) => needle && x.name.toLowerCase().includes(needle)).slice(0, 5);
    return { pages, bs, cs, its };
  }, [needle, batches.data, customers.data, items.data, c]);

  const none = !results.pages.length && !results.bs.length && !results.cs.length && !results.its.length;
  const inputStyle = { flex: 1, fontFamily: FONT, fontSize: 16, fontWeight: '500', color: C.ink, height: 56, outlineStyle: 'none' } as unknown as TextStyle;

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: C.overlay, alignItems: 'center', paddingTop: 110 }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: 620, maxWidth: '92%', maxHeight: '70%', backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(8,26,19,0.3)' } as ViewStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <Icon name="search" size={19} color={C.sub} />
            <TextInput ref={inputRef} value={q} onChangeText={setQ} placeholder={c.searchHint} placeholderTextColor={C.faint} style={inputStyle} />
            <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Tx s={10} w="700" color={C.sub}>Esc</Tx>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
            {none ? <Tx s={14} color={C.sub} style={{ padding: 18 }}>{c.noResults}</Tx> : null}
            {results.pages.length ? <Group label={c.pages} /> : null}
            {results.pages.map((p) => (
              <MenuItem key={p.key} icon={p.icon} label={c[p.key]} onPress={() => go(p.href)} />
            ))}
            {results.bs.length ? <Group label={c.batches} /> : null}
            {results.bs.map((b) => (
              <MenuItem key={b._id} icon="bird" tone="lime" label={batchTitle(b)} sub={`${b.birdType} · ${num(b.currentQuantity)} ${c.aliveShort}${isActiveBatch(b) ? '' : ` · ${c.closed}`}`} onPress={() => go(`/(app)/poultry/${b._id}` as Href)} />
            ))}
            {results.cs.length ? <Group label={c.customers} /> : null}
            {results.cs.map((x) => (
              <MenuItem key={x._id} icon="user" tone="gold" label={x.name} sub={x.phone} onPress={() => go({ pathname: '/(app)/customers', params: { id: x._id } } as Href)} />
            ))}
            {results.its.length ? <Group label={c.items} /> : null}
            {results.its.map((x) => (
              <MenuItem key={x._id} icon="box" tone="green" label={x.name} sub={`${num(x.currentStock)} ${x.unit}`} onPress={() => go('/(app)/inventory')} />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Group({ label }: { label: string }) {
  return (
    <Tx s={11} w="700" color={C.faint} style={{ letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
      {label}
    </Tx>
  );
}

/** Scrollable page body under the top bar, padded like the Figma frames (32 / 28). */
export function Page({ children, top }: { children: ReactNode; top: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      {top}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 28, paddingBottom: 48, gap: 16 }}>
        {children}
      </ScrollView>
    </View>
  );
}

export function Row({ children, gap = 16, style }: { children: ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', gap, alignItems: 'stretch' }, style]}>{children}</View>;
}

export function LoadingPage({ top }: { top: ReactNode }) {
  const { c } = useDash();
  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 150, borderRadius: 22, backgroundColor: '#E6EDE8' }} />
        ))}
      </View>
      <View style={{ height: 360, borderRadius: 22, backgroundColor: '#E6EDE8', alignItems: 'center', justifyContent: 'center' }}>
        <IconTile name="leaf" tone="green" size={44} />
        <Tx s={13} color={C.sub} style={{ marginTop: 10 }}>{c.loading}</Tx>
      </View>
    </Page>
  );
}
