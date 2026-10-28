import { useDesktopWeb, WebStock } from '@/components/dashboard';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { isLow, itemVisual, stockLevel, sum, useItems } from '@/components/dashboard/data';
import { StockDrawer } from '@/components/dashboard/drawers';
import { bdt, num, titleCase } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { Bar, EmptyCard, LimeSquare, Loading, MButton, MCard, MScreen, MSegmented, NavHeader, Sheet, SheetRow, ToneTile, Tx } from '@/components/mobile/kit';
import type { InventoryItem } from '@/types/api';

type Cat = 'all' | 'feed' | 'medicine' | 'vaccine' | 'equipment';

function InventoryScreen() {
  const { c } = useM();
  const params = useLocalSearchParams<{ action?: string; itemId?: string }>();
  const query = useItems();
  const [cat, setCat] = useState<Cat>('all');
  const [drawer, setDrawer] = useState<{ mode: 'in' | 'out'; item: InventoryItem | null } | null>(null);
  const [picked, setPicked] = useState<InventoryItem | null>(null);

  const items = useMemo(
    () => [...(query.data ?? [])].sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.name.localeCompare(b.name)),
    [query.data]
  );

  useEffect(() => {
    if (params.action !== 'in' && params.action !== 'out') return;
    const item = params.itemId ? items.find((i) => i._id === params.itemId) ?? null : null;
    if (params.itemId && !item && query.isLoading) return;
    setDrawer({ mode: params.action, item });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.action, params.itemId, query.isLoading]);

  const value = sum(items, (i) => i.currentStock * (i.unitCost ?? 0));
  const low = items.filter(isLow);
  const shown = items.filter((i) => cat === 'all' || i.category === cat);
  const catLabel: Record<string, string> = { feed: c.catFeed, medicine: c.catMedicine, vaccine: c.catVaccine, equipment: c.catEquipment };

  return (
    <MScreen
      header={<NavHeader title={c.stock} right={<LimeSquare label={c.stockIn} onPress={() => setDrawer({ mode: 'in', item: null })} />} />}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      footer={
        <>
          <MButton label={c.stockOut} icon="trendDown" kind="grey" disabled={!items.length} onPress={() => setDrawer({ mode: 'out', item: null })} style={{ flex: 1 }} />
          <MButton label={c.stockIn} icon="plus" kind="dark" onPress={() => setDrawer({ mode: 'in', item: null })} style={{ flex: 1 }} />
        </>
      }>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MCard pad={17} style={{ flex: 1 }}>
          <ToneTile icon="box" tone="green" size={32} radius={10} />
          <Tx s={12} w="500" color={C.sub} style={{ marginTop: 12 }}>{c.stockValue}</Tx>
          <Tx s={21} w="800" tabular lines={1} style={{ letterSpacing: -1, marginTop: 2 }}>{bdt(value)}</Tx>
        </MCard>
        <View style={{ flex: 1, backgroundColor: low.length ? C.coralSoft : C.white, borderWidth: 1, borderColor: low.length ? '#F7C6BE' : C.line, borderRadius: 24, padding: 17 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: low.length ? C.white : C.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={low.length ? 'alert' : 'check'} size={16} color={low.length ? C.coral : C.padma} />
          </View>
          <Tx s={12} w="500" color={low.length ? '#A33A2C' : C.sub} style={{ marginTop: 12 }}>{c.needReorder}</Tx>
          <Tx s={21} w="800" tabular lines={1} style={{ letterSpacing: -1, marginTop: 2 }}>{c.nItems(low.length)}</Tx>
        </View>
      </View>

      <MSegmented
        value={cat}
        onChange={setCat}
        options={[
          { key: 'all', label: c.all },
          { key: 'feed', label: c.catFeed },
          { key: 'medicine', label: c.catMedicine },
          { key: 'vaccine', label: c.catVaccine },
          { key: 'equipment', label: c.tools },
        ]}
      />

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <EmptyCard icon="alert" title={c.noItems} sub={query.error instanceof Error ? query.error.message : undefined} /> : null}
      {!query.isLoading && !shown.length ? (
        <EmptyCard icon="box" title={c.noItems} sub={c.noItemsSub} action={<MButton label={c.stockIn} icon="plus" kind="dark" h={44} onPress={() => setDrawer({ mode: 'in', item: null })} />} />
      ) : null}

      <View style={{ gap: 10 }}>
        {shown.map((i) => {
          const v = itemVisual(i.category);
          const lv = stockLevel(i);
          const color = lv.state === 'low' ? C.coral : lv.state === 'running' ? C.gold : C.emerald;
          const track = lv.state === 'low' ? C.coralSoft : lv.state === 'running' ? C.goldSoft : C.mint;
          const label = lv.state === 'low' ? c.lowStock : lv.state === 'running' ? c.runningLow : c.healthy;
          return (
            <Pressable key={i._id} onPress={() => setPicked(i)}>
              <MCard pad={17}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <ToneTile icon={v.icon} tone={v.tone} size={44} radius={14} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Tx s={15} w="700" lines={1}>{i.name}</Tx>
                    <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>
                      {i.unitCost != null ? c.perUnitPrice(catLabel[i.category] ?? titleCase(i.category), bdt(i.unitCost), i.unit) : catLabel[i.category] ?? titleCase(i.category)}
                    </Tx>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Tx s={20} w="800" tabular style={{ letterSpacing: -1 }}>{num(i.currentStock)}</Tx>
                    <Tx s={12} w="500" color={C.sub}>{i.unit}</Tx>
                  </View>
                </View>
                <View style={{ marginTop: 14 }}>
                  <Bar pct={lv.pct} color={color} track={track} h={7} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Tx s={12} w="700" color={color}>{label}</Tx>
                  {i.minStockLevel != null ? <Tx s={12} w="500" color={C.sub}>{c.minOf(`${num(i.minStockLevel)} ${i.unit}`)}</Tx> : null}
                </View>
              </MCard>
            </Pressable>
          );
        })}
      </View>

      <Sheet open={Boolean(picked)} onClose={() => setPicked(null)} title={picked?.name}>
        <SheetRow label={c.stockIn} icon="plus" tone="green" onPress={() => { setDrawer({ mode: 'in', item: picked }); setPicked(null); }} />
        <SheetRow label={c.stockOut} icon="trendDown" tone="coral" onPress={() => { setDrawer({ mode: 'out', item: picked }); setPicked(null); }} />
      </Sheet>
      {drawer ? <StockDrawer open onClose={() => setDrawer(null)} mode={drawer.mode} item={drawer.item} /> : null}
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebStock /> : <InventoryScreen />;
}
