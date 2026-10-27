import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { domainApi } from '@/api';
import { BarChart, Ring } from '@/components/dashboard/charts';
import {
  batchCycle,
  batchSaleAmount,
  batchTitle,
  costDate,
  costVisual,
  costsForBatch,
  customerName,
  lastDays,
  mortalityPct,
  saleDate,
  salesForBatch,
  sum,
  survival,
  unitShort,
  useCosts,
  useSales,
} from '@/components/dashboard/data';
import { EntryDrawer, type EntryKind } from '@/components/dashboard/drawers';
import { bdt, dayMonth, downloadCsv, fullDate, isoDay, num, pct, titleCase } from '@/components/dashboard/format';
import type { IconName } from '@/components/dashboard/icons';
import { Btn, Card, CardHead, Divider, Empty, IconTile, Pill, Table, Tx } from '@/components/dashboard/kit';
import { LoadingPage, Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C, type Tone } from '@/components/dashboard/theme';
import { Contours } from '@/components/web-landing/graphics';
import { canWriteCost, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

export function WebBatch({ id, initialEntry }: { id: string; initialEntry?: EntryKind }) {
  const { c, lang } = useDash();
  const router = useRouter();
  const { user } = useAuth();
  const width = useContentWidth();
  const wide = width >= 1000;
  const q = useQuery({ queryKey: ['poultry-batch', id], queryFn: () => domainApi.getPoultryBatch(id), enabled: Boolean(id) });
  const salesQ = useSales();
  const costsQ = useCosts();
  const [entry, setEntry] = useState<EntryKind | null>(initialEntry ?? null);
  const canCost = canWriteCost(user?.role);
  const canDeath = canWritePoultry(user?.role);

  const b = q.data;
  const costs = useMemo(() => costsForBatch(costsQ.data ?? [], id).sort((x, y) => +(costDate(y) ?? 0) - +(costDate(x) ?? 0)), [costsQ.data, id]);
  const sales = useMemo(() => salesForBatch(salesQ.data ?? [], id), [salesQ.data, id]);
  const costTotal = sum(costs, (x) => x.totalAmount);
  const salesTotal = sum(sales, (s) => batchSaleAmount(s, id));
  const profit = salesTotal - costTotal;
  const days = lastDays(14);
  const daily = days.map((d) => ({ label: dayMonth(d.start, lang), value: sum(costs.filter((x) => { const t = costDate(x); return Boolean(t && t >= d.start && t < d.end); }), (x) => x.totalAmount) }));
  const todayIdx = daily.length - 1;
  const spentRecently = daily.slice(-3).some((d) => d.value > 0);

  const crumbs = [c.livestock, c.poultry, b ? batchTitle(b) : '…'];
  const top = (
    <PageTop
      crumbs={crumbs}
      title={b ? batchTitle(b) : c.batch}
      actions={
        b ? (
          <>
            {canCost ? <Btn label={c.addCost} icon="plus" onPress={() => setEntry('feed')} /> : null}
            <Btn label={c.sellFromBatch} icon="cash" kind="lime" onPress={() => router.navigate({ pathname: '/(app)/sell', params: { batchId: b._id } })} />
          </>
        ) : null
      }
    />
  );

  if (q.isLoading) return <LoadingPage top={top} />;
  if (!b) {
    return (
      <Page top={top}>
        <Card>
          <Empty icon="bird" title={c.batchNotFound} sub={q.error instanceof Error ? q.error.message : undefined} action={<Btn label={c.livestock} icon="arrowLeft" onPress={() => router.navigate('/(app)/livestock')} />} />
        </Card>
      </Page>
    );
  }

  const cyc = batchCycle(b);
  const surv = survival(b);
  const m = mortalityPct(b);
  const closed = b.status === 'closed';

  const timeline: Array<{ at: Date; color: string; title: string }> = [
    ...costs.slice(0, 6).map((x) => ({ at: costDate(x) ?? new Date(0), color: C.gold, title: `${x.categoryName ?? c.other} · ${num(x.quantity)} ${x.unit} · ${bdt(x.totalAmount)}` })),
    ...sales.slice(0, 6).map((s) => {
      const it = s.items?.find((i) => String(i.referenceId ?? '') === id);
      return { at: saleDate(s) ?? new Date(0), color: C.emerald, title: c.soldTl(`${num(it?.quantity ?? 0)} ${unitShort(it?.unit)}`, customerName(s) ?? '') };
    }),
    { at: new Date(b.purchaseDate), color: C.padma, title: c.batchPlacedTl(num(b.initialQuantity)) },
  ]
    .sort((x, y) => y.at.getTime() - x.at.getTime())
    .slice(0, 6);

  const entries: Array<{ kind: EntryKind; label: string; icon: IconName; tone: Tone; allowed: boolean }> = [
    { kind: 'feed', label: c.feed, icon: 'wheat', tone: 'gold', allowed: canCost },
    { kind: 'vaccine', label: c.vaccine, icon: 'syringe', tone: 'sky', allowed: canCost },
    { kind: 'death', label: c.death, icon: 'alert', tone: 'coral', allowed: canDeath },
    { kind: 'other', label: c.other, icon: 'plus', tone: 'green', allowed: canCost },
  ];

  return (
    <Page top={top}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flex: 2.1, gap: 16, width: wide ? undefined : '100%' }}>
          <Card dark pad={26}>
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Contours w={900} h={220} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 26 }}>
              <Ring size={128} pct={surv} color={C.lime} track={C.forest3} sw={12}>
                <Tx s={28} w="800" color={C.white}>{Math.round(surv)}%</Tx>
                <Tx s={12} color="rgba(255,255,255,0.6)">{c.survival}</Tx>
              </Ring>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Pill label={titleCase(b.birdType)} tone="dark" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, paddingHorizontal: 10, height: 26 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: closed ? C.faint : C.lime }} />
                    <Tx s={12} w="600" color={C.white}>{closed ? c.closed : c.activeDay(cyc.day, cyc.total)}</Tx>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <Tx s={40} w="800" color={C.white} tabular>{num(b.currentQuantity)}</Tx>
                  <Tx s={15} color="rgba(255,255,255,0.65)">{c.birdsAliveOf(num(b.initialQuantity))}</Tx>
                </View>
                <View style={{ flexDirection: 'row', gap: 28, marginTop: 14, flexWrap: 'wrap' }}>
                  <HeroStat label={c.deaths} value={`${num(b.mortalityCount ?? 0)} · ${pct(m)}`} color={m >= 3 ? '#FF8B7D' : C.white} />
                  <HeroStat label={c.chickPrice} value={bdt(b.unitPrice)} />
                  <HeroStat label={c.costPerBird} value={b.currentQuantity ? bdt(costTotal / b.currentQuantity) : '—'} />
                  <HeroStat label={c.avgWeight} value={b.averageWeight ? `${num(b.averageWeight, 2)} kg` : '—'} />
                  <HeroStat label={c.placedOn} value={fullDate(b.purchaseDate, lang)} />
                </View>
              </View>
            </View>
          </Card>

          <Card>
            <CardHead title={c.dailySpend} sub={c.dailySpendSub} right={<Pill label={spentRecently ? c.spending : c.quiet} tone={spentRecently ? 'gold' : 'green'} />} />
            <View style={{ marginTop: 18 }}>
              <BarChart data={daily} height={170} color={C.gold} muted={C.goldSoft} highlight={daily[todayIdx].value > 0 ? todayIdx : undefined} />
            </View>
          </Card>

          <Card pad={0}>
            <CardHead
              title={c.costsForBatch}
              sub={c.entries(costs.length, bdt(costTotal))}
              right={
                <Btn
                  label={c.export}
                  icon="download"
                  size="sm"
                  onPress={() =>
                    downloadCsv(`${b.batchName}-costs.csv`, [
                      ['Date', 'Category', 'Quantity', 'Unit', 'Rate', 'Amount', 'Note'],
                      ...costs.map((x) => [isoDay(costDate(x) ?? new Date()), x.categoryName ?? '', x.quantity, x.unit, x.rate, x.totalAmount, x.description ?? '']),
                    ])
                  }
                />
              }
              style={{ padding: 22, paddingBottom: 16 }}
            />
            <Table
              rows={costs}
              rowKey={(x) => x._id}
              empty={<Empty icon="receipt" title={c.noCosts} sub={c.noCostsSub} />}
              cols={[
                { key: 'date', label: c.date, flex: 0.8 },
                { key: 'cat', label: c.category, flex: 1.7 },
                { key: 'qty', label: c.qtyRate, flex: 1.4 },
                { key: 'note', label: c.note, flex: 1.6 },
                { key: 'amt', label: c.amount, flex: 1, align: 'right' },
              ]}
              render={(x, col) => {
                if (col.key === 'date') return <Tx s={13} color={C.sub}>{dayMonth(costDate(x), lang)}</Tx>;
                if (col.key === 'cat') {
                  const v = costVisual(x.categoryName);
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <IconTile name={v.icon} tone={v.tone} size={32} />
                      <Tx s={14} w="700" lines={1} style={{ flexShrink: 1 }}>{x.categoryName ?? c.other}</Tx>
                    </View>
                  );
                }
                if (col.key === 'qty') return <Tx s={13} color={C.sub} tabular>{`${num(x.quantity)} ${x.unit} × ${bdt(x.rate)}`}</Tx>;
                if (col.key === 'note') return <Tx s={13} color={C.sub} lines={1}>{x.description ?? '—'}</Tx>;
                return <Tx s={14} w="800" tabular>{bdt(x.totalAmount)}</Tx>;
              }}
            />
          </Card>
        </View>

        <View style={{ flex: 1, gap: 16, width: wide ? undefined : '100%', minWidth: 300 }}>
          <Card>
            <Tx s={17} w="700">{c.batchPl}</Tx>
            <View style={{ gap: 12, marginTop: 16 }}>
              <PlRow label={c.salesFromBatch} value={bdt(salesTotal)} color={C.emerald} />
              <PlRow label={c.batchCosts} value={bdt(-costTotal)} color={C.coral} />
              <PlRow label={c.costPerBird} value={b.currentQuantity ? bdt(costTotal / b.currentQuantity) : '—'} />
            </View>
            <Divider style={{ marginVertical: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tx s={14} w="700">{c.recordedProfit}</Tx>
              <Tx s={24} w="800" color={profit >= 0 ? C.emerald : C.coral} tabular>{bdt(profit, { sign: true })}</Tx>
            </View>
          </Card>

          {entries.some((e) => e.allowed) && !closed ? (
            <Card>
              <Tx s={17} w="700">{c.addEntry}</Tx>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                {entries.filter((e) => e.allowed).map((e) => (
                  <Pressable
                    key={e.kind}
                    onPress={() => setEntry(e.kind)}
                    style={(state) => ({
                      flexBasis: '46%',
                      flexGrow: 1,
                      height: 56,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: C.line,
                      backgroundColor: (state as { hovered?: boolean }).hovered ? C.head : C.white,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 12,
                    })}>
                    <IconTile name={e.icon} tone={e.tone} size={32} />
                    <Tx s={14} w="700">{e.label}</Tx>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          <Card>
            <Tx s={17} w="700">{c.timeline}</Tx>
            <View style={{ marginTop: 16 }}>
              {timeline.map((t, i) => (
                <View key={`${t.title}-${i}`} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ alignItems: 'center', width: 10 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.color, marginTop: 4 }} />
                    {i < timeline.length - 1 ? <View style={{ width: 1.5, flex: 1, backgroundColor: C.line, marginVertical: 3 }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Tx s={11} color={C.faint}>{isoDay(t.at) === isoDay() ? c.today : fullDate(t.at, lang)}</Tx>
                    <Tx s={13} w="700" lines={2}>{t.title}</Tx>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <EntryDrawer open={Boolean(entry)} onClose={() => setEntry(null)} batch={b} initialKind={entry ?? 'feed'} />
    </Page>
  );
}

function HeroStat({ label, value, color = C.white }: { label: string; value: string; color?: string }) {
  return (
    <View>
      <Tx s={12} color="rgba(255,255,255,0.55)">{label}</Tx>
      <Tx s={15} w="800" color={color} tabular>{value}</Tx>
    </View>
  );
}

function PlRow({ label, value, color = C.ink }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Tx s={13} color={C.sub}>{label}</Tx>
      <Tx s={14} w="800" color={color} tabular>{value}</Tx>
    </View>
  );
}