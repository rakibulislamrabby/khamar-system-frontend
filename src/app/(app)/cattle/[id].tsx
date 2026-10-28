import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { domainApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { bdt, fullDate, num } from '@/components/dashboard/format';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { EmptyCard, ListCard, Loading, MButton, MCard, MDateField, MField, MScreen, NavHeader, Notice, SectionHead, ToneTile, Tx } from '@/components/mobile/kit';
import { Contours } from '@/components/web-landing/graphics';
import { daysOnFeed, isFatteningAnimal, weightGain } from '@/lib/cattle';
import { canWriteCattle } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function CattleDetailScreen() {
  const { c, lang } = useM();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = canWriteCattle(user?.role);
  const queryClient = useQueryClient();

  const cowQuery = useQuery({
    queryKey: ['cow', id],
    queryFn: () => domainApi.getCow(id!),
    enabled: Boolean(id),
  });

  const cow = cowQuery.data;
  const fattening = isFatteningAnimal(cow?.purpose);
  const farmId = typeof cow?.farmId === 'string' ? cow.farmId : '';

  const milkQuery = useQuery({
    queryKey: ['cow-milk', id],
    queryFn: () => domainApi.listMilk(id!),
    enabled: Boolean(id) && !fattening && Boolean(cow),
  });

  const weightQuery = useQuery({
    queryKey: ['cow-health', id],
    queryFn: () => domainApi.listCowHealth(id!),
    enabled: Boolean(id) && fattening,
  });

  const [milkDate, setMilkDate] = useState(todayInput());
  const [morning, setMorning] = useState('');
  const [evening, setEvening] = useState('');
  const [weighDate, setWeighDate] = useState(todayInput());
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cow', id] }),
      queryClient.invalidateQueries({ queryKey: ['cows'] }),
      queryClient.invalidateQueries({ queryKey: ['cow-milk', id] }),
      queryClient.invalidateQueries({ queryKey: ['cow-health', id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const milkMutation = useMutation({
    mutationFn: domainApi.recordMilk,
    onSuccess: async () => {
      setMorning('');
      setEvening('');
      setError('');
      await refresh();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const weightMutation = useMutation({
    mutationFn: domainApi.recordWeight,
    onSuccess: async () => {
      setWeight('');
      setError('');
      await refresh();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const gain = weightGain(cow?.entryWeight, cow?.currentWeight);
  const days = daysOnFeed(cow?.purchaseDate);
  const perDay = gain != null && days != null && days > 0 ? Math.round((gain / days) * 100) / 100 : null;

  const saveMilk = () => {
    if (!cow || !farmId) return;
    const morningQty = Number(morning) || 0;
    const eveningQty = Number(evening) || 0;
    if (morningQty <= 0 && eveningQty <= 0) {
      setError(c.milkRequired);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(milkDate)) {
      setError(c.dateFormat);
      return;
    }
    setError('');
    milkMutation.mutate({
      farmId,
      cowId: cow._id,
      productionDate: new Date(milkDate).toISOString(),
      morningQuantity: morningQty,
      eveningQuantity: eveningQty,
    });
  };

  const saveWeight = () => {
    if (!cow) return;
    const next = Number(weight);
    if (!Number.isFinite(next) || next <= 0) {
      setError(c.weightRequired);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weighDate)) {
      setError(c.dateFormat);
      return;
    }
    setError('');
    weightMutation.mutate({
      cowId: cow._id,
      weight: next,
      recordDate: new Date(weighDate).toISOString(),
    });
  };

  const weights = (weightQuery.data ?? []).filter((row) => row.recordType === 'weight' && row.weight != null);
  const milk = milkQuery.data?.data ?? [];
  const dateLabels = { today: c.today, yesterday: c.yesterday, daysAgo: c.daysAgo, exact: c.exactDate };
  const header = <NavHeader title={c.animalDetails} />;

  if (cowQuery.isLoading) {
    return (
      <MScreen header={header}>
        <Loading />
      </MScreen>
    );
  }
  if (!cow) {
    return (
      <MScreen header={header}>
        <EmptyCard icon="barn" title={c.noCattle} sub={cowQuery.error instanceof Error ? cowQuery.error.message : undefined} />
      </MScreen>
    );
  }

  const heroStats = fattening
    ? [
        { l: c.entryKg, v: cow.entryWeight != null ? `${num(cow.entryWeight)} kg` : '—' },
        { l: c.gain, v: gain == null ? '—' : `${gain >= 0 ? '+' : ''}${gain} kg`, color: gain != null && gain < 0 ? '#FF8A7A' : C.lime },
        { l: c.kgPerDay, v: perDay == null ? '—' : String(perDay) },
      ]
    : [
        { l: c.purchasePrice, v: cow.purchasePrice != null ? bdt(cow.purchasePrice) : '—' },
        { l: c.recentMilk, v: milk[0] ? `${num(milk[0].totalQuantity)} L` : '—', color: C.lime },
      ];

  return (
    <MScreen header={header} refreshing={cowQuery.isRefetching} onRefresh={() => refresh()}>
      <MCard dark radius={28} pad={20} style={{ overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.6 }}>
          <Contours w={350} h={240} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ height: 26, borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.22)' }}>
            <Tx s={12} w="600" color={C.lime}>{fattening ? c.fattenAnimal : c.dairyAnimal}</Tx>
          </View>
          <View style={{ height: 26, borderRadius: 999, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' }}>
            <Tx s={12} w="600" color={C.white}>{cow.gender === 'female' ? c.female : c.male}</Tx>
          </View>
          <View style={{ flex: 1 }} />
          {fattening && days != null ? <Tx s={12} w="500" color="rgba(255,255,255,0.6)">{c.daysOnFeed(days)}</Tx> : null}
        </View>
        <Tx s={22} w="700" color={C.white} lines={1} style={{ marginTop: 14, letterSpacing: -0.5 }}>{cow.animalId}</Tx>
        <Tx s={13} w="500" color="rgba(255,255,255,0.6)" lines={1} style={{ marginTop: 2 }}>
          {[cow.breed, cow.purchaseDate ? fullDate(cow.purchaseDate, lang) : null].filter(Boolean).join(' · ')}
        </Tx>
        {fattening ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 16 }}>
            <Tx s={40} w="800" color={C.white} tabular style={{ letterSpacing: -1 }}>{cow.currentWeight != null ? num(cow.currentWeight) : '—'}</Tx>
            <Tx s={15} w="500" color="rgba(255,255,255,0.6)">{`kg · ${c.nowKg}`}</Tx>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {heroStats.map((s) => (
            <View key={s.l} style={{ flex: 1, backgroundColor: C.forest2, borderRadius: 16, padding: 12 }}>
              <Tx s={12} w="500" color="rgba(255,255,255,0.6)" lines={1}>{s.l}</Tx>
              <Tx s={15} w="800" color={s.color ?? C.white} tabular lines={1} style={{ marginTop: 2 }}>{s.v}</Tx>
            </View>
          ))}
        </View>
      </MCard>

      {canWrite ? (
        <>
          <SectionHead title={fattening ? c.weightBook : c.milkBook} style={{ marginTop: 12 }} />
          <MCard pad={17} style={{ gap: 14 }}>
            {fattening ? (
              <>
                <MDateField label={c.date} value={weighDate} onChange={setWeighDate} format={(iso) => fullDate(iso, lang)} labels={dateLabels} />
                <MField label={c.newWeight} icon="scale" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="240" suffix="kg" />
                <Notice message={error} />
                <MButton label={c.saveWeight} icon="check" kind="lime" onPress={saveWeight} loading={weightMutation.isPending} />
              </>
            ) : (
              <>
                <MDateField label={c.date} value={milkDate} onChange={setMilkDate} format={(iso) => fullDate(iso, lang)} labels={dateLabels} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <MField label={c.morningMilk} value={morning} onChangeText={setMorning} keyboardType="decimal-pad" placeholder="6" suffix="L" style={{ flex: 1 }} />
                  <MField label={c.eveningMilk} value={evening} onChangeText={setEvening} keyboardType="decimal-pad" placeholder="5" suffix="L" style={{ flex: 1 }} />
                </View>
                <Notice message={error} />
                <MButton label={c.saveMilk} icon="check" kind="lime" onPress={saveMilk} loading={milkMutation.isPending} />
              </>
            )}
          </MCard>
        </>
      ) : (
        <Notice message={error} />
      )}

      <SectionHead title={fattening ? c.recentWeights : c.recentMilk} style={{ marginTop: 12 }} />
      {fattening ? (
        weights.length ? (
          <ListCard>
            {weights.map((row) => (
              <View key={row._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 12 }}>
                <ToneTile icon="scale" tone="gold" size={40} radius={13} />
                <Tx s={14} w="600" style={{ flex: 1 }}>{fullDate(row.recordDate, lang)}</Tx>
                <Tx s={15} w="700" tabular>{`${num(row.weight ?? 0)} kg`}</Tx>
              </View>
            ))}
          </ListCard>
        ) : (
          <EmptyCard icon="scale" title={c.noWeightsYet} />
        )
      ) : milk.length ? (
        <ListCard>
          {milk.map((row) => (
            <View key={row._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 12 }}>
              <ToneTile icon="milk" tone="sky" size={40} radius={13} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Tx s={14} w="600">{fullDate(row.productionDate, lang)}</Tx>
                <Tx s={12} w="500" color={C.sub} style={{ marginTop: 2 }}>{`${c.morning} ${num(row.morningQuantity)} · ${c.evening} ${num(row.eveningQuantity)}`}</Tx>
              </View>
              <Tx s={15} w="700" tabular>{`${num(row.totalQuantity)} L`}</Tx>
            </View>
          ))}
        </ListCard>
      ) : (
        <EmptyCard icon="milk" title={c.noMilkYet} />
      )}
    </MScreen>
  );
}
