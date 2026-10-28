import { useDesktopWeb, WebBatch } from '@/components/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { domainApi, inventoryApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { batchCycle, batchTitle, costVisual } from '@/components/dashboard/data';
import { bdt, dayMonth, num, titleCase } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  FieldLabel,
  MButton,
  MDateField,
  MField,
  MScreen,
  MSelect,
  NavHeader,
  Notice,
  Sheet,
  SheetRow,
  ToneTile,
  Tx,
} from '@/components/mobile/kit';
import { resolveId } from '@/lib/ids';
import { canWriteCost, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { PoultryBatch } from '@/types/api';

type CostKind = 'feed' | 'vaccine' | 'death' | 'other';

const UNITS = ['kg', 'bag', 'piece', 'vial', 'dose', 'litre'];

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function AddBatchCostScreen() {
  const { c, lang } = useM();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    batchId: string;
    farmId: string;
    batchName?: string;
    kind?: CostKind;
  }>();

  const [kind, setKind] = useState<CostKind>((params.kind as CostKind) || 'other');
  const [picked, setPicked] = useState<{ batchId: string; farmId: string; batchName: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const batchId = picked?.batchId ?? params.batchId ?? '';
  const batchFarmId = picked?.farmId ?? params.farmId ?? '';
  const batchName = picked?.batchName ?? params.batchName ?? '';
  const isDeath = kind === 'death';

  const canCost = canWriteCost(user?.role);
  const canPoultry = canWritePoultry(user?.role);
  const allowed = isDeath ? canPoultry : canCost;

  const batchQuery = useQuery({
    queryKey: ['poultry-batch', batchId],
    queryFn: () => domainApi.getPoultryBatch(batchId),
    enabled: Boolean(batchId),
  });
  const batchesQuery = useQuery({ queryKey: ['poultry-batches'], queryFn: () => domainApi.listPoultryBatches() });
  const activeBatches = (batchesQuery.data?.data ?? []).filter((b) => b.status !== 'closed');

  const categoriesQuery = useQuery({
    queryKey: ['cost-categories'],
    queryFn: inventoryApi.listCostCategories,
    enabled: !isDeath,
  });

  const preferredCategory = useMemo(() => {
    const list = categoriesQuery.data ?? [];
    if (kind === 'feed') {
      return list.find((x) => /feed/i.test(x.name)) || list[0];
    }
    if (kind === 'vaccine') {
      return (
        list.find((x) => /vaccine/i.test(x.name)) ||
        list.find((x) => /medicine/i.test(x.name)) ||
        list[0]
      );
    }
    return list.find((x) => /other/i.test(x.name)) || list[0];
  }, [categoriesQuery.data, kind]);

  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState(isDeath ? '' : '1');
  const [unit, setUnit] = useState(kind === 'feed' ? 'kg' : 'piece');
  const [rate, setRate] = useState('');
  const [costDate, setCostDate] = useState(todayInput());
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const selectedCategoryId = categoryId || preferredCategory?._id || '';
  const selectedCategory = (categoriesQuery.data ?? []).find((x) => x._id === selectedCategoryId);

  const chooseKind = (k: CostKind) => {
    if (k === kind) return;
    setKind(k);
    setCategoryId('');
    setError('');
    setQuantity(k === 'death' ? '' : '1');
    setUnit(k === 'feed' ? 'kg' : 'piece');
  };

  const previewTotal = useMemo(() => {
    const q = Number(quantity);
    const r = Number(rate);
    if (!Number.isFinite(q) || !Number.isFinite(r)) return 0;
    return q * r;
  }, [quantity, rate]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['costs'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['poultry-batch', batchId] }),
      queryClient.invalidateQueries({ queryKey: ['poultry-batches'] }),
    ]);
  };

  const costMutation = useMutation({
    mutationFn: inventoryApi.createCost,
    onSuccess: async () => {
      await invalidate();
      router.replace(`/(app)/poultry/${batchId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deathMutation = useMutation({
    mutationFn: () =>
      domainApi.recordMortality(batchId, {
        quantity: Math.floor(Number(quantity)),
        notes: description.trim() || undefined,
      }),
    onSuccess: async () => {
      await invalidate();
      router.replace(`/(app)/poultry/${batchId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const kindLabel = { feed: c.feed, vaccine: c.vaccine, death: c.death, other: c.other }[kind];

  const onSubmit = () => {
    setError('');
    if (!allowed) {
      setError(c.noPermissionBatch);
      return;
    }
    if (!batchId) {
      setError(c.chooseBatch);
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(c.qtyPositive);
      return;
    }

    if (isDeath) {
      deathMutation.mutate();
      return;
    }

    if (!selectedCategoryId) {
      setError(c.pickCategory);
      return;
    }
    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum) || rateNum < 0 || rate.trim() === '') {
      setError(c.enterRate);
      return;
    }

    costMutation.mutate({
      farmId: batchFarmId || undefined,
      categoryId: selectedCategoryId,
      costType: kind === 'feed' || kind === 'vaccine' ? 'operating' : 'custom',
      scope: 'poultry_batch',
      referenceType: 'poultry_batch',
      referenceId: batchId,
      quantity: qty,
      unit,
      rate: rateNum,
      costDate: new Date(costDate).toISOString(),
      description: description.trim() || `${kindLabel} — ${batchName}`.trim(),
    });
  };

  const loading = costMutation.isPending || deathMutation.isPending;
  const b = batchQuery.data;
  const alive = b?.currentQuantity ?? 0;
  const kinds: Array<{ key: CostKind; label: string; icon: IconName; ok: boolean }> = [
    { key: 'feed', label: c.feed, icon: 'wheat', ok: canCost },
    { key: 'vaccine', label: c.vaccine, icon: 'syringe', ok: canCost },
    { key: 'death', label: c.death, icon: 'alert', ok: canPoultry },
    { key: 'other', label: c.other, icon: 'plus', ok: canCost },
  ];
  const unitOptions = (UNITS.includes(unit) ? UNITS : [unit, ...UNITS]).map((u) => ({ value: u, label: u }));

  const pickBatch = (x: PoultryBatch) => {
    setPicked({ batchId: x._id, farmId: resolveId(x.farmId), batchName: x.batchName });
    setPickerOpen(false);
  };

  return (
    <MScreen
      header={<NavHeader title={c.addCost} />}
      plainFooter
      footer={<MButton label={isDeath ? c.saveDeaths : c.saveCost} icon="check" kind="lime" onPress={onSubmit} loading={loading} />}>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 11 }}>
        <ToneTile icon="bird" tone="lime" size={38} radius={12} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tx s={14} w="700" lines={1}>{b ? batchTitle(b) : batchName || c.chooseBatch}</Tx>
          <Tx s={12} w="500" color={C.sub} lines={1}>
            {b ? c.batchLine(titleCase(b.birdType), batchCycle(b).day, num(alive)) : c.chooseBatchSub}
          </Tx>
        </View>
        <Tx s={13} w="700" color={C.padma} style={{ paddingHorizontal: 6 }}>{batchId ? c.change : c.chooseBatch}</Tx>
      </Pressable>

      <View style={{ marginTop: 4 }}>
        <FieldLabel label={c.whatSpent} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {kinds.filter((k) => k.ok).map((k) => {
            const active = k.key === kind;
            return (
              <Pressable
                key={k.key}
                onPress={() => chooseKind(k.key)}
                style={({ pressed }) => ({ flex: 1, height: 92, borderRadius: 20, borderWidth: 1, borderColor: active ? C.forest : C.line, backgroundColor: active ? C.forest : C.white, alignItems: 'center', paddingTop: 15, gap: 8, opacity: pressed ? 0.85 : 1 })}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: active ? C.lime : C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={k.icon} size={18} color={active ? C.forest : C.sub} />
                </View>
                <Tx s={12} w="700" color={active ? C.white : C.ink} lines={1}>{k.label}</Tx>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isDeath ? (
        <>
          <MField label={c.birdsDied} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="5" big />
          <MField label={c.note} optional={c.optional} value={description} onChangeText={setDescription} placeholder={c.deathNotePh} />
          <TotalCard
            label={c.birdsDied}
            value={num(Number(quantity) || 0)}
            line={b ? `${num(alive)} → ${num(Math.max(0, alive - (Number(quantity) || 0)))}` : undefined}
            sub={b ? c.aliveAfter(num(Math.max(0, alive - (Number(quantity) || 0)))) : undefined}
          />
        </>
      ) : (
        <>
          <MSelect
            label={c.category}
            title={c.category}
            icon={costVisual(selectedCategory?.name).icon}
            value={selectedCategoryId}
            placeholder={c.pickCategory}
            options={(categoriesQuery.data ?? []).map((x) => ({ value: x._id, label: x.name, icon: costVisual(x.name).icon, tone: costVisual(x.name).tone }))}
            onChange={setCategoryId}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MField label={c.quantity} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={{ flex: 1 }} />
            <MSelect label={c.unit} title={c.unit} value={unit} options={unitOptions} onChange={setUnit} style={{ width: 120 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MField label={c.rateUnit} prefix="৳" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
            <MDateField
              label={c.date}
              value={costDate}
              onChange={setCostDate}
              format={(iso) => dayMonth(new Date(iso), lang)}
              labels={{ today: c.today, yesterday: c.yesterday, daysAgo: c.daysAgo, exact: c.exactDate }}
              style={{ flex: 1 }}
            />
          </View>
          <MField label={c.note} optional={c.optional} value={description} onChangeText={setDescription} placeholder={c.costNotePh} />
          <TotalCard
            label={c.totalCost}
            value={bdt(previewTotal)}
            line={`${num(Number(quantity) || 0)} × ${bdt(Number(rate) || 0)}`}
            sub={alive ? c.perBird(bdt(previewTotal / alive)) : undefined}
          />
        </>
      )}

      <Notice message={error} />

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title={c.chooseBatch}>
        {activeBatches.map((x) => (
          <SheetRow
            key={x._id}
            label={batchTitle(x)}
            sub={c.batchLine(titleCase(x.birdType), batchCycle(x).day, num(x.currentQuantity))}
            icon="bird"
            tone="lime"
            active={x._id === batchId}
            onPress={() => pickBatch(x)}
          />
        ))}
      </Sheet>
    </MScreen>
  );
}

function TotalCard({ label, value, line, sub }: { label: string; value: string; line?: string; sub?: string }) {
  return (
    <View style={{ backgroundColor: C.forest, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{label}</Tx>
        <Tx s={30} w="800" color={C.white} tabular lines={1} style={{ letterSpacing: -1, marginTop: 4 }}>{value}</Tx>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {line ? <Tx s={13} w="700" color={C.lime} tabular>{line}</Tx> : null}
        {sub ? <Tx s={12} w="500" color="rgba(255,255,255,0.6)" style={{ marginTop: 4 }}>{sub}</Tx> : null}
      </View>
    </View>
  );
}

function WebAddCostRoute() {
  const { batchId, kind } = useLocalSearchParams<{ batchId: string; kind?: string }>();
  const entry = kind === 'feed' || kind === 'vaccine' || kind === 'death' ? kind : 'other';
  return <WebBatch id={String(batchId)} initialEntry={entry} />;
}

export default function Route() {
  return useDesktopWeb() ? <WebAddCostRoute /> : <AddBatchCostScreen />;
}
