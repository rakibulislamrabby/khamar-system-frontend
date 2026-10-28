import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AreaSpark, PairBarChart, SparkBars } from '@/components/dashboard/charts';
import {
  batchCycle,
  batchTitle,
  birdVisual,
  buckets,
  change,
  customerName,
  customerKey,
  due,
  isActiveBatch,
  isLow,
  liveSales,
  mortalityPct,
  periodRange,
  productVisual,
  saleDate,
  saleProduct,
  sum,
  totalsFor,
  useBatches,
  useBatchPl,
  useCosts,
  useCows,
  useDashboard,
  useItems,
  useSales,
  costVisual,
  type Period,
} from '@/components/dashboard/data';
import { NewBatchDrawer } from '@/components/dashboard/drawers';
import { bdt, dayMonth, fullDate, monthName, num, pct, relativeTime, titleCase } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Btn, Card, CardHead, Cell, Delta, Empty, IconTile, MenuItem, Pill, Popover, Progress, Segmented, Table, Tx } from '@/components/dashboard/kit';
import { HerdTable } from '@/components/dashboard/screens/livestock';
import { Page, PageTop, Row, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C, TONES, type Tone } from '@/components/dashboard/theme';
import { cattleLogic, isFatteningAnimal, weightGain } from '@/lib/cattle';
import { useAuth } from '@/providers/auth-provider';

type Range = 'this' | 'last' | 'year';

