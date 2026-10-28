import { useDesktopWeb, WebSettings } from '@/components/dashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Share, View } from 'react-native';

import { authApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { costDate, saleDate, useBatchPl, useBatches, useCosts, useItems, useSales } from '@/components/dashboard/data';
import { downloadCsv, isoDay } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { useToast } from '@/components/dashboard/kit';
import { C, type Tone } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { ListCard, MButton, MField, MScreen, MSegmented, NavHeader, Notice, Sheet, SheetRow, ToneTile, Tx } from '@/components/mobile/kit';
import type { Locale } from '@/i18n/translations';

const NOTIFY_KEY = 'khamar.dashboard.notifications';
const SUPPORT_PHONE = '+8801700000000';

type Notify = { lowStock: boolean; morning: boolean; dues: boolean };
type Rows = Array<Array<string | number | null | undefined>>;

function exportCsv(filename: string, rows: Rows) {
  if (Platform.OS === 'web') return downloadCsv(filename, rows);
  const body = rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  Share.share({ title: filename, message: body }).catch(() => undefined);
}

function SettingsScreen() {
  const { c, lang, setLocale } = useM();
  const toast = useToast();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [n, setN] = useState<Notify>({ lowStock: true, morning: true, dues: false });
  const [sheet, setSheet] = useState<'password' | 'export' | 'help' | null>(null);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');

  const sales = useSales();
  const costs = useCosts();
  const batches = useBatches();
  const batchPl = useBatchPl();
  const items = useItems();

  useEffect(() => {
    AsyncStorage.getItem(NOTIFY_KEY).then((raw) => raw && setN((p) => ({ ...p, ...JSON.parse(raw) })));
  }, []);
  const flip = (k: keyof Notify) => {
    const v = { ...n, [k]: !n[k] };
    setN(v);
    AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(v));
  };

  const password = useMutation({
    mutationFn: () => authApi.changePassword(cur, next),
    onSuccess: () => {
      setCur('');
      setNext('');
      setSheet(null);
      toast(c.passwordChanged);
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const notifications: Array<{ k: keyof Notify; icon: IconName; tone: Tone; title: string; sub: string }> = [
    { k: 'lowStock', icon: 'box', tone: 'gold', title: c.lowStockAlerts, sub: c.lowStockAlertsSub2 },
    { k: 'morning', icon: 'sun', tone: 'lime', title: c.morningSummary, sub: c.morningSummarySub },
    { k: 'dues', icon: 'cash', tone: 'sky', title: c.dueReminders, sub: c.dueRemindersSub2 },
  ];

  return (
    <MScreen header={<NavHeader title={c.settings} />} gap={12}>
      <Caption text={c.language} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <LangCard glyph="অ" title="বাংলা" sub={c.defaultBangla} active={lang === 'bn'} onPress={() => setLocale('bn' as Locale)} />
        <LangCard glyph="A" title="English" sub={c.englishLabel} active={lang === 'en'} onPress={() => setLocale('en' as Locale)} />
      </View>

      <Caption text={c.appearance} />
      <MSegmented
        value="light"
        onChange={() => undefined}
        options={[
          { key: 'light', label: c.light },
          { key: 'dark', label: c.dark },
          { key: 'system', label: c.system },
        ]}
      />

      <Caption text={c.notifications} />
      <ListCard>
        {notifications.map((r) => (
          <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 17, paddingVertical: 14 }}>
            <ToneTile icon={r.icon} tone={r.tone} size={36} radius={12} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Tx s={14} w="600">{r.title}</Tx>
              <Tx s={12} w="500" color={C.sub} style={{ marginTop: 1 }}>{r.sub}</Tx>
            </View>
            <Toggle value={n[r.k]} onPress={() => flip(r.k)} label={r.title} />
          </View>
        ))}
      </ListCard>

      <Caption text={c.accountData} />
      <ListCard>
        <LinkRow icon="lock" title={c.changePassword} onPress={() => { setError(''); setSheet('password'); }} />
        <LinkRow icon="download" title={c.exportData} sub={c.exportDataSub} onPress={() => setSheet('export')} />
        <LinkRow icon="help" title={c.helpSupport} sub={c.helpSupportSub} onPress={() => setSheet('help')} />
      </ListCard>

      <View style={{ alignItems: 'center', marginTop: 18, gap: 4 }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <Icon name="leaf" size={22} color={C.lime} />
        </View>
        <Tx s={13} w="700">{c.appName}</Tx>
        <Tx s={12} w="500" color={C.faint}>{c.footerTag(appVersion)}</Tx>
      </View>

      <Sheet open={sheet === 'password'} onClose={() => setSheet(null)} title={c.changePassword}>
        <View style={{ gap: 14 }}>
          <MField label={c.currentPassword} icon="lock" value={cur} onChangeText={setCur} secure />
          <MField label={c.newPassword} icon="lock" value={next} onChangeText={setNext} secure />
          <Notice message={error} />
          <MButton
            label={c.changePassword}
            kind="dark"
            loading={password.isPending}
            disabled={!cur || !next}
            onPress={() => {
              setError('');
              if (next.length < 6) return setError(c.passwordMin);
              password.mutate();
            }}
          />
        </View>
      </Sheet>

      <Sheet open={sheet === 'export'} onClose={() => setSheet(null)} title={c.exportData}>
        <SheetRow
          label={c.exportSales}
          icon="receipt"
          onPress={() =>
            exportCsv('sales.csv', [
              ['Invoice', 'Date', 'Items', 'Total', 'Received', 'Due', 'Notes'],
              ...(sales.data ?? []).map((s) => [s.saleNumber, isoDay(saleDate(s) ?? new Date()), (s.items ?? []).map((i) => `${i.itemName} ${i.quantity} ${i.unit}`).join('; '), s.totalAmount, s.receivedAmount ?? '', s.receivableAmount ?? '', s.notes ?? '']),
            ])
          }
        />
        <SheetRow
          label={c.exportCosts}
          icon="cash"
          tone="gold"
          onPress={() =>
            exportCsv('costs.csv', [
              ['Date', 'Category', 'Quantity', 'Unit', 'Rate', 'Amount', 'Scope', 'Note'],
              ...(costs.data ?? []).map((x) => [isoDay(costDate(x) ?? new Date()), x.categoryName ?? '', x.quantity, x.unit, x.rate, x.totalAmount, x.scope ?? '', x.description ?? '']),
            ])
          }
        />
        <SheetRow
          label={c.exportBatches}
          icon="bird"
          tone="lime"
          onPress={() =>
            exportCsv('poultry-batches.csv', [
              ['Batch', 'Type', 'Placed', 'Initial', 'Alive', 'Deaths', 'Total cost', 'P/L', 'Status'],
              ...(batches.data ?? []).map((b) => [b.batchName, b.birdType, isoDay(new Date(b.purchaseDate)), b.initialQuantity, b.currentQuantity, b.mortalityCount ?? 0, b.totalCost ?? '', batchPl(b), b.status ?? '']),
            ])
          }
        />
        <SheetRow
          label={c.exportStock}
          icon="box"
          tone="sky"
          onPress={() =>
            exportCsv('stock.csv', [
              ['Item', 'Category', 'Stock', 'Unit', 'Min', 'Unit cost'],
              ...(items.data ?? []).map((i) => [i.name, i.category, i.currentStock, i.unit, i.minStockLevel ?? '', i.unitCost ?? '']),
            ])
          }
        />
      </Sheet>

      <Sheet open={sheet === 'help'} onClose={() => setSheet(null)} title={c.helpSupport}>
        <SheetRow label="WhatsApp" sub={c.helpSub} icon="send" tone="lime" onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`).catch(() => undefined)} />
        <SheetRow label={c.callTeam} sub={SUPPORT_PHONE} icon="phone" onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => undefined)} />
      </Sheet>
    </MScreen>
  );
}

function Caption({ text }: { text: string }) {
  return <Tx s={11} w="700" color={C.sub} style={{ letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 10 }}>{text}</Tx>;
}

function LangCard({ glyph, title, sub, active, onPress }: { glyph: string; title: string; sub: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({ flex: 1, minHeight: 120, borderRadius: 20, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, padding: 17, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: active ? C.lime : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
          <Tx s={14} w="800" color={active ? C.forest : C.ink}>{glyph}</Tx>
        </View>
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? C.lime : C.line, backgroundColor: active ? C.lime : C.white, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          {active ? <Icon name="check" size={12} color={C.forest} /> : null}
        </View>
      </View>
      <Tx s={15} w="700" color={active ? C.white : C.ink} style={{ marginTop: 12 }}>{title}</Tx>
      <Tx s={12} w="500" color={active ? 'rgba(255,255,255,0.6)' : C.sub} style={{ marginTop: 2 }}>{sub}</Tx>
    </Pressable>
  );
}

function Toggle({ value, onPress, label }: { value: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={6}
      style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: value ? C.emerald : '#D3DCD7', padding: 3, alignItems: value ? 'flex-end' : 'flex-start' }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
    </Pressable>
  );
}

function LinkRow({ icon, title, sub, onPress }: { icon: IconName; title: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 17, paddingVertical: 13, minHeight: 62, backgroundColor: pressed ? C.head : 'transparent' })}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={C.padma} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={14} w="600">{title}</Tx>
        {sub ? <Tx s={12} w="500" color={C.sub} style={{ marginTop: 1 }}>{sub}</Tx> : null}
      </View>
      <Icon name="right" size={16} color={C.faint} />
    </Pressable>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebSettings /> : <SettingsScreen />;
}
