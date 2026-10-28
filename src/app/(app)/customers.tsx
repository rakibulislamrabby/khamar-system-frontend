import { useDesktopWeb, WebCustomers } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { organizationApi } from '@/api';
import { customerKey, due, liveSales, sum, useSales } from '@/components/dashboard/data';
import { CustomerDrawer } from '@/components/dashboard/drawers';
import { bdt, initials } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { EmptyCard, HeroBlob, LimeSquare, Loading, MChips, MCard, MScreen, NavHeader, SearchField, Sheet, SheetRow, Tx } from '@/components/mobile/kit';
import { saleKind, type SaleKind } from '@/components/mobile/sale-kind';
import { useAuth } from '@/providers/auth-provider';
import type { Customer } from '@/types/api';

type Filter = 'all' | 'birds' | 'eggs' | 'milk';
const AVATAR_BG = [C.lime, C.goldSoft, C.skySoft];

function CustomersScreen() {
  const { c } = useM();
  const { organization } = useAuth();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [remind, setRemind] = useState(false);
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: () => organizationApi.listCustomers(),
  });
  const salesQ = useSales();

  const stats = useMemo(() => {
    const map = new Map<string, { bought: number; due: number; kinds: Record<SaleKind, number> }>();
    for (const s of liveSales(salesQ.data ?? [])) {
      const k = customerKey(s);
      if (!k) continue;
      const row = map.get(k) ?? { bought: 0, due: 0, kinds: { birds: 0, eggs: 0, milk: 0, other: 0 } };
      row.bought += s.totalAmount;
      row.due += due(s);
      row.kinds[saleKind(s)] += 1;
      map.set(k, row);
    }
    return map;
  }, [salesQ.data]);

  const customers = query.data?.data ?? [];
  const kindOf = (x: Customer): SaleKind => {
    const k = stats.get(x._id)?.kinds;
    if (!k) return 'other';
    const top = (['birds', 'eggs', 'milk'] as const).reduce((a, b) => (k[b] > k[a] ? b : a), 'birds' as SaleKind);
    return k[top] > 0 ? top : 'other';
  };
  const owing = customers.filter((x) => (stats.get(x._id)?.due ?? 0) > 0).sort((a, b) => (stats.get(b._id)?.due ?? 0) - (stats.get(a._id)?.due ?? 0));
  const toCollect = sum(owing, (x) => stats.get(x._id)?.due);
  const kindLabel: Record<SaleKind, string> = { birds: c.birdTrader, eggs: c.eggBuyer, milk: c.milk, other: c.buyer };

  const rows = customers.filter((x) => {
    if (filter !== 'all' && kindOf(x) !== filter) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [x.name, x.phone, x.address, x.district].some((v) => (v ?? '').toLowerCase().includes(needle));
  });

  const orgName = organization?.name ?? c.appName;
  const sms = (x: Customer) => {
    if (!x.phone) return;
    const body = encodeURIComponent(c.reminderText(x.name, bdt(stats.get(x._id)?.due ?? 0), orgName));
    Linking.openURL(`sms:${x.phone}?body=${body}`).catch(() => undefined);
  };

  return (
    <MScreen
      header={<NavHeader title={c.customers} right={<LimeSquare label={c.newCustomer} onPress={() => setAdding(true)} />} />}
      refreshing={query.isRefetching || salesQ.isRefetching}
      onRefresh={() => {
        query.refetch();
        salesQ.refetch();
      }}>
      <View style={{ backgroundColor: C.forest, borderRadius: 24, padding: 18, overflow: 'hidden' }}>
        <HeroBlob />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{c.toCollect}</Tx>
            <Tx s={30} w="800" color={toCollect > 0 ? '#FFC56B' : C.white} tabular lines={1} style={{ letterSpacing: -1, marginTop: 4 }}>{bdt(toCollect)}</Tx>
            <Tx s={12} w="500" color="rgba(255,255,255,0.65)">{owing.length ? c.fromBuyers(owing.length, customers.length) : c.allBuyersPaid}</Tx>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 17 }}>
            {owing.slice(0, 3).map((x, i) => (
              <View key={x._id} style={{ width: 36, height: 36, borderRadius: 18, marginLeft: i ? -10 : 0, backgroundColor: AVATAR_BG[i], borderWidth: 2, borderColor: C.forest, alignItems: 'center', justifyContent: 'center' }}>
                <Tx s={13} w="700" color={C.forest}>{initials(x.name)}</Tx>
              </View>
            ))}
          </View>
        </View>
        {owing.length ? (
          <Pressable
            onPress={() => setRemind(true)}
            style={({ pressed }) => ({ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.lime, marginTop: 14, opacity: pressed ? 0.85 : 1 })}>
            <Icon name="bell" size={14} color={C.forest} />
            <Tx s={12} w="600" color={C.forest}>{c.sendReminders}</Tx>
          </Pressable>
        ) : null}
      </View>

      <SearchField value={q} onChange={setQ} placeholder={c.searchCustomers} />
      <View style={{ marginTop: -4 }}>
        <MChips
          value={filter}
          options={[
            { key: 'all', label: c.allLabel(customers.length) },
            { key: 'birds', label: c.birdTraders },
            { key: 'eggs', label: c.eggBuyers },
            { key: 'milk', label: c.milk },
          ]}
          onChange={setFilter}
        />
      </View>

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <EmptyCard icon="alert" title={c.noCustomers} sub={query.error instanceof Error ? query.error.message : undefined} /> : null}
      {!query.isLoading && !customers.length ? <EmptyCard icon="users" title={c.noCustomers} sub={c.noCustomersSub} /> : null}
      {!query.isLoading && customers.length && !rows.length ? <EmptyCard icon="search" title={c.noMatch} /> : null}

      {rows.map((x) => {
        const st = stats.get(x._id);
        const owe = st?.due ?? 0;
        return (
          <MCard key={x._id} pad={0}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingTop: 15, paddingBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: owe > 0 ? C.goldSoft : C.mint, alignItems: 'center', justifyContent: 'center' }}>
                <Tx s={16} w="700" color={owe > 0 ? '#8A6200' : C.padma}>{initials(x.name)}</Tx>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Tx s={15} w="700" lines={1}>{x.name}</Tx>
                <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>{[x.phone, x.address || x.district].filter(Boolean).join(' · ') || c.noContact}</Tx>
              </View>
              {x.phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${x.phone}`).catch(() => undefined)}
                  accessibilityLabel={c.call}
                  style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 13, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
                  <Icon name="phone" size={17} color={C.padma} />
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginHorizontal: 17, paddingTop: 13, paddingBottom: 15, borderTopWidth: 1, borderTopColor: C.line }}>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#EBF0ED', justifyContent: 'center' }}>
                  <Tx s={12} w="600" color={C.sub}>{kindLabel[kindOf(x)]}</Tx>
                </View>
              </View>
              <View>
                <Tx s={11} w="600" color={C.sub}>{c.bought}</Tx>
                <Tx s={14} w="700" tabular>{bdt(st?.bought ?? 0)}</Tx>
              </View>
              <View>
                <Tx s={11} w="600" color={C.sub}>{c.due}</Tx>
                <Tx s={14} w="700" color={owe > 0 ? C.goldInk : C.emerald} tabular>{owe > 0 ? bdt(owe) : c.clear}</Tx>
              </View>
            </View>
          </MCard>
        );
      })}

      <Sheet open={remind} onClose={() => setRemind(false)} title={c.sendReminders}>
        {owing.map((x) => (
          <SheetRow
            key={x._id}
            label={x.name}
            sub={[bdt(stats.get(x._id)?.due ?? 0), x.phone ?? c.noContact].join(' · ')}
            icon="send"
            tone="gold"
            onPress={() => sms(x)}
          />
        ))}
      </Sheet>
      <CustomerDrawer open={adding} onClose={() => setAdding(false)} onCreated={() => query.refetch()} />
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebCustomers /> : <CustomersScreen />;
}
