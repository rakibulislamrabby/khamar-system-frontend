import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { domainApi } from '@/api';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { cattleLogic, isFatteningAnimal, weightGain } from '@/lib/cattle';
import { formatNumber } from '@/lib/format';
import { canWriteCattle } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import type { CowPurpose } from '@/types/api';

type Book = 'all' | 'dairy' | 'beef';

export function CattleHerd() {
  const { t } = useLocale();
  const { user, organization } = useAuth();
  const logic = cattleLogic(organization?.cowPurpose);
  const canAdd = canWriteCattle(user?.role);
  const [book, setBook] = useState<Book>('all');

  const herdQuery = useQuery({
    queryKey: ['cows'],
    queryFn: () => domainApi.listCows(),
  });

  const animals = useMemo(() => {
    const rows = herdQuery.data?.data ?? [];
    if (logic !== 'mixed' || book === 'all') return rows;
    return rows.filter((cow) => (book === 'beef' ? isFatteningAnimal(cow.purpose) : !isFatteningAnimal(cow.purpose)));
  }, [herdQuery.data, logic, book]);

  const subtitle =
    logic === 'beef' ? t('herdSubtitleFatten') : logic === 'mixed' ? t('herdSubtitleBoth') : t('herdSubtitleDairy');

  const emptyHint =
    logic === 'beef' ? t('noCattleHintFatten') : logic === 'mixed' ? t('noCattleHintBoth') : t('noCattleHintDairy');

  return (
    <Screen>
      <PageHeader title={t('cattleTab')} subtitle={subtitle} />

      {logic === 'mixed' ? (
        <View className="mb-4 flex-row gap-2">
          {(
            [
              ['all', t('allAnimals')],
              ['dairy', t('dairyBook')],
              ['beef', t('fattenBook')],
            ] as const
          ).map(([key, label]) => {
            const active = book === key;
            return (
              <Button
                key={key}
                title={label}
                variant={active ? 'primary' : 'secondary'}
                onPress={() => setBook(key)}
                className="min-h-[40px] flex-1 px-2"
              />
            );
          })}
        </View>
      ) : null}

      {canAdd ? (
        <Button title={t('addAnimal')} onPress={() => router.push('/(app)/cattle/new')} className="mb-4" />
      ) : null}

      <ScrollView
        contentContainerClassName="gap-3 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={herdQuery.isRefetching} onRefresh={() => herdQuery.refetch()} />
        }>
        {herdQuery.isLoading ? <LoadingBlock /> : null}
        {herdQuery.isError ? (
          <EmptyState
            title={t('noCattle')}
            subtitle={herdQuery.error instanceof Error ? herdQuery.error.message : undefined}
          />
        ) : null}

        {animals.map((cow) => {
          const fattening = isFatteningAnimal(cow.purpose);
          const gain = weightGain(cow.entryWeight, cow.currentWeight);
          const subtitleLine = fattening
            ? `${cow.breed} · ${t('entryKg')} ${formatNumber(cow.entryWeight)} kg · ${t('nowKg')} ${formatNumber(cow.currentWeight)} kg${
                gain != null ? ` · ${gain >= 0 ? '+' : ''}${gain} kg` : ''
              }`
            : `${cow.breed} · ${cow.gender === 'female' ? t('female') : t('male')}${
                cow.pregnancyStatus ? ` · ${cow.pregnancyStatus}` : ''
              }`;

          return (
            <Card key={cow._id} onPress={() => router.push(`/(app)/cattle/${cow._id}`)}>
              <ListRow
                title={cow.animalId}
                subtitle={subtitleLine}
                right={
                  <View className="items-end gap-2">
                    <Badge
                      label={fattening ? t('fattenAnimal') : t('dairyAnimal')}
                      tone={fattening ? 'warning' : 'success'}
                    />
                    <Ionicons name="chevron-forward" size={16} color="#5C7266" />
                  </View>
                }
              />
            </Card>
          );
        })}

        {!herdQuery.isLoading && !herdQuery.isError && animals.length === 0 ? (
          <EmptyState title={t('noCattle')} subtitle={canAdd ? emptyHint : t('noPermissionCattle')} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export function animalPurposeForFarm(logic: ReturnType<typeof cattleLogic>, chosen: CowPurpose): 'dairy' | 'beef' {
  if (logic === 'beef') return 'beef';
  if (logic === 'dairy') return 'dairy';
  return chosen === 'beef' ? 'beef' : 'dairy';
}
