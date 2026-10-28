import { useDesktopWeb, WebLivestock } from '@/components/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { domainApi, organizationApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { bdt, fullDate, num } from '@/components/dashboard/format';
import { Icon } from '@/components/dashboard/icons';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import {
  CheckChips,
  EmptyCard,
  FieldLabel,
  MButton,
  MDateField,
  MField,
  MScreen,
  MSelect,
  NavHeader,
  Notice,
  Stepper,
  Tx,
} from '@/components/mobile/kit';
import { canWritePoultry } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function NewPoultryBatchScreen() {
  const { c, lang } = useM();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const allowed = canWritePoultry(user?.role);

  const birdTypes = [
    { key: 'broiler', label: c.broiler },
    { key: 'layer', label: c.layer },
    { key: 'sonali', label: c.sonali },
    { key: 'duck', label: c.duck },
    { key: 'mixed', label: c.mixed },
  ];

  const farmsQuery = useQuery({
    queryKey: ['farms'],
    queryFn: () => organizationApi.listFarms(),
  });

  const poultryFarms = useMemo(
    () => (farmsQuery.data?.data ?? []).filter((f) => f.farmType === 'poultry' || !f.farmType),
    [farmsQuery.data]
  );

  const [farmId, setFarmId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [birdType, setBirdType] = useState(
    organization?.poultryPurpose && organization.poultryPurpose !== 'breeding'
      ? String(organization.poultryPurpose)
      : 'broiler'
  );
  const [purchaseDate, setPurchaseDate] = useState(todayInput());
  const [initialQuantity, setInitialQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [error, setError] = useState('');

  const selectedFarmId = farmId || poultryFarms[0]?._id || '';

  const chickTotal = useMemo(() => {
    const qty = Number(initialQuantity);
    const price = Number(unitPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
    return qty * price;
  }, [initialQuantity, unitPrice]);

  const createMutation = useMutation({
    mutationFn: domainApi.createPoultryBatch,
    onSuccess: async (batch) => {
      await queryClient.invalidateQueries({ queryKey: ['poultry-batches'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['costs'] });
      router.replace(`/(app)/poultry/${batch._id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const onSubmit = () => {
    setError('');
    if (!allowed) {
      setError(c.noPermissionBatch);
      return;
    }
    if (!selectedFarmId) {
      setError(c.selectFarm);
      return;
    }
    if (!batchName.trim()) {
      setError(c.enterBatchName);
      return;
    }
    const qty = Number(initialQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(c.qtyPositive);
      return;
    }
    const price = Number(unitPrice);
    if (!Number.isFinite(price) || price < 0 || unitPrice.trim() === '') {
      setError(c.priceRequired);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      setError(c.dateFormat);
      return;
    }

    createMutation.mutate({
      farmId: selectedFarmId,
      batchName: batchName.trim(),
      birdType,
      purchaseDate: new Date(purchaseDate).toISOString(),
      initialQuantity: Math.floor(qty),
      unitPrice: price,
    });
  };

  const header = <NavHeader title={c.newBatch} />;

  if (!allowed) {
    return (
      <MScreen header={header}>
        <EmptyCard icon="lock" title={c.noPermissionBatch} />
      </MScreen>
    );
  }

  const now = new Date();
  const namePlaceholder = `Batch-${now.toLocaleString('en', { month: 'short' })}-${now.getFullYear()}`;

  return (
    <MScreen header={header} gap={18}>
      <View>
        <Tx s={28} w="800" style={{ letterSpacing: -0.8, lineHeight: 34 }}>{c.placeFlock}</Tx>
        <Tx s={14} w="500" color={C.sub} style={{ marginTop: 6 }}>{c.chickCostSaved}</Tx>
      </View>

      <MSelect
        label={c.farm}
        title={c.farm}
        icon="barn"
        value={selectedFarmId}
        placeholder={c.selectFarm}
        options={poultryFarms.map((f) => ({ value: f._id, label: [f.name, f.district].filter(Boolean).join(' · '), icon: 'barn' as const }))}
        onChange={setFarmId}
      />

      <MField label={c.batchName} icon="pencil" value={batchName} onChangeText={setBatchName} placeholder={namePlaceholder} />

      <View>
        <FieldLabel label={c.birdType} />
        <CheckChips value={birdType} options={birdTypes} onChange={setBirdType} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stepper label={c.initialQty} value={initialQuantity} onChange={setInitialQuantity} step={100} style={{ flex: 1 }} />
        <MField label={c.pricePerChick} prefix="৳" value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" placeholder="45" style={{ flex: 1 }} />
      </View>

      <MDateField
        label={c.purchaseDate}
        value={purchaseDate}
        onChange={setPurchaseDate}
        format={(iso) => fullDate(iso, lang)}
        labels={{ today: c.today, yesterday: c.yesterday, daysAgo: c.daysAgo, exact: c.exactDate }}
      />

      <View style={{ backgroundColor: C.limeSoft, borderWidth: 1, borderColor: '#A9D35A', borderRadius: 22, padding: 19, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tx s={13} w="700" color={C.padma}>{c.chickTotal}</Tx>
          <Icon name="receipt" size={18} color={C.padma} />
        </View>
        <Tx s={30} w="800" tabular style={{ letterSpacing: -1, marginTop: 6 }}>{bdt(chickTotal)}</Tx>
        <Tx s={12} w="500" color={C.sub} style={{ marginTop: 2 }}>
          {c.chickTotalSub(num(Number(initialQuantity) || 0), bdt(Number(unitPrice) || 0))}
        </Tx>
      </View>

      <Notice message={error} />

      <MButton label={c.createBatch} icon="check" kind="dark" onPress={onSubmit} loading={createMutation.isPending} />
    </MScreen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebLivestock openNew /> : <NewPoultryBatchScreen />;
}
