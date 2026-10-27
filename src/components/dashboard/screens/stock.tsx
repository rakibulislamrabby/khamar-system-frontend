import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { inRange, isLow, itemVisual, periodRange, stockLevel, sum, useItems, usePurchases, useSuppliers } from '@/components/dashboard/data';
import { StockDrawer, SupplierDrawer } from '@/components/dashboard/drawers';
import { bdt, dayMonth, initials, isoDay, num, titleCase, toDate } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { Avatar, Btn, Card, CardHead, Empty, IconTile, Pill, Progress, SearchBox, Segmented, StatTile, Table, Tx } from '@/components/dashboard/kit';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import type { InventoryItem, Purchase } from '@/types/api';

type Cat = 'all' | 'feed' | 'medicine' | 'vaccine' | 'equipment' | 'other';
const MAIN: Cat[] = ['feed', 'medicine', 'vaccine', 'equipment'];

const purchaseDate = (p: Purchase) => toDate(p.purchaseDate ?? p.createdAt);

export function WebStock() {
  const { c, lang } = useDash();
  const params = useLocalSearchParams<{ action?: string }>();
  const width = useContentWidth();
  const wide = width >= 1040;
  const itemsQ = useItems();
  const purchasesQ = usePurchases();
  const suppliersQ = useSuppliers();
  const [cat, setCat] = useState<Cat>('all');
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState<{ mode: 'in' | 'out'; item: InventoryItem | null } | null>(params.action === 'in' || params.action === 'out' ? { mode: params.action, item: null } : null);
  const [supplierDrawer, setSupplierDrawer] = useState(false);

  useEffect(() => {
    if (params.action === 'in' || params.action === 'out') setDrawer({ mode: params.action, item: null });
  }, [params.action]);

  const items = useMemo(() => [...(itemsQ.data ?? [])].sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.name.localeCompare(b.name)), [itemsQ.data]);
  const purchases = useMemo(() => [...(purchasesQ.data ?? [])].sort((a, b) => +(purchaseDate(b) ?? 0) - +(purchaseDate(a) ?? 0)), [purchasesQ.data]);
  const suppliers = suppliersQ.data ?? [];

  const value = sum(items, (i) => i.currentStock * (i.unitCost ?? 0));
  const low = items.filter(isLow);
  const feed = items.filter((i) => i.category === 'feed');
  const feedUnit = feed[0]?.unit ?? 'bag';
  const monthPurch = purchases.filter((p) => inRange(purchaseDate(p), periodRange('month', 0)));

  const catLabel: Record<Cat, string> = { all: c.all, feed: c.catFeed, medicine: c.catMedicine, vaccine: c.catVaccine, equipment: c.catEquipment, other: c.catOther };
  const catOf = (i: InventoryItem): Cat => (MAIN.includes(i.category as Cat) ? (i.category as Cat) : 'other');
  const shown = items.filter((i) => (cat === 'all' || catOf(i) === cat) && (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase())));

  const supplierSpend = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of purchases) {
      const id = typeof p.supplierId === 'object' && p.supplierId ? p.supplierId._id : (p.supplierId as string | undefined);
      if (id) map.set(id, (map.get(id) ?? 0) + p.totalAmount);
    }
    return map;
  }, [purchases]);

  const top = (
    <PageTop
      crumbs={[c.farm, c.stock]}
      title={c.stock}
      actions={
        <>
          <Btn label={c.stockOut} icon="trendDown" disabled={!items.length} onPress={() => setDrawer({ mode: 'out', item: null })} />
          <Btn label={c.stockIn} icon="plus" kind="lime" onPress={() => setDrawer({ mode: 'in', item: null })} />
        </>
      }
    />
  );

  return (
    <Page top={top}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <StatTile icon="box" tone="green" label={c.stockValue} value={bdt(value)} sub={c.nItems(items.length)} />
        <StatTile icon="alert" tone="coral" label={c.needReorder} value={c.nItems(low.length)} sub={c.belowMinimum} />
        <StatTile icon="wheat" tone="gold" label={c.feedInStore} value={`${num(sum(feed, (i) => i.currentStock))} ${feedUnit}`} sub={c.nItems(feed.length)} />
        <StatTile icon="receipt" tone="sky" label={c.purchases} value={num(monthPurch.length)} sub={`${bdt(sum(monthPurch, (p) => p.totalAmount))} · ${c.thisMonthShort}`} />
      </View>

      <Card pad={0}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, flexWrap: 'wrap' }}>
          <Segmented value={cat} onChange={setCat} options={(['all', ...MAIN, 'other'] as Cat[]).map((k) => ({ key: k, label: catLabel[k] }))} size="lg" style={{ maxWidth: '100%' }} />
          <View style={{ flex: 1 }} />
          <SearchBox value={q} onChange={setQ} placeholder={c.searchItem} width={220} />
        </View>
        <Table
          rows={shown}
          rowKey={(i) => i._id}
          empty={<Empty icon="box" title={c.noItems} sub={c.noItemsSub} action={<Btn label={c.stockIn} icon="plus" kind="lime" onPress={() => setDrawer({ mode: 'in', item: null })} />} />}
          cols={[
            { key: 'item', label: c.item, flex: 2 },
            { key: 'cat', label: c.category, flex: 1 },
            { key: 'stock', label: c.inStock, flex: 0.9 },
            { key: 'level', label: c.level, flex: 1.4 },
            { key: 'min', label: c.min, flex: 0.6, align: 'right' },
            { key: 'cost', label: c.unitCost, flex: 0.9, align: 'right' },
            { key: 'value', label: c.value, flex: 1, align: 'right' },
            { key: 'act', label: '', width: 110, align: 'right' },
          ]}
          render={(i, col) => {
            if (col.key === 'item') {
              const v = itemVisual(i.category);
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconTile name={v.icon} tone={v.tone} size={32} />
                  <Tx s={14} w="700" lines={1} style={{ flexShrink: 1 }}>{i.name}</Tx>
                </View>
              );
            }
            if (col.key === 'cat') return <Pill label={catLabel[catOf(i)] === c.catOther ? titleCase(i.category.replace('_', ' ')) : catLabel[catOf(i)]} tone="gray" />;
            if (col.key === 'stock') return <Tx s={14} w="800" tabular>{`${num(i.currentStock, 2)} ${i.unit}`}</Tx>;
            if (col.key === 'level') {
              const l = stockLevel(i);
              const color = l.state === 'low' ? C.coral : l.state === 'running' ? C.gold : C.emerald;
              const track = l.state === 'low' ? C.coralSoft : l.state === 'running' ? C.goldSoft : '#E7EFEA';
              return (
                <View style={{ width: '100%', maxWidth: 150, gap: 5 }}>
                  <Tx s={11} w="700" color={l.state === 'low' ? C.coralInk : l.state === 'running' ? C.goldInk : C.padma}>{l.state === 'low' ? c.low : l.state === 'running' ? c.runningLow : c.healthy}</Tx>
                  <Progress pct={l.pct} color={color} track={track} h={5} />
                </View>
              );
            }
            if (col.key === 'min') return <Tx s={13} color={C.sub} tabular>{i.minStockLevel != null ? num(i.minStockLevel) : '—'}</Tx>;
            if (col.key === 'cost') return <Tx s={13} color={C.sub} tabular>{i.unitCost ? bdt(i.unitCost) : '—'}</Tx>;
            if (col.key === 'value') return <Tx s={14} w="800" tabular>{bdt(i.currentStock * (i.unitCost ?? 0))}</Tx>;
            return (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Btn label={c.in} size="sm" onPress={() => setDrawer({ mode: 'in', item: i })} style={{ height: 30, borderRadius: 999, paddingHorizontal: 12 }} />
                <Btn label={c.out} size="sm" onPress={() => setDrawer({ mode: 'out', item: i })} style={{ height: 30, borderRadius: 999, paddingHorizontal: 12 }} />
              </View>
            );
          }}
        />
      </Card>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <Card style={{ flex: 1, width: wide ? undefined : '100%' }}>
          <CardHead title={c.recentPurchases} sub={c.nThisPeriod(monthPurch.length)} />
          <View style={{ marginTop: 10 }}>
            {purchases.length ? (
              purchases.slice(0, 5).map((p, idx) => {
                const d = purchaseDate(p);
                const first = p.items?.[0];
                const supplier = typeof p.supplierId === 'object' && p.supplierId ? p.supplierId.name : null;
                return (
                  <View key={p._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: idx ? 1 : 0, borderTopColor: C.line }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="arrowIn" size={16} color={C.padma} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Tx s={14} w="700" lines={1}>{first ? `${first.itemName}${(p.items?.length ?? 0) > 1 ? ` +${p.items.length - 1}` : ''}` : p.purchaseNumber ?? '—'}</Tx>
                      <Tx s={12} color={C.sub} lines={1}>{[first ? `+${num(first.quantity)} ${first.unit}` : null, p.purchaseNumber, supplier].filter(Boolean).join(' · ')}</Tx>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Tx s={13} w="800" tabular>{bdt(p.totalAmount)}</Tx>
                      <Tx s={12} color={C.sub}>{d && isoDay(d) === isoDay() ? c.today : dayMonth(d, lang)}</Tx>
                    </View>
                  </View>
                );
              })
            ) : (
              <Empty icon="receipt" title={c.noPurchases} />
            )}
          </View>
        </Card>

        <Card style={{ flex: 1, width: wide ? undefined : '100%' }}>
          <CardHead title={c.suppliers} sub={c.nActive(suppliers.length)} right={<Btn label={c.add} size="sm" onPress={() => setSupplierDrawer(true)} />} />
          <View style={{ marginTop: 10 }}>
            {suppliers.length ? (
              suppliers.slice(0, 6).map((s, idx) => (
                <View key={s._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: idx ? 1 : 0, borderTopColor: C.line }}>
                  <Avatar text={initials(s.name)} tone="gray" size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Tx s={14} w="700" lines={1}>{s.name}</Tx>
                    <Tx s={12} color={C.sub} lines={1}>{[s.supplierType, s.phone].filter(Boolean).join(' · ') || '—'}</Tx>
                  </View>
                  <Tx s={14} w="800" tabular>{bdt(supplierSpend.get(s._id) ?? 0)}</Tx>
                </View>
              ))
            ) : (
              <Empty icon="briefcase" title={c.noSuppliers} action={<Btn label={c.addSupplier} icon="plus" onPress={() => setSupplierDrawer(true)} />} />
            )}
          </View>
        </Card>
      </View>

      <StockDrawer open={Boolean(drawer)} onClose={() => setDrawer(null)} mode={drawer?.mode ?? 'in'} item={drawer?.item} />
      <SupplierDrawer open={supplierDrawer} onClose={() => setSupplierDrawer(false)} />
    </Page>
  );
}
