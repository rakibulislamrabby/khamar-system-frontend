import { useDesktopWeb, WebOrganization } from '@/components/dashboard';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { organizationApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { DISTRICTS } from '@/components/dashboard/copy';
import { useFarms, useOrg, useRefreshAll, useUsers } from '@/components/dashboard/data';
import { titleCase } from '@/components/dashboard/format';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { useToast } from '@/components/dashboard/kit';
import { C } from '@/components/dashboard/theme';
import { useM } from '@/components/mobile/copy';
import { CircleBtn, EmptyCard, ListCard, Loading, MButton, MField, MPill, MScreen, MSelect, NavHeader, Notice, Tx } from '@/components/mobile/kit';
import { Contours } from '@/components/web-landing/graphics';
import { isOwnerFirm } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { CowPurpose, MobileBanking, Organization, PoultryPurpose } from '@/types/api';

type Form = Record<
  'name' | 'ownerName' | 'purpose' | 'established' | 'phone' | 'address' | 'district' | 'upazila' | 'tradeLicense' | 'tinNumber' | 'binVatNumber' | 'bankName' | 'accountNumber' | 'mbProvider' | 'mbNumber',
  string
>;

function toForm(o?: Organization | null): Form {
  return {
    name: o?.name ?? '',
    ownerName: o?.ownerName ?? '',
    purpose: (o?.farmType === 'cow' ? o?.cowPurpose : o?.poultryPurpose) ?? '',
    established: o?.establishedDate ? String(new Date(o.establishedDate).getFullYear()) : '',
    phone: o?.phone ?? '',
    address: o?.address ?? '',
    district: o?.district ?? '',
    upazila: o?.upazila ?? '',
    tradeLicense: o?.tradeLicense ?? '',
    tinNumber: o?.tinNumber ?? '',
    binVatNumber: o?.binVatNumber ?? '',
    bankName: o?.bankInfo?.bankName ?? '',
    accountNumber: o?.bankInfo?.accountNumber ?? '',
    mbProvider: o?.mobileBanking?.provider ?? '',
    mbNumber: o?.mobileBanking?.accountNumber ?? '',
  };
}

function OrganizationScreen() {
  const { c } = useM();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const refresh = useRefreshAll();
  const query = useOrg();
  const farmsQ = useFarms();
  const canEdit = isOwnerFirm(user?.role);
  const usersQ = useUsers(canEdit);
  const org = query.data;
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<Form>(toForm(org));
  const [error, setError] = useState('');
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const cow = org?.farmType === 'cow';

  useEffect(() => {
    if (!editing) setF(toForm(org));
  }, [org, editing]);

  const save = useMutation({
    mutationFn: () => {
      const year = Number(f.established);
      return organizationApi.update({
        name: f.name.trim(),
        ownerName: f.ownerName.trim(),
        phone: f.phone.trim(),
        address: f.address.trim(),
        district: f.district,
        upazila: f.upazila.trim(),
        establishedDate: year > 1900 && year <= new Date().getFullYear() ? `${year}-01-01` : undefined,
        ...(cow ? { cowPurpose: (f.purpose || undefined) as CowPurpose | undefined } : { poultryPurpose: (f.purpose || undefined) as PoultryPurpose | undefined }),
        tradeLicense: f.tradeLicense.trim(),
        tinNumber: f.tinNumber.trim(),
        binVatNumber: f.binVatNumber.trim(),
        bankInfo: { ...org?.bankInfo, bankName: f.bankName.trim(), accountNumber: f.accountNumber.trim() },
        mobileBanking: f.mbProvider ? { provider: f.mbProvider as MobileBanking['provider'], accountNumber: f.mbNumber.trim() } : undefined,
      });
    },
    onSuccess: async () => {
      await Promise.all([refresh('organization'), refreshProfile()]);
      toast(c.orgSaved);
      setEditing(false);
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const submit = () => {
    setError('');
    if (f.name.trim().length < 2 || f.ownerName.trim().length < 2) return setError(c.nameOwnerRequired);
    save.mutate();
  };

  const purposes = cow
    ? [
        { value: 'dairy', label: c.dairyP },
        { value: 'beef', label: c.beef },
        { value: 'breeding', label: c.breeding },
        { value: 'mixed', label: c.mixed },
      ]
    : [
        { value: 'broiler', label: c.broiler },
        { value: 'layer', label: c.layer },
        { value: 'breeding', label: c.breeding },
        { value: 'mixed', label: c.mixed },
      ];

  const header = (
    <NavHeader
      title={editing ? c.editOrg : c.organization}
      right={canEdit && org && !editing ? <CircleBtn icon="pencil" label={c.editOrg} onPress={() => setEditing(true)} /> : undefined}
      onBack={editing ? () => setEditing(false) : undefined}
    />
  );

  if (query.isLoading) {
    return (
      <MScreen header={header}>
        <Loading />
      </MScreen>
    );
  }
  if (!org) {
    return (
      <MScreen header={header}>
        <EmptyCard icon="briefcase" title={c.organization} sub={query.error instanceof Error ? query.error.message : undefined} />
      </MScreen>
    );
  }

  if (editing) {
    return (
      <MScreen
        header={header}
        footer={
          <>
            <MButton label={c.cancel} kind="outline" onPress={() => setEditing(false)} style={{ width: 120 }} />
            <MButton label={c.saveChanges} icon="check" kind="lime" loading={save.isPending} onPress={submit} style={{ flex: 1 }} />
          </>
        }>
        <MField label={c.orgName} value={f.name} onChangeText={set('name')} />
        <MField label={c.ownerName} value={f.ownerName} onChangeText={set('ownerName')} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MSelect label={c.purpose} title={c.purpose} value={f.purpose} options={purposes} onChange={set('purpose')} style={{ flex: 1 }} />
          <MField label={c.estYearField} value={f.established} onChangeText={set('established')} keyboardType="number-pad" placeholder="2019" style={{ flex: 1 }} />
        </View>
        <Tx s={11} w="700" color={C.sub} style={{ letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 8 }}>{c.contact}</Tx>
        <MField label={c.phone} icon="phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <MField label={c.address} icon="pin" value={f.address} onChangeText={set('address')} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MSelect label={c.district} title={c.district} value={f.district} options={DISTRICTS.map((d) => ({ value: d, label: d }))} onChange={set('district')} style={{ flex: 1 }} />
          <MField label={c.upazila} value={f.upazila} onChangeText={set('upazila')} style={{ flex: 1 }} />
        </View>
        <Tx s={11} w="700" color={C.sub} style={{ letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 8 }}>{c.legal}</Tx>
        <MField label={c.tradeLicense} value={f.tradeLicense} onChangeText={set('tradeLicense')} autoCapitalize="none" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MField label={c.tin} value={f.tinNumber} onChangeText={set('tinNumber')} style={{ flex: 1 }} />
          <MField label={c.binVat} value={f.binVatNumber} onChangeText={set('binVatNumber')} style={{ flex: 1 }} />
        </View>
        <Tx s={11} w="700" color={C.sub} style={{ letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 8 }}>{c.payments}</Tx>
        <MField label={c.bankName} value={f.bankName} onChangeText={set('bankName')} />
        <MField label={c.bankAccount} value={f.accountNumber} onChangeText={set('accountNumber')} keyboardType="number-pad" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MSelect
            label={c.provider}
            title={c.provider}
            value={f.mbProvider}
            options={[
              { value: '', label: '—' },
              { value: 'bkash', label: 'bKash' },
              { value: 'nagad', label: 'Nagad' },
              { value: 'rocket', label: 'Rocket' },
              { value: 'other', label: c.other },
            ]}
            onChange={set('mbProvider')}
            style={{ flex: 1 }}
          />
          <MField label={c.mbNumber} value={f.mbNumber} onChangeText={set('mbNumber')} keyboardType="phone-pad" style={{ flex: 1.3 }} />
        </View>
        <Notice message={error} />
      </MScreen>
    );
  }

  const farms = farmsQ.data ?? [];
  const types = new Set(farms.map((x) => x.farmType));
  const typeLabel = types.has('poultry') && types.has('cow') ? c.poultryAndDairy : cow ? c.dairy : c.poultry;
  const purposeLabel = purposes.find((p) => p.value === toForm(org).purpose)?.label;
  const year = org.establishedDate ? new Date(org.establishedDate).getFullYear() : null;
  const acct = org.bankInfo?.accountNumber;
  const members = usersQ.data?.length;
  const role = user?.role ? (c.roles as Record<string, string>)[user.role] ?? titleCase(user.role) : null;

  return (
    <MScreen header={header} refreshing={query.isRefetching} onRefresh={() => { query.refetch(); farmsQ.refetch(); }}>
      <View style={{ backgroundColor: C.white, borderRadius: 28, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
        <View style={{ height: 86, backgroundColor: C.forest, overflow: 'hidden' }}>
          <Contours w={350} h={86} />
        </View>
        <View style={{ paddingHorizontal: 23, paddingBottom: 22 }}>
          <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: C.white, padding: 5, marginTop: -34 }}>
            <View style={{ flex: 1, borderRadius: 21, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="leaf" size={36} color={C.forest} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Tx s={22} w="700" lines={1} style={{ letterSpacing: -0.5, flexShrink: 1 }}>{org.name}</Tx>
            {org.tradeLicense ? <Icon name="shield" size={18} color={C.emerald} /> : null}
          </View>
          <Tx s={13} w="500" color={C.sub} style={{ marginTop: 2 }}>{[typeLabel, purposeLabel, year ? c.estYear(year) : null].filter(Boolean).join(' · ')}</Tx>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <MPill label={c.farmsCount(farms.length)} />
            {members != null ? <MPill label={c.teamMembers(members)} tone="gray" /> : null}
            {role ? <MPill label={role} tone="dark" /> : null}
          </View>
        </View>
      </View>

      <Group title={c.contact}>
        <InfoRow icon="phone" label={c.phone} value={org.phone} empty={c.notSet} />
        <InfoRow icon="mail" label={c.email} value={org.email} empty={c.notSet} />
        <InfoRow icon="pin" label={c.address} value={org.address || org.location || [org.upazila, org.district].filter(Boolean).join(', ')} empty={c.notSet} />
      </Group>

      <Group title={c.legal}>
        <InfoRow icon="file" label={c.tradeLicense} value={org.tradeLicense} empty={c.notSet} />
        <InfoRow icon="receipt" label={c.tin} value={org.tinNumber} empty={c.notSet} />
        <InfoRow icon="shield" label={c.binVat} value={org.binVatNumber} empty={c.notSet} />
      </Group>

      <Group title={c.payments}>
        <InfoRow
          icon="briefcase"
          label={c.bankName}
          value={org.bankInfo?.bankName ? [org.bankInfo.bankName, acct ? `A/C ****${acct.slice(-4)}` : null].filter(Boolean).join(' · ') : null}
          empty={c.notSet}
        />
        <InfoRow
          icon="wallet"
          label={c.mobileBanking}
          value={org.mobileBanking?.provider ? [titleCase(org.mobileBanking.provider), org.mobileBanking.accountNumber].filter(Boolean).join(' · ') : null}
          empty={c.notSet}
        />
      </Group>
    </MScreen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <Tx s={11} w="700" color={C.sub} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>{title}</Tx>
      <ListCard>{children}</ListCard>
    </View>
  );
}

function InfoRow({ icon, label, value, empty }: { icon: IconName; label: string; value?: string | null; empty: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 17, paddingVertical: 13 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color={C.padma} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Tx s={12} w="500" color={C.sub}>{label}</Tx>
        <Tx s={14} w="600" color={value ? C.ink : C.faint} style={{ marginTop: 1 }}>{value || empty}</Tx>
      </View>
    </View>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebOrganization /> : <OrganizationScreen />;
}
