import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { domainApi, organizationApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import {
  AppText,
  Button,
  FormBackHeader,
  OptionChips,
  Screen,
  TextField,
} from '@/components/ui/primitives';
import { animalPurposeForFarm } from '@/components/cattle-herd';
import { formatBdt } from '@/lib/format';
import { cattleLogic } from '@/lib/cattle';
import { canWriteCattle } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewCattleScreen() {
  const { t } = useLocale();
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

  const hint =
    logic === 'beef' ? t('addAnimalHintFatten') : logic === 'mixed' ? t('addAnimalHintBoth') : t('addAnimalHintDairy');

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
      setError(t('noPermissionCattle'));
      return;
    }
    if (!selectedFarmId) {
      setError(t('selectFarm'));
      return;
    }
    if (!animalId.trim()) {
      setError(t('tagRequired'));
      return;
    }
    if (!breed.trim()) {
      setError(t('breedRequired'));
      return;
    }
    const weight = Number(entryWeight);
    if (fattening && (!Number.isFinite(weight) || weight <= 0)) {
      setError(t('weightRequired'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setError(t('dateFormat'));
      return;
    }
    const price = purchasePrice.trim() === '' ? undefined : Number(purchasePrice);
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      setError(t('priceInvalid'));
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

  if (!allowed) {
    return (
      <Screen>
        <FormBackHeader title={t('addAnimalTitle')} onBack={() => router.back()} />
        <AppText variant="body">{t('noPermissionCattle')}</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FormBackHeader title={t('addAnimalTitle')} onBack={() => router.back()} />
        <AppText variant="caption" className="mb-5">
          {hint}
        </AppText>

        <ScrollView
          contentContainerClassName="gap-4 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <OptionChips
            label={t('farm')}
            value={selectedFarmId}
            options={cattleFarms.map((farm) => ({ value: farm._id, label: farm.name }))}
            onChange={setFarmId}
          />

          {logic === 'mixed' ? (
            <OptionChips
              label={t('animalLogic')}
              value={animalLogic}
              options={[
                { value: 'dairy', label: t('dairyAnimal') },
                { value: 'beef', label: t('fattenAnimal') },
              ]}
              onChange={(value) => {
                const next = value === 'beef' ? 'beef' : 'dairy';
                setAnimalLogic(next);
                setGender(next === 'beef' ? 'male' : 'female');
              }}
            />
          ) : (
            <AppText variant="caption">{t('purposeLocked')}</AppText>
          )}

          <TextField
            label={t('animalTag')}
            value={animalId}
            onChangeText={setAnimalId}
            placeholder={fattening ? 'B-12' : 'C-04'}
            autoCapitalize="characters"
          />
          <TextField
            label={t('breed')}
            value={breed}
            onChangeText={setBreed}
            placeholder={fattening ? 'Local cross' : 'Holstein cross'}
          />
          <OptionChips
            label={t('gender')}
            value={gender}
            options={[
              { value: 'female', label: t('female') },
              { value: 'male', label: t('male') },
            ]}
            onChange={(value) => setGender(value === 'male' ? 'male' : 'female')}
          />

          {fattening ? (
            <TextField
              label={t('entryWeight')}
              value={entryWeight}
              onChangeText={setEntryWeight}
              keyboardType="decimal-pad"
              placeholder="180"
            />
          ) : null}

          <View className="flex-row gap-3">
            <TextField
              label={t('purchaseDate')}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              autoCapitalize="none"
              className="flex-1"
            />
            <TextField
              label={t('purchasePrice')}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="decimal-pad"
              placeholder="85000"
              className="flex-1"
            />
          </View>

          {purchasePrice.trim() ? (
            <AppText variant="subtitle" className="text-padma">
              {t('purchasePrice')}: {formatBdt(Number(purchasePrice) || 0)}
            </AppText>
          ) : null}

          {error ? (
            <AppText variant="caption" className="text-danger">
              {error}
            </AppText>
          ) : null}

          <Button title={t('createAnimal')} onPress={onSubmit} loading={createMutation.isPending} className="mt-2" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
