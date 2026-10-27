import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Ring, TrendLine } from '@/components/dashboard/charts';
import {
  batchCycle,
  batchTitle,
  birdVisual,
  costDate,
  inRange,
  isActiveBatch,
  lastDays,
  mortalityPct,
  periodRange,
  sum,
  survival,
  useBatches,
  useBatchPl,
  useCosts,
  useCows,
  useDashboard,
  useEggs,
  useMilk,
} from '@/components/dashboard/data';
import { EntryDrawer, NewBatchDrawer } from '@/components/dashboard/drawers';
import { bdt, dayMonth, downloadCsv, num, pct, titleCase, isoDay } from '@/components/dashboard/format';
import { Btn, Card, CardHead, Cell, Chips, Empty, IconTile, MenuItem, Pill, Popover, Progress, Segmented, StatTile, Table, Tx } from '@/components/dashboard/kit';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import { resolveId } from '@/lib/ids';
import { canWriteCattle, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { Cow, PoultryBatch } from '@/types/api';

type Sort = 'newest' | 'oldest' | 'birds';

export function WebLivestock({ openNew = false }: { openNew?: boolean }) {
  const { c } = useDash();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, organization } = useAuth();
  const width = useContentWidth();
  const batchesQ = useBatches();
  const cowsQ = useCows();
  const costsQ = useCosts();
  const eggsQ = useEggs();
  const dash = useDashboard();
  const batchPl = useBatchPl();
  const [tab, setTab] = useState<'poultry' | 'dairy'>(params.tab === 'dairy' || organization?.farmType === 'cow' ? 'dairy' : 'poultry');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [drawer, setDrawer] = useState(openNew);
  const [entryBatch, setEntryBatch] = useState<PoultryBatch | null>(null);

  useEffect(() => {
    if (params.tab === 'dairy' || params.tab === 'poultry') setTab(params.tab);
  }, [params.tab]);

  const all = useMemo(() => batchesQ.data ?? [], [batchesQ.data]);
  const active = all.filter(isActiveBatch);
  const cows = cowsQ.data ?? [];
  const types = [...new Set(active.map((b) => b.birdType?.toLowerCase()).filter(Boolean))];
  const shown = useMemo(() => {
    const list = active.filter((b) => filter === 'all' || b.birdType?.toLowerCase() === filter);
    return [...list].sort((a, b) =>
      sort === 'birds' ? b.currentQuantity - a.currentQuantity : sort === 'oldest' ? +new Date(a.purchaseDate) - +new Date(b.purchaseDate) : +new Date(b.purchaseDate) - +new Date(a.purchaseDate)
    );
  }, [active, filter, sort]);

  const alive = sum(active, (b) => b.currentQuantity);
  const placed = sum(active, (b) => b.initialQuantity);
  const deaths = sum(active, (b) => b.mortalityCount);
  const avgMort = placed ? (deaths / placed) * 100 : 0;
  const weekRange = periodRange('week', 0);
  const feedCosts = (costsQ.data ?? []).filter((x) => /feed/i.test(x.categoryName ?? '') && inRange(costDate(x), weekRange));
  const feedQty = sum(feedCosts, (x) => x.quantity);
  const feedUnit = feedCosts[0]?.unit ?? 'bag';
  const today = isoDay();
  const eggsByBatch = new Map<string, number>();
  for (const e of eggsQ.data ?? []) {
    if (isoDay(new Date(e.productionDate)) !== today) continue;
    const id = resolveId(e.batchId);
    eggsByBatch.set(id, (eggsByBatch.get(id) ?? 0) + e.saleableEggs);
  }
  const layerBirds = sum(active.filter((b) => b.birdType?.toLowerCase() === 'layer'), (b) => b.currentQuantity);
  const eggsToday = dash.data?.poultry.todayEggProduction ?? 0;

  const cols = width >= 1060 ? 3 : 2;
  const canBatch = canWritePoultry(user?.role);
  const canCow = canWriteCattle(user?.role);

  const exportCsv = () => {
    if (tab === 'dairy') {
      downloadCsv('cows.csv', [['Animal ID', 'Breed', 'Gender', 'Purpose', 'Weight (kg)', 'Pregnancy'], ...cows.map((x) => [x.animalId, x.breed, x.gender, x.purpose, x.currentWeight ?? '', x.pregnancyStatus ?? ''])]);
      return;
    }
    downloadCsv('poultry-batches.csv', [
      ['Batch', 'Type', 'Placed', 'Initial', 'Alive', 'Deaths', 'Mortality %', 'Chick price', 'Total cost', 'P/L', 'Status'],
      ...all.map((b) => [batchTitle(b), b.birdType, isoDay(new Date(b.purchaseDate)), b.initialQuantity, b.currentQuantity, b.mortalityCount ?? 0, mortalityPct(b).toFixed(2), b.unitPrice ?? '', b.totalCost ?? '', batchPl(b), b.status ?? '']),
    ]);
  };

  const top = (
    <PageTop
      crumbs={[c.farm, c.livestock]}
      title={c.livestock}
      actions={
        <>
          <Btn label={c.export} icon="download" onPress={exportCsv} />
          {tab === 'poultry' && canBatch ? <Btn label={c.newBatch} icon="plus" kind="lime" onPress={() => setDrawer(true)} /> : null}
          {tab === 'dairy' && canCow ? <Btn label={c.registerCow} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/cattle/new')} /> : null}
        </>
      }
    />
  );

  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Segmented
          size="lg"
          value={tab}
          onChange={setTab}
          options={[
            { key: 'poultry', label: `${c.poultry} · ${active.length}` },
            { key: 'dairy', label: `${c.dairy} · ${cows.length}` },
          ]}
          style={{ width: 420, maxWidth: '100%' }}
        />
        {tab === 'poultry' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Chips value={filter} onChange={setFilter} options={[{ key: 'all', label: c.all }, ...types.map((t) => ({ key: t, label: titleCase(t) }))]} />
            <Popover
              width={200}
              align="right"
              trigger={(open) => <Btn label={sort === 'newest' ? c.newest : sort === 'oldest' ? c.oldest : c.mostBirds} icon="sort" size="sm" onPress={open} style={{ height: 36, borderRadius: 999 }} />}>
              {(close) => (
                <View style={{ paddingVertical: 6 }}>
                  {(
                    [
                      ['newest', c.newest],
                      ['oldest', c.oldest],
                      ['birds', c.mostBirds],
                    ] as Array<[Sort, string]>
                  ).map(([k, label]) => (
                    <MenuItem key={k} label={label} active={sort === k} onPress={() => { setSort(k); close(); }} />
                  ))}
                </View>
              )}
            </Popover>
          </View>
        ) : null}
      </View>

      {tab === 'poultry' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            <StatTile icon="bird" tone="lime" label={c.birdsAlive} value={num(alive)} sub={c.ofPlaced(num(placed))} />
            <StatTile icon="alert" tone="coral" label={c.avgMortality} value={pct(avgMort)} sub={c.birdsThisCycle(num(deaths))} />
            <StatTile icon="egg" tone="gold" label={c.eggsToday} value={num(eggsToday)} sub={layerBirds ? c.layRate(pct((eggsToday / layerBirds) * 100, 0)) : c.noLayers} />
            <StatTile icon="wheat" tone="sky" label={c.feedThisWeek} value={c.bags(num(feedQty), feedUnit)} sub={bdt(sum(feedCosts, (x) => x.totalAmount))} />
          </View>

          {batchesQ.isLoading ? (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {Array.from({ length: cols }, (_, i) => <View key={i} style={{ flex: 1, height: 300, borderRadius: 22, backgroundColor: '#E6EDE8' }} />)}
            </View>
          ) : shown.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {shown.map((b) => (
                <View key={b._id} style={{ flexBasis: `${100 / cols - 2}%`, flexGrow: 1, maxWidth: `${100 / cols}%` }}>
                  <BatchCard
                    batch={b}
                    eggsToday={eggsByBatch.get(b._id)}
                    onCost={canBatch ? () => setEntryBatch(b) : undefined}
                    onOpen={() => router.navigate(`/(app)/poultry/${b._id}` as Href)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Card>
              <Empty icon="bird" title={c.noBatches} sub={c.noBatchesSub} action={canBatch ? <Btn label={c.newBatch} icon="plus" kind="lime" onPress={() => setDrawer(true)} /> : undefined} />
            </Card>
          )}

          {cows.length ? (
            <Card pad={0}>
              <HerdTable limit={5} />
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <DairyStats cows={cows} />
          <Card pad={0}>
            <HerdTable />
          </Card>
        </>
      )}

      <NewBatchDrawer open={drawer} onClose={() => { setDrawer(false); if (openNew) router.replace('/(app)/livestock'); }} />
      <EntryDrawer open={Boolean(entryBatch)} onClose={() => setEntryBatch(null)} batch={entryBatch} />
    </Page>
  );
}

function BatchCard({ batch: b, eggsToday, onCost, onOpen }: { batch: PoultryBatch; eggsToday?: number; onCost?: () => void; onOpen: () => void }) {
  const { c, lang } = useDash();
  const batchPl = useBatchPl();
  const v = birdVisual(b.birdType);
  const cyc = batchCycle(b);
  const surv = survival(b);
  const m = mortalityPct(b);
  const isLayer = b.birdType?.toLowerCase() === 'layer';
  const second = isLayer
    ? { label: c.eggsToday, value: num(eggsToday ?? 0) }
    : b.averageWeight
      ? { label: c.avgWeight, value: `${num(b.averageWeight, 2)} kg` }
      : { label: c.pl, value: bdt(batchPl(b), { sign: true }) };
  return (
    <Card pad={20} style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <IconTile name={v.icon} tone={v.tone} size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tx s={15} w="800" lines={1}>{batchTitle(b)}</Tx>
          <Tx s={12} color={C.sub} lines={1}>{c.placed(dayMonth(b.purchaseDate, lang), bdt(b.unitPrice))}</Tx>
        </View>
        <Pill label={titleCase(b.birdType)} tone="green" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Ring size={78} pct={surv} color={C.emerald} track={C.mint} sw={8}>
          <Tx s={15} w="800">{Math.round(surv)}%</Tx>
          <Tx s={10} color={C.sub}>{c.aliveShort}</Tx>
        </Ring>
        <View>
          <Tx s={12} color={C.sub}>{c.birdsAlive}</Tx>
          <Tx s={26} w="800" tabular>{num(b.currentQuantity)}</Tx>
          <Tx s={12} color={C.sub}>{c.ofPlaced(num(b.initialQuantity))}</Tx>
        </View>
      </View>
      <View style={{ gap: 7 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Tx s={12} color={C.sub}>{c.cycle}</Tx>
          <Tx s={12} w="700">{c.dayOf(cyc.day, cyc.total).replace('/', ' / ')}</Tx>
        </View>
        <Progress pct={cyc.pct} />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: C.canvas, borderRadius: 14, padding: 12 }}>
        <View style={{ flex: 1 }}>
          <Tx s={11} color={C.sub}>{c.mortality}</Tx>
          <Tx s={15} w="800" color={m >= 3 ? C.coral : m >= 1.5 ? C.goldInk : C.padma} tabular>{pct(m)}</Tx>
        </View>
        <View style={{ flex: 1 }}>
          <Tx s={11} color={C.sub}>{second.label}</Tx>
          <Tx s={15} w="800" tabular>{second.value}</Tx>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {onCost ? <Btn label={c.addCost} icon="plus" onPress={onCost} style={{ flex: 1 }} /> : null}
        <Btn label={c.openBatch} kind="dark" onPress={onOpen} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

function cowStatus(cow: Cow, milked: boolean): { label: keyof Pick<ReturnType<typeof useDash>['c'], 'pregnant' | 'fattening' | 'lactating' | 'dry'>; tone: 'violet' | 'gold' | 'sky' | 'gray' } {
  if (cow.pregnancyStatus === 'pregnant' || cow.pregnancyStatus === 'confirmed') return { label: 'pregnant', tone: 'violet' };
  if (cow.purpose === 'beef') return { label: 'fattening', tone: 'gold' };
  if (milked) return { label: 'lactating', tone: 'sky' };
  return { label: 'dry', tone: 'gray' };
}

function useMilkByCow() {
  const milkQ = useMilk();
  return useMemo(() => {
    const days = lastDays(7);
    const map = new Map<string, number[]>();
    for (const r of milkQ.data ?? []) {
      const id = resolveId(r.cowId);
      const d = new Date(r.productionDate);
      const idx = days.findIndex((x) => d >= x.start && d < x.end);
      if (idx < 0) continue;
      const arr = map.get(id) ?? Array(7).fill(0);
      arr[idx] += r.totalQuantity;
      map.set(id, arr);
    }
    return map;
  }, [milkQ.data]);
}

function DairyStats({ cows }: { cows: Cow[] }) {
  const { c } = useDash();
  const dash = useDashboard();
  const milkBy = useMilkByCow();
  const lact = cows.filter((x) => (milkBy.get(x._id) ?? []).some((v) => v > 0)).length;
  const preg = cows.filter((x) => x.pregnancyStatus === 'pregnant' || x.pregnancyStatus === 'confirmed').length;
  const weights = cows.map((x) => x.currentWeight).filter((w): w is number => typeof w === 'number' && w > 0);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      <StatTile icon="barn" tone="violet" label={c.totalCows} value={num(cows.length)} sub={c.cowsLactating(lact)} />
      <StatTile icon="milk" tone="sky" label={c.milkToday} value={`${num(dash.data?.dairy.todayMilkProduction ?? 0, 1)} L`} />
      <StatTile icon="pulse" tone="coral" label={c.pregnantCows} value={num(preg)} />
      <StatTile icon="scale" tone="gold" label={c.avgWeightHerd} value={weights.length ? `${num(sum(weights, (w) => w) / weights.length)} kg` : '—'} />
    </View>
  );
}

export function HerdTable({ limit, compact }: { limit?: number; compact?: boolean }) {
  const { c } = useDash();
  const router = useRouter();
  const cowsQ = useCows();
  const milkBy = useMilkByCow();
  const cows = cowsQ.data ?? [];
  const rows = limit ? cows.slice(0, limit) : cows;
  return (
    <>
      <CardHead
        title={c.dairyHerd}
        sub={c.herdSub(cows.length)}
        right={
          limit || compact ? (
            <Btn label={c.openHerd} size="sm" onPress={() => router.navigate({ pathname: '/(app)/livestock', params: { tab: 'dairy' } })} />
          ) : (
            <Btn label={c.registerCow} icon="plus" size="sm" onPress={() => router.navigate('/(app)/cattle/new')} />
          )
        }
        style={{ padding: 22, paddingBottom: 16 }}
      />
      <Table
        rows={compact ? rows.slice(0, 5) : rows}
        rowKey={(x) => x._id}
        onRowPress={(x) => router.navigate(`/(app)/cattle/${x._id}` as Href)}
        empty={<Empty icon="milk" title={c.noCows} sub={c.noCowsSub} action={<Btn label={c.registerCow} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/cattle/new')} />} />}
        cols={[
          { key: 'cow', label: c.cow, flex: 1.6 },
          { key: 'breed', label: c.breed, flex: 1.4 },
          { key: 'status', label: c.status, flex: 1.2 },
          { key: 'milk', label: c.milkToday, flex: 1, align: 'right' },
          { key: 'trend', label: c.trend7, flex: 1.2, align: 'center' },
          { key: 'weight', label: c.weight, flex: 0.9, align: 'right' },
        ]}
        render={(x, col) => {
          const series = milkBy.get(x._id) ?? [];
          const today = series[6] ?? 0;
          if (col.key === 'cow')
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconTile name="milk" tone="sky" size={34} />
                <Cell title={x.animalId} sub={titleCase(x.gender)} strong />
              </View>
            );
          if (col.key === 'breed') return <Tx s={13} color={C.sub} lines={1}>{x.breed}</Tx>;
          if (col.key === 'status') {
            const s = cowStatus(x, series.some((v) => v > 0));
            return <Pill label={c[s.label]} tone={s.tone} />;
          }
          if (col.key === 'milk') return <Tx s={14} w="800" tabular>{today ? `${num(today, 1)} L` : '—'}</Tx>;
          if (col.key === 'trend') return <TrendLine pts={series.length ? series : [0, 0]} />;
          return <Tx s={13} color={C.sub} tabular>{x.currentWeight ? `${num(x.currentWeight)} kg` : '—'}</Tx>;
        }}
      />
    </>
  );
}
