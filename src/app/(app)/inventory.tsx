import { useDesktopWeb, WebStock } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView } from 'react-native';

import { inventoryApi } from '@/api';
import {
  Badge,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { formatBdt, labelize } from '@/lib/format';

function InventoryScreen() {
  const query = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list(),
  });

  return (
    <Screen>
      <PageHeader title="Inventory" subtitle="Feed, medicine, vaccine & farm supplies" />

      <ScrollView
        contentContainerClassName="gap-3 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        {query.isLoading ? <LoadingBlock /> : null}
        {query.isError ? (
          <EmptyState
            title="Could not load inventory"
            subtitle={query.error instanceof Error ? query.error.message : undefined}
          />
        ) : null}

        {query.data?.data?.length ? (
          query.data.data.map((item) => {
            const isLow =
              item.minStockLevel != null && item.currentStock <= item.minStockLevel;
            return (
              <Card key={item._id}>
                <ListRow
                  title={item.name}
                  subtitle={`${labelize(item.category)} · ${item.currentStock} ${item.unit}${
                    item.unitCost != null ? ` · ${formatBdt(item.unitCost)}/${item.unit}` : ''
                  }`}
                  right={<Badge label={isLow ? 'Low' : 'OK'} tone={isLow ? 'warning' : 'success'} />}
                />
              </Card>
            );
          })
        ) : !query.isLoading ? (
          <EmptyState
            title="Stock list is empty"
            subtitle="Add feed, medicine, or equipment from the API / admin tools."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebStock /> : <InventoryScreen />;
}
