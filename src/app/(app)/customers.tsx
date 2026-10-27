import { useDesktopWeb, WebCustomers } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView } from 'react-native';

import { organizationApi } from '@/api';
import {
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';

function CustomersScreen() {
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: () => organizationApi.listCustomers(),
  });

  return (
    <Screen>
      <PageHeader title="Customers" subtitle="Buyers for eggs, milk & birds" />

      <ScrollView
        contentContainerClassName="gap-3 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        {query.isLoading ? <LoadingBlock /> : null}
        {query.isError ? (
          <EmptyState
            title="Could not load customers"
            subtitle={query.error instanceof Error ? query.error.message : undefined}
          />
        ) : null}

        {query.data?.data?.length ? (
          query.data.data.map((customer) => (
            <Card key={customer._id}>
              <ListRow
                title={customer.name}
                subtitle={
                  [customer.phone, customer.district, customer.address]
                    .filter(Boolean)
                    .join(' · ') || 'No contact yet'
                }
              />
            </Card>
          ))
        ) : !query.isLoading ? (
          <EmptyState title="No customers yet" subtitle="Add buyers to track receivables." />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebCustomers /> : <CustomersScreen />;
}
