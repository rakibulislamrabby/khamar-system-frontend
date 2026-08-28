import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { dashboardApi } from '@/api';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  Screen,
  SectionHeader,
  StatCard,
} from '@/components/ui/primitives';
import { formatBdt, formatDate, formatNumber } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

export default function DashboardScreen() {
  const { t } = useLocale();
  const { user, organization } = useAuth();
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  const data = query.data;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        <View className="rounded-b-3xl bg-padma px-5 pb-10 pt-5">
          <AppText variant="caption" className="text-white/80">
            {t('greeting')}
          </AppText>
          <AppText variant="title" className="mt-1 text-white">
            {user?.name ?? 'Farmer'}
          </AppText>
          <AppText variant="caption" className="mt-1 text-white/85">
            {organization?.name}
            {organization?.district ? ` · ${organization.district}` : ''}
            {organization?.upazila ? `, ${organization.upazila}` : ''}
          </AppText>
        </View>

        <View className="-mt-5 px-4">
          {query.isLoading ? <LoadingBlock /> : null}
          {query.isError ? (
            <EmptyState
              title="Could not load dashboard"
              subtitle={query.error instanceof Error ? query.error.message : undefined}
            />
          ) : null}

          {data ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                <StatCard
                  label={t('revenue')}
                  value={formatBdt(data.financials.totalRevenue)}
                  tone="accent"
                />
                <StatCard label={t('cost')} value={formatBdt(data.financials.totalCost)} tone="loss" />
                <StatCard
                  label={t('netProfit')}
                  value={formatBdt(data.financials.netProfit)}
                  tone={data.financials.netProfit >= 0 ? 'profit' : 'loss'}
                />
                <StatCard
                  label={organization?.farmType === 'cow' ? t('milkToday') : t('eggsToday')}
                  value={
                    organization?.farmType === 'cow'
                      ? `${formatNumber(data.dairy.todayMilkProduction)} L`
                      : formatNumber(data.poultry.todayEggProduction)
                  }
                  hint={
                    organization?.farmType === 'cow'
                      ? `${formatNumber(data.dairy.totalCows)} cows`
                      : `${formatNumber(data.poultry.activeBatches)} active batches`
                  }
                />
              </View>

              <SectionHeader title={t('quickSnapshot')} />
              <View className="flex-row gap-3">
                <Card className="flex-1">
                  <AppText variant="caption">{t('poultryBatches')}</AppText>
                  <AppText variant="money" className="mt-1">
                    {formatNumber(data.poultry.activeBatches)}
                  </AppText>
                </Card>
                <Card className="flex-1">
                  <AppText variant="caption">{t('dairyHerd')}</AppText>
                  <AppText variant="money" className="mt-1">
                    {formatNumber(data.dairy.totalCows)}
                  </AppText>
                  <AppText variant="caption" className="mt-1">
                    {formatNumber(data.dairy.lactatingCows)} lactating ·{' '}
                    {formatNumber(data.dairy.pregnantCows)} pregnant
                  </AppText>
                </Card>
              </View>

              <SectionHeader
                title={t('lowStockAlerts')}
                actionLabel={t('viewStock')}
                onAction={() => router.push('/(app)/inventory')}
              />
              {data.alerts.lowStockItems?.length ? (
                <View className="gap-2.5">
                  {data.alerts.lowStockItems.slice(0, 4).map((item) => (
                    <Card key={item._id} className="py-3.5">
                      <ListRow
                        title={item.name}
                        subtitle={`${item.category} · ${item.currentStock} ${item.unit}`}
                        right={<Badge label="Low" tone="warning" />}
                      />
                    </Card>
                  ))}
                </View>
              ) : (
                <EmptyState title="Stock looks healthy" subtitle="No low-stock items right now." />
              )}

              <SectionHeader
                title={t('recentSales')}
                actionLabel={t('allSales')}
                onAction={() => router.push('/(app)/sales')}
              />
              {data.recentSales?.length ? (
                <View className="gap-2.5">
                  {data.recentSales.slice(0, 5).map((sale) => (
                    <Card key={sale._id} className="py-3.5">
                      <ListRow
                        title={sale.saleNumber ?? 'Sale'}
                        subtitle={formatDate(sale.saleDate)}
                        right={
                          <AppText variant="subtitle">{formatBdt(sale.totalAmount)}</AppText>
                        }
                      />
                    </Card>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No sales yet"
                  subtitle="Record your first sale from the More tab."
                />
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
