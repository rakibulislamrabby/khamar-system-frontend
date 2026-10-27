import { useDesktopWeb, WebSell } from '@/components/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { domainApi, inventoryApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  OptionChips,
  PageHeader,
  Screen,
  TextField,
} from '@/components/ui/primitives';
import { formatBdt, formatDate, labelize } from '@/lib/format';
import { resolveId } from '@/lib/ids';
import { useLocale } from '@/providers/locale-provider';

function SellScreen() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const batchesQuery = useQuery({
    queryKey: ['poultry-batches'],
    queryFn: () => domainApi.listPoultryBatches(),
  });
  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: () => inventoryApi.listSales(),
  });

  const batches = batchesQuery.data?.data ?? [];
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'kg' | 'piece' | 'animal'>('kg');
  const [rate, setRate] = useState('');
  const [received, setReceived] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const selected = batches.find((b) => b._id === batchId);
  const total = useMemo(
    () => (Number(quantity) || 0) * (Number(rate) || 0),
    [quantity, rate]
  );

  const mutation = useMutation({
    mutationFn: inventoryApi.createSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert(t('saveSale'), 'OK');
      setQuantity('');
      setRate('');
      setReceived('');
      setShowForm(false);
      salesQuery.refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const onSave = () => {
    setError('');
    if (!batchId || !selected) {
      setError(t('selectFarm'));
      return;
    }
    const qty = Number(quantity);
    const rateNum = Number(rate);
    if (!qty || qty <= 0 || rate.trim() === '' || rateNum < 0) {
      setError(t('qtyPositive'));
      return;
    }
    const receivedAmount = received.trim() ? Number(received) : total;
    mutation.mutate({
      farmId: resolveId(selected.farmId) || undefined,
      items: [
        {
          itemName: selected.batchName,
          quantity: qty,
          unit,
          rate: rateNum,
          referenceType: 'poultry_batch',
          referenceId: batchId,
        },
      ],
      receivedAmount: Number.isFinite(receivedAmount) ? receivedAmount : total,
      notes: `Sale — ${selected.batchName}`,
    });
  };

  return (
    <Screen>
      <PageHeader title={t('sellTitle')} subtitle={t('sellSubtitle')} />

      <Button
        title={showForm ? t('recentSales') : `+ ${t('saveSale')}`}
        onPress={() => setShowForm((v) => !v)}
        variant={showForm ? 'secondary' : 'primary'}
        className="mb-4"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="gap-3 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={salesQuery.isRefetching}
              onRefresh={() => salesQuery.refetch()}
            />
          }>
          {showForm ? (
            <View className="gap-4">
              <OptionChips
                label={t('batchName')}
                value={batchId || batches[0]?._id}
                options={batches.map((b) => ({ value: b._id, label: b.batchName }))}
                onChange={setBatchId}
                error={!batchesQuery.isLoading && !batches.length ? t('noPoultryBatches') : undefined}
              />

              <View className="flex-row gap-3">
                <TextField
                  label={t('quantity')}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  className="flex-1"
                />
                <View className="flex-1">
                  <OptionChips
                    label={t('unit')}
                    value={unit}
                    options={[
                      { value: 'kg', label: 'kg' },
                      { value: 'piece', label: 'pcs' },
                      { value: 'animal', label: 'bird' },
                    ]}
                    onChange={(v) => setUnit(v as typeof unit)}
                  />
                </View>
              </View>

              <TextField
                label={t('rate')}
                value={rate}
                onChangeText={setRate}
                keyboardType="decimal-pad"
              />
              <AppText variant="subtitle" className="text-padma">
                {t('total')}: {formatBdt(total)}
              </AppText>
              <TextField
                label={t('moneyReceived')}
                value={received}
                onChangeText={setReceived}
                keyboardType="decimal-pad"
                placeholder={String(total || '')}
              />

              {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
              <Button title={t('saveSale')} onPress={onSave} loading={mutation.isPending} />
            </View>
          ) : (
            <>
              {salesQuery.isLoading ? <LoadingBlock /> : null}
              {salesQuery.data?.data?.length ? (
                salesQuery.data.data.map((sale) => (
                  <Card key={sale._id}>
                    <ListRow
                      title={sale.saleNumber ?? t('sales')}
                      subtitle={`${formatDate(sale.saleDate)}${
                        sale.receivableAmount
                          ? ` · due ${formatBdt(sale.receivableAmount)}`
                          : ''
                      }`}
                      right={
                        <AppText variant="subtitle">{formatBdt(sale.totalAmount)}</AppText>
                      }
                    />
                  </Card>
                ))
              ) : !salesQuery.isLoading ? (
                <EmptyState title={t('sales')} subtitle={t('sellSubtitle')} />
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebSell /> : <SellScreen />;
}
