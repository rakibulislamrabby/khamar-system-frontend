import { useDesktopWeb, WebHome } from '@/components/dashboard';
import { useMutation } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { domainApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { AreaSpark, SparkBars } from '@/components/dashboard/charts';
import {
  batchCycle,
  batchTitle,
  change,
  customerName,
  due,
  isActiveBatch,
  isLow,
  itemVisual,
  lastDays,
  liveSales,
  mortalityPct,
  periodRange,
  saleProduct,
  sum,
  totalsFor,
  useBatches,
  useBatchPl,
  useCosts,
  useCows,
  useCustomers,
  useDashboard,
  useEggs,
  useFarms,
  useItems,
  useMilk,
  useRefreshAll,
  useSales,
} from '@/components/dashboard/data';
import { bdt, dayMonth, initials, isoDay, monthName, num, pct, titleCase, toDate } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { useToast } from '@/components/dashboard/kit';
import { C, type Tone } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  Bar,
  CircleBtn,
  EmptyCard,
  ListCard,
  MButton,
  MCard,
  MDateField,
  MField,
  MPill,
  MScreen,
  MSelect,
  Notice,
  SectionHead,
  Sheet,
  SheetRow,
  ToneTile,
  Tx,
} from '@/components/mobile/kit';
import { resolveId } from '@/lib/ids';
import { cattleLogic, daysOnFeed, isFatteningAnimal, weightGain } from '@/lib/cattle';
import { canWriteCattle, canWriteCost, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { Cow, PoultryBatch } from '@/types/api';

function QuickAction({ icon, tone, label, onPress }: { icon: IconName; tone: Tone; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, height: 94, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', paddingTop: 15, gap: 8, opacity: pressed ? 0.85 : 1 })}>
      <ToneTile icon={icon} tone={tone} size={42} radius={14} />
      <Tx s={12} w="600" lines={1}>{label}</Tx>
    </Pressable>
  );
}

function ProdTile({ icon, tone, value, sub, today, vals, color, muted }: { icon: IconName; tone: Tone; value: string; sub: string; today: string; vals: number[]; color: string; muted: string }) {
  return (
    <MCard pad={17} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToneTile icon={icon} tone={tone} size={34} radius={11} />
        <Tx s={12} color={C.sub}>{today}</Tx>
      </View>
      <Tx s={26} w="800" tabular style={{ marginTop: 12, letterSpacing: -1, lineHeight: 32 }}>{value}</Tx>
      <Tx s={12} color={C.sub} lines={1}>{sub}</Tx>
      <View style={{ marginTop: 12 }}>
        <SparkBars vals={vals} color={color} muted={muted} w={130} h={34} />
      </View>
    </MCard>
  );
}

function StatTileM({ icon, tone, label, value, sub }: { icon: IconName; tone: Tone; label: string; value: string; sub: string }) {
  return (
    <MCard pad={17} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <ToneTile icon={icon} tone={tone} size={34} radius={11} />
        <Tx s={12} color={C.sub} lines={1} style={{ flexShrink: 1 }}>{label}</Tx>
      </View>
      <Tx s={26} w="800" tabular lines={1} style={{ marginTop: 12, letterSpacing: -1, lineHeight: 32 }}>{value}</Tx>
      <Tx s={12} color={C.sub} lines={1}>{sub}</Tx>
      <View style={{ height: 34, marginTop: 12 }} />
    </MCard>
  );
}

function AnimalSlide({ cow }: { cow: Cow }) {
  const { c } = useM();
  const fatten = isFatteningAnimal(cow.purpose);
  const gain = weightGain(cow.entryWeight, cow.currentWeight);
  const days = daysOnFeed(cow.purchaseDate);
  const pregnant = cow.pregnancyStatus === 'pregnant' || cow.pregnancyStatus === 'confirmed';
  const kg = (v?: number | null) => (v ? `${num(v)} kg` : '—');
  return (
    <MCard onPress={() => router.push(`/(app)/cattle/${cow._id}`)} pad={19} style={{ width: 290 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <MPill label={fatten ? c.fattenAnimal : c.dairyAnimal} tone={fatten ? 'gold' : 'sky'} />
        {fatten && days != null ? <Tx s={12} color={C.sub}>{c.daysOnFeed(days)}</Tx> : pregnant ? <MPill label={c.pregnant} tone="violet" /> : null}
      </View>
      <Tx s={17} w="700" lines={1} style={{ marginTop: 12, letterSpacing: -0.3 }}>{cow.animalId}</Tx>
      <Tx s={12} color={C.sub} lines={1}>{[cow.breed, cow.gender === 'male' ? c.male : c.female].filter(Boolean).join(' · ')}</Tx>
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        {(fatten
          ? [
              { l: c.entryKg, v: kg(cow.entryWeight) },
              { l: c.nowKg, v: kg(cow.currentWeight) },
              { l: c.gain, v: gain == null ? '—' : `${gain >= 0 ? '+' : ''}${num(gain, 1)} kg`, color: gain == null ? undefined : gain >= 0 ? C.padma : C.coral },
            ]
          : [
              { l: c.weight, v: kg(cow.currentWeight) },
              { l: c.status, v: pregnant ? c.pregnant : c.lactating, color: pregnant ? C.violet : C.padma },
            ]
        ).map((m) => (
          <View key={m.l} style={{ flex: 1 }}>
            <Tx s={12} color={C.sub}>{m.l}</Tx>
            <Tx s={15} w="700" color={m.color} tabular lines={1} style={{ marginTop: 2 }}>{m.v}</Tx>
          </View>
        ))}
      </View>
    </MCard>
  );
}

function BatchSlide({ b, onPress }: { b: PoultryBatch; onPress: () => void }) {
  const { c } = useM();
  const batchPl = useBatchPl();
  const cyc = batchCycle(b);
  const m = mortalityPct(b);
  const pl = batchPl(b);
  return (
    <MCard onPress={onPress} pad={19} style={{ width: 290 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <MPill label={titleCase(b.birdType)} />
        <Tx s={12} color={C.sub}>{c.dayOfN(cyc.day, cyc.total)}</Tx>
      </View>
      <Tx s={17} w="700" lines={1} style={{ marginTop: 12, letterSpacing: -0.3 }}>{batchTitle(b)}</Tx>
      <View style={{ marginTop: 12 }}>
        <Bar pct={cyc.pct} h={8} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <Tx s={12} color={C.sub}>{c.alive}</Tx>
          <Tx s={15} w="700" tabular style={{ marginTop: 2 }}>{num(b.currentQuantity)}</Tx>
        </View>
        <View style={{ flex: 1 }}>
          <Tx s={12} color={C.sub}>{c.mortality}</Tx>
          <Tx s={15} w="700" color={m >= 1.5 ? C.coral : C.padma} tabular style={{ marginTop: 2 }}>{pct(m)}</Tx>
        </View>
        <View style={{ flex: 1 }}>
          <Tx s={12} color={C.sub}>{c.pl}</Tx>
          <Tx s={15} w="700" color={pl >= 0 ? C.padma : C.coral} tabular lines={1} style={{ marginTop: 2 }}>{bdt(pl, { sign: true })}</Tx>
        </View>
      </View>
    </MCard>
  );
}

function SearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { c } = useM();
  const [q, setQ] = useState('');
  const batches = useBatches().data ?? [];
  const customers = useCustomers().data ?? [];
  const items = useItems().data ?? [];
  const needle = q.trim().toLowerCase();
  const go = (href: Href) => {
    onClose();
    setQ('');
    router.push(href);
  };
  const hits = needle
    ? [
        ...batches.filter((b) => batchTitle(b).toLowerCase().includes(needle)).slice(0, 5).map((b) => ({ key: b._id, label: batchTitle(b), sub: c.batch, icon: 'bird' as IconName, tone: 'lime' as Tone, href: `/(app)/poultry/${b._id}` as Href })),
        ...customers.filter((x) => `${x.name} ${x.phone ?? ''}`.toLowerCase().includes(needle)).slice(0, 5).map((x) => ({ key: x._id, label: x.name, sub: x.phone ?? c.customer, icon: 'user' as IconName, tone: 'violet' as Tone, href: '/(app)/customers' as Href })),
        ...items.filter((x) => x.name.toLowerCase().includes(needle)).slice(0, 5).map((x) => ({ key: x._id, label: x.name, sub: `${num(x.currentStock)} ${x.unit}`, icon: itemVisual(x.category).icon, tone: itemVisual(x.category).tone, href: '/(app)/inventory' as Href })),
      ]
    : [];
  return (
    <Sheet open={open} onClose={onClose} title={c.searchTitle}>
      <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
        <View style={{ height: 50, borderRadius: 15, borderWidth: 2, borderColor: C.padma, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
          <Icon name="search" size={18} color={C.sub} />
          <TextInput autoFocus value={q} onChangeText={setQ} placeholder={c.searchPlaceholder} placeholderTextColor={C.faint} style={{ flex: 1, fontSize: 15, color: C.ink, height: 46 }} />
        </View>
      </View>
      {needle && !hits.length ? <Tx s={14} color={C.sub} style={{ padding: 16 }}>{c.noResults}</Tx> : null}
      {!needle ? <Tx s={13} color={C.sub} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>{c.searchHint}</Tx> : null}
      {hits.map((h) => (
        <SheetRow key={h.key} label={h.label} sub={h.sub} icon={h.icon} tone={h.tone} onPress={() => go(h.href)} />
      ))}
    </Sheet>
  );
}

function NotifySheet({ open, onClose, notes }: { open: boolean; onClose: () => void; notes: Array<{ key: string; label: string; icon: IconName; tone: Tone; href: Href }> }) {
  const { c } = useM();
  return (
    <Sheet open={open} onClose={onClose} title={c.notifications}>
      {notes.length ? (
        notes.map((n) => (
          <SheetRow
            key={n.key}
            label={n.label}
            icon={n.icon}
            tone={n.tone}
            onPress={() => {
              onClose();
              router.push(n.href);
            }}
          />
        ))
      ) : (
        <Tx s={14} color={C.sub} style={{ padding: 16 }}>{c.allClear}</Tx>
      )}
    </Sheet>
  );
}

function EggsSheet({ open, onClose, batches }: { open: boolean; onClose: () => void; batches: PoultryBatch[] }) {
  const { c, lang } = useM();
  const toast = useToast();
  const refresh = useRefreshAll();
  const layers = batches.filter((b) => b.birdType?.toLowerCase() === 'layer');
  const choices = layers.length ? layers : batches;
  const [batchId, setBatchId] = useState('');
  const [eggs, setEggs] = useState('');
  const [date, setDate] = useState(isoDay());
  const [error, setError] = useState('');
  const batch = choices.find((b) => b._id === batchId) ?? choices[0];
  const mutation = useMutation({
    mutationFn: () =>
      domainApi.recordEggs({
        farmId: resolveId(batch!.farmId),
        batchId: batch!._id,
        productionDate: new Date(date).toISOString(),
        activeBirds: batch!.currentQuantity,
        totalEggs: Math.floor(Number(eggs)),
      }),
    onSuccess: async () => {
      await refresh('eggs', 'dashboard');
      toast(c.eggsSaved);
      setEggs('');
      onClose();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });
  const save = () => {
    setError('');
    if (!batch) return setError(c.noBatches);
    if (!Number(eggs) || Number(eggs) < 0) return setError(c.enterQtyRate);
    mutation.mutate();
  };
  return (
    <Sheet open={open} onClose={onClose} title={c.logEggs}>
      <View style={{ gap: 14, paddingHorizontal: 8, paddingBottom: 8 }}>
        <MSelect label={c.batch} value={batch?._id ?? ''} options={choices.map((b) => ({ value: b._id, label: batchTitle(b), sub: `${num(b.currentQuantity)} ${c.birdsInLay.toLowerCase()}` }))} onChange={setBatchId} />
        <MField label={c.eggsCount} icon="egg" value={eggs} onChangeText={setEggs} keyboardType="number-pad" placeholder="1200" big />
        <MDateField
          label={c.date}
          value={date}
          onChange={setDate}
          format={(iso) => dayMonth(iso, lang) + ' ' + iso.slice(0, 4)}
          labels={{ today: c.today, yesterday: c.yesterday, daysAgo: c.daysAgo, exact: c.exactDate }}
        />
        <Notice message={error} />
        <MButton label={c.save} kind="lime" icon="check" onPress={save} loading={mutation.isPending} />
      </View>
    </Sheet>
  );
}

function HomeScreen() {
  const { c, lang } = useM();
  const { user, organization } = useAuth();
  const dash = useDashboard();
  const salesQ = useSales();
  const costsQ = useCosts();
  const batchesQ = useBatches();
  const itemsQ = useItems();
  const farmsQ = useFarms();
  const cowsQ = useCows();
  const eggsQ = useEggs();
  const milkQ = useMilk();
  const isCow = organization?.farmType === 'cow';
  const logic = isCow ? cattleLogic(organization?.cowPurpose) : null;
  const canCost = canWriteCost(user?.role);
  const canPoultry = canWritePoultry(user?.role);
  const canCattle = canWriteCattle(user?.role);
  const cows = useMemo(() => cowsQ.data ?? [], [cowsQ.data]);
  const herd = useMemo(() => {
    const beef = cows.filter((x) => isFatteningAnimal(x.purpose));
    const weights = beef.map((x) => x.currentWeight).filter((w): w is number => typeof w === 'number' && w > 0);
    const gains = beef.map((x) => weightGain(x.entryWeight, x.currentWeight)).filter((g): g is number => g != null);
    return {
      beef,
      avgWeight: weights.length ? sum(weights, (w) => w) / weights.length : null,
      avgGain: gains.length ? sum(gains, (g) => g) / gains.length : null,
      gains: gains.length,
    };
  }, [cows]);
  const [search, setSearch] = useState(false);
  const [notify, setNotify] = useState(false);
  const [eggSheet, setEggSheet] = useState(false);

  const sales = useMemo(() => salesQ.data ?? [], [salesQ.data]);
  const costs = useMemo(() => costsQ.data ?? [], [costsQ.data]);
  const active = useMemo(() => (batchesQ.data ?? []).filter(isActiveBatch), [batchesQ.data]);
  const low = (itemsQ.data ?? []).filter(isLow);
  const owing = liveSales(sales).filter((s) => due(s) > 0);

  const month = periodRange('month', 0);
  const cur = totalsFor(sales, costs, month);
  const prev = totalsFor(sales, costs, periodRange('month', 1));
  const delta = change(cur.net, prev.net);
  const now = new Date();
  const days = Array.from({ length: now.getDate() }, (_, i) => {
    const end = new Date(now.getFullYear(), now.getMonth(), i + 2);
    return totalsFor(sales, costs, { start: month.start, end }).net;
  });

  const week = lastDays(7);
  const eggVals = week.map((d) => sum((eggsQ.data ?? []).filter((e) => { const t = toDate(e.productionDate); return Boolean(t && t >= d.start && t < d.end); }), (e) => e.totalEggs));
  const milkVals = week.map((d) => sum((milkQ.data ?? []).filter((e) => { const t = toDate(e.productionDate); return Boolean(t && t >= d.start && t < d.end); }), (e) => e.totalQuantity));
  const layerBirds = sum(active.filter((b) => b.birdType?.toLowerCase() === 'layer'), (b) => b.currentQuantity);
  const eggsToday = dash.data?.poultry.todayEggProduction ?? eggVals[6] ?? 0;
  const milkToday = dash.data?.dairy.todayMilkProduction ?? milkVals[6] ?? 0;
  const lactating = dash.data?.dairy.lactatingCows ?? 0;

  const farm = farmsQ.data?.[0];
  const place = [farm?.district ?? organization?.district, farm?.upazila ?? organization?.upazila].filter(Boolean).join(', ');

  const notes = [
    ...low.slice(0, 5).map((it) => ({ key: it._id, label: c.lowStockNote(it.name, `${num(it.currentStock)} ${it.unit}`), icon: 'alert' as IconName, tone: 'coral' as Tone, href: '/(app)/inventory' as Href })),
    ...(owing.length ? [{ key: 'due', label: c.dueNote(new Set(owing.map((s) => customerName(s) ?? s._id)).size, bdt(sum(owing, due))), icon: 'wallet' as IconName, tone: 'gold' as Tone, href: '/(app)/sales' as Href }] : []),
  ];

  const firstBatch = active[0];
  const openEntry = (kind: 'feed' | 'death') =>
    router.push({ pathname: '/(app)/poultry/add-cost', params: firstBatch ? { batchId: firstBatch._id, farmId: resolveId(firstBatch.farmId), batchName: firstBatch.batchName, kind } : { kind } });

  const refreshing = dash.isRefetching || salesQ.isRefetching;
  const onRefresh = () => {
    dash.refetch();
    salesQ.refetch();
    costsQ.refetch();
    batchesQ.refetch();
    itemsQ.refetch();
    eggsQ.refetch();
    milkQ.refetch();
    cowsQ.refetch();
  };

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.forest, alignItems: 'center', justifyContent: 'center' }}>
          <Tx s={17} w="700" color={C.lime}>{initials(user?.name)}</Tx>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tx s={13} color={C.sub}>{c.greeting(now.getHours())}</Tx>
          <Tx s={17} w="700" lines={1} style={{ letterSpacing: -0.3 }}>{user?.name ?? ''}</Tx>
        </View>
        <CircleBtn icon="search" onPress={() => setSearch(true)} label={c.searchTitle} />
        <CircleBtn icon="bell" onPress={() => setNotify(true)} label={c.notifications} dot={notes.length > 0} />
      </View>
      <Pressable
        onPress={() => router.push('/(app)/farms')}
        style={{ alignSelf: 'flex-start', maxWidth: 300, marginTop: 18, height: 44, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingLeft: 9, paddingRight: 12, gap: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="barn" size={14} color={C.padma} />
        </View>
        <Tx s={13} w="700" lines={1} style={{ flexShrink: 1 }}>{farm?.name ?? organization?.name ?? c.noFarmYet}</Tx>
        {place ? <Tx s={13} color={C.sub} lines={1} style={{ flexShrink: 2 }}>· {place}</Tx> : null}
        <Icon name="down" size={16} color={C.sub} />
      </Pressable>
    </View>
  );

  return (
    <MScreen header={header} tabs refreshing={refreshing} onRefresh={onRefresh} gap={18}>
      <MCard dark pad={22} radius={30}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.forest2 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{c.netResultOf(monthName(now.getMonth(), lang, true))}</Tx>
          {delta != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, borderRadius: 999, paddingHorizontal: 10, backgroundColor: 'rgba(197,239,99,0.16)' }}>
              <Icon name={delta >= 0 ? 'up' : 'trendDown'} size={14} color={C.lime} sw={2.4} />
              <Tx s={12} w="600" color={C.lime}>{`${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`}</Tx>
            </View>
          ) : null}
        </View>
        <Tx s={40} w="800" color={C.white} tabular style={{ marginTop: 10, letterSpacing: -1, lineHeight: 48 }}>{salesQ.isLoading ? '—' : bdt(cur.net)}</Tx>
        <Tx s={13} color="rgba(255,255,255,0.6)">{cur.net >= 0 ? c.profitAfterCosts : c.lossAfterCosts}</Tx>
        <View style={{ marginTop: 14, marginHorizontal: -4 }}>
          <AreaSpark pts={days.length > 1 ? days : [0, cur.net]} stroke={C.lime} h={74} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 15, borderTopWidth: 1, borderTopColor: C.forest3 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(197,239,99,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="up" size={16} color={C.lime} sw={2.2} />
            </View>
            <View>
              <Tx s={12} color="rgba(255,255,255,0.6)">{c.income}</Tx>
              <Tx s={15} w="700" color={C.white} tabular>{bdt(cur.income)}</Tx>
            </View>
          </View>
          <View style={{ width: 1, height: 34, backgroundColor: C.forest3, marginHorizontal: 12 }} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(236,90,74,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trendDown" size={16} color={C.coral} sw={2.2} />
            </View>
            <View>
              <Tx s={12} color="rgba(255,255,255,0.6)">{c.expense}</Tx>
              <Tx s={15} w="700" color={C.white} tabular>{bdt(cur.expense)}</Tx>
            </View>
          </View>
        </View>
      </MCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickAction icon="cash" tone="lime" label={c.addSale} onPress={() => router.navigate('/(app)/sell')} />
        {isCow ? (
          <>
            {canCattle ? <QuickAction icon={logic === 'beef' ? 'scale' : 'milk'} tone="gold" label={logic === 'dairy' ? c.registerCow : c.addAnimal} onPress={() => router.push('/(app)/cattle/new')} /> : null}
            <QuickAction icon="barn" tone="sky" label={c.herd} onPress={() => router.navigate('/(app)/livestock')} />
            <QuickAction icon="file" tone="violet" label={c.hisab} onPress={() => router.navigate('/(app)/hisab')} />
          </>
        ) : (
          <>
            {canCost ? <QuickAction icon="wheat" tone="gold" label={c.addCost} onPress={() => openEntry('feed')} /> : null}
            {canPoultry ? <QuickAction icon="alert" tone="coral" label={c.mortality} onPress={() => openEntry('death')} /> : null}
            {canPoultry ? <QuickAction icon="egg" tone="sky" label={c.eggs} onPress={() => setEggSheet(true)} /> : null}
          </>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {!isCow ? <ProdTile icon="egg" tone="gold" today={c.today} value={num(eggsToday)} sub={layerBirds ? c.eggsLay(pct((eggsToday / layerBirds) * 100, 0)) : c.eggs} vals={eggVals} color={C.gold} muted={C.goldSoft} /> : null}
        {logic !== 'beef' ? <ProdTile icon="milk" tone="sky" today={c.today} value={`${num(milkToday, 1)} L`} sub={c.milkCows(lactating)} vals={milkVals} color={C.sky} muted={C.skySoft} /> : null}
        {logic === 'beef' || logic === 'mixed' ? <StatTileM icon="scale" tone="gold" label={c.avgWeightHerd} value={herd.avgWeight ? `${num(herd.avgWeight)} kg` : '—'} sub={c.animalsSub(herd.beef.length)} /> : null}
        {logic === 'beef' ? <StatTileM icon="up" tone="green" label={c.avgGain} value={herd.avgGain != null ? `${herd.avgGain >= 0 ? '+' : ''}${num(herd.avgGain, 1)} kg` : '—'} sub={herd.avgGain != null ? c.animalsSub(herd.gains) : c.noGainYet} /> : null}
        {logic === 'dairy' ? <StatTileM icon="pulse" tone="violet" label={c.pregnantCows} value={num(dash.data?.dairy.pregnantCows ?? 0)} sub={c.herdSub(cows.length)} /> : null}
      </View>

      {isCow ? (
        <>
          <SectionHead title={logic === 'dairy' ? c.dairyHerd : logic === 'beef' ? c.fatteningHerd : c.cattleHerd} action={c.seeAll} onAction={() => router.navigate('/(app)/livestock')} />
          {cows.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {cows.slice(0, 8).map((cow) => (
                <AnimalSlide key={cow._id} cow={cow} />
              ))}
            </ScrollView>
          ) : !cowsQ.isLoading ? (
            <EmptyCard
              icon={logic === 'beef' ? 'scale' : 'milk'}
              title={c.noCows}
              sub={c.noCowsSub}
              action={canCattle ? <MButton label={logic === 'dairy' ? c.registerCow : c.addAnimal} icon="plus" kind="lime" onPress={() => router.push('/(app)/cattle/new')} /> : undefined}
            />
          ) : null}
        </>
      ) : (
        <>
          <SectionHead title={c.activeBatches} action={c.seeAll} onAction={() => router.navigate('/(app)/livestock')} />
          {active.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {active.map((b) => (
                <BatchSlide key={b._id} b={b} onPress={() => router.push(`/(app)/poultry/${b._id}`)} />
              ))}
            </ScrollView>
          ) : !batchesQ.isLoading ? (
            <EmptyCard icon="bird" title={c.noBatches} sub={c.noBatchesSub} action={canPoultry ? <MButton label={c.newBatch} icon="plus" kind="lime" onPress={() => router.push('/(app)/poultry/new')} /> : undefined} />
          ) : null}
        </>
      )}

      <SectionHead title={c.lowStock} action={c.stock} onAction={() => router.push('/(app)/inventory')} />
      {low.length ? (
        <ListCard>
          {low.slice(0, 4).map((it) => {
            const v = itemVisual(it.category);
            const ratio = it.minStockLevel ? (it.currentStock / it.minStockLevel) * 100 : 0;
            return (
              <View key={it._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 17 }}>
                <ToneTile icon={v.icon} tone={v.tone} size={40} radius={13} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Tx s={14} w="600" lines={1}>{it.name}</Tx>
                  <Tx s={12} color={C.sub} lines={1} style={{ marginTop: 2 }}>{c.leftMin(`${num(it.currentStock)} ${it.unit}`, num(it.minStockLevel))}</Tx>
                  <View style={{ marginTop: 8, width: 150 }}>
                    <Bar pct={ratio} color={C.coral} track={C.coralSoft} h={5} />
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push({ pathname: '/(app)/inventory', params: { action: 'in', itemId: it._id } })}
                  style={{ height: 28, borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, justifyContent: 'center' }}>
                  <Tx s={12} w="600" color={C.padma}>{c.reorder}</Tx>
                </Pressable>
              </View>
            );
          })}
        </ListCard>
      ) : !itemsQ.isLoading ? (
        <EmptyCard icon="box" title={c.stockHealthy} sub={c.stockHealthySub} />
      ) : null}

      <SectionHead title={c.recentSales} action={c.allSales} onAction={() => router.push('/(app)/sales')} />
      {liveSales(sales).length ? (
        <ListCard>
          {liveSales(sales)
            .slice(0, 5)
            .map((s, i) => {
              const d = due(s);
              const p = saleProduct(s);
              const name = customerName(s) ?? c.walkIn;
              const gold = d > 0;
              return (
                <Pressable key={s._id} onPress={() => router.push('/(app)/sales')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 18 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: gold ? C.goldSoft : C.mint, alignItems: 'center', justifyContent: 'center' }}>
                    <Tx s={14} w="700" color={gold ? '#9A6A00' : C.padma}>{initials(name)}</Tx>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Tx s={14} w="600" lines={1}>{name}</Tx>
                    <Tx s={12} color={C.sub} lines={1} style={{ marginTop: 2 }}>{[s.saleNumber, dayMonth(s.saleDate, lang), p.qty].filter(Boolean).join(' · ')}</Tx>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <Tx s={15} w="700" tabular>{bdt(s.totalAmount)}</Tx>
                    {gold ? <MPill label={c.dueAmt(bdt(d))} tone="gold" /> : <MPill label={c.paid} />}
                  </View>
                </Pressable>
              );
            })}
        </ListCard>
      ) : !salesQ.isLoading ? (
        <EmptyCard icon="receipt" title={c.noSales} sub={c.noSalesSub} />
      ) : null}

      <SearchSheet open={search} onClose={() => setSearch(false)} />
      <NotifySheet open={notify} onClose={() => setNotify(false)} notes={notes} />
      <EggsSheet open={eggSheet} onClose={() => setEggSheet(false)} batches={active} />
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebHome /> : <HomeScreen />;
}
