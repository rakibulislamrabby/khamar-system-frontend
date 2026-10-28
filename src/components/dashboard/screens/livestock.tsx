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
import { cattleLogic, daysOnFeed, isFatteningAnimal, weightGain, type CattleLogic } from '@/lib/cattle';
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
  const isCowFarm = organization?.farmType === 'cow';
  const logic = useHerdLogic();
  const [tab, setTab] = useState<'poultry' | 'dairy'>(params.tab === 'dairy' || isCowFarm ? 'dairy' : 'poultry');
  const [filter, setFilter] = useState('all');
  const [book, setBook] = useState<Book>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [drawer, setDrawer] = useState(openNew);
  const [entryBatch, setEntryBatch] = useState<PoultryBatch | null>(null);

  useEffect(() => {
    if (isCowFarm) setTab('dairy');
    else if (params.tab === 'dairy' || params.tab === 'poultry') setTab(params.tab);
  }, [params.tab, isCowFarm]);

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
      downloadCsv('cattle.csv', [
        ['Animal ID', 'Breed', 'Gender', 'Book', 'Entry weight (kg)', 'Weight (kg)', 'Gain (kg)', 'Days on feed', 'Purchase price', 'Pregnancy'],
        ...cows.map((x) => [x.animalId, x.breed, x.gender, x.purpose === 'beef' ? 'fattening' : 'dairy', x.entryWeight ?? '', x.currentWeight ?? '', weightGain(x.entryWeight, x.currentWeight) ?? '', daysOnFeed(x.purchaseDate) ?? '', x.purchasePrice ?? '', x.pregnancyStatus ?? '']),
      ]);
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
          {tab === 'dairy' && canCow ? <Btn label={logic === 'dairy' ? c.registerCow : c.registerAnimal} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/cattle/new')} /> : null}
        </>
      }
    />
  );

  const herdLabel = logic === 'dairy' ? c.dairy : logic === 'beef' ? c.fattening : c.cattle;
  const dairyCount = cows.filter((x) => x.purpose !== 'beef').length;

  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        {isCowFarm ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pill label={herdLabel} tone={logic === 'beef' ? 'gold' : logic === 'dairy' ? 'sky' : 'green'} icon={logic === 'beef' ? 'scale' : logic === 'dairy' ? 'milk' : 'layers'} />
            <Tx s={13} color={C.sub}>{c.animalsSub(cows.length)}</Tx>
          </View>
        ) : (
          <Segmented
            size="lg"
            value={tab}
            onChange={setTab}
            options={[
              { key: 'poultry', label: `${c.poultry} · ${active.length}` },
              { key: 'dairy', label: `${herdLabel} · ${cows.length}` },
            ]}
            style={{ width: 420, maxWidth: '100%' }}
          />
        )}
        {tab === 'dairy' && logic === 'mixed' ? (
          <Chips
            value={book}
            onChange={setBook}
            options={[
              { key: 'all', label: `${c.all} · ${cows.length}` },
              { key: 'dairy', label: `${c.dairy} · ${dairyCount}` },
              { key: 'beef', label: `${c.fattening} · ${cows.length - dairyCount}` },
            ]}
          />
        ) : null}
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
          <HerdStats cows={cows} logic={logic} />
          <Card pad={0}>
            <HerdTable book={book} />
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

type Book = 'all' | 'dairy' | 'beef';

/** Cattle farms follow the purpose chosen at signup; a poultry farm's few cows can be in either book. */
export function useHerdLogic(): CattleLogic {
  const { organization } = useAuth();
  return organization?.farmType === 'cow' ? cattleLogic(organization.cowPurpose) : 'mixed';
}

function fattenStats(cows: Cow[]) {
  const beef = cows.filter((x) => isFatteningAnimal(x.purpose));
  const weights = beef.map((x) => x.currentWeight).filter((w): w is number => typeof w === 'number' && w > 0);
  const days = beef.map((x) => daysOnFeed(x.purchaseDate)).filter((d): d is number => d != null);
  const gains = beef
    .map((x) => ({ g: weightGain(x.entryWeight, x.currentWeight), d: daysOnFeed(x.purchaseDate) }))
    .filter((x): x is { g: number; d: number | null } => x.g != null);
  const daily = gains.filter((x) => x.d).map((x) => x.g / (x.d as number));
  return {
    count: beef.length,
    avgWeight: weights.length ? sum(weights, (w) => w) / weights.length : null,
    avgDays: days.length ? Math.round(sum(days, (d) => d) / days.length) : null,
    avgGain: gains.length ? sum(gains, (x) => x.g) / gains.length : null,
    avgDaily: daily.length ? sum(daily, (v) => v) / daily.length : null,
  };
}

