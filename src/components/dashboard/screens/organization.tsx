import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Image, Platform, View } from 'react-native';

import { organizationApi } from '@/api';
import { getApiErrorMessage } from '@/api/client';
import { Ring } from '@/components/dashboard/charts';
import { DISTRICTS } from '@/components/dashboard/copy';
import { useFarms, useOrg, useRefreshAll, useUsers } from '@/components/dashboard/data';
import { Icon, type IconName } from '@/components/dashboard/icons';
import { Btn, Card, ErrorNote, Field, Pill, Select, Tx, useToast } from '@/components/dashboard/kit';
import { LoadingPage, Page, PageTop, useContentWidth, useDash } from '@/components/dashboard/shell';
import { C } from '@/components/dashboard/theme';
import { Contours, LogoMark } from '@/components/web-landing/graphics';
import { isOwnerFirm } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import type { CowPurpose, MobileBanking, Organization, PoultryPurpose } from '@/types/api';

type Form = {
  name: string;
  ownerName: string;
  purpose: string;
  established: string;
  phone: string;
  address: string;
  district: string;
  upazila: string;
  tradeLicense: string;
  tinNumber: string;
  binVatNumber: string;
  bankName: string;
  accountNumber: string;
  mbProvider: string;
  mbNumber: string;
  logo: string;
};

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
    logo: o?.logo ?? '',
  };
}

