import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { authApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { costDate, saleDate, useBatches, useBatchPl, useCosts, useItems, useRefreshAll, useSales, useUsers } from '@/components/dashboard/data';
import { MemberDrawer } from '@/components/dashboard/drawers';
import { downloadCsv, initials, isoDay, relativeTime } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Avatar, Btn, Card, CardHead, Empty, ErrorNote, Field, MenuItem, Pill, Popover, Segmented, Table, Toggle, Tx, useToast } from '@/components/dashboard/kit';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C, type Tone } from '@/components/dashboard/theme';
import { isOwnerFirm } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import type { User, UserRole } from '@/types/api';

type Tab = 'general' | 'team' | 'notifications' | 'security' | 'export' | 'help';
const NOTIFY_KEY = 'khamar.dashboard.notifications';
const ROLE_TONE: Partial<Record<UserRole, Tone>> = { owner: 'dark', admin: 'dark', farm_manager: 'green', accountant: 'gold', veterinarian: 'sky', farm_supervisor: 'violet' };
const ROLES: UserRole[] = ['admin', 'farm_manager', 'accountant', 'farm_supervisor', 'veterinarian', 'worker', 'salesperson'];
const userId = (u: User) => u.id ?? (u as unknown as { _id: string })._id;

export function WebSettings() {
  const { c } = useDash();
  const { user } = useAuth();
  const width = useContentWidth();
  const wide = width >= 1000;
  const [tab, setTab] = useState<Tab>('general');
  const [invite, setInvite] = useState(false);
  const canTeam = isOwnerFirm(user?.role);

  const nav: Array<{ key: Tab; label: string; icon: IconName; show: boolean }> = [
    { key: 'general', label: c.general, icon: 'settings', show: true },
    { key: 'team', label: c.teamRoles, icon: 'users', show: canTeam },
    { key: 'notifications', label: c.notifications, icon: 'bell', show: true },
    { key: 'security', label: c.security, icon: 'lock', show: true },
    { key: 'export', label: c.dataExport, icon: 'download', show: true },
    { key: 'help', label: c.help, icon: 'help', show: true },
  ];

  const top = <PageTop crumbs={[c.account, c.settings]} title={c.settings} actions={canTeam ? <Btn label={c.inviteMember} icon="plus" kind="lime" onPress={() => setInvite(true)} /> : null} />;

  return (
    <Page top={top}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Card pad={8} style={{ width: wide ? 220 : '100%', flexDirection: wide ? 'column' : 'row', flexWrap: 'wrap', gap: 2 }}>
          {nav.filter((n) => n.show).map((n) => {
            const active = tab === n.key;
            return (
              <Pressable
                key={n.key}
                onPress={() => setTab(n.key)}
                style={(state) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  height: 42,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: active ? C.canvas : (state as { hovered?: boolean }).hovered ? C.head : 'transparent',
                })}>
                <Icon name={n.icon} size={17} color={active ? C.padma : C.sub} />
                <Tx s={14} w={active ? '700' : '500'} color={active ? C.ink : C.sub}>{n.label}</Tx>
              </Pressable>
            );
          })}
        </Card>
        <View style={{ flex: 1, gap: 16, width: wide ? undefined : '100%' }}>
          {tab === 'general' ? (
            <>
              <LanguageCard />
              {canTeam ? <TeamCard limit={5} onManage={() => setTab('team')} /> : null}
              <NotificationsCard />
            </>
          ) : null}
          {tab === 'team' ? <TeamCard onInvite={() => setInvite(true)} /> : null}
          {tab === 'notifications' ? <NotificationsCard titled /> : null}
          {tab === 'security' ? <SecurityCard /> : null}
          {tab === 'export' ? <ExportCard /> : null}
          {tab === 'help' ? <HelpCard /> : null}
        </View>
      </View>
      <MemberDrawer open={invite} onClose={() => setInvite(false)} />
    </Page>
  );
}