export function WebHome() {
  const { c, lang } = useDash();
  const router = useRouter();
  const { user, organization } = useAuth();
  const width = useContentWidth();
  const wide = width >= 1000;
  const dash = useDashboard();
  const salesQ = useSales();
  const costsQ = useCosts();
  const batchesQ = useBatches();
  const itemsQ = useItems();
  const batchPl = useBatchPl();
  const isCow = organization?.farmType === 'cow';
  const [range, setRange] = useState<Range>('this');
  const [chartPeriod, setChartPeriod] = useState<Period>('week');
  const [newBatch, setNewBatch] = useState(false);

  const sales = useMemo(() => salesQ.data ?? [], [salesQ.data]);
  const costs = useMemo(() => costsQ.data ?? [], [costsQ.data]);
  const batches = useMemo(() => (batchesQ.data ?? []).filter(isActiveBatch), [batchesQ.data]);

  const now = new Date();
  const curRange = range === 'year' ? periodRange('year', 0) : periodRange('month', range === 'last' ? 1 : 0);
  const prevRange = range === 'year' ? periodRange('year', 1) : periodRange('month', range === 'last' ? 2 : 1);
  const cur = totalsFor(sales, costs, curRange);
  const prev = totalsFor(sales, costs, prevRange);
  const owing = liveSales(sales).filter((s) => due(s) > 0);
  const receivable = sum(owing, due);
  const owingBuyers = new Set(owing.map((s) => customerKey(s) ?? s._id)).size;

  const weekly = buckets(sales, costs, 'week', lang, 8);
  const recvWeekly = weekly.map((w) => sum(owing.filter((s) => { const d = saleDate(s); return Boolean(d && d >= w.start && d < w.end); }), due));
  const chart = buckets(sales, costs, chartPeriod, lang);
  const rangeLabel =
    range === 'year'
      ? String(curRange.start.getFullYear())
      : `1 – ${range === 'this' ? now.getDate() : new Date(curRange.end.getTime() - 1).getDate()} ${monthName(curRange.start.getMonth(), lang)} ${curRange.start.getFullYear()}`;
  const profitLabel = range === 'year' ? String(curRange.start.getFullYear()) : monthName(curRange.start.getMonth(), lang, true);

  const top = (
    <PageTop
      crumbs={[organization?.name ?? 'Khamar', c.overview]}
      title={`${c.greeting(now.getHours())}, ${user?.name?.split(' ')[0] ?? ''}`}
      actions={
        <>
          <Popover
            width={220}
            align="right"
            trigger={(open) => <Btn label={rangeLabel} icon="cal" iconRight="down" kind="outline" onPress={open} />}>
            {(close) => (
              <View style={{ paddingVertical: 6 }}>
                {(
                  [
                    ['this', monthName(periodRange('month', 0).start.getMonth(), lang, true)],
                    ['last', monthName(periodRange('month', 1).start.getMonth(), lang, true)],
                    ['year', String(now.getFullYear())],
                  ] as Array<[Range, string]>
                ).map(([k, label]) => (
                  <MenuItem key={k} label={label} active={range === k} onPress={() => { setRange(k); close(); }} />
                ))}
              </View>
            )}
          </Popover>
          <Popover
            width={240}
            align="right"
            trigger={(open) => <Btn label={c.newEntry} icon="plus" kind="lime" onPress={open} />}>
            {(close) => (
              <View style={{ paddingVertical: 6 }}>
                <MenuItem icon="cash" tone="green" label={c.recordSale} onPress={() => { close(); router.navigate('/(app)/sell'); }} />
                {!isCow ? <MenuItem icon="bird" tone="lime" label={c.newBatch} onPress={() => { close(); setNewBatch(true); }} /> : null}
                {isCow ? <MenuItem icon={organization?.cowPurpose === 'beef' ? 'scale' : 'milk'} tone="sky" label={organization?.cowPurpose === 'dairy' ? c.registerCow : c.registerAnimal} onPress={() => { close(); router.navigate('/(app)/cattle/new'); }} /> : null}
                <MenuItem icon="box" tone="gold" label={c.stockIn} onPress={() => { close(); router.navigate({ pathname: '/(app)/inventory', params: { action: 'in' } }); }} />
                <MenuItem icon="userPlus" tone="violet" label={c.addCustomer} onPress={() => { close(); router.navigate({ pathname: '/(app)/customers', params: { action: 'new' } }); }} />
              </View>
            )}
          </Popover>
        </>
      }
    />
  );

  const loading = salesQ.isLoading || costsQ.isLoading;

  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <ProfitCard
          label={`${c.netProfit} · ${profitLabel}`}
          value={loading ? '—' : bdt(cur.net)}
          delta={change(cur.net, prev.net)}
          pts={weekly.map((w) => w.a - w.b)}
        />
        <KpiCard icon="up" tone="lime" label={c.income} value={loading ? '—' : bdt(cur.income)} delta={change(cur.income, prev.income)} bars={weekly.map((w) => w.a)} barColor={C.emerald} muted={C.mint} />
        <KpiCard icon="trendDown" tone="coral" label={c.expense} value={loading ? '—' : bdt(cur.expense)} delta={change(cur.expense, prev.expense)} goodWhenUp={false} bars={weekly.map((w) => w.b)} barColor={C.coral} muted={C.coralSoft} />
        <KpiCard icon="wallet" tone="gold" label={c.receivable} value={loading ? '—' : bdt(receivable)} chip={c.buyers(owingBuyers)} bars={recvWeekly} barColor={C.gold} muted={C.goldSoft} />
      </View>

      <Row style={{ flexDirection: wide ? 'row' : 'column' }}>
        <Card style={{ flex: 2.1 }}>
          <CardHead
            title={c.incomeVsExpense}
            sub={chartPeriod === 'week' ? c.lastNWeeks(12) : chartPeriod === 'month' ? c.lastNMonths(12) : c.lastNYears(5)}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Legend color={C.padma} label={c.income} />
                <Legend color="#F4A79C" label={c.expense} />
                <Segmented
                  value={chartPeriod}
                  onChange={setChartPeriod}
                  options={[{ key: 'week', label: c.week }, { key: 'month', label: c.month }, { key: 'year', label: c.year }]}
                />
              </View>
            }
          />
          <View style={{ marginTop: 20 }}>
            <PairBarChart data={chart} height={250} />
          </View>
        </Card>
        <TodayCard />
      </Row>

      <Row style={{ flexDirection: wide ? 'row' : 'column' }}>
        <Card pad={0} style={{ flex: 2.1 }}>
          {isCow ? (
            <HerdTable compact />
          ) : (
            <>
              <CardHead
                title={c.activeBatches}
                sub={c.batchesSummary(batches.length, num(sum(batches, (b) => b.currentQuantity)))}
                right={<Btn label={c.viewAll} size="sm" onPress={() => router.navigate('/(app)/livestock')} />}
                style={{ padding: 22, paddingBottom: 16 }}
              />
              <Table
                rows={batches.slice(0, 5)}
                rowKey={(b) => b._id}
                onRowPress={(b) => router.navigate(`/(app)/poultry/${b._id}` as Href)}
                empty={<Empty icon="bird" title={c.noBatches} sub={c.noBatchesSub} action={<Btn label={c.newBatch} icon="plus" kind="lime" onPress={() => setNewBatch(true)} />} />}
                cols={[
                  { key: 'batch', label: c.batch, flex: 2.2 },
                  { key: 'type', label: c.type, flex: 1 },
                  { key: 'cycle', label: c.cycle, flex: 1.8 },
                  { key: 'alive', label: c.alive, flex: 0.9, align: 'right' },
                  { key: 'mort', label: c.mortality, flex: 1, align: 'right' },
                  { key: 'pl', label: c.pl, flex: 1.1, align: 'right' },
                ]}
                render={(b, col) => {
                  const cyc = batchCycle(b);
                  const v = birdVisual(b.birdType);
                  switch (col.key) {
                    case 'batch':
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <IconTile name={v.icon} tone={v.tone} size={36} />
                          <Cell title={batchTitle(b)} sub={c.day(cyc.day)} strong />
                        </View>
                      );
                    case 'type':
                      return <Pill label={titleCase(b.birdType)} tone="green" />;
                    case 'cycle':
                      return (
                        <View style={{ width: '100%', gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Tx s={12} color={C.sub}>{c.dayOf(cyc.day, cyc.total)}</Tx>
                            <Tx s={12} color={C.sub}>{Math.round(cyc.pct)}%</Tx>
                          </View>
                          <Progress pct={cyc.pct} h={6} />
                        </View>
                      );
                    case 'alive':
                      return <Tx s={14} w="700" tabular>{num(b.currentQuantity)}</Tx>;
                    case 'mort': {
                      const m = mortalityPct(b);
                      return <Tx s={14} w="700" color={m >= 3 ? C.coral : m >= 1.5 ? C.goldInk : C.padma} tabular>{pct(m)}</Tx>;
                    }
                    default: {
                      const pl = batchPl(b);
                      return <Tx s={14} w="700" color={pl >= 0 ? C.padma : C.coral} tabular>{bdt(pl, { sign: true })}</Tx>;
                    }
                  }
                }}
              />
            </>
          )}
        </Card>
        <LowStockCard items={(itemsQ.data ?? []).filter(isLow)} loading={itemsQ.isLoading && dash.isLoading} />
      </Row>

      <Row style={{ flexDirection: wide ? 'row' : 'column' }}>
        <Card pad={0} style={{ flex: 2.1 }}>
          <CardHead
            title={c.recentSales}
            sub={c.salesThisMonth(totalsFor(sales, costs, periodRange('month', 0)).saleCount)}
            right={<Btn label={c.allSales} size="sm" onPress={() => router.navigate('/(app)/sales')} />}
            style={{ padding: 22, paddingBottom: 16 }}
          />
          <Table
            rows={liveSales(sales).slice(0, 5)}
            rowKey={(s) => s._id}
            onRowPress={() => router.navigate('/(app)/sales')}
            empty={<Empty icon="receipt" title={c.noSales} sub={c.noSalesSub} action={<Btn label={c.recordSale} icon="plus" kind="lime" onPress={() => router.navigate('/(app)/sell')} />} />}
            cols={[
              { key: 'inv', label: c.invoice, flex: 1.4 },
              { key: 'buyer', label: c.buyer, flex: 1.5 },
              { key: 'product', label: c.product, flex: 1.5 },
              { key: 'amount', label: c.amount, flex: 1.1, align: 'right' },
              { key: 'status', label: c.status, flex: 1.1, align: 'right' },
            ]}
            render={(s, col) => {
              if (col.key === 'inv') return <Cell title={s.saleNumber ?? '—'} sub={dayMonth(s.saleDate, lang)} strong />;
              if (col.key === 'buyer') return <Tx s={14} w="600" lines={1}>{customerName(s) ?? c.walkIn}</Tx>;
              if (col.key === 'product') {
                const p = saleProduct(s);
                return <Tx s={13} color={C.sub} lines={1}>{p.qty ? `${p.name} · ${p.qty}` : p.name}</Tx>;
              }
              if (col.key === 'amount') return <Tx s={14} w="700" tabular>{bdt(s.totalAmount)}</Tx>;
              const d = due(s);
              return d > 0 ? <Pill label={c.dueAmt(bdt(d))} tone="gold" /> : <Pill label={c.paid} tone="green" />;
            }}
          />
        </Card>
        <ActivityCard />
      </Row>

      <NewBatchDrawer open={newBatch} onClose={() => setNewBatch(false)} />
    </Page>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} />
      <Tx s={12} color={C.sub}>{label}</Tx>
    </View>
  );
}