export function WebOrganization() {
  const { c } = useDash();
  const { user, refreshProfile } = useAuth();
  const width = useContentWidth();
  const wide = width >= 1000;
  const toast = useToast();
  const refresh = useRefreshAll();
  const orgQ = useOrg();
  const farmsQ = useFarms();
  const canEdit = isOwnerFirm(user?.role);
  const usersQ = useUsers(canEdit);
  const org = orgQ.data;
  const [f, setF] = useState<Form>(toForm(org));
  const [error, setError] = useState('');

  useEffect(() => {
    setF(toForm(org));
  }, [org]);

  const initial = useMemo(() => toForm(org), [org]);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const cow = org?.farmType === 'cow';

  const filled = [f.name, f.ownerName, f.purpose, f.established, f.phone, f.address, f.district, f.upazila, f.tradeLicense, f.tinNumber, f.binVatNumber, f.bankName, f.accountNumber, f.mbNumber, f.logo];
  const completeness = Math.round((filled.filter((x) => x.trim()).length / filled.length) * 100);

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
        logo: f.logo.trim() || undefined,
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
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const submit = () => {
    setError('');
    if (f.name.trim().length < 2 || f.ownerName.trim().length < 2) return setError(`${c.orgName} / ${c.ownerName}`);
    save.mutate();
  };

  const changeLogo = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const url = window.prompt(c.logoPrompt, f.logo);
    if (url != null) set('logo')(url.trim());
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
  const purposeLabel = purposes.find((p) => p.value === f.purpose)?.label;

  const top = (
    <PageTop
      crumbs={[c.account, c.organization]}
      title={c.orgProfile}
      actions={
        canEdit ? (
          <>
            <Btn label={c.discard} disabled={!dirty || save.isPending} onPress={() => { setF(initial); setError(''); }} />
            <Btn label={c.saveChanges} icon="check" kind="lime" disabled={!dirty} loading={save.isPending} onPress={submit} />
          </>
        ) : null
      }
    />
  );

  if (orgQ.isLoading) return <LoadingPage top={top} />;

  const ro = !canEdit;
  return (
    <Page top={top}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ width: wide ? 300 : '100%', gap: 16 }}>
          <View style={{ backgroundColor: C.white, borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }}>
            <View style={{ height: 88, backgroundColor: C.forest, overflow: 'hidden' }}>
              <Contours w={320} h={88} />
            </View>
            <View style={{ paddingHorizontal: 18, paddingBottom: 18, marginTop: -40 }}>
              <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: C.white, padding: 4, boxShadow: '0 6px 18px rgba(8,26,19,0.14)' }}>
                {f.logo ? <Image source={{ uri: f.logo }} style={{ width: 64, height: 64, borderRadius: 16 }} resizeMode="cover" /> : <LogoMark size={64} />}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Tx s={20} w="800" lines={1} style={{ flexShrink: 1 }}>{f.name || '—'}</Tx>
                {org?.isSetupComplete ? <Icon name="shield" size={16} color={C.emerald} /> : null}
              </View>
              <Tx s={13} color={C.sub}>{[purposeLabel ?? (cow ? c.dairy : c.poultry), f.established ? `Est. ${f.established}` : null].filter(Boolean).join(' · ')}</Tx>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                <Pill label={c.farmsCount(farmsQ.data?.length ?? 0)} tone="green" />
                {usersQ.data ? <Pill label={c.membersCount(usersQ.data.length)} tone="gray" /> : null}
                <Pill label={c.roles[user?.role ?? 'owner'] ?? user?.role ?? ''} tone="dark" solid />
              </View>
              {canEdit ? (
                <View style={{ marginTop: 16, backgroundColor: C.canvas, borderRadius: 14, padding: 12 }}>
                  <Btn label={c.changeLogo} icon="pencil" size="sm" onPress={changeLogo} style={{ alignSelf: 'flex-start' }} />
                </View>
              ) : null}
            </View>
          </View>
          <Card pad={18} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Ring size={64} pct={completeness} color={C.emerald} track={C.mint} sw={7}>
              <Tx s={14} w="800">{completeness}%</Tx>
            </Ring>
            <View style={{ flex: 1 }}>
              <Tx s={14} w="800">{c.profileComplete}</Tx>
              <Tx s={12} color={C.sub}>{c.profileHint}</Tx>
            </View>
          </Card>
        </View>

        <View style={{ flex: 1, gap: 16, width: wide ? undefined : '100%' }}>
          <FormCard icon="briefcase" title={c.business}>
            <Pair>
              <Field label={c.orgName} value={f.name} onChangeText={set('name')} editable={!ro} />
              <Field label={c.ownerName} value={f.ownerName} onChangeText={set('ownerName')} editable={!ro} />
            </Pair>
            <Pair>
              <Select label={c.purpose} value={f.purpose} onChange={set('purpose')} options={purposes} placeholder="—" />
              <Field label={c.established} value={f.established} onChangeText={(v) => /^\d{0,4}$/.test(v) && set('established')(v)} keyboardType="number-pad" placeholder="2019" editable={!ro} />
            </Pair>
            <Pair>
              <Field label={c.mainFarmType} value={cow ? c.dairyCow : c.poultry} onChangeText={() => {}} editable={false} />
              <View style={{ flex: 1 }} />
            </Pair>
          </FormCard>

          <FormCard icon="phone" title={c.contact}>
            <Pair>
              <Field label={c.phone} value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" editable={!ro} />
              <Field label={c.email} value={org?.email ?? ''} onChangeText={() => {}} editable={false} />
            </Pair>
            <Field label={c.address} value={f.address} onChangeText={set('address')} editable={!ro} />
            <Pair>
              <Select label={c.district} value={f.district} onChange={set('district')} options={DISTRICTS.map((d) => ({ value: d, label: d }))} placeholder={c.selectDistrict} />
              <Field label={c.upazila} value={f.upazila} onChangeText={set('upazila')} editable={!ro} />
            </Pair>
          </FormCard>

          <FormCard icon="shield" title={c.legalPayments}>
            <Pair>
              <Field label={c.tradeLicense} value={f.tradeLicense} onChangeText={set('tradeLicense')} editable={!ro} />
              <Field label={c.tin} value={f.tinNumber} onChangeText={set('tinNumber')} editable={!ro} />
            </Pair>
            <Pair>
              <Field label={c.binVat} value={f.binVatNumber} onChangeText={set('binVatNumber')} editable={!ro} />
              <Field label={c.bankName} value={f.bankName} onChangeText={set('bankName')} editable={!ro} />
            </Pair>
            <Pair>
              <Field label={c.accountNo} value={f.accountNumber} onChangeText={set('accountNumber')} editable={!ro} />
              <View style={{ flex: 1 }} />
            </Pair>
            <Pair>
              <Select
                label={c.mobileBanking}
                value={f.mbProvider}
                onChange={set('mbProvider')}
                placeholder={c.provider}
                options={[
                  { value: 'bkash', label: 'bKash' },
                  { value: 'nagad', label: 'Nagad' },
                  { value: 'rocket', label: 'Rocket' },
                  { value: 'other', label: c.other },
                ]}
              />
              <Field label={c.accountNo} value={f.mbNumber} onChangeText={set('mbNumber')} keyboardType="phone-pad" editable={!ro && Boolean(f.mbProvider)} />
            </Pair>
          </FormCard>
          <ErrorNote message={error} />
        </View>
      </View>
    </Page>
  );
}

function FormCard({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <Card pad={20} style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color={C.padma} />
        </View>
        <Tx s={16} w="700">{title}</Tx>
      </View>
      {children}
    </Card>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>{Array.isArray(children) ? children.map((ch, i) => <View key={i} style={{ flex: 1, minWidth: 220 }}>{ch}</View>) : children}</View>;
}
