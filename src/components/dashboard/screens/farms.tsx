import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import { costDate, inRange, isActiveBatch, liveSales, periodRange, saleDate, sum, useBatches, useCosts, useCows, useFarms, useSales, useSheds } from '@/components/dashboard/data';
import { FarmDrawer, ShedDrawer } from '@/components/dashboard/drawers';
import { bdt, num, titleCase } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { Btn, Card, Empty, MenuItem, Pill, Popover, Table, Tx } from '@/components/dashboard/kit';
import { Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import { resolveId } from '@/lib/ids';
import { isOwnerFirm } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { Farm, Shed } from '@/types/api';

export function WebFarms() {
  const { c } = useDash();
  const { user } = useAuth();
  const width = useContentWidth();
  const farmsQ = useFarms();
  const [farmDrawer, setFarmDrawer] = useState<{ farm: Farm | null } | null>(null);
  const [shedFarm, setShedFarm] = useState<string | null>(null);
  const canManage = isOwnerFirm(user?.role);
  const farms = farmsQ.data ?? [];
  const cols = width >= 1000 && farms.length > 1 ? 2 : 1;

  const top = <PageTop crumbs={[c.farm, c.farms]} title={c.farms} actions={canManage ? <Btn label={c.addFarm} icon="plus" kind="lime" onPress={() => setFarmDrawer({ farm: null })} /> : null} />;

  return (
    <Page top={top}>
      {farms.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          {farms.map((f) => (
            <View key={f._id} style={{ flexBasis: cols === 2 ? '48%' : '100%', flexGrow: 1, minWidth: 0 }}>
              <FarmCard farm={f} canManage={canManage} onEdit={() => setFarmDrawer({ farm: f })} onAddShed={() => setShedFarm(f._id)} />
            </View>
          ))}
        </View>
      ) : farmsQ.isLoading ? null : (
        <Card>
          <Empty icon="barn" title={c.addAnotherFarm} sub={c.addAnotherFarmSub} />
        </Card>
      )}

      {canManage ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9D6CE', borderRadius: 22, padding: 20, flexWrap: 'wrap' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={20} color={C.padma} />
          </View>
          <View style={{ flex: 1, minWidth: 240 }}>
            <Tx s={16} w="800">{c.addAnotherFarm}</Tx>
            <Tx s={13} color={C.sub}>{c.addAnotherFarmSub}</Tx>
          </View>
          <Btn label={c.addFarm} icon="plus" kind="dark" onPress={() => setFarmDrawer({ farm: null })} />
        </View>
      ) : null}

      <FarmDrawer open={Boolean(farmDrawer)} onClose={() => setFarmDrawer(null)} farm={farmDrawer?.farm} />
      <ShedDrawer open={Boolean(shedFarm)} onClose={() => setShedFarm(null)} farmId={shedFarm ?? ''} />
    </Page>
  );
}

