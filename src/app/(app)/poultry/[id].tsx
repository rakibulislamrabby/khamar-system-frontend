import { useDesktopWeb, WebBatch } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { domainApi } from '@/api';
import { BarChart, Ring } from '@/components/dashboard/charts';
import {
  batchCycle,
  batchSaleAmount,
  batchTitle,
  costDate,
  costVisual,
  costsForBatch,
  farmName,
  lastDays,
  mortalityPct,
  salesForBatch,
  sum,
  survival,
  useCosts,
  useFarms,
  useSales,
} from '@/components/dashboard/data';
import { bdt, dayMonth, fullDate, num, pct, titleCase } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { C, type Tone } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  ActionTile,
  CircleBtn,
  EmptyCard,
  ListCard,
  Loading,
  MButton,
  MCard,
  MPill,
  MScreen,
  NavHeader,
  SectionHead,
  Sheet,
  SheetRow,
  ToneTile,
  Tx,
} from '@/components/mobile/kit';
import { Contours } from '@/components/web-landing/graphics';
import { resolveId } from '@/lib/ids';
import { canWriteCost, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

type CostKind = 'feed' | 'vaccine' | 'death' | 'other';

const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'],
};

function PoultryBatchDetailScreen() {
  const { c, lang } = useM();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const canCost = canWriteCost(user?.role);
  const canPoultry = canWritePoultry(user?.role);
  const [menu, setMenu] = useState(false);
  const [allCosts, setAllCosts] = useState(false);

  const batchQuery = useQuery({
    queryKey: ['poultry-batch', id],
    queryFn: () => domainApi.getPoultryBatch(id!),
    enabled: Boolean(id),
  });
  const costsQ = useCosts();
  const salesQ = useSales();
  const farmsQ = useFarms();

  const b = batchQuery.data;
  const farmId = resolveId(b?.farmId);
  const costs = useMemo(
    () => costsForBatch(costsQ.data ?? [], String(id)).sort((x, y) => +(costDate(y) ?? 0) - +(costDate(x) ?? 0)),
    [costsQ.data, id]
  );
  const sales = useMemo(() => salesForBatch(salesQ.data ?? [], String(id)), [salesQ.data, id]);
  const costsTotal = sum(costs, (x) => x.totalAmount);
  const pl = sum(sales, (s) => batchSaleAmount(s, String(id))) - costsTotal;

  const days = lastDays(7);
  const daily = days.map((d) => ({
    label: WEEKDAYS[lang][d.start.getDay()],
    value: sum(costs.filter((x) => { const t = costDate(x); return Boolean(t && t >= d.start && t < d.end); }), (x) => x.totalAmount),
  }));
  const dailyAvg = sum(daily, (d) => d.value) / daily.length;
  const spentRecently = daily.slice(-3).some((d) => d.value > 0);

  const openCost = (kind: CostKind) => {
    if (!b) return;
    router.push({
      pathname: '/(app)/poultry/add-cost',
      params: { batchId: b._id, farmId, batchName: b.batchName, kind },
    });
  };
  const sell = () => b && router.navigate({ pathname: '/(app)/sell', params: { batchId: b._id } });
  const share = () => {
    if (!b) return;
    Share.share({ message: c.shareBatchText(batchTitle(b), num(b.currentQuantity), bdt(costsTotal), bdt(pl)) }).catch(() => undefined);
  };

  const entries: Array<{ kind: CostKind; label: string; icon: IconName; tone: Tone; allowed: boolean }> = [
    { kind: 'feed', label: c.feed, icon: 'wheat', tone: 'gold', allowed: canCost },
    { kind: 'vaccine', label: c.vaccine, icon: 'syringe', tone: 'sky', allowed: canCost },
    { kind: 'death', label: c.death, icon: 'alert', tone: 'coral', allowed: canPoultry },
    { kind: 'other', label: c.other, icon: 'plus', tone: 'green', allowed: canCost },
  ];
  const allowed = entries.filter((e) => e.allowed);

  const header = (
    <NavHeader title={c.batchDetails} right={b ? <CircleBtn icon="dots" label={c.batchActions} onPress={() => setMenu(true)} /> : undefined} />
  );

  if (batchQuery.isLoading) {
    return (
      <MScreen header={header}>
        <Loading />
      </MScreen>
    );
  }
  if (!b) {
    return (
      <MScreen header={header}>
        <EmptyCard icon="bird" title={c.batchNotFound} sub={batchQuery.error instanceof Error ? batchQuery.error.message : undefined} />
      </MScreen>
    );
  }

  const cyc = batchCycle(b);
  const surv = survival(b);
  const m = mortalityPct(b);
  const closed = b.status === 'closed';
  const farm = farmName(b.farmId) ?? farmsQ.data?.find((f) => f._id === farmId)?.name ?? null;
  const shown = allCosts ? costs : costs.slice(0, 3);

  return (
    <MScreen
      header={header}
      refreshing={batchQuery.isRefetching || costsQ.isRefetching}
      onRefresh={() => {
        batchQuery.refetch();
        costsQ.refetch();
        salesQ.refetch();
      }}
      footer={
        <>
          <Pressable
            onPress={share}
            accessibilityLabel={c.share}
            style={({ pressed }) => ({ width: 56, height: 56, borderRadius: 18, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Icon name="upload" size={20} color={C.ink} />
          </Pressable>
          <MButton label={c.sellFromThis} icon="cash" kind="dark" onPress={sell} disabled={closed} style={{ flex: 1 }} />
        </>
      }>
      <MCard dark radius={28} pad={20} style={{ overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.6 }}>
          <Contours w={350} h={240} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ height: 26, borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.22)' }}>
            <Tx s={12} w="600" color={C.lime}>{titleCase(b.birdType)}</Tx>
          </View>
          <View style={{ height: 26, borderRadius: 999, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.10)' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: closed ? C.faint : C.lime }} />
            <Tx s={12} w="600" color={C.white}>{closed ? c.closed : c.active}</Tx>
          </View>
          <View style={{ flex: 1 }} />
          {!closed ? <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.dayOfN(cyc.day, cyc.total)}</Tx> : null}
        </View>
        <Tx s={22} w="700" color={C.white} lines={1} style={{ marginTop: 14, letterSpacing: -0.5 }}>{batchTitle(b)}</Tx>
        <Tx s={13} w="500" color="rgba(255,255,255,0.6)" lines={1} style={{ marginTop: 2 }}>
          {farm ? c.placedOn(farm, fullDate(b.purchaseDate, lang)) : fullDate(b.purchaseDate, lang)}
        </Tx>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 }}>
          <Ring size={96} pct={surv} color={C.lime} track={C.forest3} sw={10}>
            <Tx s={22} w="800" color={C.white} style={{ letterSpacing: -1 }}>{Math.round(surv)}%</Tx>
            <Tx s={11} w="600" color="rgba(255,255,255,0.6)">{c.survival}</Tx>
          </Ring>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.birdsAlive}</Tx>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Tx s={26} w="800" color={C.white} tabular style={{ letterSpacing: -1 }}>{num(b.currentQuantity)}</Tx>
              <Tx s={13} w="500" color="rgba(255,255,255,0.55)">/ {num(b.initialQuantity)}</Tx>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <View>
                <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.deaths}</Tx>
                <Tx s={15} w="700" color={m > 0 ? '#FF8A7A' : C.white} tabular>{`${num(b.mortalityCount ?? 0)} · ${pct(m)}`}</Tx>
              </View>
              <View>
                <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.chickPrice}</Tx>
                <Tx s={15} w="700" color={C.white} tabular>{b.unitPrice != null ? bdt(b.unitPrice) : '—'}</Tx>
              </View>
            </View>
          </View>
        </View>
      </MCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatTile icon="trendDown" tone="coral" label={c.batchCosts} value={bdt(costsTotal)} sub={b.currentQuantity ? c.perBird(bdt(costsTotal / b.currentQuantity)) : '—'} />
        <StatTile
          icon="up"
          tone="lime"
          label={c.recordedPl}
          value={`${pl > 0 ? '+' : ''}${bdt(pl)}`}
          color={pl > 0 ? C.emerald : pl < 0 ? C.coral : C.ink}
          sub={c.afterSales(sales.length)}
        />
      </View>

      {allowed.length && !closed ? (
        <>
          <SectionHead title={c.addEntry} style={{ marginTop: 12 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {allowed.map((e) => (
              <ActionTile key={e.kind} icon={e.icon} tone={e.tone} label={e.label} onPress={() => openCost(e.kind)} />
            ))}
          </View>
        </>
      ) : null}

      <SectionHead title={c.dailySpend} right={<Tx s={13} w="700" color={C.padma}>{c.sevenDays}</Tx>} style={{ marginTop: 12 }} />
      <MCard pad={19}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={22} w="800" tabular style={{ letterSpacing: -1 }}>{bdt(dailyAvg)}</Tx>
            <Tx s={12} w="500" color={C.sub}>{c.avgSpendDay}</Tx>
          </View>
          <MPill label={spentRecently ? c.spending : c.quiet} tone={spentRecently ? 'gold' : 'green'} style={{ marginTop: 8 }} />
        </View>
        <View style={{ marginTop: 16 }}>
          <BarChart data={daily} height={92} color={C.gold} muted={C.goldSoft} highlight={daily[daily.length - 1].value > 0 ? daily.length - 1 : undefined} />
        </View>
      </MCard>

      <SectionHead
        title={c.costsForBatch}
        action={costs.length > 3 ? (allCosts ? c.showLess : c.all) : undefined}
        onAction={() => setAllCosts((v) => !v)}
        style={{ marginTop: 12 }}
      />
      {costsQ.isLoading ? <Loading /> : null}
      {!costsQ.isLoading && !costs.length ? <EmptyCard icon="receipt" title={c.noCosts} sub={c.noCostsSub} /> : null}
      {shown.length ? (
        <ListCard>
          {shown.map((x) => {
            const v = costVisual(x.categoryName);
            return (
              <View key={x._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 12 }}>
                <ToneTile icon={v.icon} tone={v.tone} size={40} radius={13} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Tx s={14} w="600" lines={1}>{x.categoryName ?? c.other}</Tx>
                  <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>
                    {`${dayMonth(costDate(x), lang)} · ${num(x.quantity)} ${x.unit} × ${bdt(x.rate)}`}
                  </Tx>
                </View>
                <Tx s={15} w="700" tabular>{bdt(x.totalAmount)}</Tx>
              </View>
            );
          })}
        </ListCard>
      ) : null}

      <Sheet open={menu} onClose={() => setMenu(false)} title={c.batchActions}>
        {!closed ? <SheetRow label={c.sellFromThis} icon="cash" tone="lime" onPress={() => { setMenu(false); sell(); }} /> : null}
        {!closed
          ? allowed.map((e) => <SheetRow key={e.kind} label={e.label} icon={e.icon} tone={e.tone} onPress={() => { setMenu(false); openCost(e.kind); }} />)
          : null}
        <SheetRow label={c.share} icon="upload" tone="gray" onPress={() => { setMenu(false); share(); }} />
      </Sheet>
    </MScreen>
  );
}

function StatTile({ icon, tone, label, value, sub, color = C.ink }: { icon: IconName; tone: Tone; label: string; value: string; sub: string; color?: string }) {
  return (
    <MCard pad={17} style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ToneTile icon={icon} tone={tone} size={28} radius={9} />
        <Tx s={12} w="500" color={C.sub} lines={1} style={{ flexShrink: 1 }}>{label}</Tx>
      </View>
      <Tx s={22} w="800" color={color} tabular lines={1} style={{ marginTop: 10, letterSpacing: -1 }}>{value}</Tx>
      <Tx s={12} w="500" color={C.sub} lines={1}>{sub}</Tx>
    </MCard>
  );
}

function WebBatchRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WebBatch id={String(id)} />;
}

export default function Route() {
  return useDesktopWeb() ? <WebBatchRoute /> : <PoultryBatchDetailScreen />;
}
