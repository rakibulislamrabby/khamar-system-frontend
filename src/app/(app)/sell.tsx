import { useDesktopWeb, WebSell } from '@/components/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { domainApi, inventoryApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { batchTitle, customerName, due, liveSales, saleProduct, useCustomers } from '@/components/dashboard/data';
import { CustomerDrawer } from '@/components/dashboard/drawers';
import { bdt, dayMonth, initials, num, titleCase } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { useToast } from '@/components/dashboard/kit';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  CircleBtn,
  EmptyCard,
  FieldLabel,
  HeroBlob,
  ListCard,
  Loading,
  MButton,
  MField,
  MPill,
  MScreen,
  MSegmented,
  MSelect,
  Notice,
  SectionHead,
  TitleHeader,
  Tx,
} from '@/components/mobile/kit';
import { resolveId } from '@/lib/ids';
import type { PoultryBatch } from '@/types/api';

function SellScreen() {
  const { c, lang } = useM();
  const queryClient = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ batchId?: string }>();

  const batchesQuery = useQuery({
    queryKey: ['poultry-batches'],
    queryFn: () => domainApi.listPoultryBatches(),
  });
  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: () => inventoryApi.listSales(),
  });
  const customersQ = useCustomers();

  const batches = (batchesQuery.data?.data ?? []).filter((b) => b.status !== 'closed');
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'kg' | 'piece'>('kg');
  const [rate, setRate] = useState('');
  const [received, setReceived] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.batchId) setBatchId(String(params.batchId));
  }, [params.batchId]);

  const selectedId = batchId || batches[0]?._id || '';
  const selected = batches.find((b) => b._id === selectedId);
  const total = useMemo(() => (Number(quantity) || 0) * (Number(rate) || 0), [quantity, rate]);
  const receivedNum = received.trim() ? Number(received) || 0 : total;
  const stillDue = Math.max(0, total - receivedNum);
  const unitLabel = unit === 'kg' ? 'kg' : 'pcs';

  const mutation = useMutation({
    mutationFn: inventoryApi.createSale,
    onSuccess: async (sale) => {
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast(c.saleSaved(sale?.saleNumber ?? ''));
      setQuantity('');
      setRate('');
      setReceived('');
      salesQuery.refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const onSave = () => {
    setError('');
    if (!selected) {
      setError(c.pickBatch);
      return;
    }
    const qty = Number(quantity);
    const rateNum = Number(rate);
    if (!qty || qty <= 0 || rate.trim() === '' || rateNum < 0) {
      setError(c.qtyPositive);
      return;
    }
    const receivedAmount = received.trim() ? Number(received) : total;
    mutation.mutate({
      farmId: resolveId(selected.farmId) || undefined,
      customerId: customerId || undefined,
      items: [
        {
          itemName: selected.batchName,
          quantity: qty,
          unit,
          rate: rateNum,
          referenceType: 'poultry_batch',
          referenceId: selected._id,
        },
      ],
      receivedAmount: Number.isFinite(receivedAmount) ? receivedAmount : total,
      notes: `Sale — ${selected.batchName}`,
    });
  };

  const sales = liveSales(salesQuery.data?.data ?? []).slice(0, 3);
  const customerOptions = [
    { value: '', label: c.walkIn, icon: 'user' as const },
    ...(customersQ.data ?? []).map((x) => ({ value: x._id, label: x.name, sub: x.phone, icon: 'users' as const })),
  ];

  return (
    <MScreen
      tabs
      header={<TitleHeader title={c.sell} sub={c.sellSub} right={<CircleBtn icon="file" label={c.salesHistory} onPress={() => router.push('/(app)/sales')} />} />}
      refreshing={salesQuery.isRefetching}
      onRefresh={() => {
        salesQuery.refetch();
        batchesQuery.refetch();
      }}>
      <View>
        <FieldLabel label={c.fromBatch} />
        {batchesQuery.isLoading ? <Loading /> : null}
        {!batchesQuery.isLoading && !batches.length ? (
          <EmptyCard
            icon="bird"
            title={c.noBatchToSell}
            sub={c.noBatchToSellSub}
            action={<MButton label={c.newBatch} icon="plus" kind="dark" h={44} onPress={() => router.push('/(app)/poultry/new')} />}
          />
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {batches.map((b) => (
            <BatchPick key={b._id} b={b} active={b._id === selectedId} onPress={() => setBatchId(b._id)} sub={c.aliveN(titleCase(b.birdType), num(b.currentQuantity))} />
          ))}
        </ScrollView>
      </View>

      <View>
        <FieldLabel label={c.sellBy} />
        <MSegmented
          value={unit}
          options={[
            { key: 'piece', label: c.piece },
            { key: 'kg', label: c.kilogram },
          ]}
          onChange={setUnit}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <MField label={c.quantity} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="0" suffix={unitLabel} style={{ flex: 1 }} />
        <MField label={c.rate} prefix="৳" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="0" suffix={c.perUnit(unitLabel)} style={{ flex: 1 }} />
      </View>

      <MSelect
        label={c.customer}
        title={c.customer}
        icon="users"
        value={customerId}
        options={customerOptions}
        onChange={setCustomerId}
        footer={(close) => (
          <MButton
            label={c.newCustomer}
            icon="userPlus"
            kind="outline"
            onPress={() => {
              close();
              setNewCustomer(true);
            }}
          />
        )}
      />

      <View style={{ backgroundColor: C.forest, borderRadius: 26, padding: 20, overflow: 'hidden', marginTop: 4 }}>
        <HeroBlob />
        <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{c.saleTotal}</Tx>
        <Tx s={38} w="800" color={C.white} tabular lines={1} style={{ letterSpacing: -1, marginTop: 4 }}>{bdt(total)}</Tx>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1, backgroundColor: C.forest2, borderRadius: 16, padding: 12 }}>
            <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.moneyReceived}</Tx>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
              <Tx s={15} w="800" color={C.lime}>৳</Tx>
              <TextInput
                value={received}
                onChangeText={setReceived}
                keyboardType="decimal-pad"
                placeholder={num(total)}
                placeholderTextColor={C.lime}
                accessibilityLabel={c.moneyReceived}
                style={[{ flex: 1, minWidth: 0, color: C.lime, fontSize: 15, fontWeight: '800', padding: 0, height: 22 }, { outlineStyle: 'none' } as object]}
              />
              <Icon name="pencil" size={13} color="rgba(255,255,255,0.45)" />
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: C.forest2, borderRadius: 16, padding: 12 }}>
            <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.stillDue}</Tx>
            <Tx s={15} w="800" color={stillDue > 0 ? '#FFC56B' : C.white} tabular style={{ marginTop: 2 }}>{bdt(stillDue)}</Tx>
          </View>
        </View>
      </View>

      <Notice message={error} />

      <MButton label={c.saveSale} icon="check" kind="lime" onPress={onSave} loading={mutation.isPending} />

      <SectionHead title={c.recentSales} action={c.all} onAction={() => router.push('/(app)/sales')} style={{ marginTop: 12 }} />
      {salesQuery.isLoading ? <Loading /> : null}
      {sales.length ? (
        <ListCard>
          {sales.map((s) => {
            const name = customerName(s) ?? c.walkIn;
            const p = saleProduct(s);
            const d = due(s);
            return (
              <Pressable key={s._id} onPress={() => router.push('/(app)/sales')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: d > 0 ? C.goldSoft : C.mint, alignItems: 'center', justifyContent: 'center' }}>
                  <Tx s={14} w="700" color={d > 0 ? C.goldInk : C.padma}>{initials(name)}</Tx>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Tx s={14} w="600" lines={1}>{name}</Tx>
                  <Tx s={12} w="500" color={C.sub} lines={1} style={{ marginTop: 2 }}>{[dayMonth(s.saleDate, lang), [p.qty, p.name].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}</Tx>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Tx s={15} w="700" tabular>{bdt(s.totalAmount)}</Tx>
                  {d > 0 ? <MPill label={c.dueAmt(bdt(d))} tone="gold" /> : null}
                </View>
              </Pressable>
            );
          })}
        </ListCard>
      ) : !salesQuery.isLoading ? (
        <EmptyCard icon="receipt" title={c.noSales} sub={c.noSalesSub} />
      ) : null}

      <CustomerDrawer open={newCustomer} onClose={() => setNewCustomer(false)} onCreated={(x) => setCustomerId(x._id)} />
    </MScreen>
  );
}

function BatchPick({ b, active, onPress, sub }: { b: PoultryBatch; active: boolean; onPress: () => void; sub: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ width: 168, height: 112, borderRadius: 20, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, padding: 15, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: active ? C.lime : C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bird" size={16} color={active ? C.forest : C.padma} />
        </View>
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? C.lime : C.line, backgroundColor: active ? C.lime : C.white, alignItems: 'center', justifyContent: 'center' }}>
          {active ? <Icon name="check" size={12} color={C.forest} /> : null}
        </View>
      </View>
      <Tx s={14} w="700" color={active ? C.white : C.ink} lines={1} style={{ marginTop: 12 }}>{batchTitle(b)}</Tx>
      <Tx s={12} w="500" color={active ? 'rgba(255,255,255,0.6)' : C.sub} lines={1} style={{ marginTop: 2 }}>{sub}</Tx>
    </Pressable>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebSell /> : <SellScreen />;
}
