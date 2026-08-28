import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppText, Button, Screen, TextField } from '@/components/ui/primitives';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

export default function LoginScreen() {
  const { t } = useLocale();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError(t('enterEmailPassword'));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="rounded-b-3xl bg-padma px-6 pb-10 pt-14">
            <AppText variant="display" className="mb-3 text-white">
              {t('brandBn')}
            </AppText>
            <AppText variant="title" className="text-white">
              {t('appName')}
            </AppText>
            <AppText variant="body" className="mt-2 max-w-[280px] text-white/85">
              {t('signInSubtitle')}
            </AppText>
          </View>

          <View className="gap-4 px-5 pb-10 pt-7">
            <View className="mb-1 gap-1">
              <AppText variant="title">{t('welcomeBack')}</AppText>
              <AppText variant="caption">{t('signInSubtitle')}</AppText>
            </View>

            <TextField
              label={t('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="owner@khamar.com"
            />
            <TextField
              label={t('password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />

            {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

            <Button title={t('signIn')} onPress={onSubmit} loading={loading} className="mt-2" />

            <View className="mt-2 flex-row items-center justify-center gap-1.5">
              <AppText variant="caption">{t('newOwner')}</AppText>
              <Link href="/(auth)/register">
                <AppText variant="caption" className="font-semibold text-padma">
                  {t('createAccount')}
                </AppText>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