function Banner({ dairy, label }: { dairy: boolean; label: string }) {
  const bg = dairy ? '#123B6B' : C.forest;
  const stripe = dairy ? '#1A4A82' : '#14382A';
  const id = dairy ? 'stripe-dairy' : 'stripe-poultry';
  return (
    <View style={{ height: 120, backgroundColor: bg, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <Pattern id={id} width={56} height={56} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <Line x1={0} y1={0} x2={0} y2={56} stroke={stripe} strokeWidth={28} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <Svg width={60} height={60} style={{ position: 'absolute', right: 32, top: 16 }}>
        <Circle cx={30} cy={30} r={17} fill={C.lime} />
      </Svg>
      <View style={{ position: 'absolute', left: 18, bottom: 16, backgroundColor: dairy ? C.skySoft : 'rgba(197,239,99,0.16)', borderRadius: 999, paddingHorizontal: 10, height: 24, justifyContent: 'center' }}>
        <Tx s={12} w="700" color={dairy ? C.skyInk : C.lime}>{label}</Tx>
      </View>
    </View>
  );
}

function FarmCard({ farm, canManage, onEdit, onAddShed }: { farm: Farm; canManage: boolean; onEdit: () => void; onAddShed: () => void }) {
  const { c } = useDash();
  const batchesQ = useBatches();
  const cowsQ = useCows();
  const shedsQ = useSheds();
  const salesQ = useSales();
  const costsQ = useCosts();
  const dairy = farm.farmType === 'cow';

  const data = useMemo(() => {
    const batches = (batchesQ.data ?? []).filter((b) => resolveId(b.farmId) === farm._id && isActiveBatch(b));
    const cows = (cowsQ.data ?? []).filter((x) => resolveId(x.farmId) === farm._id);
    const sheds = (shedsQ.data ?? []).filter((s) => resolveId(s.farmId) === farm._id);
    const month = periodRange('month', 0);
    const income = sum(liveSales(salesQ.data ?? []).filter((s) => resolveId(s.farmId) === farm._id && inRange(saleDate(s), month)), (s) => s.totalAmount);
    const expense = sum((costsQ.data ?? []).filter((x) => resolveId(x.farmId) === farm._id && inRange(costDate(x), month)), (x) => x.totalAmount);
    return { batches, cows, sheds, net: income - expense };
  }, [batchesQ.data, cowsQ.data, shedsQ.data, salesQ.data, costsQ.data, farm._id]);

  const shedRow = (s: Shed) => {
    const inShed = data.batches.filter((b) => resolveId(b.shedId) === s._id);
    const current = sum(inShed, (b) => b.currentQuantity);
    const types = [...new Set(inShed.map((b) => titleCase(b.birdType)))].join(', ');
    const laying = inShed.some((b) => b.birdType?.toLowerCase() === 'layer');
    return { current, types, status: !inShed.length ? 'empty' : laying ? 'laying' : 'active' } as const;
  };

  const location = [farm.district, farm.upazila].filter(Boolean).join(', ') || farm.address || farm.location || '—';
  const stats = dairy
    ? [
        { l: c.sheds, v: num(data.sheds.length) },
        { l: c.cows, v: num(data.cows.length) },
        { l: c.batchesShort, v: num(data.batches.length) },
      ]
    : [
        { l: c.sheds, v: num(data.sheds.length) },
        { l: c.birds, v: num(sum(data.batches, (b) => b.currentQuantity)) },
        { l: c.batchesShort, v: num(data.batches.length) },
      ];

  return (
    <View style={{ backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
      <Banner dairy={dairy} label={dairy ? c.dairy : c.poultry} />
      <View style={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={20} w="800" lines={1}>{farm.name}</Tx>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Icon name="pin" size={14} color={C.sub} />
              <Tx s={13} color={C.sub} lines={1}>{location}</Tx>
            </View>
          </View>
          {canManage ? (
            <Popover width={200} align="right" trigger={(open) => <Btn label={c.manage} onPress={open} />}>
              {(close) => (
                <View style={{ paddingVertical: 6 }}>
                  <MenuItem icon="pencil" label={c.editFarm} onPress={() => { close(); onEdit(); }} />
                  <MenuItem icon="plus" label={c.addShed} onPress={() => { close(); onAddShed(); }} />
                </View>
              )}
            </Popover>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: C.canvas, borderRadius: 14, paddingVertical: 12 }}>
          {[...stats, { l: c.thisMonth, v: bdt(data.net, { sign: true }) }].map((s, i, arr) => (
            <View key={s.l} style={{ flex: 1, paddingHorizontal: 12, borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: C.line }}>
              <Tx s={12} color={C.sub} lines={1}>{s.l}</Tx>
              <Tx s={15} w="800" tabular lines={1} color={i === arr.length - 1 ? (data.net >= 0 ? C.emerald : C.coral) : C.ink}>{s.v}</Tx>
            </View>
          ))}
        </View>
      </View>
      <Table
        dense
        rows={data.sheds}
        rowKey={(s) => s._id}
        empty={<Empty icon="barn" title={c.noSheds} action={canManage ? <Btn label={c.addShed} icon="plus" size="sm" onPress={onAddShed} /> : undefined} />}
        cols={[
          { key: 'shed', label: c.shed, flex: 1.4 },
          { key: 'type', label: c.type, flex: 1.1 },
          { key: 'cap', label: c.capacity, flex: 0.9, align: 'right' },
          { key: 'cur', label: c.current, flex: 0.9, align: 'right' },
          { key: 'status', label: c.status, flex: 0.9, align: 'right' },
        ]}
        render={(s, col) => {
          const r = shedRow(s);
          if (col.key === 'shed')
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="barn" size={14} color={C.padma} />
                </View>
                <Tx s={14} w="700" lines={1} style={{ flexShrink: 1 }}>{s.name}</Tx>
              </View>
            );
          if (col.key === 'type') return <Tx s={13} color={C.sub} lines={1}>{r.types || (dairy ? c.dairy : '—')}</Tx>;
          if (col.key === 'cap') return <Tx s={13} color={C.sub} tabular>{s.capacity ? num(s.capacity) : '—'}</Tx>;
          if (col.key === 'cur') return <Tx s={14} w="800" tabular>{num(r.current)}</Tx>;
          return <Pill label={r.status === 'empty' ? c.empty : r.status === 'laying' ? c.laying : c.active} tone={r.status === 'empty' ? 'gray' : 'green'} />;
        }}
      />
    </View>
  );
}
