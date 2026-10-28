import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { domainApi } from '@/api';
import { Ring } from '@/components/dashboard/charts';
import { fullDate, num, pct } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { EmptyCard, Loading, MButton, MCard, MChips, MetricBox, MPill, Notice, SearchField, ToneTile, Tx } from '@/components/mobile/kit';
import { cattleLogic, isFatteningAnimal, weightGain } from '@/lib/cattle';
import { canWriteCattle } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { CowPurpose } from '@/types/api';

type Book = 'all' | 'dairy' | 'beef';

/** Dairy tab body of the Livestock screen. */
export function CattleHerd() {
  const { c, lang } = useM();
  const { user, organization } = useAuth();
  const logic = cattleLogic(organization?.cowPurpose);
  const canAdd = canWriteCattle(user?.role);
  const [book, setBook] = useState<Book>('all');
  const [q, setQ] = useState('');

  const herdQuery = useQuery({
    queryKey: ['cows'],
    queryFn: () => domainApi.listCows(),
  });

  const rows = useMemo(() => herdQuery.data?.data ?? [], [herdQuery.data]);
  const animals = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((cow) => (logic !== 'mixed' || book === 'all' ? true : book === 'beef' ? isFatteningAnimal(cow.purpose) : !isFatteningAnimal(cow.purpose)))
      .filter((cow) => !needle || `${cow.animalId} ${cow.breed}`.toLowerCase().includes(needle));
  }, [rows, logic, book, q]);

  const females = rows.filter((cow) => cow.gender === 'female' && !isFatteningAnimal(cow.purpose));
  const lactating = females.filter((cow) => (cow.status ?? '').toLowerCase() === 'lactating' || !cow.status).length;
  const pregnant = rows.filter((cow) => (cow.pregnancyStatus ?? '').toLowerCase().includes('preg')).length;
  const weighed = rows.filter((cow) => cow.currentWeight);
  const avgWeight = weighed.length ? weighed.reduce((s, cow) => s + Number(cow.currentWeight), 0) / weighed.length : 0;
  const share = rows.length ? (logic === 'beef' ? (weighed.length / rows.length) * 100 : (lactating / Math.max(1, females.length)) * 100) : 0;

  return (
    <>
      <MCard dark pad={18}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -2, right: -40, width: 170, height: 170, borderRadius: 85, backgroundColor: C.forest2 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Ring size={72} pct={share} color={C.lime} track={C.forest3} sw={8}>
            <Tx s={15} w="800" color={C.white}>{pct(share, 0)}</Tx>
          </Ring>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Tx s={11} w="700" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{c.herdTotal}</Tx>
            <Tx s={30} w="800" color={C.white} tabular style={{ letterSpacing: -1, lineHeight: 36 }}>{num(rows.length)}</Tx>
            <Tx s={12} color="rgba(255,255,255,0.65)" lines={1}>{logic === 'beef' ? c.ofHerdFatten(`${num(avgWeight)} kg`) : c.ofHerd(lactating, pregnant)}</Tx>
          </View>
        </View>
      </MCard>

      <SearchField value={q} onChange={setQ} placeholder={c.searchAnimal} />

      {logic === 'mixed' ? (
        <MChips
          value={book}
          onChange={setBook}
          options={[
            { key: 'all', label: c.allAnimals },
            { key: 'dairy', label: c.dairyBook },
            { key: 'beef', label: c.fattenBook },
          ]}
        />
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tx s={17} w="700" style={{ letterSpacing: -0.3 }}>{c.activeN(animals.length)}</Tx>
      </View>

      {herdQuery.isLoading ? <Loading /> : null}
      <Notice message={herdQuery.isError ? (herdQuery.error instanceof Error ? herdQuery.error.message : c.couldNotLoad) : null} />

      {animals.map((cow) => {
        const fattening = isFatteningAnimal(cow.purpose);
        const gain = weightGain(cow.entryWeight, cow.currentWeight);
        return (
          <MCard key={cow._id} pad={17} onPress={() => router.push(`/(app)/cattle/${cow._id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ToneTile icon={fattening ? 'scale' : 'milk'} tone={fattening ? 'gold' : 'sky'} size={46} radius={15} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Tx s={15} w="700" lines={1} style={{ flexShrink: 1 }}>{cow.animalId}</Tx>
                  <MPill label={fattening ? c.fattenAnimal : c.dairyAnimal} tone={fattening ? 'gold' : 'green'} />
                </View>
                <Tx s={12} color={C.sub} lines={1} style={{ marginTop: 3 }}>
                  {[cow.breed, cow.gender === 'female' ? c.female : c.male, cow.purchaseDate ? c.arrivedOnly(fullDate(cow.purchaseDate, lang)) : null].filter(Boolean).join(' · ')}
                </Tx>
              </View>
              <Icon name="right" size={18} color={C.faint} sw={1.5} />
            </View>
            <MetricBox
              style={{ marginTop: 14 }}
              items={
                fattening
                  ? [
                      { label: c.entryKg, value: cow.entryWeight != null ? `${num(cow.entryWeight)} kg` : '—' },
                      { label: c.nowKg, value: cow.currentWeight != null ? `${num(cow.currentWeight)} kg` : '—' },
                      { label: c.gain, value: gain == null ? '—' : `${gain >= 0 ? '+' : ''}${gain} kg`, color: gain != null && gain < 0 ? C.coral : C.padma },
                    ]
                  : [
                      { label: c.status, value: cow.status ? cow.status.charAt(0).toUpperCase() + cow.status.slice(1) : '—' },
                      { label: c.pregnant, value: cow.pregnancyStatus ?? '—' },
                      { label: c.purchasePrice, value: cow.purchasePrice != null ? `৳${num(cow.purchasePrice)}` : '—' },
                    ]
              }
            />
          </MCard>
        );
      })}

      {!herdQuery.isLoading && !herdQuery.isError && animals.length === 0 ? (
        <EmptyCard
          icon="milk"
          title={rows.length ? c.noMatch : c.noCattle}
          sub={canAdd ? c.noCattleHint : c.noPermissionCattle}
          action={canAdd && !rows.length ? <MButton label={c.addAnimal} icon="plus" kind="lime" onPress={() => router.push('/(app)/cattle/new')} /> : undefined}
        />
      ) : null}
    </>
  );
}

export function animalPurposeForFarm(logic: ReturnType<typeof cattleLogic>, chosen: CowPurpose): 'dairy' | 'beef' {
  if (logic === 'beef') return 'beef';
  if (logic === 'dairy') return 'dairy';
  return chosen === 'beef' ? 'beef' : 'dairy';
}
