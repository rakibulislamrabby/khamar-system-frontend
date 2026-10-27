import { useDesktopWeb, WebBatch } from '@/components/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { domainApi, inventoryApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import {
  AppText,
  Button,
  FormBackHeader,
  OptionChips,
  Screen,
  TextField,
} from '@/components/ui/primitives';
import { formatBdt } from '@/lib/format';
import { canWriteCost, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

type CostKind = 'feed' | 'vaccine' | 'death' | 'other';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function titleForKind(kind: CostKind, t: (k: 'costFeed' | 'costVaccine' | 'costDeath' | 'costOther' | 'addBatchCost') => string) {
  if (kind === 'feed') return t('costFeed');
  if (kind === 'vaccine') return t('costVaccine');
  if (kind === 'death') return t('costDeath');
  if (kind === 'other') return t('costOther');
  return t('addBatchCost');
}

function AddBatchCostScreen() {
  const { t } = useLocale();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    batchId: string;
    farmId: string;
    batchName?: string;
    kind?: CostKind;
  }>();

  const kind: CostKind = (params.kind as CostKind) || 'other';
  const isDeath = kind === 'death';

  const allowed = isDeath ? canWritePoultry(user?.role) : canWriteCost(user?.role);

  const categoriesQuery = useQuery({
    queryKey: ['cost-categories'],
    queryFn: inventoryApi.listCostCategories,
    enabled: !isDeath,
  });

  const preferredCategory = useMemo(() => {
    const list = categoriesQuery.data ?? [];
    if (kind === 'feed') {
      return list.find((c) => /feed/i.test(c.name)) || list[0];
    }
    if (kind === 'vaccine') {
      return (
        list.find((c) => /vaccine/i.test(c.name)) ||
        list.find((c) => /medicine/i.test(c.name)) ||
        list[0]
      );
    }
    return list.find((c) => /other/i.test(c.name)) || list[0];
  }, [categoriesQuery.data, kind]);

  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState(isDeath ? '' : '1');
  const [unit, setUnit] = useState(kind === 'feed' ? 'kg' : 'piece');
  const [rate, setRate] = useState('');
  const [costDate, setCostDate] = useState(todayInput());
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const selectedCategoryId = categoryId || preferredCategory?._id || '';

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
      queryClient.invalidateQueries({ queryKey: ['poultry-batch', params.batchId] }),
      queryClient.invalidateQueries({ queryKey: ['poultry-batches'] }),
    ]);
  };

  const costMutation = useMutation({
    mutationFn: inventoryApi.createCost,
    onSuccess: async () => {
      await invalidate();
      router.replace(`/(app)/poultry/${params.batchId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deathMutation = useMutation({
    mutationFn: () =>
      domainApi.recordMortality(params.batchId, {
        quantity: Math.floor(Number(quantity)),
        notes: description.trim() || undefined,
      }),
    onSuccess: async () => {
      await invalidate();
      router.replace(`/(app)/poultry/${params.batchId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const onSubmit = () => {
    setError('');
    if (!allowed) {
      setError(t('noPermissionBatch'));
      return;
    }
    if (!params.batchId) {
      setError(t('selectFarm'));
      return;
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(t('qtyPositive'));
      return;
    }

    if (isDeath) {
      deathMutation.mutate();
      return;
    }

    if (!selectedCategoryId) {
      setError(t('category'));
      return;
    }
    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum) || rateNum < 0 || rate.trim() === '') {
      setError(t('priceRequired'));
      return;
    }

    costMutation.mutate({
      farmId: params.farmId || undefined,
      categoryId: selectedCategoryId,
      costType: kind === 'feed' || kind === 'vaccine' ? 'operating' : 'custom',
      scope: 'poultry_batch',
      referenceType: 'poultry_batch',
      referenceId: params.batchId,
      quantity: qty,
      unit,
      rate: rateNum,
      costDate: new Date(costDate).toISOString(),
      description:
        description.trim() ||
        `${titleForKind(kind, t)} — ${params.batchName ?? ''}`.trim(),
    });
  };

  const loading = costMutation.isPending || deathMutation.isPending;

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FormBackHeader
          title={titleForKind(kind, t)}
          onBack={() => router.back()}
        />
        <AppText variant="caption" className="mb-5">
          {params.batchName ? `${params.batchName}` : ''} · {organization?.name}
        </AppText>

        <ScrollView
          contentContainerClassName="gap-4 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {isDeath ? (
            <>
              <TextField
                label={t('mortalityBirds')}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="5"
              />
              <TextField
                label={t('descriptionOptional')}
                value={description}
                onChangeText={setDescription}
              />
            </>
          ) : (
            <>
              {kind === 'other' ? (
                <OptionChips
                  label={t('category')}
                  value={selectedCategoryId}
                  options={(categoriesQuery.data ?? []).map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                  onChange={setCategoryId}
                />
              ) : (
                <AppText variant="caption">
                  {t('category')}: {preferredCategory?.name ?? '—'}
                </AppText>
              )}

              <View className="flex-row gap-3">
                <TextField
                  label={t('quantity')}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  className="flex-1"
                />
                <TextField
                  label={t('unit')}
                  value={unit}
                  onChangeText={setUnit}
                  className="w-28"
                />
              </View>

              <TextField
                label={t('rate')}
                value={rate}
                onChangeText={setRate}
                keyboardType="decimal-pad"
              />
              <AppText variant="subtitle" className="text-padma">
                {t('total')}: {formatBdt(previewTotal)}
              </AppText>
              <TextField label={t('costDate')} value={costDate} onChangeText={setCostDate} />
              <TextField
                label={t('descriptionOptional')}
                value={description}
                onChangeText={setDescription}
              />
            </>
          )}

          {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

          <Button
            title={isDeath ? t('saveDeath') : t('saveCost')}
            onPress={onSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
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
