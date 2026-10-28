import { useDesktopWeb, WebFarms } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import { organizationApi } from '@/api';
import { costDate, inRange, isActiveBatch, liveSales, periodRange, saleDate, sum, useBatches, useCosts, useCows, useSales, useSheds } from '@/components/dashboard/data';
import { FarmDrawer, ShedDrawer } from '@/components/dashboard/drawers';
import { bdt, num } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { EmptyCard, LimeSquare, Loading, MScreen, NavHeader, Sheet, SheetRow, Tx } from '@/components/mobile/kit';
import { resolveId } from '@/lib/ids';
import { isOwnerFirm } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { Farm } from '@/types/api';

function FarmsScreen() {
  const { c } = useM();
  const { user, organization } = useAuth();
  const canManage = isOwnerFirm(user?.role);
  const query = useQuery({
    queryKey: ['farms'],
    queryFn: () => organizationApi.listFarms(),
  });
  const [farmDrawer, setFarmDrawer] = useState<{ farm: Farm | null } | null>(null);
  const [shedFarm, setShedFarm] = useState<string | null>(null);
  const [menu, setMenu] = useState<Farm | null>(null);
  const farms = query.data?.data ?? [];

  return (
    <MScreen
      header={<NavHeader title={c.farms} right={canManage ? <LimeSquare label={c.addFarm} onPress={() => setFarmDrawer({ farm: null })} /> : undefined} />}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}>
      <View>
        <Tx s={28} w="800" style={{ letterSpacing: -0.8, lineHeight: 34 }}>{c.farmsCount(farms.length)}</Tx>
        <Tx s={14} w="500" color={C.sub} style={{ marginTop: 4 }}>{c.unitsUnder(organization?.name ?? c.appName)}</Tx>
      </View>

      {query.isLoading ? <Loading /> : null}
      {query.isError ? <EmptyCard icon="alert" title={c.farms} sub={query.error instanceof Error ? query.error.message : undefined} /> : null}

      {farms.map((f) => (
        <FarmCard key={f._id} farm={f} onMenu={canManage ? () => setMenu(f) : undefined} />
      ))}

      {canManage ? (
        <Pressable
          onPress={() => setFarmDrawer({ farm: null })}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B9CBC1', borderRadius: 24, padding: 21, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={20} color={C.padma} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={15} w="700">{c.addFarmCard}</Tx>
            <Tx s={12} w="500" color={C.sub} style={{ marginTop: 2 }}>{c.addFarmCardSub}</Tx>
          </View>
        </Pressable>
      ) : null}

      <Sheet open={Boolean(menu)} onClose={() => setMenu(null)} title={menu?.name}>
        <SheetRow label={c.editFarm} icon="pencil" onPress={() => { setFarmDrawer({ farm: menu }); setMenu(null); }} />
        <SheetRow label={c.addShed} icon="plus" onPress={() => { setShedFarm(menu?._id ?? null); setMenu(null); }} />
      </Sheet>
      <FarmDrawer open={Boolean(farmDrawer)} onClose={() => { setFarmDrawer(null); query.refetch(); }} farm={farmDrawer?.farm} />
      <ShedDrawer open={Boolean(shedFarm)} onClose={() => setShedFarm(null)} farmId={shedFarm ?? ''} />
    </MScreen>
  );
}

function Banner({ dairy, label }: { dairy: boolean; label: string }) {
  const bg = dairy ? '#123B6B' : C.forest;
  const stripe = dairy ? '#1A4A82' : '#14382A';
  const id = dairy ? 'm-stripe-dairy' : 'm-stripe-poultry';
  return (
    <View style={{ height: 110, backgroundColor: bg, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <Pattern id={id} width={56} height={56} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <Line x1={0} y1={0} x2={0} y2={56} stroke={stripe} strokeWidth={28} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <Svg width={40} height={40} style={{ position: 'absolute', right: 40, top: 18 }}>
        <Circle cx={20} cy={20} r={17} fill={C.lime} />
      </Svg>
      <View style={{ position: 'absolute', left: 16, bottom: 14, backgroundColor: dairy ? C.skySoft : C.forest, borderRadius: 999, paddingHorizontal: 10, height: 26, justifyContent: 'center' }}>
        <Tx s={12} w="600" color={dairy ? '#2155B8' : C.lime}>{label}</Tx>
      </View>
    </View>
  );
}

function FarmCard({ farm, onMenu }: { farm: Farm; onMenu?: () => void }) {
  const { c } = useM();
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

  const location = [farm.district, farm.upazila].filter(Boolean).join(', ') || farm.address || farm.location || '—';
  const stats = [
    dairy ? { l: c.cows, v: num(data.cows.length) } : { l: c.sheds, v: num(data.sheds.length) },
    dairy ? { l: c.sheds, v: num(data.sheds.length) } : { l: c.birds, v: num(sum(data.batches, (b) => b.currentQuantity)) },
    { l: c.thisMonth, v: bdt(data.net, { sign: true }), color: data.net >= 0 ? C.emerald : C.coral },
  ];

  return (
    <View style={{ backgroundColor: C.white, borderRadius: 24, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
      <Banner dairy={dairy} label={dairy ? c.dairy : c.poultry} />
      <View style={{ padding: 16, gap: 14 }}>
        <Pressable onPress={onMenu} disabled={!onMenu} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={17} w="700" lines={1} style={{ letterSpacing: -0.3 }}>{farm.name}</Tx>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Icon name="pin" size={13} color={C.sub} />
              <Tx s={12} w="500" color={C.sub} lines={1}>{location}</Tx>
            </View>
          </View>
          {onMenu ? <Icon name="right" size={18} color={C.faint} /> : null}
        </Pressable>
        <View style={{ flexDirection: 'row', backgroundColor: C.canvas, borderRadius: 16, paddingVertical: 12 }}>
          {stats.map((s, i) => (
            <View key={s.l} style={{ flex: 1, paddingHorizontal: 12, borderLeftWidth: i ? 1 : 0, borderLeftColor: C.line }}>
              <Tx s={11} w="600" color={C.sub} lines={1}>{s.l}</Tx>
              <Tx s={15} w="800" tabular lines={1} color={s.color ?? C.ink} style={{ marginTop: 2 }}>{s.v}</Tx>
            </View>
          ))}
        </View>
        {data.sheds.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {data.sheds.map((s) => (
              <View key={s._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.white }}>
                <Icon name="barn" size={13} color={C.padma} />
                <Tx s={12} w="600">{s.name}</Tx>
              </View>
            ))}
          </View>
        ) : (
          <Tx s={12} w="500" color={C.sub}>{c.noSheds}</Tx>
        )}
      </View>
    </View>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebFarms /> : <FarmsScreen />;
}