function LanguageCard() {
  const { c } = useDash();
  const { locale, setLocale } = useLocale();
  const option = (key: 'bn' | 'en', glyph: string, title: string, sub: string) => {
    const active = locale === key;
    return (
      <Pressable
        onPress={() => setLocale(key)}
        style={{ flexGrow: 1, flexBasis: 180, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, padding: 14 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: active ? C.lime : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
          <Tx s={15} w="800" color={active ? C.forest : C.ink}>{glyph}</Tx>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tx s={15} w="800" color={active ? C.white : C.ink}>{title}</Tx>
          <Tx s={12} color={active ? 'rgba(255,255,255,0.65)' : C.sub} lines={2}>{sub}</Tx>
        </View>
        {active ? (
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={12} color={C.forest} sw={3} />
          </View>
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#C9D6CE' }} />
        )}
      </Pressable>
    );
  };
  return (
    <Card>
      <CardHead title={c.langAppearance} sub={c.langSub} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {option('bn', 'অ', c.bangla, c.banglaSub)}
        {option('en', 'A', c.english, c.englishSub)}
        <View style={{ flexGrow: 1, flexBasis: 220 }}>
          <Tx s={13} w="600" style={{ marginBottom: 8 }}>{c.theme}</Tx>
          <Segmented
            size="lg"
            value="light"
            onChange={() => {}}
            options={[
              { key: 'light', label: c.light },
              { key: 'dark', label: c.dark, disabled: true },
              { key: 'system', label: c.system, disabled: true },
            ]}
          />
        </View>
      </View>
    </Card>
  );
}

function TeamCard({ limit, onManage, onInvite }: { limit?: number; onManage?: () => void; onInvite?: () => void }) {
  const { c, lang } = useDash();
  const { user } = useAuth();
  const toast = useToast();
  const refresh = useRefreshAll();
  const usersQ = useUsers(true);
  const users = usersQ.data ?? [];
  const rows = limit ? users.slice(0, limit) : users;

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<{ role: UserRole; isActive: boolean }> }) => authApi.updateUser(id, payload),
    onSuccess: async () => {
      await refresh('users');
      toast(c.saved);
    },
    onError: (e) => toast(getApiErrorMessage(e), 'err'),
  });

  return (
    <Card pad={0}>
      <CardHead
        title={c.teamRoles}
        sub={c.teamSub(users.length)}
        right={onManage ? <Btn label={c.manage} size="sm" onPress={onManage} /> : onInvite ? <Btn label={c.inviteMember} icon="plus" size="sm" onPress={onInvite} /> : null}
        style={{ padding: 20, paddingBottom: 14 }}
      />
      <Table
        rows={rows}
        rowKey={(u) => userId(u)}
        empty={<Empty icon="users" title={c.loading} />}
        cols={[
          { key: 'member', label: c.member, flex: 2 },
          { key: 'role', label: c.role, flex: 1 },
          { key: 'access', label: c.farmAccess, flex: 1.1 },
          { key: 'last', label: c.lastActive, flex: 1 },
          { key: 'more', label: '', width: 36, align: 'center' },
        ]}
        render={(u, col) => {
          if (col.key === 'member')
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: u.isActive === false ? 0.5 : 1 }}>
                <Avatar text={initials(u.name)} size={36} />
                <View style={{ flexShrink: 1, minWidth: 0 }}>
                  <Tx s={14} w="700" lines={1}>{u.name}</Tx>
                  <Tx s={12} color={C.sub} lines={1}>{u.email || u.phone}</Tx>
                </View>
              </View>
            );
          if (col.key === 'role') {
            const tone = ROLE_TONE[u.role] ?? 'gray';
            return u.isActive === false ? <Pill label={c.inactive} tone="coral" /> : <Pill label={c.roles[u.role] ?? u.role} tone={tone} solid={tone === 'dark'} />;
          }
          if (col.key === 'access') return <Tx s={13} color={C.sub}>{c.allFarms}</Tx>;
          if (col.key === 'last') return <Tx s={13} color={C.sub}>{u.lastLoginAt ? relativeTime(u.lastLoginAt, lang) : c.never}</Tx>;
          const self = userId(u) === user?.id;
          if (self || u.role === 'owner') return null;
          return (
            <Popover
              width={230}
              align="right"
              trigger={(open) => (
                <Pressable onPress={open} hitSlop={8} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="dots" size={18} color={C.sub} />
                </Pressable>
              )}>
              {(close) => (
                <View style={{ paddingVertical: 6 }}>
                  {ROLES.map((r) => (
                    <MenuItem key={r} label={c.roles[r] ?? r} active={u.role === r} onPress={() => { close(); if (u.role !== r) update.mutate({ id: userId(u), payload: { role: r } }); }} />
                  ))}
                  <View style={{ height: 1, backgroundColor: C.line, marginVertical: 6 }} />
                  <MenuItem
                    icon={u.isActive === false ? 'check' : 'x'}
                    label={u.isActive === false ? c.activate : c.deactivate}
                    onPress={() => { close(); update.mutate({ id: userId(u), payload: { isActive: u.isActive === false } }); }}
                  />
                </View>
              )}
            </Popover>
          );
        }}
      />
    </Card>
  );
}

type Notify = { lowStock: boolean; morning: boolean; dues: boolean };

