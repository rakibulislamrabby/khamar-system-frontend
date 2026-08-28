import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, View } from 'react-native';

import { organizationApi } from '@/api';
import {
  Badge,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { labelize } from '@/lib/format';

export default function FarmsScreen() {
  const query = useQuery({
    queryKey: ['farms'],
    queryFn: () => organizationApi.listFarms(),
  });

  return (
    <Screen>
      <PageHeader title="Farms" subtitle="খামার units under your organization" />

      <ScrollView
        contentContainerClassName="gap-3 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        {query.isLoading ? <LoadingBlock /> : null}
        {query.isError ? (
          <EmptyState
            title="Could not load farms"
            subtitle={query.error instanceof Error ? query.error.message : undefined}
          />
        ) : null}

        {query.data?.data?.length ? (
          query.data.data.map((farm) => (
            <Card key={farm._id}>
              <ListRow
                title={farm.name}
                subtitle={
                  [farm.district, farm.upazila].filter(Boolean).join(', ') ||
                  farm.location ||
                  farm.address ||
                  'Location not set'
                }
                right={
                  <Badge
                    label={labelize(farm.farmType)}
                    tone={farm.farmType === 'poultry' ? 'success' : 'neutral'}
                  />
                }
              />
            </Card>
          ))
        ) : !query.isLoading ? (
          <EmptyState
            title="No farms yet"
            subtitle="Your main farm is created on registration."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