function HerdStats({ cows, logic }: { cows: Cow[]; logic: CattleLogic }) {
  const { c } = useDash();
  const dash = useDashboard();
  const milkBy = useMilkByCow();
  const dairy = cows.filter((x) => !isFatteningAnimal(x.purpose));
  const lact = dairy.filter((x) => (milkBy.get(x._id) ?? []).some((v) => v > 0)).length;
  const preg = dairy.filter((x) => x.pregnancyStatus === 'pregnant' || x.pregnancyStatus === 'confirmed').length;
  const f = fattenStats(cows);
  const allWeights = cows.map((x) => x.currentWeight).filter((v): v is number => typeof v === 'number' && v > 0);
  const herdWeight = allWeights.length ? sum(allWeights, (v) => v) / allWeights.length : null;
  const milk = <StatTile icon="milk" tone="sky" label={c.milkToday} value={`${num(dash.data?.dairy.todayMilkProduction ?? 0, 1)} L`} sub={c.cowsLactating(lact)} />;
  const weight = <StatTile icon="scale" tone="gold" label={c.avgWeightHerd} value={f.avgWeight ? `${num(f.avgWeight)} kg` : '—'} sub={f.avgDays != null ? c.onFeedSub(f.avgDays) : undefined} />;
  const gain = (
    <StatTile
      icon="up"
      tone="green"
      label={c.avgGain}
      value={f.avgGain != null ? `${f.avgGain >= 0 ? '+' : ''}${num(f.avgGain, 1)} kg` : '—'}
      sub={f.avgDaily != null ? c.avgGainSub(`${num(f.avgDaily, 2)} kg`) : c.noGainYet}
      subColor={f.avgDaily != null ? C.padma : undefined}
    />
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {logic === 'dairy' ? (
        <>
          <StatTile icon="barn" tone="violet" label={c.totalCows} value={num(cows.length)} sub={c.cowsLactating(lact)} />
          {milk}
          <StatTile icon="pulse" tone="coral" label={c.pregnantCows} value={num(preg)} />
          <StatTile icon="scale" tone="gold" label={c.avgWeightHerd} value={herdWeight ? `${num(herdWeight)} kg` : '—'} />
        </>
      ) : logic === 'beef' ? (
        <>
          <StatTile icon="barn" tone="violet" label={c.onFeed} value={num(f.count)} sub={c.animalsSub(f.count)} />
          {weight}
          {gain}
          <StatTile icon="clock" tone="sky" label={c.daysFed} value={f.avgDays != null ? num(f.avgDays) : '—'} />
        </>
      ) : (
        <>
          <StatTile icon="barn" tone="violet" label={c.totalAnimals} value={num(cows.length)} sub={c.dairyFattenSplit(dairy.length, f.count)} />
          {milk}
          {weight}
          {gain}
        </>
      )}
    </View>
  );
}