function NotificationsCard({ titled }: { titled?: boolean }) {
  const { c } = useDash();
  const [n, setN] = useState<Notify>({ lowStock: true, morning: true, dues: false });
  useEffect(() => {
    AsyncStorage.getItem(NOTIFY_KEY).then((raw) => raw && setN((p) => ({ ...p, ...JSON.parse(raw) })));
  }, []);
  const flip = (k: keyof Notify) => (v: boolean) => {
    const next = { ...n, [k]: v };
    setN(next);
    AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
  };
  const rows: Array<{ k: keyof Notify; icon: IconName; title: string; sub: string }> = [
    { k: 'lowStock', icon: 'box', title: c.lowStockAlerts, sub: c.lowStockAlertsSub },
    { k: 'morning', icon: 'sun', title: c.morningSummary, sub: c.morningSummarySub },
    { k: 'dues', icon: 'cash', title: c.dueReminders, sub: c.dueRemindersSub },
  ];
  return (
    <Card pad={20}>
      {titled ? <Tx s={17} w="700" style={{ marginBottom: 8 }}>{c.notifications}</Tx> : null}
      {rows.map((r, i) => (
        <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={r.icon} size={16} color={C.sub} />
          </View>
          <View style={{ flex: 1 }}>
            <Tx s={14} w="700">{r.title}</Tx>
            <Tx s={12} color={C.sub}>{r.sub}</Tx>
          </View>
          <Toggle value={n[r.k]} onChange={flip(r.k)} />
        </View>
      ))}
    </Card>
  );
}

function SecurityCard() {
  const { c } = useDash();
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const m = useMutation({
    mutationFn: () => authApi.changePassword(cur, next),
    onSuccess: () => {
      setCur('');
      setNext('');
      toast(c.passwordChanged);
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  return (
    <Card style={{ gap: 16 }}>
      <CardHead title={c.changePassword} />
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
        <Field label={c.currentPassword} value={cur} onChangeText={setCur} secure icon="lock" style={{ flex: 1, minWidth: 220 }} />
        <Field label={c.newPassword} value={next} onChangeText={setNext} secure icon="lock" style={{ flex: 1, minWidth: 220 }} />
      </View>
      <ErrorNote message={error} />
      <Btn
        label={c.changePassword}
        kind="dark"
        loading={m.isPending}
        disabled={!cur || !next}
        onPress={() => {
          setError('');
          if (next.length < 6) return setError(c.passwordMin);
          m.mutate();
        }}
        style={{ alignSelf: 'flex-start' }}
      />
    </Card>
  );
}

function ExportCard() {
  const { c } = useDash();
  const sales = useSales();
  const costs = useCosts();
  const batches = useBatches();
  const batchPl = useBatchPl();
  const items = useItems();
  const row = (icon: IconName, label: string, onPress: () => void, ready: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={C.padma} />
      </View>
      <Tx s={14} w="700" style={{ flex: 1 }}>{label}</Tx>
      <Btn label={c.export} icon="download" size="sm" disabled={!ready} onPress={onPress} />
    </View>
  );
  return (
    <Card>
      <CardHead title={c.dataExport} sub={c.exportSub} />
      <View style={{ marginTop: 12 }}>
        {row('receipt', c.exportSales, () => downloadCsv('sales.csv', [
          ['Invoice', 'Date', 'Items', 'Total', 'Received', 'Due', 'Notes'],
          ...(sales.data ?? []).map((s) => [s.saleNumber, isoDay(saleDate(s) ?? new Date()), (s.items ?? []).map((i) => `${i.itemName} ${i.quantity} ${i.unit}`).join('; '), s.totalAmount, s.receivedAmount ?? '', s.receivableAmount ?? '', s.notes ?? '']),
        ]), Boolean(sales.data))}
        {row('cash', c.exportCosts, () => downloadCsv('costs.csv', [
          ['Date', 'Category', 'Quantity', 'Unit', 'Rate', 'Amount', 'Scope', 'Note'],
          ...(costs.data ?? []).map((x) => [isoDay(costDate(x) ?? new Date()), x.categoryName ?? '', x.quantity, x.unit, x.rate, x.totalAmount, x.scope ?? '', x.description ?? '']),
        ]), Boolean(costs.data))}
        {row('bird', c.exportBatches, () => downloadCsv('poultry-batches.csv', [
          ['Batch', 'Type', 'Placed', 'Initial', 'Alive', 'Deaths', 'Total cost', 'P/L', 'Status'],
          ...(batches.data ?? []).map((b) => [b.batchName, b.birdType, isoDay(new Date(b.purchaseDate)), b.initialQuantity, b.currentQuantity, b.mortalityCount ?? 0, b.totalCost ?? '', batchPl(b), b.status ?? '']),
        ]), Boolean(batches.data))}
        {row('box', c.exportStock, () => downloadCsv('stock.csv', [
          ['Item', 'Category', 'Stock', 'Unit', 'Min', 'Unit cost'],
          ...(items.data ?? []).map((i) => [i.name, i.category, i.currentStock, i.unit, i.minStockLevel ?? '', i.unitCost ?? '']),
        ]), Boolean(items.data))}
      </View>
    </Card>
  );
}

function HelpCard() {
  const { c } = useDash();
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: C.limeSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="help" size={22} color={C.padma} />
      </View>
      <View style={{ flex: 1, minWidth: 220 }}>
        <Tx s={16} w="800">{c.help}</Tx>
        <Tx s={13} color={C.sub}>{c.helpSub}</Tx>
      </View>
      <Btn label="WhatsApp" icon="send" kind="lime" onPress={() => Linking.openURL('https://wa.me/8801700000000')} />
    </Card>
  );
}