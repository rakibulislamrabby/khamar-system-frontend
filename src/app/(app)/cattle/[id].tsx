import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { domainApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  FormBackHeader,
  ListRow,
  LoadingBlock,
  Screen,
  SectionHeader,
  StatCard,
  TextField,
} from '@/components/ui/primitives';
import { daysOnFeed, isFatteningAnimal, weightGain } from '@/lib/cattle';
import { formatBdt, formatDate, formatNumber } from '@/lib/format';
import { canWriteCattle } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function CattleDetailScreen() {
  const { t } = useLocale();
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
      setError(t('milkRequired'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(milkDate)) {
      setError(t('dateFormat'));
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
      setError(t('weightRequired'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weighDate)) {
      setError(t('dateFormat'));
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

  return (
    <Screen>
      <FormBackHeader title={t('animalDetails')} onBack={() => router.back()} />
      {cowQuery.isLoading ? <LoadingBlock /> : null}
      {cowQuery.isError ? (
        <EmptyState
          title={t('noCattle')}
          subtitle={cowQuery.error instanceof Error ? cowQuery.error.message : undefined}
        />
      ) : null}

      {cow ? (
        <ScrollView contentContainerClassName="gap-3 pb-12" keyboardShouldPersistTaps="handled">
          <Card>
            <View className="mb-3 flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <AppText variant="subtitle">{cow.animalId}</AppText>
                <AppText variant="caption" className="mt-1">
                  {cow.breed} · {cow.gender === 'female' ? t('female') : t('male')}
                  {cow.purchaseDate ? ` · ${formatDate(cow.purchaseDate)}` : ''}
                </AppText>
              </View>
              <Badge
                label={fattening ? t('fattenAnimal') : t('dairyAnimal')}
                tone={fattening ? 'warning' : 'success'}
              />
            </View>
            {cow.purchasePrice != null ? (
              <AppText variant="caption">
                {t('purchasePrice')}: {formatBdt(cow.purchasePrice)}
              </AppText>
            ) : null}
          </Card>

          {fattening ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                <StatCard label={t('entryKg')} value={`${formatNumber(cow.entryWeight)} kg`} />
                <StatCard label={t('nowKg')} value={`${formatNumber(cow.currentWeight)} kg`} tone="accent" />
                <StatCard
                  label={t('gain')}
                  value={gain == null ? '—' : `${gain >= 0 ? '+' : ''}${gain} kg`}
                  tone={gain != null && gain >= 0 ? 'profit' : 'loss'}
                />
                <StatCard
                  label={t('kgPerDay')}
                  value={perDay == null ? '—' : String(perDay)}
                  hint={days == null ? undefined : `${days} ${t('daysOnFeed')}`}
                />
              </View>

              {canWrite ? (
                <Card>
                  <AppText variant="subtitle" className="mb-3">
                    {t('weightBook')}
                  </AppText>
                  <View className="gap-3">
                    <TextField label={t('costDate')} value={weighDate} onChangeText={setWeighDate} autoCapitalize="none" />
                    <TextField
                      label={t('newWeight')}
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      placeholder="240"
                    />
                    <Button title={t('saveWeight')} onPress={saveWeight} loading={weightMutation.isPending} />
                  </View>
                </Card>
              ) : null}

              <SectionHeader title={t('recentWeights')} />
              {weights.length ? (
                weights.map((row) => (
                  <Card key={row._id} className="py-3.5">
                    <ListRow title={`${formatNumber(row.weight)} kg`} subtitle={formatDate(row.recordDate)} />
                  </Card>
                ))
              ) : (
                <EmptyState title={t('noWeightsYet')} />
              )}
            </>
          ) : (
            <>
              {canWrite ? (
                <Card>
                  <AppText variant="subtitle" className="mb-3">
                    {t('milkBook')}
                  </AppText>
                  <View className="gap-3">
                    <TextField label={t('costDate')} value={milkDate} onChangeText={setMilkDate} autoCapitalize="none" />
                    <View className="flex-row gap-3">
                      <TextField
                        label={t('morningMilk')}
                        value={morning}
                        onChangeText={setMorning}
                        keyboardType="decimal-pad"
                        placeholder="6"
                        className="flex-1"
                      />
                      <TextField
                        label={t('eveningMilk')}
                        value={evening}
                        onChangeText={setEvening}
                        keyboardType="decimal-pad"
                        placeholder="5"
                        className="flex-1"
                      />
                    </View>
                    <Button title={t('saveMilk')} onPress={saveMilk} loading={milkMutation.isPending} />
                  </View>
                </Card>
              ) : null}

              <SectionHeader title={t('recentMilk')} />
              {milkQuery.data?.data?.length ? (
                milkQuery.data.data.map((row) => (
                  <Card key={row._id} className="py-3.5">
                    <ListRow
                      title={`${formatNumber(row.totalQuantity)} L`}
                      subtitle={`${formatDate(row.productionDate)} · ${t('morningMilk')} ${formatNumber(row.morningQuantity)} · ${t('eveningMilk')} ${formatNumber(row.eveningQuantity)}`}
                    />
                  </Card>
                ))
              ) : (
                <EmptyState title={t('noMilkYet')} />
              )}
            </>
          )}

          {error ? (
            <AppText variant="caption" className="text-danger">
              {error}
            </AppText>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
