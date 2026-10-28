import { useDesktopWeb, WebLivestock } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { domainApi } from '@/api';
import { CattleHerd } from '@/components/cattle-herd';
import { Ring } from '@/components/dashboard/charts';
import { batchCycle, batchTitle, birdVisual, isActiveBatch, mortalityPct, useBatchPl, useEggs } from '@/components/dashboard/data';
import { bdt, fullDate, num, pct, titleCase, toDate } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  Bar,
  EmptyCard,
  LimeSquare,
  Loading,
  MButton,
  MCard,
  MChips,
  MetricBox,
  MPill,
  MScreen,
  MSegmented,
  Notice,
  SearchField,
  Sheet,
  SheetRow,
  TitleHeader,
  ToneTile,
  Tx,
} from '@/components/mobile/kit';
import { canWriteCattle, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { PoultryBatch } from '@/types/api';

type Tab = 'poultry' | 'dairy';
type Sort = 'newest' | 'oldest' | 'most';

function BatchCard({ b, eggsToday }: { b: PoultryBatch; eggsToday: number }) {
  const { c, lang } = useM();
  const batchPl = useBatchPl();
  const v = birdVisual(b.birdType);
  const cyc = batchCycle(b);
  const m = mortalityPct(b);
  const layer = b.birdType?.toLowerCase() === 'layer';
  const third = layer
    ? { label: c.eggsToday, value: num(eggsToday) }
    : b.averageWeight
      ? { label: c.avgWeight, value: `${num(b.averageWeight, 2)} kg` }
      : { label: c.pl, value: bdt(batchPl(b), { sign: true }), color: batchPl(b) >= 0 ? C.padma : C.coral };
  return (
    <MCard pad={17} onPress={() => router.push(`/(app)/poultry/${b._id}`)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ToneTile icon={v.icon} tone={v.tone} size={46} radius={15} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Tx s={15} w="700" lines={1} style={{ flexShrink: 1 }}>{batchTitle(b)}</Tx>
            <MPill label={titleCase(b.birdType)} />
          </View>
          <Tx s={12} color={C.sub} lines={1} style={{ marginTop: 3 }}>
            {b.unitPrice != null ? c.arrived(fullDate(b.purchaseDate, lang), `৳${num(b.unitPrice)}`) : c.arrivedOnly(fullDate(b.purchaseDate, lang))}
          </Tx>
        </View>
        <Icon name="right" size={18} color={C.faint} sw={1.5} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
        <Tx s={12} color={C.sub}>{c.cycleProgress}</Tx>
        <Tx s={12} w="700">{isActiveBatch(b) ? c.dayOfSlash(cyc.day, cyc.total) : c.closed}</Tx>
      </View>
      <View style={{ marginTop: 6 }}>
        <Bar pct={isActiveBatch(b) ? cyc.pct : 100} color={isActiveBatch(b) ? C.emerald : C.faint} />
      </View>
      <MetricBox
        style={{ marginTop: 14 }}
        items={[
          { label: c.alive, value: num(b.currentQuantity), suffix: `/ ${num(b.initialQuantity)}` },
          { label: c.mortality, value: pct(m), color: m >= 1.5 ? C.coral : C.padma },
          third,
        ]}
      />
    </MCard>
  );
}

function PoultryTab() {
  const { c } = useM();
  const { user } = useAuth();
  const canAddBatch = canWritePoultry(user?.role);
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const eggs = useEggs();

  const poultryQuery = useQuery({
    queryKey: ['poultry-batches'],
    queryFn: () => domainApi.listPoultryBatches(),
  });

  const all = useMemo(() => poultryQuery.data?.data ?? [], [poultryQuery.data]);
  const active = all.filter(isActiveBatch);
  const placed = active.reduce((s, b) => s + b.initialQuantity, 0);
  const alive = active.reduce((s, b) => s + b.currentQuantity, 0);
  const share = placed ? (alive / placed) * 100 : 0;

  const types = useMemo(() => [...new Set(all.map((b) => b.birdType?.toLowerCase()).filter(Boolean))], [all]);
  const today = new Date().toDateString();
  const eggsFor = (id: string) =>
    (eggs.data ?? [])
      .filter((e) => toDate(e.productionDate)?.toDateString() === today && (typeof e.batchId === 'object' && e.batchId ? e.batchId._id : e.batchId) === id)
      .reduce((s, e) => s + e.totalEggs, 0);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = all
      .filter((b) => kind === 'all' || b.birdType?.toLowerCase() === kind)
      .filter((b) => !needle || batchTitle(b).toLowerCase().includes(needle));
    const time = (b: PoultryBatch) => toDate(b.purchaseDate)?.getTime() ?? 0;
    return [...list].sort((a, b) => (sort === 'most' ? b.currentQuantity - a.currentQuantity : sort === 'oldest' ? time(a) - time(b) : time(b) - time(a)));
  }, [all, kind, q, sort]);

  const activeShown = shown.filter(isActiveBatch);
  const closedShown = shown.filter((b) => !isActiveBatch(b));
  const sortLabel = sort === 'most' ? c.mostBirds : sort === 'oldest' ? c.oldest : c.newest;

  return (
    <>
      <MCard dark pad={18}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -2, right: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: C.forest2 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Ring size={72} pct={share} color={C.lime} track={C.forest3} sw={8}>
            <Tx s={15} w="800" color={C.white}>{pct(share, 0)}</Tx>
          </Ring>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{c.birdsAlive}</Tx>
            <Tx s={30} w="800" color={C.white} tabular style={{ letterSpacing: -1, lineHeight: 36 }}>{num(alive)}</Tx>
            <Tx s={12} color="rgba(255,255,255,0.65)" lines={1}>{c.ofPlacedLost(num(placed), num(placed - alive))}</Tx>
          </View>
        </View>
      </MCard>

      <SearchField value={q} onChange={setQ} placeholder={c.searchBatch} onFilter={() => setSortOpen(true)} />

      <MChips value={kind} onChange={setKind} options={[{ key: 'all', label: c.allBatches }, ...types.map((t) => ({ key: t, label: titleCase(t) }))]} />

      {poultryQuery.isLoading ? <Loading /> : null}
      <Notice message={poultryQuery.isError ? (poultryQuery.error instanceof Error ? poultryQuery.error.message : c.couldNotLoad) : null} />

      {activeShown.length || !closedShown.length ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Tx s={17} w="700" style={{ letterSpacing: -0.3 }}>{c.activeN(activeShown.length)}</Tx>
          <Tx s={13} color={C.sub}>{c.sortedBy(sortLabel)}</Tx>
        </View>
      ) : null}
      {activeShown.map((b) => (
        <BatchCard key={b._id} b={b} eggsToday={eggsFor(b._id)} />
      ))}

      {closedShown.length ? <Tx s={17} w="700" style={{ letterSpacing: -0.3, marginTop: 4 }}>{c.closedN(closedShown.length)}</Tx> : null}
      {closedShown.map((b) => (
        <BatchCard key={b._id} b={b} eggsToday={0} />
      ))}

      {!poultryQuery.isLoading && !shown.length ? (
        <EmptyCard
          icon="bird"
          title={all.length ? c.noMatch : c.noBatches}
          sub={canAddBatch ? c.noBatchesSub : undefined}
          action={canAddBatch && !all.length ? <MButton label={c.newBatch} icon="plus" kind="lime" onPress={() => router.push('/(app)/poultry/new')} /> : undefined}
        />
      ) : null}

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title={c.sortBy}>
        {(
          [
            ['newest', c.newest],
            ['oldest', c.oldest],
            ['most', c.mostBirds],
          ] as Array<[Sort, string]>
        ).map(([k, label]) => (
          <SheetRow
            key={k}
            label={label}
            active={sort === k}
            onPress={() => {
              setSort(k);
              setSortOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

function LivestockScreen() {
  const { c } = useM();
  const { user, organization } = useAuth();
  const [tab, setTab] = useState<Tab>(organization?.farmType === 'cow' ? 'dairy' : 'poultry');
  const batches = useQuery({ queryKey: ['poultry-batches'], queryFn: () => domainApi.listPoultryBatches() });
  const cows = useQuery({ queryKey: ['cows'], queryFn: () => domainApi.listCows() });
  const canAdd = tab === 'poultry' ? canWritePoultry(user?.role) : canWriteCattle(user?.role);
  const refreshing = batches.isRefetching || cows.isRefetching;

  return (
    <MScreen
      tabs
      refreshing={refreshing}
      onRefresh={() => {
        batches.refetch();
        cows.refetch();
      }}
      header={
        <TitleHeader
          title={c.livestock}
          sub={c.livestockSub}
          right={canAdd ? <LimeSquare label={tab === 'poultry' ? c.newBatch : c.addAnimal} onPress={() => router.push(tab === 'poultry' ? '/(app)/poultry/new' : '/(app)/cattle/new')} /> : null}
        />
      }>
      <MSegmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'poultry', label: c.poultryN((batches.data?.data ?? []).filter(isActiveBatch).length) },
          { key: 'dairy', label: c.dairyN(cows.data?.data?.length ?? 0) },
        ]}
      />
      {tab === 'poultry' ? <PoultryTab /> : <CattleHerd />}
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebLivestock /> : <LivestockScreen />;
}