const kpiBox = { flexGrow: 1, flexBasis: 230, minHeight: 176, justifyContent: 'space-between' as const };

function ProfitCard({ label, value, delta, pts }: { label: string; value: string; delta: number | null; pts: number[] }) {
  return (
    <Card dark pad={21} style={kpiBox}>
      <View pointerEvents="none" style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: C.forest2, top: -70, right: -50 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconTile name="leaf" onDark size={38} />
        <Delta value={delta} onDark />
      </View>
      <View style={{ marginTop: 16 }}>
        <Tx s={13} color="rgba(255,255,255,0.6)">{label}</Tx>
        <Tx s={30} w="800" color={C.white} style={{ marginTop: 2 }} tabular>{value}</Tx>
      </View>
      <View style={{ marginTop: 8, marginHorizontal: -2 }}>
        <AreaSpark pts={pts} stroke={C.lime} h={40} />
      </View>
    </Card>
  );
}

function KpiCard({
  icon,
  tone,
  label,
  value,
  delta,
  goodWhenUp = true,
  chip,
  bars,
  barColor,
  muted,
}: {
  icon: IconName;
  tone: Tone;
  label: string;
  value: string;
  delta?: number | null;
  goodWhenUp?: boolean;
  chip?: string;
  bars: number[];
  barColor: string;
  muted: string;
}) {
  return (
    <Card pad={21} style={kpiBox}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconTile name={icon} tone={tone} size={38} />
        {chip ? <Delta value={null} text={chip} /> : <Delta value={delta ?? null} goodWhenUp={goodWhenUp} />}
      </View>
      <View style={{ marginTop: 'auto' as unknown as number }}>
        <Tx s={13} color={C.sub}>{label}</Tx>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
          <Tx s={28} w="800" lines={1} tabular style={{ flexShrink: 1 }}>{value}</Tx>
          <SparkBars vals={bars.slice(-7)} color={barColor} muted={muted} />
        </View>
      </View>
    </Card>
  );
}

