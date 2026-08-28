import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
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
    <Screen padded={false} className="px-5">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="min-h-0 flex-1 justify-between py-2">
          <View className="items-center pt-1">
            <BrandLogo size="sm" />
            <AppText variant="caption" className="mt-2 text-center text-muted" numberOfLines={2}>
              {t('signInSubtitle')}
            </AppText>
          </View>

          <View className="gap-3">
            <TextField
              label={t('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="owner@khamarmanager.com"
            />
            <TextField
              label={t('password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />

            {error ? (
              <AppText variant="caption" className="text-danger">
                {error}
              </AppText>
            ) : null}

            <Button title={t('signIn')} onPress={onSubmit} loading={loading} />
          </View>

          <View className="flex-row items-center justify-center gap-1.5 pb-1">
            <AppText variant="caption">{t('newOwner')}</AppText>
            <Link href="/(auth)/register">
              <AppText variant="caption" className="font-semibold text-padma">
                {t('createAccount')}
              </AppText>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
