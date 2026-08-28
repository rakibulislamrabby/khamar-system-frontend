import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import {
  AppText,
  Button,
  Screen,
  SegmentedControl,
  TextField,
} from '@/components/ui/primitives';
import { useAuth } from '@/providers/auth-provider';
import type { FarmType } from '@/types/api';

export default function RegisterScreen() {
  const { register } = useAuth();
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

  const canSubmit = useMemo(
    () =>
      form.name.trim().length >= 2 &&
      form.email.includes('@') &&
      form.password.length >= 6 &&
      form.orgName.trim().length >= 2 &&
      form.ownerName.trim().length >= 2 &&
      form.orgPhone.trim().length >= 10,
    [form]
  );

  const onSubmit = async () => {
    setError('');
    if (!canSubmit) {
      setError('Fill required fields. Password min 6, phone min 10 digits.');
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

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="grow pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-8">
            <AppText variant="title">Open your খামার</AppText>
            <AppText variant="caption" className="mt-1.5">
              Register farm + owner account. District & upazila help local reporting.
            </AppText>
          </View>

          <View className="mt-6 gap-3.5 px-5">
            <AppText variant="label">Farm type</AppText>
            <SegmentedControl
              value={farmType}
              onChange={setFarmType}
              options={[
                { key: 'poultry', label: 'Poultry (মুরগি)' },
                { key: 'cow', label: 'Dairy / Cow (গরু)' },
              ]}
            />

            <TextField label="Your name" value={form.name} onChangeText={(v) => set('name', v)} />
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => set('email', v)}
            />
            <TextField
              label="Phone (optional)"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              placeholder="01XXXXXXXXX"
            />
            <TextField
              label="Password"
              secureTextEntry
              value={form.password}
              onChangeText={(v) => set('password', v)}
            />
            <TextField
              label="Farm / organization name"
              value={form.orgName}
              onChangeText={(v) => set('orgName', v)}
              placeholder="Green Valley Poultry"
            />
            <TextField
              label="Owner name"
              value={form.ownerName}
              onChangeText={(v) => set('ownerName', v)}
            />
            <TextField
              label="Farm phone"
              keyboardType="phone-pad"
              value={form.orgPhone}
              onChangeText={(v) => set('orgPhone', v)}
              placeholder="01XXXXXXXXX"
            />

            <View className="flex-row gap-3">
              <TextField
                label="District"
                value={form.district}
                onChangeText={(v) => set('district', v)}
                placeholder="Gazipur"
                className="flex-1"
              />
              <TextField
                label="Upazila"
                value={form.upazila}
                onChangeText={(v) => set('upazila', v)}
                placeholder="Sreepur"
                className="flex-1"
              />
            </View>

            {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

            <Button title="Create farm account" onPress={onSubmit} loading={loading} className="mt-2" />

            <View className="mt-1 flex-row items-center justify-center gap-1.5">
              <AppText variant="caption">Already registered?</AppText>
              <Link href="/(auth)/login">
                <AppText variant="caption" className="font-semibold text-padma">
                  Sign in
                </AppText>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
