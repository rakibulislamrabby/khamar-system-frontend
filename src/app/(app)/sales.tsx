import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, View } from 'react-native';

import { inventoryApi } from '@/api';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { formatBdt, formatDate, labelize } from '@/lib/format';

export default function SalesScreen() {
  const query = useQuery({
    queryKey: ['sales'],
    queryFn: () => inventoryApi.listSales(),
  });

  return (
    <Screen>
      <PageHeader title="Sales" subtitle="বিক্রয় records & receivables" />

      <ScrollView
        contentContainerClassName="gap-3 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        {query.isLoading ? <LoadingBlock /> : null}
        {query.isError ? (
          <EmptyState
            title="Could not load sales"
            subtitle={query.error instanceof Error ? query.error.message : undefined}
          />
        ) : null}

        {query.data?.data?.length ? (
          query.data.data.map((sale) => (
            <Card key={sale._id}>
              <ListRow
                title={sale.saleNumber ?? 'Sale'}
                subtitle={`${formatDate(sale.saleDate)}${
                  sale.receivableAmount != null
                    ? ` · due ${formatBdt(sale.receivableAmount)}`
                    : ''
                }`}
                right={
                  <View className="items-end gap-1.5">
                    <AppText variant="subtitle">{formatBdt(sale.totalAmount)}</AppText>
                    <Badge label={labelize(sale.status)} tone="success" />
                  </View>
                }
              />
            </Card>
          ))
        ) : !query.isLoading ? (
          <EmptyState title="No sales yet" subtitle="Completed sales will show here." />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
