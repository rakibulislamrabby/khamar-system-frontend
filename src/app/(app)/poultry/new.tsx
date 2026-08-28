import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { domainApi, organizationApi } from '@/api';
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
import { canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewPoultryBatchScreen() {
  const { t } = useLocale();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const allowed = canWritePoultry(user?.role);

  const birdTypes = [
    { value: 'broiler', label: t('broiler') },
    { value: 'layer', label: t('layer') },
    { value: 'sonali', label: t('sonali') },
    { value: 'duck', label: t('duck') },
    { value: 'mixed', label: t('mixed') },
  ];

  const farmsQuery = useQuery({
    queryKey: ['farms'],
    queryFn: () => organizationApi.listFarms(),
  });

  const poultryFarms = useMemo(
    () => (farmsQuery.data?.data ?? []).filter((f) => f.farmType === 'poultry' || !f.farmType),
    [farmsQuery.data]
  );

  const [farmId, setFarmId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [birdType, setBirdType] = useState(
    organization?.poultryPurpose && organization.poultryPurpose !== 'breeding'
      ? String(organization.poultryPurpose)
      : 'broiler'
  );
  const [purchaseDate, setPurchaseDate] = useState(todayInput());
  const [initialQuantity, setInitialQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [error, setError] = useState('');

  const selectedFarmId = farmId || poultryFarms[0]?._id || '';

  const chickTotal = useMemo(() => {
    const qty = Number(initialQuantity);
    const price = Number(unitPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
    return qty * price;
  }, [initialQuantity, unitPrice]);

  const createMutation = useMutation({
    mutationFn: domainApi.createPoultryBatch,
    onSuccess: async (batch) => {
      await queryClient.invalidateQueries({ queryKey: ['poultry-batches'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['costs'] });
      router.replace(`/(app)/poultry/${batch._id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const onSubmit = () => {
    setError('');
    if (!allowed) {
      setError(t('noPermissionBatch'));
      return;
    }
    if (!selectedFarmId) {
      setError(t('selectFarm'));
      return;
    }
    if (!batchName.trim()) {
      setError(t('enterBatchName'));
      return;
    }
    if (!birdType) {
      setError(t('selectBirdType'));
      return;
    }
    const qty = Number(initialQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(t('qtyPositive'));
      return;
    }
    const price = Number(unitPrice);
    if (!Number.isFinite(price) || price < 0 || unitPrice.trim() === '') {
      setError(t('priceRequired'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setError(t('dateFormat'));
      return;
    }

    createMutation.mutate({
      farmId: selectedFarmId,
      batchName: batchName.trim(),
      birdType,
      purchaseDate: new Date(purchaseDate).toISOString(),
      initialQuantity: Math.floor(qty),
      unitPrice: price,
    });
  };

  if (!allowed) {
    return (
      <Screen>
        <FormBackHeader title={t('addBatchTitle')} onBack={() => router.back()} />
        <AppText variant="body">{t('noPermissionBatch')}</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FormBackHeader title={t('addBatchTitle')} onBack={() => router.back()} />
        <AppText variant="caption" className="mb-5">
          {t('addBatchHint')} ({organization?.name})
        </AppText>

        <ScrollView
          contentContainerClassName="gap-4 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <OptionChips
            label={t('farm')}
            value={selectedFarmId}
            options={poultryFarms.map((f) => ({ value: f._id, label: f.name }))}
            onChange={setFarmId}
          />

          <TextField
            label={t('batchName')}
            value={batchName}
            onChangeText={setBatchName}
            placeholder="Batch-Mar-2026"
          />

          <OptionChips
            label={t('birdType')}
            value={birdType}
            options={birdTypes}
            onChange={setBirdType}
          />

          <TextField
            label={t('purchaseDate')}
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="2026-03-15"
            autoCapitalize="none"
          />

          <View className="flex-row gap-3">
            <TextField
              label={t('initialQuantity')}
              value={initialQuantity}
              onChangeText={setInitialQuantity}
              keyboardType="number-pad"
              placeholder="1000"
              className="flex-1"
            />
            <TextField
              label={t('pricePerChick')}
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
              placeholder="45"
              className="flex-1"
            />
          </View>

          <AppText variant="subtitle" className="text-padma">
            {t('chickPurchaseTotal')}: {formatBdt(chickTotal)}
          </AppText>

          {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

          <Button
            title={t('createBatch')}
            onPress={onSubmit}
            loading={createMutation.isPending}
            className="mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
