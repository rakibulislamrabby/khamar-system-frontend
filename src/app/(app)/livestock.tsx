import { useDesktopWeb, WebLivestock } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { domainApi } from '@/api';
import { CattleHerd } from '@/components/cattle-herd';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { formatBdt, formatDate, formatNumber, labelize } from '@/lib/format';
import { canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

function LivestockScreen() {
  const { organization } = useAuth();
  if (organization?.farmType === 'cow') return <CattleHerd />;
  return <PoultryLivestock />;
}

function PoultryLivestock() {
  const { t } = useLocale();
  const { user } = useAuth();
  const canAddBatch = canWritePoultry(user?.role);

  const poultryQuery = useQuery({
    queryKey: ['poultry-batches'],
    queryFn: () => domainApi.listPoultryBatches(),
  });

  return (
    <Screen>
      <PageHeader title={t('livestock')} subtitle={t('livestockSubtitle')} />

      {canAddBatch ? (
        <Button
          title={t('addPoultryBatch')}
          onPress={() => router.push('/(app)/poultry/new')}
          className="mb-4"
        />
      ) : null}

      <ScrollView
        contentContainerClassName="gap-3 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={poultryQuery.isRefetching}
            onRefresh={() => poultryQuery.refetch()}
          />
        }>
        {poultryQuery.isLoading ? <LoadingBlock /> : null}
        {poultryQuery.isError ? (
          <EmptyState
            title="Could not load batches"
            subtitle={
              poultryQuery.error instanceof Error ? poultryQuery.error.message : undefined
            }
          />
        ) : null}

        {poultryQuery.data?.data?.length
          ? poultryQuery.data.data.map((batch) => (
              <Card
                key={batch._id}
                onPress={() => router.push(`/(app)/poultry/${batch._id}`)}>
                <ListRow
                  title={batch.batchName}
                  subtitle={`${labelize(batch.birdType)} · ${formatNumber(batch.currentQuantity)} birds · ${formatDate(batch.purchaseDate)}${
                    batch.unitPrice != null ? ` · ৳${batch.unitPrice}/chick` : ''
                  }\nP/L ${formatBdt(batch.profitLoss)}`}
                  right={
                    <View className="items-end gap-2">
                      <Badge label={labelize(batch.status)} tone="success" />
                      <Ionicons name="chevron-forward" size={16} color="#5C7266" />
                    </View>
                  }
                />
              </Card>
            ))
          : null}

        {!poultryQuery.isLoading && !poultryQuery.data?.data?.length ? (
          <EmptyState
            title={t('noPoultryBatches')}
            subtitle={canAddBatch ? t('noPoultryHint') : t('noPermissionBatch')}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebLivestock /> : <LivestockScreen />;
}
