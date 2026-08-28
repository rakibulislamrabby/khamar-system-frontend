import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { domainApi, inventoryApi } from '@/api';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  FormBackHeader,
  ListRow,
  LoadingBlock,
  Screen,
  SectionHeader,
  StatCard,
} from '@/components/ui/primitives';
import { formatBdt, formatDate, formatNumber, labelize } from '@/lib/format';
import { resolveId } from '@/lib/ids';
import { canWriteCost, canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

type CostKind = 'feed' | 'vaccine' | 'death' | 'other';

function ActionChip({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-2 min-w-[72px] items-center rounded-xl border border-line bg-white px-3 py-3 active:opacity-90">
      <View
        className="mb-1.5 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}20` }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text className="text-2xs font-semibold text-ink">{label}</Text>
    </Pressable>
  );
}

export default function PoultryBatchDetailScreen() {
  const { t } = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const canCost = canWriteCost(user?.role);
  const canPoultry = canWritePoultry(user?.role);

  const batchQuery = useQuery({
    queryKey: ['poultry-batch', id],
    queryFn: () => domainApi.getPoultryBatch(id!),
    enabled: Boolean(id),
  });

  const farmId = resolveId(batchQuery.data?.farmId);

  const costsQuery = useQuery({
    queryKey: ['costs', farmId],
    queryFn: () => inventoryApi.listCosts(1, 100, farmId || undefined),
    enabled: Boolean(farmId),
  });

  const batchCosts = useMemo(() => {
    const all = costsQuery.data?.data ?? [];
    return all.filter(
      (c) => String(c.referenceId) === String(id) || c.scope === 'poultry_batch'
    ).filter((c) => String(c.referenceId) === String(id));
  }, [costsQuery.data, id]);

  const costsTotal = batchCosts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  const openCost = (kind: CostKind) => {
    if (!batchQuery.data) return;
    router.push({
      pathname: '/(app)/poultry/add-cost',
      params: {
        batchId: batchQuery.data._id,
        farmId,
        batchName: batchQuery.data.batchName,
        kind,
      },
    });
  };

  return (
    <Screen>
      <FormBackHeader title={t('batchDetails')} onBack={() => router.back()} />

      {batchQuery.isLoading ? <LoadingBlock /> : null}
      {batchQuery.isError ? (
        <EmptyState
          title="Could not load batch"
          subtitle={batchQuery.error instanceof Error ? batchQuery.error.message : undefined}
        />
      ) : null}

      {batchQuery.data ? (
        <ScrollView
          contentContainerClassName="gap-3 pb-12"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={batchQuery.isRefetching || costsQuery.isRefetching}
              onRefresh={() => {
                batchQuery.refetch();
                costsQuery.refetch();
              }}
            />
          }>
          {/* Generic batch info */}
          <Card>
            <View className="mb-3 flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <AppText variant="subtitle">{batchQuery.data.batchName}</AppText>
                <AppText variant="caption" className="mt-1">
                  {labelize(batchQuery.data.birdType)} · {formatDate(batchQuery.data.purchaseDate)}
                </AppText>
              </View>
              <Badge label={labelize(batchQuery.data.status)} tone="success" />
            </View>

            <View className="mt-1 gap-1.5">
              <AppText variant="caption">
                {t('birdsAlive')}: {formatNumber(batchQuery.data.currentQuantity)} /{' '}
                {t('birdsStart')}: {formatNumber(batchQuery.data.initialQuantity)}
              </AppText>
              <AppText variant="caption">
                {t('mortality')}: {formatNumber(batchQuery.data.mortalityCount ?? 0)} (
                {formatNumber(batchQuery.data.mortalityPercentage)}%)
              </AppText>
              {batchQuery.data.unitPrice != null ? (
                <AppText variant="caption">
                  {t('pricePerChick')}: {formatBdt(batchQuery.data.unitPrice)}
                </AppText>
              ) : null}
            </View>
          </Card>

          <View className="flex-row flex-wrap gap-3">
            <StatCard label={t('batchCosts')} value={formatBdt(costsTotal)} tone="loss" />
            <StatCard
              label={t('recordedPl')}
              value={formatBdt(batchQuery.data.profitLoss)}
              tone={(batchQuery.data.profitLoss ?? 0) >= 0 ? 'profit' : 'loss'}
            />
          </View>

          {/* Side / quick add buttons */}
          {(canCost || canPoultry) ? (
            <View>
              <SectionHeader title={t('addEntry')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1">
                <View className="flex-row">
                  {canCost ? (
                    <ActionChip
                      label={t('costFeed')}
                      icon="nutrition"
                      color="#CA8A04"
                      onPress={() => openCost('feed')}
                    />
                  ) : null}
                  {canCost ? (
                    <ActionChip
                      label={t('costVaccine')}
                      icon="medkit"
                      color="#2563EB"
                      onPress={() => openCost('vaccine')}
                    />
                  ) : null}
                  {canPoultry ? (
                    <ActionChip
                      label={t('costDeath')}
                      icon="warning"
                      color="#DC2626"
                      onPress={() => openCost('death')}
                    />
                  ) : null}
                  {canCost ? (
                    <ActionChip
                      label={t('costOther')}
                      icon="add-circle"
                      color="#006A4E"
                      onPress={() => openCost('other')}
                    />
                  ) : null}
                </View>
              </ScrollView>
            </View>
          ) : null}

          <SectionHeader title={t('costsForBatch')} />

          {costsQuery.isLoading ? <LoadingBlock /> : null}

          {batchCosts.length ? (
            batchCosts.map((cost) => (
              <Card key={cost._id} className="py-3.5">
                <ListRow
                  title={cost.categoryName || labelize(cost.costType)}
                  subtitle={`${formatDate(cost.costDate)} · ${cost.quantity} ${cost.unit} × ৳${cost.rate}`}
                  right={<AppText variant="subtitle">{formatBdt(cost.totalAmount)}</AppText>}
                />
              </Card>
            ))
          ) : !costsQuery.isLoading ? (
            <EmptyState title={t('noCostsYet')} subtitle={t('noCostsHint')} />
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
