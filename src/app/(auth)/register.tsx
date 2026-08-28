import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import {
  AppText,
  Button,
  Screen,
  SegmentedControl,
  TextField,
} from '@/components/ui/primitives';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import type { FarmType } from '@/types/api';

type Step = 1 | 2;

export default function RegisterScreen() {
  const { t } = useLocale();
  const { register } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [farmType, setFarmType] = useState<FarmType>('poultry');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    orgName: '',
    ownerName: '',
    orgPhone: '',
    district: '',
    upazila: '',
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const step1Valid = useMemo(
    () =>
      form.orgName.trim().length >= 2 &&
      form.ownerName.trim().length >= 2 &&
      form.orgPhone.trim().length >= 10,
    [form.orgName, form.ownerName, form.orgPhone]
  );

  const step2Valid = useMemo(
    () =>
      form.name.trim().length >= 2 &&
      form.email.includes('@') &&
      form.password.length >= 6,
    [form.name, form.email, form.password]
  );

  const onNext = () => {
    setError('');
    if (!step1Valid) {
      setError(t('registerValidation'));
      return;
    }
    setStep(2);
  };

  const onSubmit = async () => {
    setError('');
    if (!step2Valid) {
      setError(t('registerValidation'));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        organization: {
          name: form.orgName.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.orgPhone.trim(),
          email: form.email.trim().toLowerCase(),
          farmType,
          poultryPurpose: farmType === 'poultry' ? 'mixed' : undefined,
          cowPurpose: farmType === 'cow' ? 'mixed' : undefined,
          district: form.district.trim() || undefined,
          upazila: form.upazila.trim() || undefined,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = step === 1 ? t('registerStepFarm') : t('registerStepAccount');

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="items-center border-b border-line bg-rice px-5 pb-3 pt-1">
          <BrandLogo size="sm" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-5 pb-10 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="items-center">
            <AppText variant="subtitle">{stepTitle}</AppText>
            <View className="mt-2 flex-row items-center gap-2">
              <View className={`h-1.5 w-8 rounded-full ${step === 1 ? 'bg-padma' : 'bg-mist'}`} />
              <View className={`h-1.5 w-8 rounded-full ${step === 2 ? 'bg-padma' : 'bg-mist'}`} />
            </View>
          </View>

          {step === 1 ? (
            <>
              <AppText variant="label">{t('farmType')}</AppText>
              <SegmentedControl
                value={farmType}
                onChange={setFarmType}
                options={[
                  { key: 'poultry', label: t('poultry') },
                  { key: 'cow', label: t('dairyCow') },
                ]}
              />
              <TextField
                compact
                label={t('orgName')}
                value={form.orgName}
                onChangeText={(v) => set('orgName', v)}
                placeholder="Green Valley Poultry"
              />
              <TextField
                compact
                label={t('ownerName')}
                value={form.ownerName}
                onChangeText={(v) => set('ownerName', v)}
              />
              <TextField
                compact
                label={t('farmPhone')}
                keyboardType="phone-pad"
                value={form.orgPhone}
                onChangeText={(v) => set('orgPhone', v)}
                placeholder="01XXXXXXXXX"
              />
              <View className="flex-row gap-3">
                <TextField
                  compact
                  label={t('districtOptional')}
                  value={form.district}
                  onChangeText={(v) => set('district', v)}
                  placeholder="Gazipur"
                  className="flex-1"
                />
                <TextField
                  compact
                  label={t('upazilaOptional')}
                  value={form.upazila}
                  onChangeText={(v) => set('upazila', v)}
                  placeholder="Sreepur"
                  className="flex-1"
                />
              </View>
            </>
          ) : (
            <>
              <TextField
                compact
                label={t('yourName')}
                value={form.name}
                onChangeText={(v) => set('name', v)}
              />
              <TextField
                compact
                label={t('email')}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(v) => set('email', v)}
              />
              <TextField
                compact
                label={t('password')}
                secureTextEntry
                value={form.password}
                onChangeText={(v) => set('password', v)}
              />
              <TextField
                compact
                label={t('phoneOptional')}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => set('phone', v)}
                placeholder="01XXXXXXXXX"
              />
            </>
          )}

          {error ? (
            <AppText variant="caption" className="text-danger">
              {error}
            </AppText>
          ) : null}

          {step === 1 ? (
            <Button title={t('registerNext')} onPress={onNext} className="mt-1" />
          ) : (
            <View className="mt-1 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setError('');
                  setStep(1);
                }}
                className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-line bg-white">
                <AppText variant="subtitle">{t('registerBack')}</AppText>
              </Pressable>
              <Button
                title={t('createFarmAccount')}
                onPress={onSubmit}
                loading={loading}
                className="flex-1"
              />
            </View>
          )}

          <View className="mt-2 flex-row items-center justify-center gap-1.5">
            <AppText variant="caption">{t('alreadyRegistered')}</AppText>
            <Link href="/(auth)/login">
              <AppText variant="caption" className="font-semibold text-padma">
                {t('signIn')}
              </AppText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
