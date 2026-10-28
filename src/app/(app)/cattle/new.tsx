import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { domainApi, organizationApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { animalPurposeForFarm } from '@/components/cattle-herd';
import { bdt, fullDate } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { CheckChips, EmptyCard, FieldLabel, MButton, MDateField, MField, MScreen, MSegmented, MSelect, NavHeader, Notice, Tx } from '@/components/mobile/kit';
import { cattleLogic } from '@/lib/cattle';
import { canWriteCattle } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewCattleScreen() {
  const { c, lang } = useM();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const allowed = canWriteCattle(user?.role);
  const logic = cattleLogic(organization?.cowPurpose);

  const farmsQuery = useQuery({
    queryKey: ['farms'],
    queryFn: () => organizationApi.listFarms(),
  });

  const cattleFarms = useMemo(
    () => (farmsQuery.data?.data ?? []).filter((farm) => farm.farmType === 'cow' || !farm.farmType),
    [farmsQuery.data]
  );

  const [farmId, setFarmId] = useState('');
  const [animalLogic, setAnimalLogic] = useState<'dairy' | 'beef'>(logic === 'beef' ? 'beef' : 'dairy');
  const [animalId, setAnimalId] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>(logic === 'beef' ? 'male' : 'female');
  const [purchaseDate, setPurchaseDate] = useState(todayInput());
  const [purchasePrice, setPurchasePrice] = useState('');
  const [entryWeight, setEntryWeight] = useState('');
  const [error, setError] = useState('');

  const selectedFarmId = farmId || cattleFarms[0]?._id || '';
  const purpose = animalPurposeForFarm(logic, animalLogic);
  const fattening = purpose === 'beef';

  const hint = logic === 'beef' ? c.addAnimalHintFatten : logic === 'mixed' ? c.addAnimalHintBoth : c.addAnimalHintDairy;

  const createMutation = useMutation({
    mutationFn: domainApi.createCow,
    onSuccess: async (cow) => {
      await queryClient.invalidateQueries({ queryKey: ['cows'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['costs'] });
      router.replace(`/(app)/cattle/${cow._id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const onSubmit = () => {
    setError('');
    if (!allowed) {
      setError(c.noPermissionCattle);
      return;
    }
    if (!selectedFarmId) {
      setError(c.selectFarm);
      return;
    }
    if (!animalId.trim()) {
      setError(c.tagRequired);
      return;
    }
    if (!breed.trim()) {
      setError(c.breedRequired);
      return;
    }
    const weight = Number(entryWeight);
    if (fattening && (!Number.isFinite(weight) || weight <= 0)) {
      setError(c.weightRequired);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setError(c.dateFormat);
      return;
    }
    const price = purchasePrice.trim() === '' ? undefined : Number(purchasePrice);
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      setError(c.priceInvalid);
      return;
    }

    createMutation.mutate({
      farmId: selectedFarmId,
      animalId: animalId.trim(),
      breed: breed.trim(),
      gender,
      purpose,
      purchaseDate: new Date(purchaseDate).toISOString(),
      purchasePrice: price,
      entryWeight: fattening ? weight : undefined,
      currentWeight: fattening ? weight : undefined,
    });
  };

  const header = <NavHeader title={c.addAnimal} />;

  if (!allowed) {
    return (
      <MScreen header={header}>
        <EmptyCard icon="lock" title={c.noPermissionCattle} />
      </MScreen>
    );
  }

  return (
    <MScreen header={header} gap={18}>
      <View>
        <Tx s={28} w="800" style={{ letterSpacing: -0.8, lineHeight: 34 }}>{c.addAnimalTitle}</Tx>
        <Tx s={14} w="500" color={C.sub} style={{ marginTop: 6 }}>{hint}</Tx>
      </View>

      <MSelect
        label={c.farm}
        title={c.farm}
        icon="barn"
        value={selectedFarmId}
        placeholder={c.selectFarm}
        options={cattleFarms.map((f) => ({ value: f._id, label: [f.name, f.district].filter(Boolean).join(' · '), icon: 'barn' as const }))}
        onChange={setFarmId}
      />

      {logic === 'mixed' ? (
        <View>
          <FieldLabel label={c.animalLogic} />
          <MSegmented
            value={animalLogic}
            options={[
              { key: 'dairy', label: c.dairyAnimal },
              { key: 'beef', label: c.fattenAnimal },
            ]}
            onChange={(next) => {
              setAnimalLogic(next);
              setGender(next === 'beef' ? 'male' : 'female');
            }}
          />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.mint, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
          <Icon name="lock" size={15} color={C.padma} />
          <Tx s={13} w="600" color={C.padma} style={{ flex: 1 }}>{`${fattening ? c.fattenAnimal : c.dairyAnimal} · ${c.purposeLocked}`}</Tx>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <MField label={c.animalTag} icon="tag" value={animalId} onChangeText={setAnimalId} placeholder={fattening ? 'B-12' : 'C-04'} autoCapitalize="none" style={{ flex: 1 }} />
        <MField label={c.breed} value={breed} onChangeText={setBreed} placeholder={fattening ? 'Local cross' : 'Holstein cross'} style={{ flex: 1 }} />
      </View>

      <View>
        <FieldLabel label={c.gender} />
        <CheckChips
          value={gender}
          options={[
            { key: 'female', label: c.female },
            { key: 'male', label: c.male },
          ]}
          onChange={setGender}
        />
      </View>

      {fattening ? <MField label={c.entryWeight} icon="scale" value={entryWeight} onChangeText={setEntryWeight} keyboardType="decimal-pad" placeholder="180" suffix="kg" /> : null}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <MDateField
          label={c.purchaseDate}
          value={purchaseDate}
          onChange={setPurchaseDate}
          format={(iso) => fullDate(iso, lang)}
          labels={{ today: c.today, yesterday: c.yesterday, daysAgo: c.daysAgo, exact: c.exactDate }}
          style={{ flex: 1 }}
        />
        <MField label={c.purchasePrice} optional={c.optional} prefix="৳" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="85000" style={{ flex: 1 }} />
      </View>

      {purchasePrice.trim() ? (
        <View style={{ backgroundColor: C.limeSoft, borderWidth: 1, borderColor: '#A9D35A', borderRadius: 22, padding: 19 }}>
          <Tx s={13} w="700" color={C.padma}>{c.purchasePrice}</Tx>
          <Tx s={30} w="800" tabular style={{ letterSpacing: -1, marginTop: 6 }}>{bdt(Number(purchasePrice) || 0)}</Tx>
        </View>
      ) : null}

      <Notice message={error} />

      <MButton label={c.createAnimal} icon="check" kind="dark" onPress={onSubmit} loading={createMutation.isPending} />
    </MScreen>
  );
}