export function HerdTable({ limit, compact, book = 'all' }: { limit?: number; compact?: boolean; book?: Book }) {
  const { c } = useDash();
  const router = useRouter();
  const logic = useHerdLogic();
  const cowsQ = useCows();
  const milkBy = useMilkByCow();
  const cows = (cowsQ.data ?? []).filter((x) => book === 'all' || (book === 'beef') === isFatteningAnimal(x.purpose));
  const rows = limit ? cows.slice(0, limit) : cows;
  const title = logic === 'dairy' ? c.dairyHerd : logic === 'beef' ? c.fatteningHerd : c.cattleHerd;
  const addLabel = logic === 'dairy' ? c.registerCow : c.registerAnimal;
  const cols: Array<{ key: string; label: string; flex: number; align?: 'right' | 'center' }> =
    logic === 'dairy'
      ? [
          { key: 'cow', label: c.cow, flex: 1.6 },
          { key: 'breed', label: c.breed, flex: 1.4 },
          { key: 'status', label: c.status, flex: 1.2 },
          { key: 'milk', label: c.milkToday, flex: 1, align: 'right' },
          { key: 'trend', label: c.trend7, flex: 1.2, align: 'center' },
          { key: 'weight', label: c.weight, flex: 0.9, align: 'right' },
        ]
      : logic === 'beef'
        ? [
            { key: 'cow', label: c.cow, flex: 1.6 },
            { key: 'breed', label: c.breed, flex: 1.4 },
            { key: 'entry', label: c.entryKg, flex: 0.9, align: 'right' },
            { key: 'weight', label: c.weight, flex: 0.9, align: 'right' },
            { key: 'gain', label: c.gain, flex: 0.9, align: 'right' },
            { key: 'days', label: c.daysFed, flex: 0.8, align: 'right' },
          ]
        : [
            { key: 'cow', label: c.cow, flex: 1.6 },
            { key: 'breed', label: c.breed, flex: 1.3 },
            { key: 'status', label: c.book, flex: 1.1 },
            { key: 'milk', label: c.milkToday, flex: 1, align: 'right' },
            { key: 'weight', label: c.weight, flex: 0.9, align: 'right' },
            { key: 'gain', label: c.gain, flex: 0.9, align: 'right' },
          ];
  return (
    <>
      <CardHead
        title={title}
        sub={logic === 'dairy' ? c.herdSub(cows.length) : c.animalsSub(cows.length)}
        right={
          limit || compact ? (
            <Btn label={c.openHerd} size="sm" onPress={() => router.navigate({ pathname: '/(app)/livestock', params: { tab: 'dairy' } })} />
          ) : (
            <Btn label={addLabel} icon="plus" size="sm" onPress={() => router.navigate('/(app)/cattle/new')} />
          )
        }
        style={{ padding: 22, paddingBottom: 16 }}
      />
      <Table
        rows={compact ? rows.slice(0, 5) : rows}
        rowKey={(x) => x._id}
        onRowPress={(x) => router.navigate(`/(app)/cattle/${x._id}` as Href)}
        empty={<Empty icon={logic === 'beef' ? 'scale' : 'milk'} title={c.noCows} sub={c.noCowsSub} action={<Btn label={addLabel} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/cattle/new')} />} />}
        cols={cols}
        render={(x, col) => {
          const series = milkBy.get(x._id) ?? [];
          const today = series[6] ?? 0;
          const fatten = isFatteningAnimal(x.purpose);
          if (col.key === 'cow')
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconTile name={fatten ? 'scale' : 'milk'} tone={fatten ? 'gold' : 'sky'} size={34} />
                <Cell title={x.animalId} sub={titleCase(x.gender)} strong />
              </View>
            );
          if (col.key === 'breed') return <Tx s={13} color={C.sub} lines={1}>{x.breed}</Tx>;
          if (col.key === 'status') {
            const s = cowStatus(x, series.some((v) => v > 0));
            return <Pill label={c[s.label]} tone={s.tone} />;
          }
          if (col.key === 'milk') return <Tx s={14} w="800" tabular>{!fatten && today ? `${num(today, 1)} L` : '—'}</Tx>;
          if (col.key === 'trend') return <TrendLine pts={series.length ? series : [0, 0]} />;
          if (col.key === 'entry') return <Tx s={13} color={C.sub} tabular>{x.entryWeight ? `${num(x.entryWeight)} kg` : '—'}</Tx>;
          if (col.key === 'gain') {
            const g = fatten ? weightGain(x.entryWeight, x.currentWeight) : null;
            return <Tx s={14} w="800" tabular color={g == null ? C.faint : g >= 0 ? C.padma : C.coral}>{g == null ? '—' : `${g >= 0 ? '+' : ''}${num(g, 1)} kg`}</Tx>;
          }
          if (col.key === 'days') {
            const d = daysOnFeed(x.purchaseDate);
            return <Tx s={13} color={C.sub} tabular>{d == null ? '—' : num(d)}</Tx>;
          }
          return <Tx s={13} w={logic === 'beef' ? '800' : '400'} color={logic === 'beef' ? C.ink : C.sub} tabular>{x.currentWeight ? `${num(x.currentWeight)} kg` : '—'}</Tx>;
        }}
      />
    </>
  );
}
