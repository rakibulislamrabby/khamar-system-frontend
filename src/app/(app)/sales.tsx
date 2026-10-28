import { useDesktopWeb, WebSales } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { inventoryApi } from '@/api';
import { change, customerKey, customerName, due, liveSales, periodRange, saleDate, saleProduct, sum, totalsFor } from '@/components/dashboard/data';
import { bdt, dayMonth, isoDay } from '@/components/dashboard/format';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { KIND_VISUAL, saleKind } from '@/components/mobile/sale-kind';
import { EmptyCard, LimeSquare, ListCard, Loading, MChips, MPill, MScreen, NavHeader, SearchField, ToneTile, Tx } from '@/components/mobile/kit';
import type { Sale } from '@/types/api';

type Filter = 'all' | 'paid' | 'due' | 'birds' | 'eggs' | 'milk';

function SalesScreen() {
  const { c, lang } = useM();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({
    queryKey: ['sales'],
    queryFn: () => inventoryApi.listSales(),
  });

  const all = useMemo(() => liveSales(query.data?.data ?? []), [query.data]);
  const month = totalsFor(all, [], periodRange('month', 0));
  const prev = totalsFor(all, [], periodRange('month', 1));
  const delta = change(month.income, prev.income);
  const receivable = sum(all, (s) => due(s));
  const owing = new Set(all.filter((s) => due(s) > 0).map((s) => customerKey(s) ?? s._id)).size;

  const rows = all.filter((s) => {
    if (filter === 'paid' && due(s) > 0) return false;
    if (filter === 'due' && due(s) <= 0) return false;
    if ((filter === 'birds' || filter === 'eggs' || filter === 'milk') && saleKind(s) !== filter) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return [s.saleNumber, customerName(s), ...(s.items ?? []).map((i) => i.itemName)].some((v) => (v ?? '').toLowerCase().includes(needle));
  });

  const groups = useMemo(() => {
    const today = isoDay(new Date());
    const yest = isoDay(new Date(Date.now() - 86_400_000));
    const map = new Map<string, { label: string; rows: Sale[] }>();
    for (const s of [...rows].sort((a, b) => +(saleDate(b) ?? 0) - +(saleDate(a) ?? 0))) {
      const d = saleDate(s);
      const key = d ? isoDay(d) : '—';
      const label = key === today ? c.today : key === yest ? c.yesterday : d ? dayMonth(d, lang) : '—';
      if (!map.has(key)) map.set(key, { label, rows: [] });
      map.get(key)!.rows.push(s);
    }
    return [...map.values()];
  }, [rows, c.today, c.yesterday, lang]);

  const chips: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: c.all },
    { key: 'paid', label: c.paid },
    { key: 'due', label: c.due },
    { key: 'birds', label: c.birds },
    { key: 'eggs', label: c.eggs },
    { key: 'milk', label: c.milk },
  ];

  return (
    <MScreen
      header={<NavHeader title={c.sales} right={<LimeSquare label={c.newSale} onPress={() => router.navigate('/(app)/sell')} />} />}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: C.forest, borderRadius: 22, padding: 16 }}>
          <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.thisMonth}</Tx>
          <Tx s={22} w="800" color={C.white} tabular lines={1} style={{ letterSpacing: -1, marginTop: 6 }}>{bdt(month.income)}</Tx>
          <Tx s={12} w="600" color={C.lime} lines={1} style={{ marginTop: 4 }}>
            {delta == null ? c.salesCount(month.saleCount) : c.salesDelta(c.salesCount(month.saleCount), `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`)}
          </Tx>
        </View>
        <View style={{ flex: 1, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: '#F5DC9E', borderRadius: 22, padding: 16 }}>
          <Tx s={12} w="500" color="#8A6200">{c.receivable}</Tx>
          <Tx s={22} w="800" tabular lines={1} style={{ letterSpacing: -1, marginTop: 6 }}>{bdt(receivable)}</Tx>
          <Tx s={12} w="600" color="#8A6200" lines={1} style={{ marginTop: 4 }}>{owing ? c.buyersOwe(owing) : c.allBuyersPaid}</Tx>
        </View>
      </View>

      <SearchField value={q} onChange={setQ} placeholder={c.searchSales} />
      <View style={{ marginTop: -4 }}>
        <MChips value={filter} options={chips} onChange={setFilter} />
      </View>

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <EmptyCard icon="alert" title={c.noSales} sub={query.error instanceof Error ? query.error.message : undefined} /> : null}
      {!query.isLoading && !all.length ? <EmptyCard icon="receipt" title={c.noSales} sub={c.noSalesSub} /> : null}
      {!query.isLoading && all.length && !rows.length ? <EmptyCard icon="search" title={c.noMatch} /> : null}

      {groups.map((g) => (
        <View key={g.label} style={{ gap: 8, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tx s={13} w="700">{g.label}</Tx>
            <Tx s={12} w="500" color={C.sub}>{c.salesCount(g.rows.length)}</Tx>
          </View>
          <ListCard>
            {g.rows.map((s) => {
              const v = KIND_VISUAL[saleKind(s)];
              const p = saleProduct(s);
              const d = due(s);
              return (
                <View key={s._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 16 }}>
                  <ToneTile icon={v.icon} tone={v.tone} size={42} radius={14} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Tx s={14} w="600" lines={1}>{customerName(s) ?? c.walkIn}</Tx>
                    <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>{[s.saleNumber, [p.qty, p.name].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}</Tx>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <Tx s={15} w="700" tabular>{bdt(s.totalAmount)}</Tx>
                    {d > 0 ? <MPill label={c.dueAmt(bdt(d))} tone="gold" /> : <MPill label={c.paid} />}
                  </View>
                </View>
              );
            })}
          </ListCard>
        </View>
      ))}
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebSales /> : <SalesScreen />;
}