function TodayCard() {
  const { c, lang } = useDash();
  const { organization } = useAuth();
  const logic = organization?.farmType === 'cow' ? cattleLogic(organization.cowPurpose) : null;
  const dash = useDashboard();
  const batchesQ = useBatches();
  const itemsQ = useItems();
  const cowsQ = useCows();
  const d = dash.data;
  const active = (batchesQ.data ?? []).filter(isActiveBatch);
  const layers = active.filter((b) => b.birdType?.toLowerCase() === 'layer');
  const layerBirds = sum(layers, (b) => b.currentQuantity);
  const eggs = d?.poultry.todayEggProduction ?? 0;
  const layRate = layerBirds ? (eggs / layerBirds) * 100 : 0;
  const totalCows = d?.dairy.totalCows ?? cowsQ.data?.length ?? 0;
  const lact = d?.dairy.lactatingCows ?? 0;
  const deaths = sum(active, (b) => b.mortalityCount);
  const avgMort = active.length ? sum(active, mortalityPct) / active.length : 0;
  const feed = (itemsQ.data ?? []).filter((i) => i.category === 'feed');
  const feedStock = sum(feed, (i) => i.currentStock);
  const feedMin = sum(feed, (i) => i.minStockLevel);
  const feedLow = feed.filter(isLow).length;
  const feedUnit = feed[0]?.unit ?? 'bags';
  const today = new Date();

  type TodayRow = { icon: IconName; tone: Tone; label: string; value: string; sub: string; pct: number; color: string; track: string };
  const cows = cowsQ.data ?? [];
  const fattening = d?.dairy.fatteningCattle ?? cows.filter((x) => isFatteningAnimal(x.purpose)).length;
  const dairyCows = Math.max(0, totalCows - fattening);
  const preg = d?.dairy.pregnantCows ?? 0;
  const gains = cows.filter((x) => isFatteningAnimal(x.purpose)).map((x) => weightGain(x.entryWeight, x.currentWeight)).filter((g): g is number => g != null);
  const avgGain = gains.length ? sum(gains, (g) => g) / gains.length : null;

  const eggRow: TodayRow = { icon: 'egg', tone: 'gold', label: c.eggsCollected, value: num(eggs), sub: layerBirds ? c.layRate(pct(layRate, 0)) : c.noLayers, pct: layRate, color: C.gold, track: C.goldSoft };
  const milkRow: TodayRow = { icon: 'milk', tone: 'sky', label: c.milk, value: `${num(d?.dairy.todayMilkProduction ?? 0, 1)} L`, sub: c.cowsLactating(lact), pct: dairyCows ? (lact / dairyCows) * 100 : 0, color: C.sky, track: C.skySoft };
  const deathRow: TodayRow = { icon: 'alert', tone: 'coral', label: c.deaths, value: num(deaths), sub: c.thisCycle(pct(avgMort)), pct: Math.min(100, avgMort * 10), color: C.coral, track: C.coralSoft };
  const feedRow: TodayRow = { icon: 'wheat', tone: 'green', label: c.feedInStore, value: `${num(feedStock)} ${feedUnit}`, sub: feed.length ? c.itemsLow(feedLow) : c.noFeedStock, pct: feedMin ? Math.min(100, (feedStock / (feedMin * 3)) * 100) : feedStock ? 70 : 0, color: C.emerald, track: C.mint };
  const pregRow: TodayRow = { icon: 'pulse', tone: 'violet', label: c.pregnantCows, value: num(preg), sub: c.herdSub(dairyCows), pct: dairyCows ? (preg / dairyCows) * 100 : 0, color: C.violet, track: C.violetSoft };
  const weightRow: TodayRow = { icon: 'scale', tone: 'gold', label: c.avgWeightHerd, value: d?.dairy.averageWeight ? `${num(d.dairy.averageWeight)} kg` : '—', sub: c.animalsSub(fattening), pct: totalCows ? (fattening / totalCows) * 100 : 0, color: C.gold, track: C.goldSoft };
  const gainRow: TodayRow = { icon: 'up', tone: 'green', label: c.avgGain, value: avgGain != null ? `${avgGain >= 0 ? '+' : ''}${num(avgGain, 1)} kg` : '—', sub: avgGain != null ? c.animalsSub(gains.length) : c.noGainYet, pct: gains.length && fattening ? (gains.length / fattening) * 100 : 0, color: C.emerald, track: C.mint };

  const rows: TodayRow[] =
    logic === 'dairy' ? [milkRow, pregRow, feedRow] : logic === 'beef' ? [weightRow, gainRow, feedRow] : logic === 'mixed' ? [milkRow, weightRow, gainRow, feedRow] : [eggRow, milkRow, deathRow, feedRow];

  return (
    <Card style={{ flex: 1, minWidth: 300 }}>
      <CardHead title={c.todayOnFarm} sub={fullDate(today, lang)} right={<Pill label={c.live} tone="green" />} />
      <View style={{ marginTop: 14 }}>
        {rows.map((r, i) => (
          <View key={r.label} style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: C.line }}>
            <IconTile name={r.icon} tone={r.tone} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Tx s={13} w="600">{r.label}</Tx>
                <Tx s={16} w="800" tabular>{r.value}</Tx>
              </View>
              <View style={{ marginTop: 7 }}>
                <Progress pct={r.pct} color={r.color} track={r.track} h={6} />
              </View>
              <Tx s={11} color={C.sub} style={{ marginTop: 5 }}>{r.sub}</Tx>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function LowStockCard({ items, loading }: { items: Array<import('@/types/api').InventoryItem>; loading: boolean }) {
  const { c } = useDash();
  const router = useRouter();
  return (
    <Card style={{ flex: 1, minWidth: 300 }}>
      <CardHead
        title={c.lowStock}
        sub={c.itemsBelowMin(items.length)}
        right={<Btn label={c.stock} iconRight="right" size="sm" kind="ghost" onPress={() => router.navigate('/(app)/inventory')} />}
      />
      <View style={{ marginTop: 12 }}>
        {!loading && !items.length ? <Empty icon="box" title={c.stockHealthy} sub={c.stockHealthySub} /> : null}
        {items.slice(0, 4).map((it, i) => {
          const v = it.category === 'vaccine' ? { icon: 'syringe' as const, tone: 'sky' as const } : it.category === 'medicine' ? { icon: 'drop' as const, tone: 'violet' as const } : it.category === 'feed' ? { icon: 'wheat' as const, tone: 'gold' as const } : { icon: 'box' as const, tone: 'violet' as const };
          const ratio = it.minStockLevel ? (it.currentStock / it.minStockLevel) * 100 : 0;
          return (
            <View key={it._id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: i === Math.min(items.length, 4) - 1 ? 0 : 1, borderBottomColor: C.line }}>
              <IconTile name={v.icon} tone={v.tone} size={34} />
              <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Tx s={13} w="700" lines={1} style={{ flex: 1 }}>{it.name}</Tx>
                  <Tx s={12} w="700" color={C.coral}>{c.ofMin(num(it.currentStock), `${num(it.minStockLevel)} ${it.unit}`)}</Tx>
                </View>
                <Progress pct={ratio} color={C.coral} track={C.coralSoft} h={5} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function ActivityCard() {
  const { c, lang } = useDash();
  const salesQ = useSales();
  const costsQ = useCosts();
  const batchesQ = useBatches();

  const events = useMemo(() => {
    const list: Array<{ id: string; at: Date; icon: IconName; tone: Tone; text: string; sub: string }> = [];
    for (const s of liveSales(salesQ.data ?? []).slice(0, 12)) {
      const at = new Date(s.createdAt ?? s.saleDate ?? 0);
      list.push({ id: `s${s._id}`, at, icon: productVisual(s.items?.[0]?.itemName ?? '').icon, tone: 'green', text: c.actSale(s.saleNumber ?? '', bdt(s.totalAmount)), sub: customerName(s) ?? c.walkIn });
    }
    for (const x of (costsQ.data ?? []).slice(0, 12)) {
      const at = new Date(x.createdAt ?? x.costDate ?? 0);
      const v = costVisual(x.categoryName);
      list.push({ id: `c${x._id}`, at, icon: v.icon, tone: v.tone, text: c.actCost(x.categoryName ?? c.other, bdt(x.totalAmount)), sub: x.description ?? '' });
    }
    for (const b of (batchesQ.data ?? []).slice(0, 6)) {
      const at = new Date(b.createdAt ?? b.purchaseDate);
      list.push({ id: `b${b._id}`, at, icon: 'bird', tone: 'lime', text: c.actBatch(b.batchName, num(b.initialQuantity)), sub: titleCase(b.birdType) });
    }
    return list.filter((e) => !Number.isNaN(e.at.getTime())).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 5);
  }, [salesQ.data, costsQ.data, batchesQ.data, c]);

  return (
    <Card style={{ flex: 1, minWidth: 300 }}>
      <CardHead title={c.activity} sub={c.activitySub} />
      <View style={{ marginTop: 16 }}>
        {!events.length ? <Empty icon="clock" title={c.noActivity} sub={c.noActivitySub} /> : null}
        {events.map((e, i) => (
          <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: TONES[e.tone].bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={e.icon} size={14} color={TONES[e.tone].fg === C.gold ? C.goldInk : TONES[e.tone].fg} />
              </View>
              {i < events.length - 1 ? <View style={{ width: 1.5, flex: 1, backgroundColor: C.line, marginVertical: 4 }} /> : null}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingBottom: 16 }}>
              <Tx s={13} w="700" lines={2}>{e.text}</Tx>
              {e.sub ? <Tx s={12} color={C.sub} lines={1}>{e.sub}</Tx> : null}
              <Tx s={11} color={C.faint} style={{ marginTop: 2 }}>{relativeTime(e.at, lang)}</Tx>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}